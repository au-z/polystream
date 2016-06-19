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
				// printGlobs();
				tick();
			});
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
			globFactory.createGlobs({
				triangle: {
					name: 'triangle',
					pos: [-1, 0, -7.0],
					url: 'glob/triangle.json',
					drawOptions: { gl: gl, mode: gl.TRIANGLES }
				},
				square: {
					name: 'square',
					pos: [1, 0, -7.0],					
					url: 'glob/square.json',
					drawOptions: { gl: gl, mode: gl.TRIANGLE_STRIP }
				}
			}).then(function(globs){ resolve(globs); }, function(error){ reject(error); });
		});
	}

	function registerAnimations(){
		globs.triangle.registerAnimation('rotate',
			function(glob, mvMatrix){
				mat4.rotate(mvMatrix, GL.degToRad(glob.rotation), [0, 1, 0]);
			},
			function(glob, t){
				glob.rotation = ((90 * t) / 1000.0) % 360;
			});
		globs.square.registerAnimation('rotate',
			function(glob, mvMatrix){
				mat4.rotate(mvMatrix, GL.degToRad(glob.rotation), [1, 1, 1]);
			},
			function(glob, t){
				glob.rotation = ((90 * t) / 1000.0) % 360;
			});
	}

	function tick(){
		requestAnimationFrame(tick);
		drawScene();
		animate();
	}


		function drawScene(){
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

