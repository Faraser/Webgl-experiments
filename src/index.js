function onRender(dt) {
    window.gCamera.updateViewMatrix();
    window.gl.fClear();

    window.gSkymap.render(window.gCamera);
    window.gGridFloor.render(window.gCamera);

    gl.fUpdateTexture('vid', Resources.Videos['vid'], false, true);

    gShader.preRender('uCameraMatrix', window.gCamera.viewMatrix)
        .renderModel(gModel.preRender(), false)

}

function onReady() {
    window.gShader = new ShaderBuilder(gl, 'vertex_shader', 'fragment_shader')
        .prepareUniforms(
            'uPMatrix', 'mat4',
            'uMVMatrix', 'mat4',
            'uCameraMatrix', 'mat4'
        )
        .prepareTextures('uTex', 'vid')
        .setUniforms('uPMatrix', window.gCamera.projectionMatrix);

    window.gModel = Primitives.Cube.createModel(gl, 'Cube', true).setPosition(0, 0.6, 0);

    window.RLoop.start();
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

    Resources.setup(gl, onReady)
        .loadVideoTexture('vid', 'textures/shark_3d_360.mp4')
        .start();

    window.RLoop = new RenderLoop(onRender);

});
