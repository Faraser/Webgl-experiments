const Primitives = {};

Primitives.GridAxis = class {
    static createMesh(gl) {
        const verts = [];
        const size = 1.8; // W/H of the outer box of the grid
        const div = 10.0; // How to divide up the grid
        const step = size / div; // Steps between each line
        const half = size / 2;

        for (let i=0; i <= div; i++) {
            // Vertical line
            let p = -half + (i * step);
            verts.push(p, half, 0, 0); // x1, y1, z1, c2
            verts.push(p, -half, 0, 1); // x2, y2, z2, c2

            // Horizontal line
            p = half - (i * step);
            verts.push(-half, p, 0, 0); // x1, y1, z1, c1
            verts.push(half, p, 0, 1); // x2, y2, z2, c2
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
