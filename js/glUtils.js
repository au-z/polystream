'use-strict';

var WebglUtils = (function () {
	var gl = null;
	var shaderProgram;

	function initGL(canvas){
		try {
			gl = canvas.getContext('webgl');
			gl.viewportWidth = canvas.width;
			gl.viewportHeight = canvas.height;
		} catch (e) {
			if (!gl) alert('Could not init WebGL. Sorry. :(');
		}
		return gl;
	}

	function initShaders(fsUrl, vsUrl){
		var loadFragShader = _requestShader(fsUrl, 'fragment').then(_loadShader, _handleError);
		var loadVertShader = _requestShader(vsUrl, 'vertex').then(_loadShader, _handleError);

		Promise.all([loadFragShader, loadVertShader]).then( _createShaderProgram, _handleError);
	}

	function _requestShader(url, type){
		return new Promise(function(resolve, reject){
			var http = new XMLHttpRequest();
			http.responseType = "text";
			http.open('GET', url);
			http.onload = function(){
				if(http.status === 200){
					resolve({
						shader: http.response,
						type: type
					});
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

	function _loadShader(shaderData){
		return new Promise(function (resolve, reject){
			var shaderScript = shaderData.shader;
			var shaderType = shaderData.type;
			if(!shaderScript){ reject(Error('No shader script found in shader response.')) }

			var shader;
			if(shaderType == 'fragment'){
				shader = gl.createShader(gl.FRAGMENT_SHADER);
			}else if(shaderType == 'vertex'){
				shader = gl.createShader(gl.VERTEX_SHADER);
			}else{
				reject(Error('Shader type not recognized'));
			}

			gl.shaderSource(shader, shaderScript);
			gl.compileShader(shader);

			if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
				alert(gl.getShaderInfoLog(shader));
				reject(Error(gl.getShaderInfoLog(shader)));
			}

			resolve({
				shader: shader,
				type: shaderType
			});
		});
	}

	function _createShaderProgram(shaders){
		if(shaders.length !== 2){ throw Error(shaders.length + ' shader(s) loaded. glUtils supports only two shaders.')}
		
		var vertShader, fragShader;
		for(var i = 0; i < shaders.length; i++){
			if(shaders[i].type === 'fragment'){ fragShader = shaders[i].shader; }
			else if(shaders[i].type === 'vertex'){ vertShader = shaders[i].shader; }
		}

		shaderProgram = gl.createProgram();
		gl.attachShader(shaderProgram, vertShader);
		gl.attachShader(shaderProgram, fragShader);
		gl.linkProgram(shaderProgram);

		if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)){
			alert("Could not init shaders");
		}

		gl.useProgram(shaderProgram);

		shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
		gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

		shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
		gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

		shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
		shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
	}

	function _handleError(e){
		console.log(e);
	}

	return {
		initGL: initGL,
		initShaders: initShaders,
		shaderProgram: shaderProgram
	}
});