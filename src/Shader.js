class Shader {
    constructor(gl, vertShaderSrc, fragShaderSrc) {
        this.program = ShaderUtil.createProgramFromText(gl, vertShaderSrc, fragShaderSrc, true);
        if (this.program !== null) {
            this.gl = gl;
            gl.useProgram(this.program);
            this.attribLoc = ShaderUtil.getStandardAttribLocations(gl, this.program);
            this.uniformLoc = ShaderUtil.getStandardUniformLocations(gl, this.program);
        }
    }

    activate() {
        this.gl.useProgram(this.program);
        return this;
    }

    deactivate() {
        this.gl.useProgram(null);
        return this;
    }

    setPerspective(matData) {
        this.gl.uniformMatrix4fv(this.uniformLoc.perspective, false, matData);
        return this;
    }

    setModelMatrix(matData) {
        this.gl.uniformMatrix4fv(this.uniformLoc.modelMatrix, false, matData);
        return this;
    }

    setCameraMatrix(matData) {
        this.gl.uniformMatrix4fv(this.uniformLoc.cameraMatrix, false, matData);
        return this;
    }

    dispose() {
        if (this.gl.getParameter(this.gl.CURRENT_PROGRAM) === this.program) {
            this.gl.useProgram(null);
        }
        this.gl.deleteProgram(this.program);
    }

    preRender() {
    }

    renderModel(model) {
        this.setModelMatrix(model.transform.getViewMatrix());
        this.gl.bindVertexArray(model.mesh.vao);

        if (model.mesh.noCulling) this.gl.disable(this.gl.CULL_FACE);
        if (model.mesh.doBlending) this.gl.enable(this.gl.BLEND);

        if (model.mesh.indexCount) {
            this.gl.drawElements(model.mesh.drawMode, model.mesh.indexCount, gl.UNSIGNED_SHORT, 0);
        } else {
            this.gl.drawArrays(model.mesh.drawMode, 0, model.mesh.vertexCount);
        }

        // Clean up
        this.gl.bindVertexArray(null);
        if (model.mesh.noCulling) this.gl.enable(this.gl.CULL_FACE);
        if (model.mesh.doBlending) this.gl.disable(this.gl.BLEND);

        return this;
    }
}

class ShaderUtil {
    static domShaderSrc(elemId) {
        const elem = document.getElementById(elemId);

        if (!elem || !elem.text) {
            console.error(`${elemId} shader not found or text!`);
            return null;
        }

        return elem.text;
    }

    static createShader(gl, src, type) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, src);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(`Error compiling shader : ${src}, ${gl.getShaderInfoLog(shader)}`);
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    static createProgram(gl, vShader, fShader, doValidate) {
        const program = gl.createProgram();
        gl.attachShader(program, vShader);
        gl.attachShader(program, fShader);

        // Force predefined locations for specific attributes
        // If the attributes isn't used in the shader its location will default to -1
        gl.bindAttribLocation(program, ATTR_POSITION_LOC, ATTR_POSITION_NAME);
        gl.bindAttribLocation(program, ATTR_NORMAL_LOC, ATTR_NORMAL_NAME);
        gl.bindAttribLocation(program, ATTR_UV_LOC, ATTR_UV_NAME);

        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error(`Error creating shader program ${gl.getProgramInfoLog(program)}`);
            gl.deleteProgram(program);
            return null;
        }

        if (doValidate) {
            gl.validateProgram(program);
            if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
                console.error(`Error validating program ${gl.getProgramInfoLog(program)}`);
                return null;
            }
        }

        gl.detachShader(program, vShader);
        gl.detachShader(program, fShader);
        gl.deleteShader(vShader);
        gl.deleteShader(fShader);

        return program;
    }

    static domShaderProgram(gl, vertId, fragId, doValidate = true) {
        const vShaderTxt = ShaderUtil.domShaderSrc(vertId);
        const fShaderTxt = ShaderUtil.domShaderSrc(fragId);

        if (!vShaderTxt || !fShaderTxt) return null;

        return ShaderUtil.createProgramFromText(gl, vShaderTxt, fShaderTxt, doValidate);
    }

    static createProgramFromText(gl, vShaderTxt, fShaderTxt, doValidate = true) {
        const vShader = ShaderUtil.createShader(gl, vShaderTxt, gl.VERTEX_SHADER);
        if (!vShader) return null;

        const fShader = ShaderUtil.createShader(gl, fShaderTxt, gl.FRAGMENT_SHADER);
        if (!fShader) {
            gl.deleteShader(vShader);
            return null;
        }

        return ShaderUtil.createProgram(gl, vShader, fShader, doValidate);
    }

    static getStandardAttribLocations(gl, program) {
        return {
            position: gl.getAttribLocation(program, ATTR_POSITION_NAME),
            norm: gl.getAttribLocation(program, ATTR_NORMAL_NAME),
            uv: gl.getAttribLocation(program, ATTR_UV_NAME)
        }
    }

    static getStandardUniformLocations(gl, program) {
        return {
            perspective: gl.getUniformLocation(program, 'uPMatrix'),
            modelMatrix: gl.getUniformLocation(program, 'uMVMatrix'),
            cameraMatrix: gl.getUniformLocation(program, 'uCameraMatrix'),
            mainTexture: gl.getUniformLocation(program, 'uMainTex')
        }
    }
}

