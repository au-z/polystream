var polystream = (function () {
	var instance;
	var gl, sp;
	var canvas;
	var globs;
	var mvMatrix, pMatrix;

	function polystream(id, options) {
		canvas = document.getElementById(id);
		mvMatrix = mat4.create();
		pMatrix = mat4.create();

		globs = [];

		GL.initGL(canvas, [0.24, 0.24, 0.24, 1.0], options.vs, options.fs)
		.then(function(glUtils){
			gl = glUtils.gl;
			sp = glUtils.shaderProgram;
			linkShaders();
			
			createGlobs();
			drawScene();
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
		globs.push(new Glob('triangle', [ -2.0, 0.0, -10.0],
			{ data: [ 0.0,  1.0,  0.0,
								-1.0, -1.0,  0.0,
								1.0, -1.0,  0.0 ],
				stride: 3, numStrides: 3},
			{ data: [ 1.0, 0.0, 0.0, 1.0,
								0.0, 1.0, 0.0, 1.0,
								0.0, 0.0, 1.0, 1.0 ],
				stride: 4, numStrides: 3 },
			{ gl: gl, drawMode: gl.TRIANGLES }));
		globs.push(new Glob('square', [1.5, 0.0, -7.0],
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
			{ gl: gl, drawMode: gl.TRIANGLE_STRIP }));
	}

	function drawScene(){
		GL.drawGL(pMatrix);
		printGlobs();

		mat4.identity(mvMatrix); //move to center of space
		globs.map(glob => drawGlob(glob));
	}

	function drawGlob(glob){
		mat4.identity(mvMatrix);
		mat4.translate(mvMatrix, glob.pos);
		setMatrixUniforms();		
		glob.draw(gl, glob.drawMode, sp.attributes.aVertexPosition, sp.attributes.aVertexColor);
	}

	function printGlobs(){
		globs.map(glob => glob.log());
	}

	return {
		start: function (id, options) {
			if (!instance) { instance = new polystream(id, options); }
			return instance;
		},
		printGlobs: printGlobs
	}
})();

