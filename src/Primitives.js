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

Primitives.Cube = class {
    static createModel(gl, name = 'Cube') {
        return new Model(Primitives.Cube.createMesh(gl, name, 1, 1, 1, 0, 0, 0));
    }

    static createMesh(gl, name, width, height, depth, x, y, z) {
        const w = width * 0.5, h = height * 0.5, d = depth * 0.5;
        const x0 = x - w, x1 = x + w, y0 = y - h, y1 = y + h, z0 = z - d, z1 = z + d;

        // Starting bottom left corner, then working counter clockwise to create the front face.
        // Backface is the first face but in reverse (3,2,1,0)
        // keep each quad face built the same way to make index and uv easier to assign
        const aVert = [
            x0, y1, z1, 0,	//0 Front
            x0, y0, z1, 0,	//1
            x1, y0, z1, 0,	//2
            x1, y1, z1, 0,	//3

            x1, y1, z0, 1,	//4 Back
            x1, y0, z0, 1,	//5
            x0, y0, z0, 1,	//6
            x0, y1, z0, 1,	//7

            x0, y1, z0, 2,	//7 Left
            x0, y0, z0, 2,	//6
            x0, y0, z1, 2,	//1
            x0, y1, z1, 2,	//0

            x0, y0, z1, 3,	//1 Bottom
            x0, y0, z0, 3,	//6
            x1, y0, z0, 3,	//5
            x1, y0, z1, 3,	//2

            x1, y1, z1, 4,	//3 Right
            x1, y0, z1, 4,	//2
            x1, y0, z0, 4,	//5
            x1, y1, z0, 4,	//4

            x0, y1, z0, 5,	//7 Top
            x0, y1, z1, 5,	//0
            x1, y1, z1, 5,	//3
            x1, y1, z0, 5	//4
        ];

        // Build the index of each quad [0,1,2, 2,3,0]
        const aIndex = [];
        for (let i = 0; i < aVert.length / 4; i += 2) {
            aIndex.push(i, i + 1, (Math.floor(i / 4) * 4) + ((i + 2) % 4));
        }

        //Build UV data for each vertex
        const aUV = [];
        for (let i = 0; i < 6; i++) {
            aUV.push(0, 0, 0, 1, 1, 1, 1, 0);
        }

        //Build Normal data for each vertex
        const aNorm = [
            0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,		//Front
            0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,		//Back
            -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,		//Left
            0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,		//Bottom
            1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,		//Right
            0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0		//Top
        ];

        const mesh = gl.fCreateMeshVAO(name, aIndex, aVert, aNorm, aUV, 4);
        mesh.noCulling = true;	// TODO Only setting this true to view animations better.
        return mesh;
    }
};