class ShaderBuilder {
    constructor(gl, vertShader, fragShader) {
        this.program = vertShader.length < 20 ?
                       ShaderUtil.domShaderProgram(gl, vertShader, fragShader, true) :
                       ShaderUtil.createProgramFromText(gl, vertShader, fragShader, true);

        if (this.program) {
            this.gl = gl;
            gl.useProgram(this.program);
            this.mUniformList = {}; // List of uniforms that have been loaded in
            this.mTextureList = []; // List of texture uniforms, Indexed {lox, tex}

            this.noCulling = false;
            this.doBlending = false;
        }
    }

    prepareUniforms(...args) {
        if (args.length % 2 !== 0) {
            console.warn('prepareUniforms needs arguments to be in pairs');
            return this;
        }

        for (let i = 0; i < args.length; i += 2) {
            const loc = gl.getUniformLocation(this.program, args[i]);
            if (loc) {
                this.mUniformList[args[i]] = { loc: loc, type: args[i + 1] };
            }
        }

        return this;
    }

    prepareUniformBlocks(...args) {
        for (let i = 0; i < args.length; i += 2) {
            this.gl.uniformBlockBinding(this.program, args[i + 1], args[i].blockPoint);
        }

        return this;
    }

    prepareTextures(...args) {
        if (args.length % 2 !== 0) {
            console.warn('prepareTextures needs arguments to be in pair');
            return this;
        }

        for (let i = 0; i < args.length; i += 2) {
            const tex = this.gl.mTextureCache[args[i + 1]];
            if (!tex) {
                console.warn(`Texture not found in cache ${args[i + 1]}`);
                continue;
            }

            const loc = gl.getUniformLocation(this.program, args[i]);
            if (loc) {
                this.mTextureList.push({ loc: loc, tex: tex });
            }
        }

        return this;
    }

    setUniforms(...args) {
        if (arguments.length % 2 !== 0) {
            console.warn('setUniforms needs arguments to be in pairs');
            return this;
        }

        for (let i = 0; i < args.length; i += 2) {
            const uniform = this.mUniformList[args[i]];
            if (!uniform) {
                console.warn('uniform not found ' + name);
                return this;
            }

            switch (uniform.type) {
                case '2fv' :
                    this.gl.uniform2fv(uniform.loc, new Float32Array(args[i + 1]));
                    break;
                case '3fv':
                    this.gl.uniform3fv(uniform.loc, new Float32Array(args[i + 1]));
                    break;
                case '4fv':
                    this.gl.uniform4fv(uniform.loc, new Float32Array(args[i + 1]));
                    break;
                case 'mat4':
                    this.gl.uniformMatrix4fv(uniform.loc, false, args[i + 1]);
                    break;
                default:
                    console.warn(`Unknown uniform type for ${args[i]}`);
                    break;
            }
        }

        return this;
    }

    activate() {
        this.gl.useProgram(this.program);
        return this;
    }

    deactivate() {
        this.gl.useProgram(null);
        return this;
    }

    dispose() {
        if (this.gl.getParameter(this.gl.CURRENT_PROGRAM) === this.program) {
            this.gl.useProgram(null);
        }
        this.gl.deleteProgram(this.program);
    }

    preRender(...args) {
        this.gl.useProgram(this.program);

        if (args.length > 0) {
            this.setUniforms(...args);
        }

        if (this.mTextureList.length) {
            for (let i = 0; i < this.mTextureList.length; i++) {
                const texSlot = this.gl['TEXTURE' + i];
                this.gl.activeTexture(texSlot);
                this.gl.bindTexture(this.gl.TEXTURE_2D, this.mTextureList[i].tex);
                this.gl.uniform1i(this.mTextureList[i].loc, i);
            }
        }

        return this;
    }

