var GlobFactory = (function () {
	
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
	
	return{
		createGlobs: createGlobs,
	}
});