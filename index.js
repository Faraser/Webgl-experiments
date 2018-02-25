function GLInstance(canvasId) {

    const canvas = document.getElementById(canvasId);
    const gl = canvas.getContext('webgl2');

    if (!gl) {
        throw (new Error("Unable to initialize WebGL!"));
    }

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

    return gl;
}

window.addEventListener('load', function() {
    const gl = window.gl = GLInstance('canvas').fSetSize(500, 500).fClear();

    // Link shaders together as a program
    const shaderProg = ShaderUtil.domShaderProgram(gl, 'vertex_shader', 'fragment_shader', true);

    // Get location uniforms
    gl.useProgram(shaderProg);

    const aPositionLoc = gl.getAttribLocation(shaderProg, 'a_position');
    const uPointSizeLoc = gl.getUniformLocation(shaderProg, 'uPointSize');
    const uAngleLoc = gl.getUniformLocation(shaderProg, 'uAngle');

    gl.useProgram(null);

    // Set up data buffers
    const aryVerts = new Float32Array([0, 0, 0]);
    const bufVerts = gl.fCreateArrayBuffer(aryVerts);

    window.gVertCount = aryVerts.length / 3;

    // Set up for drawing
    gl.useProgram(shaderProg);

    gl.bindBuffer(gl.ARRAY_BUFFER, bufVerts);
    gl.enableVertexAttribArray(aPositionLoc);
    gl.vertexAttribPointer(aPositionLoc, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    const RLoop = new RenderLoop(onRender).start();

    let gPointSize = 0;
    let gPSizeStep = 3;
    let gAngle = 0;
    let gAngleStep = (Math.PI / 180.0) * 90;

    function onRender(dt) {
        gPointSize += gPSizeStep * dt;
        const size = (Math.sin(gPointSize) * 10.0) + 30.0;
        gl.uniform1f(uPointSizeLoc, size);

        gAngle += gAngleStep * dt;
        gl.uniform1f(uAngleLoc, gAngle);

        gl.fClear();
        gl.drawArrays(gl.POINTS, 0, window.gVertCount);
    }
});
