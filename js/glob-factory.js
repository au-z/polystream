var GlobFactory = (function () {
	function createGlobs(reqs){
		return new Promise(function (resolve, reject){
			var loadGlobs = [];
			var dataStreams = {};
			for(var i in reqs){
				if(reqs[i].lazy){
					loadGlobs.push(createGlobStream(reqs[i]));
				}else{
					loadGlobs.push(httpGetGlob(reqs[i]));
				}
			}
			Promise.all(loadGlobs).then(createGlobCollection).then(resolve, reject);
		});
	}

	function createGlobStream(req){
		return new Promise(function(resolve, reject){
			var glob$ = Rx.Observable.fromPromise(httpGetGlob(req));
			glob$.subscribe(
				function(globResponse){
					var throttle = req.lazy.throttle || 10;
					var glob = globResponse.glob;
					var data = glob.strip(req.lazy.arrayKey || 'verts');
					var data$ = Rx.Observable.interval(throttle)
						.take(data.length)
						.map(i => {return data[i]})
						.bufferWithCount(req.lazy.bufferGrouping);
					resolve({ name: globResponse.name, glob: glob, data$: data$ });
				},
				reject
			);
		});
	}

	function createGlobCollection(globArray){
		return new Promise(function(resolve, reject){
			var globs = {};
			var streams = {};
			globArray.map(el => addToGlobsAndStreams(globs, streams, el));
			if(globArray.length !== Object.keys(globs).length) reject(Error('Could not convert array of globs to a collection of globs!'));
			resolve({globs: globs, streams: streams});
		});
	}

		function addToGlobsAndStreams(globs, streams, element){
			globs[element.name] = element.glob;
			if(element.data$) streams[element.name] = element.data$;
		}

	function httpGetGlob(req){
		return new Promise(function(resolve, reject){
			// console.log('Loading new glob from: ' + req.url);
			var http = new XMLHttpRequest();
			http.responseType = 'text';
			http.open('GET', req.url);
			http.onload = function(){
				if(http.status === 200){
					var glob = parseGlob(req, http.response);
					if(!glob) reject(Error('Parse error. Malformed http response: ', http.response));
					resolve({name: req.name, glob: glob});
				}else{
					reject(Error('Network error. Status code: ' + http.status));
				}
			}
			http.onerror = function(){
				reject(Error('Network error.'));
			};
			http.send();
		});
	}

	function parseGlob(req, json){
		var obj = JSON.parse(json);
		if(!req.name) throw new Error('Error parsing Glob. Missing data: \'name\'. Check your JSON Glob defn.');
		if(!req.pos) throw new Error('Error parsing Glob. Missing data: \'pos\'. Check your JSON Glob defn.');
		if(!obj.verts) throw new Error('Error parsing Glob. Missing data: \'verts\'. Check your JSON Glob defn.');
		if(!req.drawOptions.gl) throw new Error('Error parsing Glob. Missing data: \'drawOptions.gl\'. Check your arguments.');
		if(!req.drawOptions.mode) throw new Error('Error parsing Glob. Missing data: \'drawOptions.mode\'. Check your arguments.');
		var glob = new Glob(req.name, req.pos, obj.verts, obj.elements, obj.colors, req.drawOptions, req.lazy);
		return glob;
	}

	function simpleGrid(req){
		var verts = {}; verts.data = []; verts.stride = 3;
		var colors = {}; colors.data = []; colors.stride = 4;
		var color = [0.65, 0.65, 0.65, 1.0];
		var gridDim = 1.6;
		verts.data.push(0, gridDim, 0.0); verts.data.push(0, 0.0, 0.0);
		verts.data.push(gridDim, 0.0, 0); verts.data.push(0.0, 0.0, 0);
		verts.data.push(0.0, 0, gridDim); verts.data.push(0.0, 0, 0.0);

		for(var i = 0; i < 6; i++){ Array.prototype.push.apply(colors.data, color); }
		
		verts.numStrides = verts.data.length / verts.stride;
		colors.numStrides = colors.data.length / colors.stride;
		var grid = new Glob(req.name, req.pos, verts, null, colors, req.drawOptions);
		return grid;
	}
	
	return{
		createGlobs: createGlobs,
		simpleGrid: simpleGrid
	}
});