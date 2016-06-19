var polystream = (function () {
	var instance;
	var gl, sp;
	var canvas;
	var globs;
	var mvMatrix, pMatrix;

	var lastTime = 0;

	function polystream(id, options) {
		canvas = document.getElementById(id);
		mvMatrix = mat4.create();
		pMatrix = mat4.create();

		globs = {};

		GL.initGL(canvas, [0.24, 0.24, 0.24, 1.0], options.vs, options.fs)
		.then(function(glUtils){
			gl = glUtils.gl;
			sp = glUtils.shaderProgram;
			linkShaders();
			
			createGlobs();
			registerAnimations();
			printGlobs();
			
			tick();
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
		var triangle = new Glob('triangle', [ -1.0, 0.0, -7.0],
			{ data: [ 0.0,  1.0,  0.0,
								-1.0, -1.0,  0.0,
								1.0, -1.0,  0.0 ],
				stride: 3, numStrides: 3},
			{ data: [ 1.0, 0.0, 0.0, 1.0,
								0.0, 1.0, 0.0, 1.0,
								0.0, 0.0, 1.0, 1.0 ],
				stride: 4, numStrides: 3 },
			{ gl: gl, drawMode: gl.TRIANGLES });
		var square = new Glob('square', [1.0, 0.0, -7.0],
			{ data: [ 1.0,  1.0,  0.0,
								-1.0,  1.0,  0.0,
								1.0, -1.0,  0.0,
								-1.0, -1.0,  0.0 ],
				stride: 3, numStrides: 4 },
			{ data: [ 1.0, 0.0, 0.0, 1.0,
								0.0, 1.0, 0.0, 1.0,
								0.0, 0.0, 1.0, 1.0,
								1.0, 1.0, 1.0, 1.0 ],
				stride: 4, numStrides: 4 },
			{ gl: gl, drawMode: gl.TRIANGLE_STRIP });

		globs[triangle.name] = triangle;
		globs[square.name] = square;
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
				drawGlob(globs[i]);
			}
		}

			function drawGlob(glob){
				mat4.identity(mvMatrix);				
				mat4.translate(mvMatrix, glob.pos);
				mvMatrix = glob.draw(gl, mvMatrix, sp.attributes.aVertexPosition, sp.attributes.aVertexColor, setMatrixUniforms);
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

