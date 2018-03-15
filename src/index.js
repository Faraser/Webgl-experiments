function onRender(dt) {
    window.gCamera.updateViewMatrix();
    window.gl.fClear();

    UBO.Cache['MatTransform'].update('matCameraView', window.gCamera.viewMatrix);

    // window.gSkymap.render(window.gCamera);
    window.gGridFloor.render(window.gCamera);

    window.gShader
        .preRender()
        .renderModel(gModel.preRender(), false);
}

function onReady() {
    window.gShader = new ShaderBuilder(gl, 'vertex_shader', 'fragment_shader')
        .prepareUniforms('uMVMatrix', 'mat4')
        .prepareUniformBlocks(UBO.Cache['MatTransform'], 0);

    const cubeMesh = Primitives.Cube.createMesh(gl, 'Cube', 1, 1, 1, 0, 0, 0, false);
    window.gModel = new Model(cubeMesh).setPosition(0, 0.5, 0);

    window.RLoop.start();
}

window.addEventListener('load', function() {
    const gl = window.gl = GLInstance('canvas').fFitScreen(0.95, 0.9).fClear();

    window.gCamera = new Camera(gl);
    window.gCamera.transform.position.set(0, 1, 3);
    window.gCameraCtrl = new CameraController(gl, window.gCamera);

    window.gSkymap = new Skymap(gl)
        .setDayTexByDom('cube01_right', 'cube01_left', 'cube01_top', 'cube01_bottom', 'cube01_back', 'cube01_front')
        .setNightTexByDom('cube02_right', 'cube02_left', 'cube02_top', 'cube02_bottom', 'cube02_back', 'cube02_front')
        .setTime(0.7).finalize();

    window.gGridFloor = new GridFloor(gl);

    UBO.create(gl, 'MatTransform', 1, [
        { name: 'matProjection', type: 'mat4' },
        { name: 'matCameraView', type: 'mat4' }
    ]);

    UBO.Cache['MatTransform'].update('matProjection', gCamera.projectionMatrix);

    window.RLoop = new RenderLoop(onRender);

    onReady();

});
