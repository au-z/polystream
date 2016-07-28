var GltfFactory = (function(){
	function load(config){
		console.log('Loading from gltf: ', config.name);
		getGltfAsGlob(config);
		return new Glob(config.name, 
			[0,0,0], 
			null, 
			null, 
			null, 
			null, 
			config.drawOptions, 
			config.lazy);
	}

	function getGltfAsGlob(req){
		return new Promise(function(resolve, reject){
			var http = new XMLHttpRequest();
			http.responseType = 'text';
			http.open('GET', req.url);
			http.onload = function(){
				if(http.status === 200){
					var glob = parseToGlob(req, http.response);
					console.log(http.response);
					resolve({name: req.name, glob: glob});
				}else{
					reject(Error('Netword error. Status code: ' + http.status));
				}
			};
			http.onerror = function(){
				reject(Error('Network error.'));
			};
			http.send();
		});
	}

	function parseToGlob(req, gltf){
		if(!req.name) throw new Error('Error parsing Glob. Missing data: \'name\'. Check your JSON Glob defn.');
		var pos = posFromGltf(gltf);
		if(!pos) throw new Error('Error parsing Glob. Missing data: \'pos\'. Check your JSON Glob defn.');
		var verts = vertsFromGltf(gltf);
		if(!verts) throw new Error('Error parsing Glob. Missing data: \'verts\'. Check your JSON Glob defn.');
		if(!req.drawOptions.gl) throw new Error('Error parsing Glob. Missing data: \'drawOptions.gl\'. Check your arguments.');
		if(!req.drawOptions.mode) throw new Error('Error parsing Glob. Missing data: \'drawOptions.mode\'. Check your arguments.');
		var glob = new Glob(req.name, req.pos, verts, null, null, null, req.drawOptions, req.lazy);
		return glob;
	}

	function posFromGltf(gltf){
		return [0, 0, 0];
	}

	function vertsFromGltf(gltf){
		
	}

	var accessor_componentType ={
		5120: 1, // BYTE
		5121: 1, // UNSIGNED_BYTE
		5122: 2, // SHORT
		5123: 2, // UNSIGNED_SHORT
		5126: 4  // FLOAT
	}

	/* 
	* The size of an accessor's attribute type, in bytes.
	*/
	var accessor_type = {
		SCALAR: 1,
		VEC2: 2, 
		VEC3: 3,
		VEC4: 4,
		MAT2: 4,
		MAT3: 9,
		MAT4: 16
	}

	return{
		load: load
	}

});