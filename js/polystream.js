var polystream = (function () {
	var instance;
	var gl, sp;
	var canvas;
	var globs = {};
	var mvMatrix, pMatrix;

	var lastTime = 0;

	function polystream(id, options) {
		canvas = document.getElementById(id);
		mvMatrix = mat4.create();
		pMatrix = mat4.create();

		GL.initGL(canvas, [0.24, 0.24, 0.24, 1.0], options.vs, options.fs)
		.then(function(glUtils){
			gl = glUtils.gl;
			sp = glUtils.shaderProgram;
			
			linkShaders();
			
			createGlobs().then(function(glObjects){
				globs = glObjects;
				registerAnimations();
				printGlobs();
				tick();
			}, function(error){throw error; });
		})
		.catch(function(e){ console.error(e); })
	}

	function linkShaders(){
		GL.linkShaders(sp, {
			attributes: ['aVertexPosition', 'aVertexColor'],
			uniforms: ['uPMatrix', 'uMVMatrix']
		});
	}

	function setMatrixUniforms(){
		gl.uniformMatrix4fv(sp.uniforms.uPMatrix, false, pMatrix);
		gl.uniformMatrix4fv(sp.uniforms.uMVMatrix, false, mvMatrix);
	}

	function createGlobs(){
		var grid = globFactory.simpleGrid({
			name: 'grid',
			pos: [-3,-3,-15],
			drawOptions: { gl: gl, mode: gl.LINES }
		});

		return new Promise(function(resolve, reject){
			globFactory.createGlobs({
				streampot: {
					name: 'streampot',
					async: true,
					pos: [0,0,-70],
					url: 'glob/teapot.json',
					drawOptions: { gl: gl, mode: gl.LINE_STRIP, staticOrDynamicDraw: gl.DYNAMIC_DRAW }
				}
			}).then(function(result){
				bufferDataStreams(result.streams);
				result.globs.grid = grid;
				resolve(result.globs);
			}, function(error){ reject(error); });
		});
	}

	function bufferDataStreams(streams){
		streams.streampot.subscribe(function(vert){ 
			globs.streampot.passToBuffer(vert, gl);
		});
	}

	function registerAnimations(){
		globs.streampot.registerAnimation('rotate',
			function(glob, mvMatrix){
				mat4.rotate(mvMatrix, GL.degToRad(glob.rotation), [0, 1, .5]);
			},
			function(glob, t){
				glob.rotation = ((10 * t) / 1000.0) % 360;
			});
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
				if(globs[i] !== undefined) mvMatrix = globs[i].draw(gl, mvMatrix, sp.attributes.aVertexPosition, sp.attributes.aVertexColor, setMatrixUniforms);
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

	function printGlobs(){
		if(globs.length > 0){
			for(var i in globs) globs[i].log();
		}
	}

	return {
		start: function (id, options) {
			if (!instance) { instance = new polystream(id, options); }
			return instance;
		},
		printGlobs: printGlobs
	}
})();

