function onRender(dt) {
    window.gCamera.updateViewMatrix();
    window.gl.fClear();

    window.gSkymap.render(window.gCamera);
    window.gGridFloor.render(window.gCamera);

    gShader.preRender('uCameraMatrix', window.gCamera.viewMatrix)
        // .renderModel(gModel.preRender(), false)

    for (let i=0; i < window.gCubes.length; i++) {
        window.gShader.setUniforms('uFaces', window.texMap[i]).renderModel(gCubes[i].preRender());
    }
}

function onReady() {
    window.gShader = new ShaderBuilder(gl, 'vertex_shader', 'fragment_shader')
        .prepareUniforms(
            'uPMatrix', 'mat4',
            'uMVMatrix', 'mat4',
            'uCameraMatrix', 'mat4',
            'uColors', '3fv',
            'uFaces', '2fv'
        )
        .prepareTextures('uAtlas', 'atlas')
        .setUniforms('uPMatrix', window.gCamera.projectionMatrix);

    window.gCubes = [];
    window.texMap = [
        [3, 0, 3, 0, 3, 0, 2, 0, 3, 0, 2, 9], // GrassDirt
        [4, 1, 4, 1, 4, 1, 5, 1, 4, 1, 5, 1], // Log
        [11, 1, 10, 1, 10, 1, 9, 1, 10, 1, 9, 1], // Chest
        [7, 7, 6, 7, 6, 7, 6, 7, 6, 7, 6, 6], // Pumpkin
        [8, 8, 8, 8, 8, 8, 9, 8, 8, 8, 9, 8], // WaterMelon
        [8, 0, 8, 0, 8, 0, 10, 0, 8, 0, 9, 0] // TNT
    ];

    const cubeMesh = Primitives.Cube.createMesh(window.gl, 'Cube', 1, 1, 1, 0, 0, 0, false);
    for (let i=0; i < 6; i++) {
        const model = new Model(cubeMesh).setPosition((i % 3) * 2, 0.6, Math.floor(i / 3) * -2);
        window.gCubes.push(model);
    }

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
        .loadTexture('atlas', 'textures/atlas_mindcraft.png')
        .start();

    window.RLoop = new RenderLoop(onRender);

});
