class TestShader extends Shader {
    constructor(gl, pMatrix) {
        const vertSrc = ShaderUtil.domShaderSrc('vertex_shader');
        const fragSrc = ShaderUtil.domShaderSrc('fragment_shader');

        super(gl, vertSrc, fragSrc);

        this.setPerspective(pMatrix);

        this.mainTexture = -1; // Store texture id
        gl.useProgram(null);
    }

    setTexture(texId) {
        this.mainTexture = texId;
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

    window.gModel = Primitives.MultiQuad.createModel(gl)
        .setPosition(0, 0.6, 0);

    window.RLoop = new RenderLoop(onRender, 30).start();
});
