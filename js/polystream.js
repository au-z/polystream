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
		return new Promise(function(resolve, reject){
			var grid = globFactory.simpleGrid({
				name: 'grid',
				pos: [-1,-1,-5],
				drawOptions: { gl: gl, mode: gl.LINES }
			});
			globFactory.createGlobs({
				teapot: {
					name: 'teapot',
					pos: [0, 0, -70],
					url: 'glob/teapot.json',
					drawOptions: { gl: gl, mode: gl.LINE_LOOP }
				}
			}).then(function(globs){
				globs.grid = grid;
				resolve(globs);
			}, function(error){ reject(error); });
		});
	}

	function registerAnimations(){
		globs.teapot.registerAnimation('rotate',
			function(glob, mvMatrix){
				mat4.rotate(mvMatrix, GL.degToRad(glob.rotation), [0, 1, 0]);
			},
			function(glob, t){
				glob.rotation = ((20 * t) / 1000.0) % 360;
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
				mvMatrix = globs[i].draw(gl, mvMatrix, sp.attributes.aVertexPosition, sp.attributes.aVertexColor, setMatrixUniforms);
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
		for(var i in globs) globs[i].log();
	}

	return {
		start: function (id, options) {
			if (!instance) { instance = new polystream(id, options); }
			return instance;
		},
		printGlobs: printGlobs
	}
})();

