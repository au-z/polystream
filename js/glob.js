function Glob(name, pos, verts, color, drawOptions){
	this.name = name;
	this.pos = pos || [0, 0, 0];
	this.rotation = 0;
	this.verts = verts || { data: [], stride: 0, numStrides: 0};
	this.color = color || { data: [], stride: 0, numStrides: 0};
	this.buffers = {};

	var o = drawOptions || {};
	if(!o.drawMode) throw new Error('A webGL draw mode must be passed when creating the drawable Glob \'' + this.name + '\'');
	this.drawMode = o.drawMode;
	if(o.gl){
		this.createBuffer('positionBuffer', o.gl, this.verts);
		this.createBuffer('colorBuffer', o.gl, this.color);
	}
}

Glob.prototype = {
	log: function(){
		console.log(this);
	},

	registerAnimation: function(name, animation, timeUpdate){
		if(this.animations === undefined) this.animations = {};
		if(this.timeUpdates === undefined) this.timeUpdates = {};
		this.animations[name] = animation;
		this.timeUpdates[name] = timeUpdate;
	},

	createBuffer: function(name, gl, bufferData){
		this[name] = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this[name]);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bufferData.data), gl.STATIC_DRAW);
		this[name].stride = bufferData.stride;
		this[name].numStrides = bufferData.numStrides;
	},

	draw: function(gl, mvMatrix, positionAttribute, colorAttribute, fnSetMatrixUniforms){
		GL.pushMatrix(mvMatrix);
		if(this.animations !== undefined){
			for(var i in this.animations){
				this.animations[i](this, mvMatrix);
			}
		}
		gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
		gl.vertexAttribPointer(positionAttribute, this.positionBuffer.stride, gl.FLOAT, false, 0, 0);
		if(colorAttribute){
			gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
			gl.vertexAttribPointer(colorAttribute, this.colorBuffer.stride, gl.FLOAT, false, 0, 0);
		}
		fnSetMatrixUniforms();
		gl.drawArrays(this.drawMode, 0, this.positionBuffer.numStrides);
		return GL.popMatrix();
	},

	animate: function(animation, args){
		if(!this.animations[animation]) throw new Error('Animation ' + animation + 'not found for Glob \'' + this.name + '\'');
		this.animations[animation].apply(this, args);
	}

}

