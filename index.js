class TestShader extends Shader {
    constructor(gl, pMatrix) {
        const vertSrc = ShaderUtil.domShaderSrc('vertex_shader');
        const fragSrc = ShaderUtil.domShaderSrc('fragment_shader');

        super(gl, vertSrc, fragSrc);

        //Custom Uniforms
        this.uniformLoc.lightpos = gl.getUniformLocation(this.program,"uLightPos");
        this.uniformLoc.campos = gl.getUniformLocation(this.program,"uCamPos");
        this.uniformLoc.matNormal = gl.getUniformLocation(this.program,"uNormMatrix");

        this.setPerspective(pMatrix);
        this.mainTexture = -1; // Store texture id
        gl.useProgram(null);
    }

    setTexture(texId) {
        this.mainTexture = texId;
        return this;
    }

    setLightPos(obj) {
        this.gl.uniform3fv(this.uniformLoc.lightpos, new Float32Array(obj.transform.position.getArray()));
        return this;
    }

    setCameraPos(obj) {
        this.gl.uniform3fv(this.uniformLoc.campos, new Float32Array(obj.transform.position.getArray()));
        return this;
    }

    preRender() {
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.mainTexture);
        this.gl.uniform1i(this.uniformLoc.mainTexture, 0);
        return this;
    }

    renderModel(model) {
        this.gl.uniformMatrix3fv(this.uniformLoc.matNormal, false, model.transform.getNormalMatrix());
        super.renderModel(model);
        return this;
    }
}

let radius = 1.5,
    angle = 0,
    angleInc = 1,
    yPos = 0,
    yPosInc = 0.2;

function onRender(dt) {
    window.gCamera.updateViewMatrix();
    window.gl.fClear();

    window.gSkymap.render(window.gCamera);
    window.gGridFloor.render(window.gCamera);

    angle += angleInc * dt;
    yPos += yPosInc * dt;

    const x = radius * Math.cos(angle);
    const z = radius * Math.sin(angle);
    const y = MathUtil.Map(Math.sin(yPos), -1, 1, 0.1, 2);
    mDebug.transform.position.set(x, y, z);

    window.gShader.activate()
        .preRender()
        .setCameraMatrix(window.gCamera.viewMatrix)
        .setCameraPos(window.gCamera)
        .setLightPos(window.mDebug)
        // .renderModel(window.gModel.preRender());
        .renderModel(window.gModel2.preRender());

    window.mDebug.render(window.gCamera);
}

window.addEventListener('load', function() {
    const gl = window.gl = GLInstance('canvas').fSetSize(500, 500).fClear();

    window.gCamera = new Camera(gl);
    window.gCamera.transform.position.set(0, 1, 3);
    window.gCameraCtrl = new CameraController(gl, window.gCamera);

    window.gSkymap = new Skymap(gl)
        .setDayTexByDom('cube01_right', 'cube01_left', 'cube01_top', 'cube01_bottom', 'cube01_back', 'cube01_front')
        .setNightTexByDom('cube02_right', 'cube02_left', 'cube02_top', 'cube02_bottom', 'cube02_back', 'cube02_front')
        .setTime(0.7).finalize();

    window.gGridFloor = new GridFloor(gl);

    gl.fLoadTexture('tex001', document.getElementById('imgTex'));

    window.gShader = new TestShader(gl, window.gCamera.projectionMatrix)
        .setTexture(gl.mTextureCache['tex001']);

    window.gModel = Primitives.Cube.createModel(gl);

    window.gModel2 = new Model(ObjLoader.domToMesh('ObjCube', 'obj_file', true, true)).setScale(0.5, 0.5, 0.5);

    window.mDebug = new VertexDebugger(gl, 10).addColor('#ff0000').addPoint(0, 0, 0, 0).finalize();

    window.RLoop = new RenderLoop(onRender).start();
});
