class Terrain {
    static createModel(gl, keepRawData) {
        return new Model(Terrain.createMesh(gl, 10, 10, 20, 20, keepRawData));
    }

    static createMesh(gl, w, h, rLen, cLen, keepRawData) {
        const rStart = w / -2; // Starting position for rows when calculating Z position
        const cStart = h / -2; // Starting position of column when calculating X position

        const vLen = rLen * cLen; // Total Vertices needed to create plane
        const iLen = (rLen - 1) * cLen; // Total Index Values needed to create the Triangle Strip

        const cInc = w / (cLen - 1); // Increment value for columns when calculating X position
        const rInc = h / (rLen - 1); // Increment value for rows when calculating Z position

        const uvxInc = 1 / (cLen - 1); // Increment value for columns when calculating X UV position
        const uvyInc = 1 / (rLen - 1); // Increment value for columns when calculating Y UV position

        const aVert = []; // Vertices array
        const aIndex = []; // Index array
        const aUV = []; // UV map array

        // Perlin noise
        noise.seed(1);
        const freq = 13;
        const maxHeight = -3;

        // Generate the vertices and the index array
        for (let i = 0; i < vLen; i++) {
            const cRow = Math.floor(i / cLen); // Current row
            const cCol = i % cLen; // Current column
            const h = noise.perlin2((cRow + 1) / freq, (cCol + 1) / freq * maxHeight);

            // Create Vertices x, y, z
            aVert.push(cStart + cCol * cInc, 0.2 + h, rStart + cRow * rInc);

            // Create UV s,t. Spread the 0,0 to 1,1 throughout the whole plane
            aUV.push(
                cCol === cLen - 1 ? 1 : cCol * uvxInc,
                cRow === rLen - 1 ? 1 : cRow * uvyInc
            );

            // Create index of row R and R+1
            if (i < iLen) {
                // Column index of row R and R+1
                aIndex.push(cRow * cLen + cCol, (cRow + 1) * cLen + cCol);
                // Create Degenerate Triangle, Last AND first index of the R+1 (next row becomes the top row)
                if (cCol === cLen - 1 && i < iLen - 1) {
                    aIndex.push((cRow + 1) * cLen + cCol, (cRow + 1) * cLen);
                }
            }
        }

        // Generate the Normals using finite difference method
        const aNorm = [];
        const xMax = cLen - 1;
        const yMax = rLen - 1;

        for (let i=0; i < vLen; i++) {
            const y = Math.floor(i / cLen); // Current row
            const x = i % cLen; // Current column
            const pos = y * 3 * cLen + x * 3; // X, Y position to Array index conversion

            // Get the height value of 4 neighboring vectors: Left, Right, Top Left
            let p, hL, hR, hU, hD;
            if (x > 0) {  // Left
                p = y * 3 * cLen + (x - 1) * 3; // Calc neighbor vector
                hL = aVert[p + 1]; // Grab only the Y position which is the height
            } else {
                hL = aVert[pos + 1];
            }

            if (x < xMax) { // Right
                p = y * 3 * cLen + (x + 1) * 3;
                hR = aVert[p + 1];
            } else {
                hR = aVert[pos + 1];
            }

            if (y > 0) { // Up
                p = (y - 1) * 3 * cLen + x * 3;
                hU = aVert[p + 1];
            } else {
                hU = aVert[pos + 1];
            }

            if (y < yMax) { // Down
                p = (y + 1)  * 3 * cLen + x * 3;
                hD = aVert[p + 1];
            } else {
                hD = aVert[pos + 1];
            }

            // Calculate the final normal vector
            const nX = hL - hR;
            const nY = 2.0;
            const nZ = hD - hU;
            const nL = Math.sqrt(nX * nX + nY * nY + nZ * nZ); // Length of vector
            aNorm.push(nX/nL, nY/nL, nZ/nL); // Normalize the final normal vector
        }

        const mesh = gl.fCreateMeshVAO('Terrain', aIndex, aVert, aNorm, aUV, 3);
        mesh.drawMode = gl.TRIANGLE_STRIP;

        if (keepRawData) {
            mesh.aVert = aVert;
            mesh.aNorm = aNorm;
            mesh.aIndex = aIndex;
        }

        return mesh;
    }
}
