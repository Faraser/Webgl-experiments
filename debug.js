class VertexDebugger {
    constructor(gl, pntSize) {
        this.transform = new Transform();
        this.gl = gl;
        this.mColor = [];
        this.mVerts = [];
        this.mVertBuffer = 0;
        this.mVertCount = 0;
        this.mVertexComponentLen = 4;
        this.mPointSize = pntSize;
    }

    addColor(...args) {
        const colors = GLUtil.rgbToArray(...args);
        if (colors) {
            this.mColor.push(...colors);
        }
        return this;
    }

    addPoint(x1, y1, z1, cIndex = 0) {
        this.mVerts.push(x1, y1, z1, cIndex);
        this.mVertCount = this.mVerts.length / this.mVertexComponentLen;
        return this;
    }

    addMeshPoints(cIndex, mesh) {
        if (mesh.aVert === undefined) return this;

        for (let i=0; i < mesh.aVert.length; i+=3) {
            this.mVerts.push(
                mesh.aVert[i],
                mesh.aVert[i + 1],
                mesh.aVert[i + 2],
                cIndex
            );
        }

        this.mVertCount = this.mVerts.length / this.mVertexComponentLen;
        return this;
    }

    createShader() {
        const vertSrc = `#version 300 es
          layout(location=0) in vec4 a_position;

          uniform mat4 uPMatrix;
          uniform mat4 uMVMatrix;
          uniform mat4 uCameraMatrix;
          uniform vec3 uColorAry[6];
          uniform vec3 uCameraPos;
          uniform float uPointSize;

          out lowp vec4 color;

          void main(void) {
              vec4 pos = uMVMatrix * vec4(a_position.xyz, 1.0);
              color = vec4(uColorAry[int(a_position.w)], 1.0);
              gl_PointSize = (1.0 - distance(uCameraPos, pos.xyz) / 10.0) * uPointSize;
              gl_Position = uPMatrix * uCameraMatrix * pos;
          }`;

        const fragSrc = `#version 300 es
          precision mediump float;

          in vec4 color;
          out vec4 finalColor;

          void main(void) {
            finalColor = color;
          }`;

        this.mShader = ShaderUtil.createProgramFromText(this.gl, vertSrc, fragSrc, true);
        this.mUniformColor = this.gl.getUniformLocation(this.mShader, 'uColorAry');
        this.mUniformProj = this.gl.getUniformLocation(this.mShader, 'uPMatrix');
        this.mUniformCamer = this.gl.getUniformLocation(this.mShader, 'uCameraMatrix');
        this.mUniformModelV = this.gl.getUniformLocation(this.mShader, 'uMVMatrix');
        this.mUniformPointSize = this.gl.getUniformLocation(this.mShader, 'uPointSize');
        this.mUniformCameraPos = this.gl.getUniformLocation(this.mShader, 'uCameraPos');

        // Save colors in the shader. Should only need to render once
        this.gl.useProgram(this.mShader);
        this.gl.uniform3fv(this.mUniformColor, new Float32Array(this.mColor));
        this.gl.uniform1f(this.mUniformPointSize, this.mPointSize);
        this.gl.useProgram(null);
    }

    finalize() {
        this.mVertBuffer = this.gl.fCreateArrayBuffer(new Float32Array(this.mVerts), true);
        this.createShader();
        return this;
    }

    render(camera) {
        this.transform.updateMatrix();

        // Start up the shader
        this.gl.useProgram(this.mShader);

        // Push uniform data
        this.gl.uniformMatrix4fv(this.mUniformProj, false, camera.projectionMatrix);
        this.gl.uniformMatrix4fv(this.mUniformCamera, false, camer.viewMatrix);
        this.gl.uniformMatrix4fv(this.mUniformModelV, false, this.transform.getViewMatrix());
        this.gl.uniform3fv(this.mUniformCameraPos, new Float32Array(camera.transform.position.getArray()));

        // Activate Vertice Buffer Array
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.mVertBuffer);
        this.gl.enableVertexAttribArray(0);
        this.gl.vertexAttribPointer(0, this.mVertexComponentLen, this.gl.FLOAT, false, 0, 0);

        // Draw
        this.gl.drawArrays(this.gl.POINTS, 0, this.mVertCount);

        // Clean up
        this.gl.disableVertexAttribArray(0);
        this.gl.useProgram(null);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
    }
}