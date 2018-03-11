const ATTR_POSITION_NAME = 'a_position';
const ATTR_POSITION_LOC = 0;
const ATTR_NORMAL_NAME = 'a_norm';
const ATTR_NORMAL_LOC = 1;
const ATTR_UV_NAME = 'a_uv';
const ATTR_UV_LOC = 2;

function GLInstance(canvasId) {

    const canvas = document.getElementById(canvasId);
    const gl = canvas.getContext('webgl2');

    if (!gl) {
        throw (new Error("Unable to initialize WebGL!"));
    }

    gl.mMeshCache = {}; // Cache all the mesh structs, easy to unload buffer if they all exist in one place
    gl.mTextureCache = {};

    gl.cullFace(gl.BACK);
    gl.frontFace(gl.CCW);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.depthFunc(gl.LEQUAL);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.fClear = function() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        return this;
    };

    gl.fSetSize = function(w, h) {
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        canvas.width = w;
        canvas.height = h;

        gl.viewport(0, 0, w, h);
        return this;
    };

    gl.fFitScreen = function(wp = 1, hp = 1) {
        return this.fSetSize(window.innerWidth * wp, window.innerHeight * hp);
    };

    gl.fCreateArrayBuffer = function(floatAry, isStatic = true) {
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, floatAry, isStatic ? gl.STATIC_DRAW : gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return buf;
    };

    gl.fCreateMeshVAO = function(name, aryInd, aryVert, aryNorm, aryUV, vertLen = 3) {
        const rtn = { drawMode: gl.TRIANGLES };

        // Create and bind vao
        rtn.vao = gl.createVertexArray();
        gl.bindVertexArray(rtn.vao);

        // Set up vertices
        if (aryVert !== undefined && aryVert !== null) {
            rtn.bufVertices = gl.createBuffer();
            rtn.vertexComponentLen = vertLen;
            rtn.vertexCount = aryVert.length / rtn.vertexComponentLen;

            gl.bindBuffer(gl.ARRAY_BUFFER, rtn.bufVertices);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(aryVert), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(ATTR_POSITION_LOC);
            gl.vertexAttribPointer(ATTR_POSITION_LOC, rtn.vertexComponentLen, gl.FLOAT, false, 0, 0);
        }

        // Set up normals
        if (aryNorm !== undefined && aryNorm !== null) {
            rtn.bufNormals = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, rtn.bufNormals);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(aryNorm), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(ATTR_NORMAL_LOC);
            gl.vertexAttribPointer(ATTR_NORMAL_LOC, 3, gl.FLOAT, false, 0, 0);
        }

        // Set up UV
        if (aryUV !== undefined && aryUV !== null) {
            rtn.bufUV = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, rtn.bufUV);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(aryUV), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(ATTR_UV_LOC);
            gl.vertexAttribPointer(ATTR_UV_LOC, 2, gl.FLOAT, false, 0, 0);
        }

        // Set up index
        if (aryInd !== undefined && aryInd !== null) {
            rtn.bufIndex = gl.createBuffer();
            rtn.indexCount = aryInd.length;
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, rtn.bufIndex);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(aryInd), gl.STATIC_DRAW);
        }

        // Clean up
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        if (aryInd !== undefined && aryInd !== null) gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        gl.mMeshCache[name] = rtn;
        return rtn;
    };

    gl.fLoadTexture = function(name, img, doYFlip, noMips) {
        gl.mTextureCache[name] = gl.createTexture();
        return gl.fUpdateTexture(name, img, doYFlip, noMips);
    };

    gl.fUpdateTexture = function(name, img, doYFlip, noMips) {
        const tex = gl.mTextureCache[name];
        if (doYFlip) {
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // Flip the texture by the Y position
        }

        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img); // Push image to GPU

        if (!noMips) {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); // Setup up scaling
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST); // Setup down scaling
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }

        gl.bindTexture(gl.TEXTURE_2D, null);

        if (doYFlip) {
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); // Stop flipping textures
        }

        return tex;
    };

    gl.fLoadCubeMap = function(name, imgAry) {
        if (imgAry.length !== 6) return null;

        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, tex);

        for (let i=0; i<6; i++) {
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imgAry[i]);
        }

        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR); // Setup scaling
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR); // Setup scaling
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); // Stretch image to X position
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); // Stretch image to Y position
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE); // Stretch image to Z position

        // gl.generateMipmap(gl.TEXTURE_CUBE_MAP);

        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
        gl.mTextureCache[name] = tex;
        return tex;
    };

    return gl;
}

class GLUtil {
    static rgbToArray(...args) {
        if (args.length === 0) return null;
        const result = [];

        for (let i = 0, c, p; i < args.length; i++) {
            if (args[i].length < 6) continue;
            c = args[i];
            p = (c[0] === '#') ? 1 : 0;

            result.push(
                parseInt(c[p] + c[p + 1], 16) / 255.0,
                parseInt(c[p + 2] + c[p + 3], 16) / 255.0,
                parseInt(c[p + 4] + c[p + 5], 16) / 255.0
            )
        }

        return result;
    }
}
