function Glob(name, pos, verts, colors, drawOptions){
	this.name = name;
	this.pos = pos || [0, 0, 0];
	this.rotation = 0;

	this.verts = verts || { data: [], stride: 0 };
	this.verts.numStrides = verts.data.length / verts.stride;
	this.colors = colors || { data: [], stride: 0 };
	if(colors.monochrome === true) this.generateColors(colors.color, this.verts.numStrides);
	this.colors.numStrides = colors.data.length / colors.stride;
	
	var o = drawOptions || {};
	if(!o.mode) throw new Error('A webGL draw mode must be passed when creating the drawable Glob \'' + this.name + '\'');
	this.drawMode = o.mode;
	this.staticOrDynamicDraw = o.staticOrDynamicDraw || o.gl.STATIC_DRAW;
	this.updateBuffer('positionBuffer', o.gl, this.verts, true);
	this.updateBuffer('colorBuffer', o.gl, this.colors, true);
}

Glob.prototype = {
	log: function(){
		console.log(this);
	},

	generateColors: function(color, vertCount){
		for(var i = 0; i < vertCount; i++){
			Array.prototype.push.apply(this.colors.data, color);
		}
		this.colors.stride = 4;
	},

	registerAnimation: function(name, animation, timeUpdate){
		if(this.animations === undefined) this.animations = {};
		if(this.timeUpdates === undefined) this.timeUpdates = {};
		this.animations[name] = animation;
		this.timeUpdates[name] = timeUpdate;
	},

	updateBuffer: function(bufferName, gl, bufferData, create){
		if(create) this[bufferName] = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this[bufferName]);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bufferData.data), this.staticOrDynamicDraw);
		this[bufferName].stride = bufferData.stride;
		this[bufferName].numStrides = bufferData.numStrides;
	},

	draw: function(gl, mvMatrix, positionAttribute, colorAttribute, fnSetMatrixUniforms){
		mat4.identity(mvMatrix);
		mat4.translate(mvMatrix, this.pos);
		GL.pushMatrix(mvMatrix);
		if(this.animations !== undefined){
			for(var i in this.animations){
				this.animations[i](this, mvMatrix);
			}
		}
		gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
		if(this.staticOrDynamicDraw === gl.DYNAMIC_DRAW){
			gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(this.verts.data));
		}
		gl.vertexAttribPointer(positionAttribute, this.positionBuffer.stride, gl.FLOAT, false, 0, 0);
		if(colorAttribute){
			gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
			gl.vertexAttribPointer(colorAttribute, this.colorBuffer.stride, gl.FLOAT, false, 0, 0);
		}
		fnSetMatrixUniforms();
		//TODO: update this.positionBuffer.numStrides
		gl.drawArrays(this.drawMode, 0, this.verts.numStrides);
		return GL.popMatrix();
	},

	animate: function(animation, args){
		if(!this.animations[animation]) throw new Error('Animation ' + animation + 'not found for Glob \'' + this.name + '\'');
		this.animations[animation].apply(this, args);
	},

	stripVertData: function(){
		var data = this.verts.data;
		this.verts.data = [data[0], data[1], data[2], data[3], data[4], data[5]];
		this.verts.numStrides = 2;
		this.positionBuffer.numStrides = 2;
		return data;
	},

	passToBuffer: function(vert, gl){
		Array.prototype.push.apply(this.verts.data, vert);
		this.verts.numStrides++;
		this.updateBuffer(this.positionBuffer, gl, this.verts, true);
	}
}

