class TestShader extends Shader {
    constructor(gl, pMatrix) {
        const vertSrc = ShaderUtil.domShaderSrc('vertex_shader');
        const fragSrc = ShaderUtil.domShaderSrc('fragment_shader');

        super(gl, vertSrc, fragSrc);

        this.setPerspective(pMatrix);
        gl.useProgram(null);
    }
}

function onRender(dt) {
    window.gCamera.updateViewMatrix();
    window.gl.fClear();

    window.gridShader.activate()
        .setCameraMatrix(window.gCamera.viewMatrix)
        .renderModel(window.gridModel.preRender());

    window.gShader.activate()
        .setCameraMatrix(gCamera.viewMatrix)
        .renderModel(window.gModel.preRender())
}

window.addEventListener('load', function() {
    const gl = window.gl = GLInstance('canvas').fSetSize(500, 500).fClear();

    window.gCamera = new Camera(gl);
    window.gCamera.transform.position.set(0, 1, 3);
    window.gCameraCtrl = new CameraController(gl, window.gCamera);

    window.gridShader = new GridAxisShader(gl, window.gCamera.projectionMatrix);
    window.gridModel = new Model(Primitives.GridAxis.createMesh(gl, true));

    window.gShader = new TestShader(gl, window.gCamera.projectionMatrix);
    window.gModel = Primitives.MultiQuad.createModel(gl);

    window.RLoop = new RenderLoop(onRender).start();
});
