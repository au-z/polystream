var GlobFactory = (function () {
	var colorR = [1.0, 0.0, 0.0, 1.0];
	var colorG = [0.0, 1.0, 0.0, 1.0];
	var colorB = [0.0, 0.0, 1.0, 1.0];

	function createGlobs(globTemplate){
		return new Promise(function (resolve, reject){
			var loadGlobs = [];
			for(var g in globTemplate){
				loadGlobs.push(loadGlobAsync(
					globTemplate[g].name,
					globTemplate[g].pos,
					globTemplate[g].url,
					globTemplate[g].drawOptions));
			}
			Promise.all(loadGlobs).then(createGlobArray).then(
				function(globs){ resolve(globs); },
				function(error){ reject(error); }
			);
		});
	}

	function createGlobArray(globArray){
		return new Promise(function(resolve, reject){
			var globs = {};
			globArray.map(el => addToGlobsObj(globs, el));
			if(globArray.length !== Object.keys(globs).length){
				reject(Error('Could not convert globArray to a globs object.'));
			}
			resolve(globs);
		});
	}

		function addToGlobsObj(globs, element){
			globs[element.name] = element.glob;
		}

	function loadGlobAsync(name, pos, url, drawOptions){
		return new Promise(function(resolve, reject){
			console.log('Loading new glob from: ' + url);
			var http = new XMLHttpRequest();
			http.responseType = 'text';
			http.open('GET', url);
			http.onload = function(){
				if(http.status === 200){
					var glob = parseGlob(name, pos, http.response, drawOptions);
					if(!glob) reject(Error('Parse error. Malformed http response: ', http.response));
					resolve({name: name, glob: glob});
				}else{
					reject(Error('Network error.'));
				}
			}
			http.onerror = function(){
				reject(Error('Network error.'));
			};
			http.send();
		});
	}

	function parseGlob(name, pos, json, drawOptions){
		var obj = JSON.parse(json);
		if(!obj.verts) throw new Error('Error parsing Glob. Missing data: \'verts\'. Check your JSON Glob defn.');
		if(!obj.colors) throw new Error('Error parsing Glob. Missing data: \'colors\'. Check your JSON Glob defn.');
		if(!drawOptions.gl) throw new Error('Error parsing Glob. Missing data: \'drawOptions.gl\'. Check your arguments.');
		if(!drawOptions.mode) throw new Error('Error parsing Glob. Missing data: \'drawOptions.mode\'. Check your arguments.');
		var glob = new Glob(name, pos, obj.verts, obj.colors, drawOptions);
		return glob;
	}

	function createGrid(globTemplate){
		var verts = {}; verts.data = []; verts.stride = 3;
		var colors = {}; colors.data = []; colors.stride = 4;
		var color = [0.8, 0.8, 0.8, 1.0];
		var gridDim = 12;
		for(var x = (-1 * (gridDim / 2)); x < (gridDim / 2); x++){
			verts.data.push(x, gridDim, 0.0);
			verts.data.push(x, (gridDim * -1), 0.0);
			if(x === 0){
				Array.prototype.push.apply(colors.data, colorR);
				Array.prototype.push.apply(colors.data, colorR);
			}else{
				Array.prototype.push.apply(colors.data, color);
				Array.prototype.push.apply(colors.data, color);
			}
		}
		for(var z = (-1 * (gridDim / 2)); z < (gridDim / 2); z++){
			verts.data.push(gridDim, 0.0, z);
			verts.data.push((gridDim * -1), 0.0, z);
			if(z === 0){
				Array.prototype.push.apply(colors.data, colorB);
				Array.prototype.push.apply(colors.data, colorB);
			}else{
				Array.prototype.push.apply(colors.data, color);
				Array.prototype.push.apply(colors.data, color);
			}
		}
		for(var y = (-1 * (gridDim / 2)); y < (gridDim / 2); y++){
			verts.data.push(0.0, y, gridDim);
			verts.data.push(0.0, y, (gridDim * -1));
			if(y === 0){
				Array.prototype.push.apply(colors.data, colorG);
				Array.prototype.push.apply(colors.data, colorG);
			}else{
				Array.prototype.push.apply(colors.data, color);
				Array.prototype.push.apply(colors.data, color);
			}
		}
		verts.numStrides = verts.data.length / verts.stride;
		colors.numStrides = colors.data.length / colors.stride;
		var grid = new Glob(globTemplate.name, globTemplate.pos, verts, colors, globTemplate.drawOptions);
		return grid;
	}

	function simpleGrid(globTemplate){
		var verts = {}; verts.data = []; verts.stride = 3;
		var colors = {}; colors.data = []; colors.stride = 4;
		var color = [0.2, 0.2, 0.2, 1.0];
		var gridDim = 2;
		//X
		verts.data.push(0, gridDim, 0.0);
		verts.data.push(0, 0.0, 0.0);
		Array.prototype.push.apply(colors.data, color);
		Array.prototype.push.apply(colors.data, color);
		//Z
		verts.data.push(gridDim, 0.0, 0);
		verts.data.push(0.0, 0.0, 0);
		Array.prototype.push.apply(colors.data, color);
		Array.prototype.push.apply(colors.data, color);
		//Y
		verts.data.push(0.0, 0, gridDim);
		verts.data.push(0.0, 0, 0.0);
		Array.prototype.push.apply(colors.data, color);
		Array.prototype.push.apply(colors.data, color);

		verts.numStrides = verts.data.length / verts.stride;
		colors.numStrides = colors.data.length / colors.stride;

		var grid = new Glob(globTemplate.name, globTemplate.pos, verts, colors, globTemplate.drawOptions);
		return grid;
	}
	
	return{
		createGlobs: createGlobs,
		createGrid: createGrid,
		simpleGrid: simpleGrid
	}
});