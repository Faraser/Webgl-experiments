function GLInstance(canvasId) {

    const canvas = document.getElementById(canvasId);
    const gl = this.canvas.getContext('webgl2');

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

    return gl;
}

window.addEventListener('load', function() {
    const gl = window.gl = GLInstance('canvas').fSetSize(500, 500).fClear();

    // Get vertex and fragment shader text
    const vShaderTxt = ShaderUtil.domShaderSrc('vertex_shader');
    const fShaderTxt = ShaderUtil.domShaderSrc('fragment_shader');

    // Compile text and validate
    const vShader = ShaderUtil.createShader(gl, vShaderTxt, gl.VERTEX_SHADER);
    const fShader = ShaderUtil.createShader(gl, fShaderTxt, gl.FRAGMENT_SHADER);

    // Link shaders together as a program
    const shaderProg = ShaderUtil.createProgram(gl, vShader, fShader, true);

    // Get location uniforms
    gl.useProgram(shaderProg);

    const aPositionLoc = gl.getAttribLocation(shaderProg, 'a_position');
    const uPointSizeLoc = gl.getUniformLocation(shaderProg, 'uPointSize');

    gl.useProgram(null);

    // Set up data buffers
    const aryVerts = new Float32Array([0, 0, 0, 0.5, 0.7, 0]);
    const bufVerts = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, bufVerts);
    gl.bufferData(gl.ARRAY_BUFFER, aryVerts, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // Set up for drawing
    gl.useProgram(shaderProg);
    gl.uniform1f(uPointSizeLoc, 50.0);

    gl.bindBuffer(gl.ARRAY_BUFFER, bufVerts);
    gl.enableVertexAttribArray(aPositionLoc);
    gl.vertexAttribPointer(aPositionLoc, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    gl.drawArrays(gl.POINTS, 0, 2);
});
