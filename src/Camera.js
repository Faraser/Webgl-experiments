class Camera {
    constructor(gl, fov = 45, near = 0.1, far = 100) {
        this.projectionMatrix = new Float32Array(16);
        const ratio = gl.canvas.width / gl.canvas.height;
        Matrix4.perspective(this.projectionMatrix, fov, ratio, near, far);

        this.transform = new Transform();
        this.viewMatrix = new Float32Array(16);

        this.mode = Camera.MODE_ORBIT;
    }

    panX(v) {
        if (this.mode === Camera.MODE_ORBIT) return; // Panning on the X axis is only allowed when in free mode
        this.updateViewMatrix();
        this.transform.position.x += this.transform.right[0] * v;
        this.transform.position.y += this.transform.right[1] * v;
        this.transform.position.z += this.transform.right[2] * v;
    }

    panY(v) {
        this.updateViewMatrix();
        this.transform.position.y += this.transform.up[1] * v;
        if (this.mode === Camera.MODE_ORBIT) return; // Can only move up and down the y axix in orbit mode
        this.transform.position.x += this.transform.up[0] * v;
        this.transform.position.z += this.transform.up[2] * v;
    }

    panZ(v) {
        this.updateViewMatrix();
        if (this.mode === Camera.MODE_ORBIT) {
            // Orbit mode does translate after rotate, so only need to set Z, the rotate will handle the rest
            this.transform.position.z += v;
        } else {
            // In free mode to move forward, we need to move based on our forward which is relative to our current rotatio
            this.transform.position.x += this.transform.forward[0] * v;
            this.transform.position.y += this.transform.forward[1] * v;
            this.transform.position.z += this.transform.forward[2] * v;
        }
    }

    updateViewMatrix() {
        // Optimize camera transform update, no need for scale or rotateZ
        if (this.mode === Camera.MODE_FREE) {
            this.transform.matView.reset()
                .vtranslate(this.transform.position)
                .rotateY(this.transform.rotation.y * Transform.deg2Rad)
                .rotateX(this.transform.rotation.x * Transform.deg2Rad);
        } else {
            this.transform.matView.reset()
                .rotateY(this.transform.rotation.y * Transform.deg2Rad)
                .rotateX(this.transform.rotation.x * Transform.deg2Rad)
                .vtranslate(this.transform.position);
        }

        this.transform.updateDirection();

        Matrix4.invert(this.viewMatrix, this.transform.matView.raw);
        return this.viewMatrix;
    }

    getTranslatelessMatrix() {
        const mat = new Float32Array(this.viewMatrix);
        mat[12] = mat[13] = mat[14] = 0.0; // Reset Translation position in the matrix to zero
        return mat;
    }
}

Camera.MODE_FREE = 0; // Allows free movement of position and rotation
Camera.MODE_ORBIT = 1; // Movement is locked to rotate around the origin

class CameraController {
    constructor(gl, camera) {
        const box = gl.canvas.getBoundingClientRect();
        this.canvas = gl.canvas;
        this.camera = camera;

        this.rotateRate = -300;
        this.panRate = 5;
        this.zoomRate = 200;

        this.offsetX = box.left;
        this.offsetY = box.top;

        this.initX = 0;
        this.initY = 0;
        this.prevX = 0;
        this.prevY = 0;

        this.onUpHandler = (e) => this.onMouseUp(e);
        this.onMoveHandler = (e) => this.onMouseMove(e);

        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousewheel', (e) => this.onMouseWheel(e));
    }

    getMouseVec2(e) {
        return { x: e.pageX - this.offsetX, y: e.pageY - this.offsetY };
    }

    // Begin listening for dragging movement
    onMouseDown(e) {
        this.initX = this.prevX = e.pageX - this.offsetX;
        this.initY = this.prevY = e.pageY - this.offsetY;

        this.canvas.addEventListener('mouseup', this.onUpHandler);
        this.canvas.addEventListener('mousemove', this.onMoveHandler);
    }

    // End listening for dragging movement
    onMouseUp(e) {
        this.canvas.removeEventListener('mouseup', this.onUpHandler);
        this.canvas.removeEventListener('mousemove', this.onMoveHandler);
    }

    onMouseWheel(e) {
        const delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
        this.camera.panZ(delta * (this.zoomRate / this.canvas.height));
    }

    onMouseMove(e) {
        const x = e.pageX - this.offsetX;
        const y = e.pageY - this.offsetY;
        const dx = x - this.prevX;
        const dy = y - this.prevY;

        if (!e.shiftKey) {
            this.camera.transform.rotation.y += dx * (this.rotateRate / this.canvas.width);
            this.camera.transform.rotation.x += dy * (this.rotateRate / this.canvas.height);
        } else {
            this.camera.panX(-dx * (this.panRate / this.canvas.width));
            this.camera.panY(dy * (this.panRate / this.canvas.height));
        }

        this.prevX = x;
        this.prevY = y;
    }
}
