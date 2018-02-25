class ShaderUtil {
    static domShaderSrc(elemId) {
        const elem = document.getElementById(elemId);

        if (!elem || !elem.text) {
            console.error(`${elemId} shader not found or text!`);
            return null;
        }

        return elem.text;
    }

    static createShader(gl, src, type) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, src);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(`Error compiling shader : ${src}, ${gl.getShaderInfoLog(shader)}`);
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    static createProgram(gl, vShader, fShader, doValidate) {
        const program = gl.createProgram();
        gl.attachShader(program, vShader);
        gl.attachShader(program, fShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error(`Error creating shader program ${gl.getProgramInfoLog(program)}`);
            gl.deleteProgram(program);
            return null;
        }

        if (doValidate) {
            gl.validateProgram(program);
            if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
                console.error(`Error validating program ${gl.getProgramInfoLog(program)}`);
                return null;
            }
        }

        gl.detachShader(program, vShader);
        gl.detachShader(program, fShader);
        gl.deleteShader(vShader);
        gl.deleteShader(fShader);

        return program;
    }

    static domShaderProgram(gl, vertId, fragId, doValidate = true) {
        const vShaderTxt = ShaderUtil.domShaderSrc(vertId);
        const fShaderTxt = ShaderUtil.domShaderSrc(fragId);

        if (!vShaderTxt || !fShaderTxt) return null;

        const vShader = ShaderUtil.createShader(gl, vShaderTxt, gl.VERTEX_SHADER);
        const fShader = ShaderUtil.createShader(gl, fShaderTxt, gl.FRAGMENT_SHADER);

        if (!vShader || !fShader) return null;

        return ShaderUtil.createProgram(gl, vShader, fShader, doValidate);
    }
}
