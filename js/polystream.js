'use-strict';

var polystream = (function () {
	var instance;
	var GL;

	var canvas;

	var mvMatrix = mat4.create();
	var pMatrix = mat4.create();

	var gl;
	var shaderProgram;

	function polystream(id, options) {
		canvas = document.getElementById(id);
		GL = new WebglUtils();
		GL.initGL(canvas, options.vs, options.fs);
		gl = GL.gl;
		shaderProgram = GL.shaderProgram;
		console.log(gl);
		console.log(shaderProgram);
		// addToShaders();

		// _createBuffers();
		gl.clearColor(0.9, 0.9, 0.9, 1.0);
		gl.enable(gl.DEPTH_TEST);

		// _drawScene();
	}

	function addToShaders(){
		// console.log(gl);
		shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
		gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

		shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
		gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

		shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
		shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
	}

	function _createBuffers(){
		triangleVertexPositionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
		var vertices = [
		0.0, 1.0, 0.0,
		-1.0, -1.0, 0.0,
		1.0, -1.0, 0.0
		];
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
		triangleVertexPositionBuffer.itemSize = 3;
		triangleVertexPositionBuffer.numItems = 3;

		triangleVertexColorBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexColorBuffer);
		var colors = [
		1.0, 0.0, 0.0, 1.0,
		0.0, 1.0, 0.0, 1.0,
		0.0, 0.0, 1.0, 1.0
		];
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
		triangleVertexColorBuffer.itemSize = 4;
		triangleVertexColorBuffer.numItems = 3;

		squareVertexPositionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
		vertices = [
		1.0, 1.0, 0.0, 
		-1.0, 1.0, 0.0,
		1.0, -1.0, 0.0,
		-1.0, -1.0, 0.0
		];
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
		squareVertexPositionBuffer.itemSize = 3;
		squareVertexPositionBuffer.numItems = 4;

		squareVertexColorBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexColorBuffer);
		colors = [];
		for(var i=0; i < 4; i++){
			colors = colors.concat([0.5, 0.5, 1.0, 1.0]);
		}
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
		squareVertexColorBuffer.itemSize = 4;
		squareVertexColorBuffer.numItems = 4;
	}

	function _drawScene(){
		gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);

		mat4.identity(mvMatrix);

		mat4.translate(mvMatrix, [-1.5, 0.0, -7.0]);
		gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
		gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, triangleVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexColorBuffer);
		gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, triangleVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

		setMatrixUniforms();
		gl.drawArrays(gl.TRIANGLES, 0, triangleVertexPositionBuffer.numItems);

		mat4.translate(mvMatrix, [2.0, 0.0, 3.0]);
		gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
		gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexColorBuffer);
		gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, squareVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

		setMatrixUniforms();
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);
	}

	return {
		start: function (id, options) {
			if (!instance) { instance = new polystream(id, options); }
			return instance;
		}
	}
})();

