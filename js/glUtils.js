'use-strict';

var WebglUtils = (function () {
	var gl = null;
	var shaderProgram;

	function initGL(canvas, vsUrl, fsUrl){
		try {
			gl = canvas.getContext('webgl');
			gl.viewportWidth = canvas.width;
			gl.viewportHeight = canvas.height;
		} catch (e) {
			if (!gl) alert('Could not init WebGL. Sorry. :(');
		}
		initShaders(vsUrl, fsUrl, function(program){
			shaderProgram = program;
		});
	}

	function initShaders(vsUrl, fsUrl, callback){
		var loadVertShader = loadShader(vsUrl, 'vertex').then(compileShader).catch(handleError);
		var loadFragShader = loadShader(fsUrl, 'fragment').then(compileShader).catch(handleError);
		Promise.all([loadVertShader, loadFragShader])
			.then(createProgram)
			.then(callback)
			.catch(handleError);
	}

	function createProgram(shaders){
		return new Promise(function(resolve, reject){
			if(shaders.length !== 2){ reject(Error(shaders.length + ' shader(s) loaded. glUtils supports only two shaders.'))}
			var vertShader, fragShader;
			for(var i = 0; i < shaders.length; i++){
				if(shaders[i].type === 'vertex'){ vertShader = shaders[i].shader; }
				else if(shaders[i].type === 'fragment'){ fragShader = shaders[i].shader; }
			}

			shaderProgram = gl.createProgram();
			gl.attachShader(shaderProgram, vertShader);
			gl.attachShader(shaderProgram, fragShader);
			gl.linkProgram(shaderProgram);

			if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)){
				reject(Error("Could not init shaders"));
			}

			resolve(shaderProgram);
		});
	}

	function loadShader(url, type){
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

	function compileShader(shaderData){
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

	function handleError(e){
		console.log(e);
	}

	return {
		//public properties
		gl: gl,
		shaderProgram: shaderProgram,
		//public methods
		initGL: initGL
	}
});