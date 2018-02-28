class TestShader extends Shader {
    constructor(gl, pMatrix) {
        const vertSrc = ShaderUtil.domShaderSrc('vertex_shader');
        const fragSrc = ShaderUtil.domShaderSrc('fragment_shader');

        super(gl, vertSrc, fragSrc);

        this.uniformLoc.time = gl.getUniformLocation(this.program, 'uTime');
        const uColor = gl.getUniformLocation(this.program, 'uColor');
        gl.uniform3fv(uColor, new Float32Array(GLUtil.rgbToArray('#ff0000', '00ff00', '0000ff', '909090', 'c0c0c0', '404040')))

        this.setPerspective(pMatrix);

        this.mainTexture = -1; // Store texture id
        gl.useProgram(null);
    }

    setTexture(texId) {
        this.mainTexture = texId;
        return this;
    }

    setTime(t) {
        this.gl.uniform1f(this.uniformLoc.time, t);
        return this;
    }

    preRender() {
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.mainTexture);
        this.gl.uniform1i(this.uniformLoc.mainTexture, 0);
        return this;
    }
}

function onRender(dt) {
    window.gCamera.updateViewMatrix();
    window.gl.fClear();

    window.gridShader.activate()
        .setCameraMatrix(window.gCamera.viewMatrix)
        .renderModel(window.gridModel.preRender());

    window.gShader.activate()
        .preRender()
        .setTime(performance.now())
        .setCameraMatrix(gCamera.viewMatrix)
        .renderModel(window.gModel.preRender())
}

window.addEventListener('load', function() {
    const gl = window.gl = GLInstance('canvas').fSetSize(500, 500).fClear();

    window.gCamera = new Camera(gl);
    window.gCamera.transform.position.set(0, 1, 3);
    window.gCameraCtrl = new CameraController(gl, window.gCamera);

    gl.fLoadTexture('tex001', document.getElementById('imgTex'));

    window.gridShader = new GridAxisShader(gl, window.gCamera.projectionMatrix);
    window.gridModel = new Model(Primitives.GridAxis.createMesh(gl, true));

    window.gShader = new TestShader(gl, window.gCamera.projectionMatrix)
        .setTexture(gl.mTextureCache['tex001']);

    window.gModel = Primitives.Cube.createModel(gl)
        .setPosition(0, 0.6, 0);

    window.RLoop = new RenderLoop(onRender, 60).start();
});
