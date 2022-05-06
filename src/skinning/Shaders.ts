export const floorVSText = `
    precision mediump float;

    uniform vec4 uLightPos;
    uniform mat4 uWorld;
    uniform mat4 uView;
    uniform mat4 uProj;
    
    attribute vec4 aVertPos;

    varying vec4 vClipPos;

    void main () {

        gl_Position = uProj * uView * uWorld * aVertPos;
        vClipPos = gl_Position;
    }
`;

export const floorFSText = `
    precision mediump float;

    uniform mat4 uViewInv;
    uniform mat4 uProjInv;
    uniform vec4 uLightPos;

    varying vec4 vClipPos;

    void main() {
        vec4 wsPos = uViewInv * uProjInv * vec4(vClipPos.xyz/vClipPos.w, 1.0);
        wsPos /= wsPos.w;
        /* Determine which color square the position is in */
        float checkerWidth = 5.0;
        float i = floor(wsPos.x / checkerWidth);
        float j = floor(wsPos.z / checkerWidth);
        vec3 color = mod(i + j, 2.0) * vec3(1.0, 1.0, 1.0);

        /* Compute light fall off */
        vec4 lightDirection = uLightPos - wsPos;
        float dot_nl = dot(normalize(lightDirection), vec4(0.0, 1.0, 0.0, 0.0));
	    dot_nl = clamp(dot_nl, 0.0, 1.0);
	
        gl_FragColor = vec4(clamp(dot_nl * color, 0.0, 1.0), 1.0);
    }
`;

export const sceneVSText = `
    precision mediump float;

    attribute vec3 vertPosition;
    attribute vec2 aUV;
    attribute vec3 aNorm;
    attribute vec4 skinIndices;
    attribute vec4 skinWeights;
    attribute vec4 v0;
    attribute vec4 v1;
    attribute vec4 v2;
    attribute vec4 v3;
    
    varying vec4 lightDir;
    varying vec2 uv;
    varying vec4 normal;
 
    uniform vec4 lightPosition;
    uniform mat4 mWorld;
    uniform mat4 mView;
    uniform mat4 mProj;

    uniform vec3 jTrans[64];
    uniform vec4 jRots[64];
     
    uniform vec3 bTrans[64];
    uniform vec4 bRots[64];

    vec3 qtrans(vec4 q, vec3 v) {
        return v + 2.0 * cross(cross(v, q.xyz) - q.w*v, q.xyz);
    }

    void main () {

        vec3 trans = vertPosition;
        
        // first bone
        float weight0 = float(skinWeights.x);
        vec3 v0_3 = vec3(v0.x/v0.w, v0.y/v0.w, v0.z/v0.w);
        vec4 D_0 = vec4(bTrans[int(skinIndices.x)] + qtrans(bRots[int(skinIndices.x)], v0_3), 1.0);
        vec4 worldPosition = (weight0 * D_0);
        
        worldPosition = vec4(worldPosition.x/worldPosition.w, worldPosition.y/worldPosition.w, worldPosition.z/worldPosition.w, 1.0);
        
        // second bone
        float weight1 = float(skinWeights.y);
        vec3 v1_3 = vec3(v1.x/v1.w, v1.y/v1.w, v1.z/v1.w);
        vec4 D_1 = vec4(bTrans[int(skinIndices.y)] + qtrans(bRots[int(skinIndices.y)], v1_3), 1.0);
        worldPosition+=(weight1 * D_1);

        worldPosition = vec4(worldPosition.x/worldPosition.w, worldPosition.y/worldPosition.w, worldPosition.z/worldPosition.w, 1.0);
        
        // third bone
        float weight2 = float(skinWeights.z);
        vec3 v2_3 = vec3(v2.x/v2.w, v2.y/v2.w, v2.z/v2.w);
        vec4 D_2 = vec4(bTrans[int(skinIndices.z)] + qtrans(bRots[int(skinIndices.z)], v2_3), 1.0);
        worldPosition+=(weight2 * D_2);

        worldPosition = vec4(worldPosition.x/worldPosition.w, worldPosition.y/worldPosition.w, worldPosition.z/worldPosition.w, 1.0);
        
        // fourth bone
        float weight3 = float(skinWeights.w);
        vec3 v3_3 = vec3(v3.x/v3.w, v3.y/v3.w, v3.z/v3.w);
        vec4 D_3 = vec4(bTrans[int(skinIndices.w)] + qtrans(bRots[int(skinIndices.w)], v3_3), 1.0);
        worldPosition+=(weight3 * D_3);

        worldPosition = vec4(worldPosition.x/worldPosition.w, worldPosition.y/worldPosition.w, worldPosition.z/worldPosition.w, 1.0);
                
        gl_Position = mProj * mView * mWorld *worldPosition;
        
        //  Compute light direction and transform to camera coordinates
        lightDir = lightPosition - worldPosition;
        
        vec4 aNorm4 = vec4(aNorm, 0.0);
        normal = normalize(mWorld * vec4(aNorm, 0.0));

        uv = aUV;
    }

`;

