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

    gl.mMeshCache = []; // Cache all the mesh structs, easy to unload buffer if they all exist in one place

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

    gl.fCreateArrayBuffer = function(floatAry, isStatic = true) {
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, floatAry, isStatic ? gl.STATIC_DRAW : gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return buf;
    };

    gl.fCreateMeshVAO = function(name, aryInd, aryVert, aryNorm, aryUV) {
        const rtn = { drawMode: gl.TRIANGLES };

        // Create and bind vao
        rtn.vao = gl.createVertexArray();
        gl.bindVertexArray(rtn.vao);

        // Set up vertices
        if (aryVert !== undefined && aryVert !== null) {
            rtn.bufVertices = gl.createBuffer();
            rtn.vertexComponentLen = 3;
            rtn.vertexCount = aryVert.length / rtn.vertexComponentLen;

            gl.bindBuffer(gl.ARRAY_BUFFER, rtn.bufVertices);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(aryVert), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(ATTR_POSITION_LOC);
            gl.vertexAttribPointer(ATTR_POSITION_LOC, 3, gl.FLOAT, false, 0, 0);
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
        if (aryUV !== undefined && aryUV != null) {
            rtn.bufUV = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, rtn.bufUV);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(aryUV), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(ATTR_UV_LOC);
            gl.vertexAttribPointer(ATTR_UV_LOC, 2, gl.FLOAT, false, 0, 0);
        }

        // Set up index
        if (aryInd !== undefined && aryInd != null) {
            rtn.bufIndex = gl.createBuffer();
            rtn.indexCount = aryInd.length;
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, rtn.bufIndex);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(aryInd), gl.STATIC_DRAW);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        }

        // Clean up
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        gl.mMeshCache[name] = rtn;
        return rtn;
    };

    return gl;
}

class TestShader extends Shader {
    constructor(gl, aryColor) {
        const vertSrc = ShaderUtil.domShaderSrc('vertex_shader');
        const fragSrc = ShaderUtil.domShaderSrc('fragment_shader');

        super(gl, vertSrc, fragSrc);

        const uColor = gl.getUniformLocation(this.program, 'uColor');
        gl.uniform3fv(uColor, aryColor);

        gl.useProgram(null);
    }
}

function onRender(dt) {
    gl.fClear();

    const p = window.gModel.transform.position;
    const angle = Math.atan2(p.y, p.x) + (1 * dt);
    const radius = Math.sqrt(p.x * p.x + p.y * p.y);
    const scale = Math.max(0.2, Math.abs(Math.sin(angle)) * 1.2);


    window.gShader.activate().renderModel(window.gModel
        .setScale(scale, scale / 4, 1)
        .setPosition(radius * Math.cos(angle), radius * Math.sin(angle), 0)
        .addRotation(30 * dt, 60 * dt, 15 * dt)
        .preRender());
}

window.addEventListener('load', function() {
    const gl = window.gl = GLInstance('canvas').fSetSize(500, 500).fClear();

    window.gShader = new TestShader(gl, [0.8,0.8,0.8, 1,0,0, 0,1,0, 0,0,1]);

    window.gModel = new Model(Primitives.GridAxis.createMesh(gl))
        .setScale(0.4, 0.4, 0.4)
        .setRotation(0, 0, 45)
        .setPosition(0.8, 0.8, 0);

    window.RLoop = new RenderLoop(onRender).start();
});
