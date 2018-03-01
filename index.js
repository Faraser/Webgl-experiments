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

class SkymapShader extends Shader {
    constructor(gl, pMatrix, dayTex, nightTex) {
        const vertSrc = ShaderUtil.domShaderSrc('sky_vshader');
        const fragSrc = ShaderUtil.domShaderSrc('sky_fshader');

        super(gl, vertSrc, fragSrc);

        this.uniformLoc.time = gl.getUniformLocation(this.program, 'uTime');
        this.uniformLoc.dayTex = gl.getUniformLocation(this.program, 'uDayTex');
        this.uniformLoc.nightTex = gl.getUniformLocation(this.program, 'uNightTex');

        this.setPerspective(pMatrix);
        this.texDay = dayTex;
        this.texNight = nightTex;

        gl.useProgram(null);
    }

    setTime(t) {
        this.gl.uniform1f(this.uniformLoc.time, t);
        return this;
    }

    preRender() {
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.texDay);
        this.gl.uniform1i(this.uniformLoc.dayTex, 0);

        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.texNight);
        this.gl.uniform1i(this.uniformLoc.nightTex, 1);
        return this;
    }
}

function onRender(dt) {
    window.gCamera.updateViewMatrix();
    window.gl.fClear();

    window.gSkymapShader.activate().preRender()
        .setCameraMatrix(window.gCamera.getTranslatelessMatrix())
        .setTime(performance.now())
        .renderModel(window.gSkymap);

    window.gridShader.activate()
        .setCameraMatrix(window.gCamera.viewMatrix)
        .renderModel(window.gridModel.preRender());

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
    gl.fLoadCubeMap('skybox01', [
        document.getElementById('cube01_right'),
        document.getElementById('cube01_left'),
        document.getElementById('cube01_top'),
        document.getElementById('cube01_bottom'),
        document.getElementById('cube01_back'),
        document.getElementById('cube01_front')
    ]);

    gl.fLoadCubeMap('skybox02', [
        document.getElementById('cube02_right'),
        document.getElementById('cube02_left'),
        document.getElementById('cube02_top'),
        document.getElementById('cube02_bottom'),
        document.getElementById('cube02_back'),
        document.getElementById('cube02_front')
    ]);

    window.gridShader = new GridAxisShader(gl, window.gCamera.projectionMatrix);
    window.gridModel = new Model(Primitives.GridAxis.createMesh(gl, true));

    window.gShader = new TestShader(gl, window.gCamera.projectionMatrix)
        .setTexture(gl.mTextureCache['tex001']);

    window.gModel2 = new Model(ObjLoader.domToMesh('objCube', 'obj_file', true));
    window.gModel2.setPosition(0, 0.6, 0).setScale(0.5, 0.5, 0.5);

    window.gSkymap = new Model(Primitives.Cube.createMesh(gl, 'Skymap', 10, 10, 10, 0, 0, 0));
    window.gSkymapShader = new SkymapShader(gl, window.gCamera.projectionMatrix,
        gl.mTextureCache['skybox01'], gl.mTextureCache['skybox02']);

    window.RLoop = new RenderLoop(onRender, 60).start();
});