export const sceneFSText = `
    precision mediump float;

    varying vec4 lightDir;
    varying vec2 uv;
    varying vec4 normal;

    void main () {
        gl_FragColor = vec4((normal.x + 1.0)/2.0, (normal.y + 1.0)/2.0, (normal.z + 1.0)/2.0,1.0);
    }
`;

export const skeletonVSText = `
    precision mediump float;

    attribute vec3 vertPosition;
    attribute float boneIndex;
    varying float boneIndex_;
    
    uniform mat4 mWorld;
    uniform mat4 mView;
    uniform mat4 mProj;

    uniform vec3 bTrans[64];
    uniform vec4 bRots[64];

    uniform float highlightedBone;
    varying float highlightedBone_;

    vec3 qtrans(vec4 q, vec3 v) {
        return v + 2.0 * cross(cross(v, q.xyz) - q.w*v, q.xyz);
    }

    void main () {
        int index = int(boneIndex);
        highlightedBone_ = highlightedBone;
        boneIndex_ = boneIndex;
        gl_Position = mProj * mView * mWorld * vec4(bTrans[index] + qtrans(bRots[index], vertPosition), 1.0);
    }
`;

export const skeletonFSText = `
    precision mediump float;
    varying float highlightedBone_;
    varying float boneIndex_;

    void main () {
        int highlight = int(highlightedBone_);
        int index  = int(boneIndex_);
        if(index == highlight){
            gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);
        } else {
            gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
        }
       
    }
`;

export const sBackVSText = `
    precision mediump float;

    attribute vec2 vertPosition;

    varying vec2 uv;

    void main() {
        gl_Position = vec4(vertPosition, 0.0, 1.0);
        uv = vertPosition;
        uv.x = (1.0 + uv.x) / 2.0;
        uv.y = (1.0 + uv.y) / 2.0;
    }
`;

export const sBackFSText = `
    precision mediump float;

    varying vec2 uv;

    void main () {
        gl_FragColor = vec4(0.1, 0.1, 0.1, 1.0);
        if (abs(uv.y-.33) < .005 || abs(uv.y-.67) < .005) {
            gl_FragColor = vec4(1, 1, 1, 1);
        }
    }

`;

export const previewVSText = `
    precision mediump float;

    attribute vec2 vertPosition;

    uniform float currentKeyFrame;
    uniform float highlightedKeyFrame;

    varying vec2 uv_shared;
    varying vec4 color;

    void main() {
        gl_Position = vec4(vertPosition.x, vertPosition.y, 0, 1);
        uv_shared.x = (1.0 + vertPosition.x) / 2.0;
        uv_shared.y = (1.0 + vertPosition.y) / 2.0;

        // red if highlighted, black otherwise
        if (highlightedKeyFrame == currentKeyFrame) {
            color = vec4(1, 0, 0, 1); 
        } else {
            color = vec4(0, 0, 0, 1);
        }
    }
`;

export const previewFSText = `
    precision mediump float;

    varying vec2 uv_shared;
    varying vec4 color;

    // texture
    uniform sampler2D texture;

    void main(void) {
        if (uv_shared.x < 0.01 || uv_shared.x > 0.99 || uv_shared.y < 0.01 || uv_shared.y > 0.99) {
            gl_FragColor = color;
        } else {
            gl_FragColor = texture2D(texture, uv_shared);
        }
    }
`;
