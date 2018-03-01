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

    window.gSkymap.render(window.gCamera);
    window.gGridFloor.render(window.gCamera);

    window.gShader.activate()
        .preRender()
        .setCameraMatrix(gCamera.viewMatrix)
        .renderModel(window.gModel2.preRender())
}

window.addEventListener('load', function() {
    const gl = window.gl = GLInstance('canvas').fSetSize(500, 500).fClear();

    window.gCamera = new Camera(gl);
    window.gCamera.transform.position.set(0, 1, 3);
    window.gCameraCtrl = new CameraController(gl, window.gCamera);

    gl.fLoadTexture('tex001', document.getElementById('imgTex'));

    window.gShader = new TestShader(gl, window.gCamera.projectionMatrix)
        .setTexture(gl.mTextureCache['tex001']);

    window.gModel2 = new Model(ObjLoader.domToMesh('objCube', 'obj_file', true));
    window.gModel2.setPosition(0, 0.6, 0).setScale(0.5, 0.5, 0.5);

    window.gSkymap = new Skymap(gl)
        .setDayTexByDom('cube01_right', 'cube01_left', 'cube01_top', 'cube01_bottom', 'cube01_back', 'cube01_front' )
        .setNightTexByDom('cube02_right', 'cube02_left', 'cube02_top', 'cube02_bottom', 'cube02_back', 'cube02_front')
        .setTime(0.7).finalize();

    window.gGridFloor = new GridFloor(gl);

    window.RLoop = new RenderLoop(onRender, 60).start();
});
