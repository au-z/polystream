function Glob(name, pos, verts, elements, colors, drawOptions, lazy){
	this.name = name;
	this.pos = pos || [0, 0, 0];
	if(!drawOptions.mode) throw new Error('A webGL draw mode must be passed when creating the drawable Glob \'' + this.name + '\'');
	this.drawMode = drawOptions.mode;
	this.drawType = lazy ? drawOptions.gl.DYNAMIC_DRAW : drawOptions.gl.STATIC_DRAW;

	this.verts = verts || { data: [], stride: 0 };
	this.updateBuffer(drawOptions.gl, this.verts, 'float32', drawOptions.gl.ARRAY_BUFFER);

	this.colors = colors || { monochrome: true, color: [1.0, 1.0, 1.0, 1.0] };
	if(colors.monochrome === true) this.generateColors(colors.color, this.verts.numStrides);
	this.updateBuffer(drawOptions.gl, this.colors, 'float32', drawOptions.gl.ARRAY_BUFFER);

	if(elements){
		this.elements = elements;
		this.updateBuffer(drawOptions.gl, this.elements, 'uint16', drawOptions.gl.ELEMENT_ARRAY_BUFFER);
	}
}

Glob.prototype = {
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

	updateBuffer: function(gl, bufferData, dataType, bufferType){
		bufferData.buffer = gl.createBuffer();
		bufferData.numStrides = bufferData.data.length / bufferData.stride;
		gl.bindBuffer(bufferType, bufferData.buffer);
		var data;
		switch(dataType){
			case 'float32':
				data = new Float32Array(bufferData.data);
				break;
			case 'uint16':
				data = new Uint16Array(bufferData.data);
				break;
			default:
				throw new Error('A data type must be specified when updating buffers.');
		}
		gl.bufferData(bufferType, data, this.drawType);
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

		this._bindVerts(gl, positionAttribute);
		if(this.colors) this._bindColors(gl, colorAttribute);
		if(this.elements) this._bindElements(gl);

		fnSetMatrixUniforms();

		if(this.elements){
			gl.drawElements(this.drawMode, this.elements.numStrides, gl.UNSIGNED_SHORT, 0);
		}else{
			gl.drawArrays(this.drawMode, 0, this.verts.numStrides);
		}
		return GL.popMatrix();
	},

		_bindVerts: function(gl, positionAttribute){
			gl.bindBuffer(gl.ARRAY_BUFFER, this.verts.buffer);
			if(this.drawType === gl.DYNAMIC_DRAW){
				gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(this.verts.data));
			}
			gl.vertexAttribPointer(positionAttribute, this.verts.stride, gl.FLOAT, false, 0, 0);
		},

		_bindColors: function(gl, colorAttribute){
			gl.bindBuffer(gl.ARRAY_BUFFER, this.colors.buffer);
			gl.vertexAttribPointer(colorAttribute, this.colors.stride, gl.FLOAT, false, 0, 0);
		},

		_bindElements: function(gl){
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.elements.buffer);
		},

	animate: function(animation, args){
		if(!this.animations[animation]) throw new Error('Animation ' + animation + 'not found for Glob \'' + this.name + '\'');
		this.animations[animation].apply(this, args);
	},

	strip: function(key){
		var data = this[key].data;
		this[key].data = [data[0], data[1], data[2], data[3], data[4], data[5]];
		this[key].numStrides = 2;
		this[key].buffer.numStrides = 2;
		var res = data.slice(6, data.length);
		return res;
	},

	push: function(key, value, gl){
		Array.prototype.push.apply(this[key].data, value);
		this[key].numStrides += value.length / this[key].stride;
		this.updateBuffer(this.verts.buffer, gl, this[key], true);
	},

	log: function(){ console.log(this); }
}

