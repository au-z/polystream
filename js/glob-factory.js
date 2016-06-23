var GlobFactory = (function () {
	function createGlobStream(req){
		return new Promise(function(resolve, reject){
			var glob$ = Rx.Observable.fromPromise(httpGetGlob(req.name, req.pos, req.url, req.drawOptions));
			glob$.subscribe( function(nameAndGlob){
					var glob = nameAndGlob.glob;
					var data = glob.stripVertData();
					var data$ = Rx.Observable.interval(35)
						.take(data.length)
						.map(i => {return data[i]})
						.bufferWithCount(3);
					resolve({ name: nameAndGlob.name, glob: glob, data$: data$ });
				},
				function(error){reject(error);}
			);
		});
	}

	function createGlobs(req){
		return new Promise(function (resolve, reject){
			var loadGlobs = [];
			var dataStreams = {};
			for(var i in req){
				if(req[i].async){
					loadGlobs.push(createGlobStream(req[i]));
				}else{
					loadGlobs.push(httpGetGlob( req[i].name, req[i].pos, req[i].url, req[i].drawOptions));
				}
			}
			Promise.all(loadGlobs).then(createGlobCollection).then(
				function(globs){ resolve(globs); },
				function(error){ reject(error); }
			);
		});
	}

	function createGlobCollection(globArray){
		return new Promise(function(resolve, reject){
			var globs = {};
			var streams = {};
			globArray.map(el => addToGlobsAndStreams(globs, streams, el));
			if(globArray.length !== Object.keys(globs).length) reject(Error('Could not convert globArray to a globs object.'));
			resolve({globs: globs, streams: streams});
		});
	}

		function addToGlobsAndStreams(globs, streams, element){
			globs[element.name] = element.glob;
			if(element.data$) streams[element.name] = element.data$;
		}

	function httpGetGlob(name, pos, url, drawOptions){
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

	function simpleGrid(globTemplate){
		var verts = {}; verts.data = []; verts.stride = 3;
		var colors = {}; colors.data = []; colors.stride = 4;
		var color = [0.3, 0.3, 0.3, 1.0];
		var gridDim = 2;
		//X
		verts.data.push(0, gridDim, 0.0); verts.data.push(0, 0.0, 0.0);
		//Z
		verts.data.push(gridDim, 0.0, 0); verts.data.push(0.0, 0.0, 0);
		//Y
		verts.data.push(0.0, 0, gridDim); verts.data.push(0.0, 0, 0.0);
		
		for(var i = 0; i < 6; i++){ Array.prototype.push.apply(colors.data, color); }
		verts.numStrides = verts.data.length / verts.stride;
		colors.numStrides = colors.data.length / colors.stride;

		var grid = new Glob(globTemplate.name, globTemplate.pos, verts, colors, globTemplate.drawOptions);
		return grid;
	}
	
	return{
		createGlobs: createGlobs,
		createGlobStream: createGlobStream,
		simpleGrid: simpleGrid
	}
});