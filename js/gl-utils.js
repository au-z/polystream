var GLUtils = (function () {
	var gl = null;
	var clearColor = [0.2, 0.2, 0.2, 1.0];
	var matrixStack = [];

	function initGL(canvas, clearColor, vsUrl, fsUrl){
		try {
			gl = canvas.getContext('webgl');
			gl.viewportWidth = canvas.width;
			gl.viewportHeight = canvas.height;
			clearColor = clearColor;
		} catch (e) {
			if (!gl) alert('Could not init WebGL. Sorry. :(');
		}

		return new Promise(function(resolve, reject){
			initShaders(vsUrl, fsUrl).then(
				function(program){ resolve({ gl: gl, shaderProgram: program }); }, 
				function(error){ reject(error); });
		});
	}

	function linkShaders(program, props){
		if(props.attributes.length > 0){
			program.attributes = {};
			props.attributes.map(attrib => attribToProgram(attrib, program));
		}
		if(props.uniforms.length > 0){
			program.uniforms = {};
			props.uniforms.map(uniform => uniformToProgram(uniform, program));
		}
	}

		function attribToProgram(attrib, program){
			program.attributes[attrib] = gl.getAttribLocation(program, attrib);
			if(program.attributes[attrib] === null){
				throw new Error('Could not link to shader attribute ' + attrib + + '. Check your shaders!');
			}
			gl.enableVertexAttribArray(program.attributes[attrib]);
		}

		function uniformToProgram(uniform, program){
			program.uniforms[uniform] = gl.getUniformLocation(program, uniform);
			if(program.uniforms[uniform] === null){
				throw new Error('Could not link to shader uniform ' + uniform + '. Check your shaders!');
			}
		}

	function drawGL(pMatrix){
		gl.clearColor(0.94, 0.94, 0.94, 1.0);
		gl.enable(gl.DEPTH_TEST);
		gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		//set up projection matrix
		mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
	}

		function initShaders(vsUrl, fsUrl){
			return new Promise(function(resolve, reject){
				var loadVertShader = loadShaderAsync(vsUrl, 'vertex');
				var loadFragShader = loadShaderAsync(fsUrl, 'fragment');
				Promise.all([loadVertShader, loadFragShader]).then(createProgram).then(
					function(shader){ resolve(shader); }, 
					function(error){ reject(error); }
				);
			});
		}

		function createProgram(shaders){
			return new Promise(function(resolve, reject){
				if(shaders.length !== 2){ reject(Error(shaders.length + ' shader(s) loaded. glUtils supports only two shaders.'))}
				var vertShader, fragShader;
				for(var i = 0; i < shaders.length; i++){
					if(shaders[i].type === 'vertex'){ vertShader = shaders[i]; }
					else if(shaders[i].type === 'fragment'){ fragShader = shaders[i]; }
				}
				var program = gl.createProgram();
				gl.attachShader(program, vertShader);
				gl.attachShader(program, fragShader);
				
				gl.linkProgram(program);

				if(!gl.getProgramParameter(program, gl.LINK_STATUS)){
					reject(Error("Could not init shaders"));
				}
				gl.useProgram(program);
				resolve(program);
			});
		}

		function loadShaderAsync(url, type){
			return new Promise(function(resolve, reject){
				var http = new XMLHttpRequest();
				http.responseType = "text";
				http.open('GET', url);
				http.onload = function(){
					if(http.status === 200){
						var shader = compileShader(http.response, type);
						shader.type = type;
						resolve(shader);
					}else{
						reject(Error(http.statusText));
					}
				};
				http.onerror = function(){
					reject(Error('Network error.'));
				};
				http.send();
			});
		}

		function compileShader(shaderScript, shaderType){
			if(!shaderScript){ throw new Error('No shader script found in shader response.'); }

			var shader;
			if(shaderType == 'fragment'){
				shader = gl.createShader(gl.FRAGMENT_SHADER);
			}else if(shaderType == 'vertex'){
				shader = gl.createShader(gl.VERTEX_SHADER);
			}else{
				throw new Error('Shader type not recognized');
			}

			gl.shaderSource(shader, shaderScript);
			gl.compileShader(shader);

			if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
				alert(gl.getShaderInfoLog(shader));
			}
			return shader;
		}

	function resize(){
  	var realToCSSPixels = window.devicePixelRatio || 1;
  	var displayWidth  = Math.floor(gl.canvas.clientWidth  * realToCSSPixels);
  	var displayHeight = Math.floor(gl.canvas.clientHeight * realToCSSPixels);
		
 		if (gl.canvas.width  != displayWidth || gl.canvas.height != displayHeight) {
    	gl.canvas.width  = displayWidth;
    	gl.canvas.height = displayHeight;
    	gl.viewportWidth = gl.canvas.width;
			gl.viewportHeight = gl.canvas.height;
  	}
	}

	function pushMatrix(matrix){
		var copy = mat4.create();
		mat4.set(matrix, copy);
		matrixStack.push(copy);
	}

	function popMatrix(){
		if(matrixStack.length === 0) throw Error('Invalid popMatrix on a matrix of length 0!');
		return matrixStack.pop();
	}

	function degToRad(deg){
		return deg * Math.PI / 180;
	}

	return {
		initGL: initGL,
		linkShaders: linkShaders,
		drawGL: drawGL,
		resize: resize,
		pushMatrix: pushMatrix,
		popMatrix: popMatrix,
		degToRad: degToRad
	}
});