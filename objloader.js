class ObjLoader {
    static domToMesh(meshName, elemId, flipYUV) {
        const d = ObjLoader.parseFromDom(elemId, flipYUV);
        return gl.fCreateMeshVAO(meshName, d[0], d[1], d[2], d[3], 3);
    }

    static parseFromDom(elemId, flipYUV) {
        return ObjLoader.parseObjText(document.getElementById(elemId).innerHTML, flipYUV);
    }

    static parseObjText(text, flipYUV) {
        text = text.trim() + '\n';

        const aCache = {}; // Cache Dictionary key: item array element, val: final index of the vertice
        const cVert = []; // Cache Vertice array read from obj;
        const cNorm = []; // Cache Normal array
        const cUV = []; // Cache UV array;
        const fVert = []; // Final index sorted vertice array
        const fNorm = []; // Final index sorted normal array
        const fUV = []; // Final index sorted uv array
        const fIndex = []; // Final sorted index array

        let fIndexCnt = 0; // Final count of unique vertices
        let posA = 0;
        let posB = text.indexOf('\n', 0);

        while (posB > posA) {
            let line = text.substring(posA, posB).trim(); // Line text from obj file
            let item; // Line split into an array

            switch (line.charAt(0)) {
                // Cache Vertex Data for Index processing when going through face data
                // Sample data (x, y, z)
                // v -1.000000 1.000000 1.00000
                // vt 0.000000 0.666667
                // vn 0.000000 0.000000 -1.000000
                case 'v':
                    item = line.split(' ');
                    item.shift();
                    switch (line.charAt(1)) {
                        case ' ':
                            cVert.push(parseFloat(item[0]), parseFloat(item[1]), parseFloat(item[2]));
                            break; // Vertex
                        case 't':
                            cUV.push(parseFloat(item[0]), parseFloat(item[1]));
                            break; // UV
                        case 'n':
                            cNorm.push(parseFloat(item[0]), parseFloat(item[1]), parseFloat(item[2]));
                            break; // Normal
                    }
                    break;

                // Process face data
                // All index values start at 1 and need always subtract 1 from index
                // Sample data [Vertex Index, UV Index, Normal Index], Each line is triangle or quad
                // f 1/1/1 2/2/1 3/3/1 4/4/1
                // f 34/41/36 34/41/35 34/41/36
                // f 34//36 34//35 34//36
                case 'f':
                    item = line.split(' ');
                    item.shift();
                    let isQuad = false;

                    for (let i = 0; i < item.length; i++) {
                        if (i === 3 && !isQuad) {
                            i = 2; // Last vertex in the first triangle is the start of the 2nd triangle in a quad
                            isQuad = true;
                        }

                        // Has this vertex data been processed?
                        if (item[i] in aCache) {
                            fIndex.push(aCache[item[i]]);
                        } else {
                            // New unique vertex data
                            const ary = item[i].split('/');

                            // Parse Vertex data and save final version ordered correctly by index
                            let ind = (parseInt(ary[0]) - 1) * 3;
                            fVert.push(cVert[ind], cVert[ind + 1], cVert[ind + 2]);

                            // Parse Normal data ans save final version ordered correctly by index
                            ind = (parseInt(ary[2]) - 1) * 3;
                            fNorm.push(cNorm[ind], cNorm[ind + 1], cNorm[ind + 2]);

                            // Parse Texture data if available and save final version ordered correctly by index
                            if (ary[1] !== '') {
                                ind = (parseInt(ary[1]) - 1) * 2;
                                fUV.push(cUV[ind], !flipYUV ? cUV[ind + 1] : 1 - cUV[ind + 1]);
                            }

                            // Cache the vertex item value and its new index
                            // The idea is to create an index for each unique set of vertex data base on the face data
                            // So when the same item is found, just add the index value without duplicating vertex, normak, and texture
                            aCache[item[i]] = fIndexCnt;
                            fIndex.push(fIndexCnt);
                            fIndexCnt++;
                        }

                        // In a quad, the last vertex of the second triangle is the first vertex in the first triangle
                        if (i === 3 && isQuad) fIndex.push(aCache[item[0]]);
                    }
                    break;
            }

            // Get ready to parse next line
            posA = posB + 1;
            posB = text.indexOf('\n', posA);
        }

        return [fIndex, fVert, fNorm, fUV];
    }
}
