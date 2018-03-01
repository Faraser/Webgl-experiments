class Skymap {
    constructor(gl, w = 20, h = 20, d = 20) {
        this.gl = gl;
        this.mDayTex = -1;
        this.mNightTex = -1;
        this.mTime = 0.0;
        this.createMesh(w, h, d);
    }

    setTime(t) {
        this.mTime = t;
        return this;
    }

    setDayTex(...args) {
        if (args.length === 6) {
            this.mDayTex = gl.fLoadCubeMap('Skymap_Day', arguments);
        }
        return this;
    }

    setDayTexByDom(...args) {
        if (args.length !== 6) {
            console.warn('Day texture needs to be 6 images');
            return this;
        }

        this.mDayTex = gl.fLoadCubeMap('Skymap_Day', args.map(id => document.getElementById(id)));
        return this;
    }

    setNightTex(...args) {
        if (args.length === 6) {
            this.mNightTex = gl.fLoadCubeMap('Skymap_Night', arguments);
        }
        return this;
    }

    setNightTexByDom(...args) {
        if (args.length !== 6) {
            console.warn('Night texture needs to be 6 images');
            return this;
        }

        this.mNightTex = gl.fLoadCubeMap('Skymap_Night', args.map(id => document.getElementById(id)));
        return this;
    }

    finalize() {
        this.createShader();
        return this;
    }

    render(camera) {
        this.gl.useProgram(this.mShader);
        this.gl.bindVertexArray(this.mesh.vao);

        this.gl.uniformMatrix4fv(this.mUniProj, false, camera.projectionMatrix);
        this.gl.uniformMatrix4fv(this.mUniCamera, false, camera.viewMatrix);

        // Setup Date Texture
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.mDayTex);
        this.gl.uniform1i(this.mUniDayTex, 0);

        if (this.mNightTex !== -1) {
            this.gl.uniform1f(this.mUniTime, this.mTime);

            this.gl.activeTexture(this.gl.TEXTURE1);
            this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.mNightTex);
            this.gl.uniform1i(this.mUniNightTex, 1);
        }

        this.gl.drawElements(this.mesh.drawMode, this.mesh.indexCount, this.gl.UNSIGNED_SHORT, 0);

        // Clean up
        this.gl.bindVertexArray(null);
        this.gl.useProgram(null);
    }

    createShader() {
        const vertSrc = `#version 300 es
          layout(location=0) in vec3 a_position;

          uniform mat4 uPMatrix;
          uniform mat4 uCameraMatrix;

          out highp vec3 texCoord; // Interpolate UV values to the fragment shader

          void main(void) {
              texCoord = a_position.xyz;
              gl_Position = uPMatrix * uCameraMatrix * vec4(a_position.xyz, 1.0);
          }`;
        const fragSrc = `#version 300 es
            precision mediump float;

            in highp vec3 texCoord;
            out vec4 finalColor;

            uniform samplerCube uDayTex;
            ${this.mNightTex === -1 ?
              `void main(void) { finalColor = texture(uDayTex, texCoord); }` :
              `uniform samplerCube uNightTex;
               uniform float uTime;
               void main(void) { finalColor = mix(texture(uDayTex, texCoord), texture(uNightTex, texCoord), uTime);}`}
            `;

        console.log(fragSrc)
        this.mShader = ShaderUtil.createProgramFromText(this.gl, vertSrc, fragSrc, true);
        this.mUniProj = this.gl.getUniformLocation(this.mShader, 'uPMatrix');
        this.mUniCamera = this.gl.getUniformLocation(this.mShader, 'uCameraMatrix');
        this.mUniDayTex = this.gl.getUniformLocation(this.mShader, 'uDayTex');

        if (this.mNightTex !== -1) {
            this.mUniNightTex = this.gl.getUniformLocation(this.mShader, 'uNightTex');
            this.mUniTiem = this.gl.getUniformLocation(this.mShader, 'uTime');
        }
    }

    createMesh(width, height, depth) {
        const w = width * 0.5, h = height * 0.5, d = depth * 0.5;
        const x0 = -w, x1 = w, y0 = -h, y1 = h, z0 = -d, z1 = d;

        const aVert = [
            x0, y1, z1, //0 Front
            x0, y0, z1, //1
            x1, y0, z1,	//2
            x1, y1, z1,	//3
            x1, y1, z0,	//4 Back
            x1, y0, z0,	//5
            x0, y0, z0,	//6
            x0, y1, z0,	//7
            x0, y1, z0,	//7 Left
            x0, y0, z0,	//6
            x0, y0, z1,	//1
            x0, y1, z1,	//0
            x0, y0, z1,	//1 Bottom
            x0, y0, z0,	//6
            x1, y0, z0,	//5
            x1, y0, z1,	//2
            x1, y1, z1,	//3 Right
            x1, y0, z1,	//2
            x1, y0, z0,	//5
            x1, y1, z0,	//4
            x0, y1, z0, //7 Top
            x0, y1, z1, //0
            x1, y1, z1, //3
            x1, y1, z0  //4
        ];

        //Build the index of each quad [0,1,2, 2,3,0]
        const aIndex = [];
        for (let i = 0; i < aVert.length / 3; i += 2) {
            aIndex.push((Math.floor(i / 4) * 4) + ((i + 2) % 4), i + 1, i); //Build in reverse order so the inside renders but not the outside
        }

        //Create VAO
        this.mesh = this.gl.fCreateMeshVAO("SkymapCube", aIndex, aVert, null, null);
    }
}
