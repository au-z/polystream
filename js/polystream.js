var polystream = (function () {
	var instance;
	var gl, sp;
	var canvas;
	var globs = {};
	var mvMatrix = mat4.create();
	var pMatrix = mat4.create();

	var lastTime = 0;

	function polystream(id, options) {
		canvas = document.getElementById(id);
		GL.initGL(canvas, [0.23, 0.23, 0.23, 1.0], options.vs, options.fs)
		.then(render)
		.catch(function(e){ console.error(e); });
	}

	function render(glTools){
		gl = glTools.gl;
		sp = glTools.shaderProgram;
		linkShaders();
		createGlobs().then(function(_globs){
			globs = _globs;
			tick();
		});
	}

	function linkShaders(){
		GL.linkShaders(sp, {
			attributes: ['aVertexPosition', 'aVertexColor'],
			uniforms: ['uPMatrix', 'uMVMatrix']
		});
		sp.setMatrixUniforms = function(){
			gl.uniformMatrix4fv(sp.uniforms.uPMatrix, false, pMatrix);
			gl.uniformMatrix4fv(sp.uniforms.uMVMatrix, false, mvMatrix);
		};
	}

	function createGlobs(){
		var grid = globFactory.simpleGrid({
			name: 'grid',
			pos: [-2,-2,-9],
			drawOptions: { gl: gl, mode: gl.LINES }
		});

		return new Promise(function(resolve, reject){
			globFactory.createGlobs({
				triangle: { name: 'triangle',
					pos: [20, -20,-70],
					url: 'glob/triangle.json',
					drawOptions: {gl: gl, mode: gl.LINE_LOOP }
				},
				cube: { name: 'cube',
					pos: [0,0,-10],
					url: 'glob/cube.json',
					drawOptions: { gl: gl, mode: gl.TRIANGLES },
					lazy: {arrayKey: 'verts', throttle: 200, bufferGrouping: 12 }
				},
				teapot: { name: 'teapot',
					pos: [-40, -20, -80],
					url: 'glob/teapot.json',
					drawOptions: {gl: gl, mode: gl.LINE_STRIP },
					lazy: {arrayKey: 'verts', throttle: 10, bufferGrouping: 3 }
				}
			}).then(function(result){
				result.globs.grid = grid;
				subscribeToStreams(result.streams);
				registerAnimations(result.globs);
				resolve(result.globs);
			}, reject);
		});
	}

	function subscribeToStreams(streams){
		if (Object.keys(streams).length === 0) return;
		streams.cube.subscribe(function(value){
			globs.cube.push('verts', value, gl);
		});
		streams.teapot.subscribe(function(vert){
			globs.teapot.push('verts', vert, gl);
		});
	}

	function registerAnimations(globs){
		globs.cube.registerAnimation('rotate',
			function(glob, mvMatrix){
				mat4.rotate(mvMatrix, GL.degToRad(glob.rotation), [.5, 1, -.4]);
			},
			function(glob, t){ glob.rotation = ((30 * t) / 1000.0) % 360; });
		globs.teapot.registerAnimation('rotate',
			function(glob, mvMatrix){
				mat4.rotate(mvMatrix, GL.degToRad(glob.rotation), [.5, 1, 0]);
			},
			function(glob, t){ glob.rotation = ((40 * t) / 1000.0) % 360; });
		globs.triangle.registerAnimation('rotate',
			function(glob, mvMatrix){
				mat4.rotate(mvMatrix, GL.degToRad(glob.rotation), [0, 1, 0]);
			},
			function(glob, t){ glob.rotation = ((90 * t) / 1000.0) % 360; });
	}

	function tick(){
		requestAnimationFrame(tick);
		drawScene();
		animate();
	}

	function drawScene(){
		GL.resize();
		GL.drawGL(pMatrix);
		for(var i in globs){
			mvMatrix = globs[i].draw(gl, sp, mvMatrix);
		}
	}

	function animate(){
		var timeNow = new Date().getTime();
		if (lastTime != 0) {
			var elapsed = timeNow - lastTime;
			for(var i in globs){
				for(var j in globs[i].timeUpdates){
					globs[i].timeUpdates[j](globs[i], timeNow);
				}
			}
		}
		lastTime = timeNow;
	}

	function printGlobs(){ for(var i in globs) globs[i].log(); }
	function getGl(){ return gl; }
	function getSp(){ return sp; }

	return {
		start: function (id, options) {
			if (!instance) { instance = new polystream(id, options); }
			return instance;
		},
		printGlobs: printGlobs,
		getGl: getGl,
		getSp: getSp
	}
})();

