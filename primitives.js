const Primitives = {};

Primitives.GridAxis = class {
    static createModel(gl, incAxis) {
        return new Model(Primitives.GridAxis.createMesh(gl, incAxis));
    }

    static createMesh(gl, incAxis) {
        const verts = [];
        const size = 1.8; // W/H of the outer box of the grid
        const div = 10.0; // How to divide up the grid
        const step = size / div; // Steps between each line
        const half = size / 2;

        // Create grid
        for (let i = 0; i <= div; i++) {
            // Vertical line
            let p = -half + (i * step);
            verts.push(p, 0, half, 0); // x1, y1, z1, c2
            verts.push(p, 0, -half, 0); // x2, y2, z2, c2

            // Horizontal line
            p = half - (i * step);
            verts.push(-half, 0, p, 0); // x1, y1, z1, c1
            verts.push(half, 0, p, 0); // x2, y2, z2, c2
        }

        // Create axis
        if (incAxis) {
            // x axis
            verts.push(-1.1, 0, 0, 1); // x1, y1, z1, c2
            verts.push(1.1, 0, 0, 1); // x2, y2, z2, c2
            // y axis
            verts.push(0, -1.1, 0, 2); // x1, y1, z1, c2
            verts.push(0, 1.1, 0, 2); // x2, y2, z2, c2
            // z axis
            verts.push(0, 0, -1.1, 3); // x1, y1, z1, c2
            verts.push(0, 0, 1.1, 3); // x2, y2, z2, c2
        }

        const attrColorLoc = 4;
        const mesh = { drawMode: gl.LINES, vao: gl.createVertexArray() };

        mesh.vertexComponentLen = 4;
        mesh.vertexCount = verts.length / mesh.vertexComponentLen;

        const strideLen = Float32Array.BYTES_PER_ELEMENT * mesh.vertexComponentLen;

        // Setup buffer
        mesh.bufVertices = gl.createBuffer();
        gl.bindVertexArray(mesh.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.bufVertices);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(ATTR_POSITION_LOC);
        gl.enableVertexAttribArray(attrColorLoc);

        gl.vertexAttribPointer(ATTR_POSITION_LOC, 3, gl.FLOAT, false, strideLen, 0);
        gl.vertexAttribPointer(attrColorLoc, 1, gl.FLOAT, false, strideLen, Float32Array.BYTES_PER_ELEMENT * 3);

        // Clean up
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.mMeshCache['grid'] = mesh;
        return mesh;
    }
};

Primitives.Quad = class {
    static createModel(gl) {
        return new Model(Primitives.Quad.createMesh(gl));
    }

    static createMesh(gl) {
        const aVert = [
            -0.5, 0.5, 0,
            -0.5, -0.5, 0,
            0.5, -0.5, 0,
            0.5, 0.5, 0
        ];
        const aUV = [
            0, 0,
            0, 1,
            1, 1,
            1, 0
        ];
        const aIndex = [
            0, 1, 2,
            2, 3, 0
        ];
        const mesh = gl.fCreateMeshVAO('Quad', aIndex, aVert, null, aUV);
        mesh.noCulling = true;
        mesh.doBlending = true;
        return mesh;
    }
};

Primitives.MultiQuad = class {
    static createModel(gl) {
        return new Model(Primitives.MultiQuad.createMesh(gl));
    }

    static createMesh(gl) {
        const aIndex = [];
        const aUV = [];
        const aVert = [];
        const quadsCount = 10;

        for (let i = 0; i < quadsCount; i++) {
            // Calculate a random size, y rotation and position for the quad
            const size = 0.2 + (0.8 * Math.random());
            const half = size / 2;
            const angle = Math.PI * 2 * Math.random();
            const dx = half * Math.cos(angle);
            const dy = half * Math.sin(angle);
            const x = -2.5 + Math.random() * 5;
            const y = -2.5 + Math.random() * 5;
            const z = 2.5 - Math.random() * 5;
            const p = i * 4;

            // Build the 4 points of the quad
            aVert.push(x - dx, y + half, z - dy); // TOP LEFT
            aVert.push(x - dx, y - half, z - dy); // BOTTOM LEFT
            aVert.push(x + dx, y - half, z + dy); // BOTTOM RIGHT
            aVert.push(x + dx, y + half, z + dy); // TOP RIGHT

            aUV.push(0, 0, 0, 1, 1, 1, 1, 0); // Quad's UV
            aIndex.push(p, p + 1, p + 2, p + 2, p + 3, p) // Quad's Index
        }

        const mesh = gl.fCreateMeshVAO('MultiQuad', aIndex, aVert, null, aUV);
        mesh.noCulling = true;
        mesh.doBlending = true;
        return mesh;
    }
};
