export const vertexShaderSource = `
    attribute vec2 spritePosition;  // position of sprite
    uniform vec2 screenSize;        // width/height of screen

    void main() {
        vec4 screenTransform = vec4(2.0 / screenSize.x, -2.0 / screenSize.y, -1.0, 1.0);
        gl_Position = vec4(spritePosition, 0.0, 1.0);
        //vec4(spritePosition * screenTransform.xy + screenTransform.zw, 0.0, 1.0);
        gl_PointSize = 65.0;
    }
`;
export const fragmentShaderSource = `
    //uniform sampler2D spriteTexture;  // texture we are drawing

    void main() {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
        //texture2D(spriteTexture, gl_PointCoord);
    }
`;
export const vertexShaderCage = `
    attribute vec2 spritePosition;  // position of sprite
    uniform vec2 screenSize;        // width/height of screen
    
    void main() {
        // vec4 screenTransform = vec4(2.0 / screenSize.x, -2.0 / screenSize.y, -1.0, 1.0);
        gl_Position = vec4(spritePosition, 0.0, 1.0);
        // //gl_Position = vec4(spritePosition * screenTransform.xy + screenTransform.zw, 0.0, 1.0);
    } 
`;
export const fragmentShaderCage = `
    void main() {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    }
`;
//# sourceMappingURL=Shaders.js.map