    renderModel(model, doShaderClose) {
        this.setUniforms('uMVMatrix', model.transform.getViewMatrix());
        this.gl.bindVertexArray(model.mesh.vao);

        if (model.mesh.noCulling || this.noCulling) this.gl.disable(this.gl.CULL_FACE);
        if (model.mesh.doBlending || this.doBlending) this.gl.enable(this.gl.BLEND);

        if (model.mesh.indexCount) {
            this.gl.drawElements(model.mesh.drawMode, model.mesh.indexCount, this.gl.UNSIGNED_SHORT, 0)
        } else {
            this.gl.drawArrays(model.mesh.drawMode, 0, model.mesh.vertexCount);
        }

        // Clean up
        this.gl.bindVertexArray(null);
        if (model.mesh.noCulling || this.noCulling) this.gl.enable(this.gl.CULL_FACE);
        if (model.mesh.doBlending || this.doBlending) this.gl.disable(this.gl.BLEND);

        if (doShaderClose) this.gl.useProgram(null);

        return this;
    }
}

class UBO {
    constructor(gl, blockName, blockPoint, bufSize, aryCalc) {
        this.items = {};
        this.keys = [];

        for (let i = 0; i < aryCalc.length; i++) {
            this.items[aryCalc[i].name] = {
                offset: aryCalc[i].offset,
                dataLen: aryCalc[i].dataLen,
                chunkLen: aryCalc[i].chunkLen
            };
            this.keys[i] = aryCalc[i].name;
        }

        this.gl = gl;
        this.blockName = blockName;
        this.blockPoint = blockPoint;

        this.buf = gl.createBuffer();
        gl.bindBuffer(gl.UNIFORM_BUFFER, this.buf);
        gl.bufferData(gl.UNIFORM_BUFFER, bufSize, gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.UNIFORM_BUFFER, null);
        gl.bindBufferBase(gl.UNIFORM_BUFFER, blockPoint, this.buf);
    }

    update(name, data) {
        if (!(data instanceof Float32Array)) {
            data = new Float32Array(Array.isArray(data) ? data : [data]);
        }

        this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, this.buf);
        this.gl.bufferSubData(this.gl.UNIFORM_BUFFER, this.items[name].offset, data, 0, null);
        this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, null);
        return this;
    }

    static create(gl, blockName, blockPoint, ary) {
        var bufSize = UBO.calculate(ary);
        UBO.Cache[blockName] = new UBO(gl, blockName, blockPoint, bufSize, ary);
        UBO.debugVisualize(UBO.Cache[blockName]);
    }

    static getSize(type) {
        switch (type) {
            case 'mat4':
                return 16 * 4;
            case 'mat3':
                return 16 * 3;
            case 'vec2':
                return 8;
            case 'f':
            case'i':
            case 'b':
                return 4;
            case 'vec3':
            case 'vec4':
                return 16;
            default:
                return 0;
        }
    }

    static calculate(ary) {
        let chunk = 16; // Data size in bytes, UBO using layout std140 needs to build out the struct in chunks of 16 bytes
        let offset = 0; // Offset in the buffer allocation
        for (let i = 0; i < ary.length; i++) {
            const size = !ary[i].arylen || ary[i].arylen === 0 ? // Data size of the current type
                         UBO.getSize(ary[i].type) :
                         ary[i].arylen * 16;
            const tsize = chunk - size; // Temp size, how much of the chunk is available after removing the data size from it

            // Chunk has been overdrawn when it already has some data reserved for it
            if (tsize < 0 && chunk < 16) {
                offset += chunk; // Add remaining chunk to offset
                if (i > 0) ary[i - 1].chunkLen += chunk; // So the remaining chunk can be used by the last variable
                chunk = 16; // Reset chunk
            } else if (tsize < 0 && chunk === 16) {
                // Do nothing in case data length is >= unused chunk size
            } else if (tsize === 0) {
                chunk = 16;
            } else {
                chunk -= size;
            }

            ary[i].offset = offset;
            ary[i].chunkLen = size;
            ary[i].dataLen = size;

            offset += size;
        }

        if (offset % 16 !== 0) {
            ary[ary.length - 1].chunkLen += chunk;
            offset += chunk;
        }

        console.log("UBO Buffer size ", offset);
        return offset;
    }

    static debugVisualize(ubo) {
        let str = '';
        let tchunk = 0;

        for (let i = 0; i < ubo.keys.length; i++) {
            const item = ubo.items[ubo.keys[i]];
            console.log(ubo.keys[i], item);

            const chunk = item.chunkLen / 4;
            for (let x = 0; x < chunk; x++) {
                str += (x === 0 || x === chunk - 1) ? '|.' + i + '.' : '|...';
                tchunk++;
                if (tchunk % 4 === 0) {
                    str += '| ~ ';
                }
            }
        }

        if (tchunk % 4 !== 0) {
            str += '|'
        }

        console.log(str);
    }
}

UBO.Cache = [];
