import { Mat4, Vec4, Vec3, Vec2 } from "../lib/TSM.js";


var isSetUp = true;
var isChangingHandle = false;
var cageVertices  = [];
var ogCageVertices = [];
var currentImageData = null;
var ogImageData = null;
var highlightedHandle = -1;

var imageWidth = 300;
var imageHeight = 150;
var imageStartX = 200;
var imageStartY = 200;

// our "main" function
export function initializeCanvas() {
  initImage();
  makeCage();

  // var canvas = document.getElementById("textCanvas") as HTMLCanvasElement;
  // var context = canvas.getContext('2d');
  // drawPoint(context, imageStartX, imageStartY, 'A', 'red', 10);
}


// eventlisteners
document.getElementById('textCanvas').onclick = function clickEvent(e) {
  // e = Mouse click event.
  var x = e.clientX;
  var y = e.clientY;
  
  var canvas = document.getElementById("textCanvas") as HTMLCanvasElement;
  var context = canvas.getContext('2d');

  // if in setup mode, then add to the cage vertices array
  if(isSetUp){
    var newPoint = new Vec2();
    newPoint.x = x;
    newPoint.y = y;

    cageVertices.push(newPoint);
    ogCageVertices.push(newPoint);

    // new cage, create initialize image again
    context.clearRect(0, 0, canvas.width,canvas.height);
    initImage();
    makeCage();
  } 
  // if not in set up mode, find if a point is selected
  else {
    
    var pointSelected = isVertexHighlighted(x,y);
    

    // if point is clicked on, then chane into changing handle mode
    if(pointSelected != -1) {
      isChangingHandle = true; 
      highlightedHandle = pointSelected; 
    } else {
      // if currently in chaning handle mode
      if(isChangingHandle){
        // change handle
        var newPoint = new Vec2();
        newPoint.x = x;
        newPoint.y = y;

        cageVertices[highlightedHandle] = newPoint;
        
        // go through each pixel and update image
        var index = 0;
        for(var i = 0; i < imageWidth; i++){
          for(var j = 0; j < imageHeight; j++){
            var pixelInfo = copiedPixel(i, j);
            if(pixelInfo == null) continue;
            console.log("hit");
            currentImageData[index] = pixelInfo[0];
            currentImageData[index + 1] = pixelInfo[1];
            currentImageData[index + 2] = pixelInfo[2];
            currentImageData[index + 3] = pixelInfo[3];
            index+=4;
          }
        }
        
        // handle is changed, so turn back into false
        isChangingHandle = false;
        highlightedHandle = -1;
      }
      // if not, then change highlighted back to -1
      else {
        highlightedHandle = -1;
      }
      
    }

    // rerender canvas
    rerenderImage();


  }

  
}


document.addEventListener('keydown', (event) => {
  const keyName = event.key;
  
  var canvas = document.getElementById("textCanvas") as HTMLCanvasElement;
  var context = canvas.getContext('2d');

  // done setup time
  if(keyName === 'o'){
    isSetUp = false;
  }

  if(keyName === 'f'){
    testModify();
  }

}, false);




// helper methods

function copiedPixel(pixelNumX, pixelNumY) {
  var coordX = pixelNumX + imageStartX;
  var coordY = pixelNumY + imageStartY;

  var P_coords = new Vec2();
  P_coords[0] = coordX;
  P_coords[1] = coordY;

  // find its barycentric coordinates
  var baryCoords = meanValCoordinates(cageVertices, P_coords);
  for (let i = 0; i < baryCoords.length; i++) {
    console.log(baryCoords[i]);
  }

  // look up point with same coordinates on
  // undeformed shape
  var U = Math.floor(baryCoords[0]);
  var V = Math.floor(baryCoords[1]);
  var W = 1 - U - V;
  var newCoordsX = ogCageVertices[0].x*U + ogCageVertices[1].x*V + ogCageVertices[2].x*W;
  var newCoordsY = ogCageVertices[0].y*U + ogCageVertices[1].y*V + ogCageVertices[2].y*W;
  var newPixelX = newCoordsX - imageStartX;
  var newPixelY = newCoordsY - imageStartY;



  // copy pixel at that point
  var rgba = new Vec4();
  var index = 0;
  for(var i = 0; i < imageWidth; i++){
    for(var j = 0; j < imageHeight; j++){
      if(i == newPixelX && j == newPixelY){
        var rgba = new Vec4();
        rgba[0] = ogImageData[index];
        rgba[1] = ogImageData[index + 1];
        rgba[2] = ogImageData[index + 2];
        rgba[3] = ogImageData[index + 3];
        return rgba;
      }

      index+=4;
    }
  }

  return null;
  



}


function getBaryCoord(P_coords : Vec2){
  var a_coords : Vec2 = cageVertices[0];
	var b_coords : Vec2 = cageVertices[1];
  var c_coords : Vec2 = cageVertices[2];

  var vab = Vec2.difference(b_coords, a_coords);
  var vca = Vec2.difference(a_coords, c_coords);
  var vac = Vec2.difference(c_coords, a_coords);
  var vap = Vec2.difference(P_coords, a_coords);
  var CAP_triangle = (Vec2.cross(vca, vap)).length() / 2.0;
  var ABP_triangle = (Vec2.cross(vab, vap)).length() / 2.0;
  var ABC_triangle = (Vec2.cross(vab, vac)).length() / 2.0;

  var U = CAP_triangle / ABC_triangle;
  var V = ABP_triangle / ABC_triangle;

  return [U,V];

}



function testModify() {
  var canvas = document.getElementById("textCanvas") as HTMLCanvasElement;
  var context = canvas.getContext('2d');
  const image = document.getElementById('source') as HTMLImageElement;

  var image_data = context.getImageData(imageStartX, imageStartY, imageWidth, imageHeight);
  
  for(var i = 0; i < image_data.data.length; i++){
    if((i + 1) % 4 == 0) continue;
    image_data.data[i] = 255 - image_data.data[i];
  }
  currentImageData = image_data;
  rerenderImage();

}

// other modify
function testModify2(x,y){
  // var canvas = document.getElementById("textCanvas") as HTMLCanvasElement;
  // var context = canvas.getContext('2d');

  // var imagePixelX = x - imageStartX;
  // var imagePixelY = y - imageStartY;

  // var index = 0;
  // for(var i = 0; i < imageWidth; i++){
  //   for(var j = 0; j < imageHeight; j++){
  //     if(i == imagePixelX && j == imagePixelY){
  //       currentImageData[index] = 0;
  //       currentImageData[index+1] = 0;
  //       currentImageData[index+2] = 0;

  //       for(var z = index - )
  //     }

  //     index+=4;
  //   }
  // }

  // return [imagePixelX,  imagePixelY];

  //rerenderImage();

}


// initial image that is rendered
function initImage(){
  var canvas = document.getElementById("textCanvas") as HTMLCanvasElement;
  var context = canvas.getContext('2d');
  const image = document.getElementById('source') as HTMLImageElement;
  context.drawImage(image, imageStartX, imageStartY, imageWidth, imageHeight);
  currentImageData = context.getImageData(imageStartX, imageStartY, imageWidth, imageHeight);
  ogImageData = context.getImageData(imageStartX, imageStartY, imageWidth, imageHeight);
}


// re-render image according to modified cage
function rerenderImage() {
  var canvas = document.getElementById("textCanvas") as HTMLCanvasElement;
  var context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width,canvas.height);
  makeCage();
  loadImage(currentImageData);
  //initImage();
  
}

// load image based on image_data
function loadImage(image_data){
  var canvas = document.getElementById("textCanvas") as HTMLCanvasElement;
  var context = canvas.getContext('2d');
  Promise.all([
    createImageBitmap(image_data)
  ]).then(function(bitmaps) {
    context.drawImage(bitmaps[0], imageStartX, imageStartY, imageWidth, imageHeight);
  });
}


function makeCage() {
  var canvas = document.getElementById("textCanvas") as HTMLCanvasElement;
  var context = canvas.getContext('2d');
 
  if(cageVertices.length <= 1) return;

  context.beginPath();
  context.moveTo( cageVertices[0].x,  cageVertices[0].y); // point 1
  for(var i = 1; i < cageVertices.length; i++){
    context.lineTo(cageVertices[i].x, cageVertices[i].y);
  }
  context.closePath();      // go back to point 1
  context.stroke();         // draw stroke line

  // draw the "handles" of the cage
  for(var i = 0; i < cageVertices.length; i++){
    if(highlightedHandle == i){
      drawPoint(context, cageVertices[i].x, cageVertices[i].y, 'A', 'blue', 10);
    } else {
      drawPoint(context, cageVertices[i].x, cageVertices[i].y, 'A', 'red', 10);
    }
  }  

}


// finds if a current point is highlighted, returns the index
function isVertexHighlighted(x, y) {
    for(var i = 0; i < cageVertices.length; i++){
      
      var xValue = cageVertices[i].x;
      var yValue = cageVertices[i].y;
      if(xValue - 10 <= x && x <= xValue + 10){
        if(yValue - 10<= y && y <= yValue + 10){
          return i;
        }
      }
    }
    
    return -1;
}


// draws a point. source: https://dirask.com/posts/JavaScript-how-to-draw-point-on-canvas-element-PpOBLD
function drawPoint(context, x, y, label, color, size) {
  if (color == null) {
    color = '#000';
  }
  if (size == null) {
      size = 5;
  }

  var radius = 0.5 * size;

  // to increase smoothing for numbers with decimal part
  var pointX = Math.round(x - radius);
  var pointY = Math.round(y - radius);

  context.beginPath();
  context.fillStyle = color;
  context.fillRect(pointX, pointY, size, size);
  context.fill();

  if (label) {
      var textX = Math.round(x);
      var textY = Math.round(pointY - 5);
    
      context.font = 'Italic 14px Arial';
      context.fillStyle = color;
      context.textAlign = 'center';
      context.fillText(label, textX, textY);
  }
}




// export class CageAnimation extends CanvasAnimation{

//   private canvas2d: HTMLCanvasElement;
//   private ctx2: CanvasRenderingContext2D | null;


//   private backgroundColor: Vec4;

//   private sceneRenderPass: RenderPass;
//   private cageRenderPass: RenderPass;


//   constructor(canvas: HTMLCanvasElement) {
//     super(canvas);

//     this.canvas2d = document.getElementById("textCanvas") as HTMLCanvasElement;
//     this.ctx2 = this.canvas2d.getContext("2d");
//     if (this.ctx2) {
//       this.ctx2.font = "25px serif";
//       this.ctx2.fillStyle = "#ffffffff";
//     }
//     this.ctx = Debugger.makeDebugContext(this.ctx);
//     let gl = this.ctx;

//     this.backgroundColor = new Vec4([0.0, 0.37254903, 0.37254903, 1.0]);

//     this.sceneRenderPass = new RenderPass(this.extVAO, gl, vertexShaderSource, fragmentShaderSource);
//     this.cageRenderPass = new RenderPass(this.extVAO, gl, vertexShaderCage, fragmentShaderCage);

//   }


//   public initScene(): void {
//     //this.initModel();
//     this.initCage();
//   }


//   public initModel() : void {
//     this.sceneRenderPass = new RenderPass(this.extVAO, this.ctx, vertexShaderSource, fragmentShaderSource);

//     const array = new Uint32Array(1000);  // allow for 500 sprites
//     array[0] = 0.5;  // x-value
//     array[1] = -0.5;  // y-value

//     const index = new Uint32Array(1);
//     index[0] = 1;
//     this.sceneRenderPass.setIndexBufferData(index);

//     this.sceneRenderPass.addUniform("screenSize",
//       (gl: WebGLRenderingContext, loc: WebGLUniformLocation) => {
//         gl.uniform2f(loc, this.canvas2d.width, this.canvas2d.height);
//     });
//     this.sceneRenderPass.addAttribute("spritePosition",
//       2,
//       this.ctx.FLOAT,
//       false,
//       0,
//       0,
//       undefined,
//       array
//     );

//     this.sceneRenderPass.setDrawData(this.ctx.POINTS, 2, this.ctx.UNSIGNED_INT, 0);
//     this.sceneRenderPass.setup();
//   }


//   public initCage() : void {
//     this.cageRenderPass = new RenderPass(this.extVAO, this.ctx, vertexShaderCage, fragmentShaderCage);

//     const array = new Uint32Array(1000);  // allow for 500 sprites
//     array[0] = 100;  // x-value
//     array[1] = 100;  // y-value
//     array[2] = 150;
//     array[3] = 150


//     var vertices = new Float32Array([
//       -0.5, -0.5,  -0.5, +0.5,  0.0, +0.5,  0.0, 0.0
//       // -0.5, -0.5,   -0.5, +0.5,  0.0, +0.5,  0.0, 0.0,  +0.5, -0.5
//     ]);

//     const index = new Uint32Array(4);
//     index[0] = 1;
//     index[1] = 2;
//     index[2] = 3;
//     index[3] = 4;
//     this.cageRenderPass.setIndexBufferData(index);


//     this.cageRenderPass.addAttribute("aPosition",
//       2,
//       this.ctx.FLOAT,
//       false,
//       0,
//       0,
//       undefined,
//       vertices
//     );

//     this.cageRenderPass.setDrawData(this.ctx.LINE_LOOP, 4, this.ctx.UNSIGNED_INT, 0);
//     this.cageRenderPass.setup();
//   }

//   // public loadShader(gl, type, source) {
//   //   const shader = gl.createShader(type);
//   //   gl.shaderSource(shader, source);
//   //   gl.compileShader(shader);
  
//   //   const status = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
//   //   if (!status) {
//   //     throw new TypeError(`couldn't compile shader:\n${gl.getShaderInfoLog(shader)}`);
//   //   }
//   //   return shader;
//   // }


//   // public drawScene() : void {
//   //   let gl = this.ctx;
//   //   const vertexShader = this.loadShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
//   //   const fragmentShader = this.loadShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

//   //   const shaderProgram = gl.createProgram();
//   //   gl.attachShader(shaderProgram, vertexShader);
//   //   gl.attachShader(shaderProgram, fragmentShader);
//   //   gl.linkProgram(shaderProgram);
    
//   //   const status = gl.getProgramParameter(shaderProgram, gl.LINK_STATUS);
//   //   if (!status) {
//   //     throw new TypeError(`couldn't link shader program:\n${gl.getProgramInfoLog(shaderProgram)}`);
//   //   }

//   //   //gl.useProgram(shaderProgram);
//   //   gl.uniform2f(gl.getUniformLocation(shaderProgram, 'screenSize'), this.canvas2d.width, this.canvas2d.height);
  
//   //   const array = new Float32Array(1000);  // allow for 500 sprites
//   //   array[0] = 500;  // x-value
//   //   array[1] = 500;  // y-value

//   //   const glBuffer = gl.createBuffer();
//   //   gl.bindBuffer(gl.ARRAY_BUFFER, glBuffer);
//   //   gl.bufferData(gl.ARRAY_BUFFER, array, gl.DYNAMIC_DRAW);  // upload data


//   //   const loc = gl.getAttribLocation(shaderProgram, 'spritePosition');
//   //   gl.enableVertexAttribArray(loc);
//   //   gl.vertexAttribPointer(loc,
//   //       2,  // because it was a vec2
//   //       gl.FLOAT,  // vec2 contains floats
//   //       false,  // ignored
//   //       0,   // each value is next to each other
//   //       0);  // starts at start of array

//   //   gl.clear(gl.COLOR_BUFFER_BIT);   // clear screen
//   //   gl.useProgram(shaderProgram);    // activate our program
//   //   gl.drawArrays(gl.POINTS, 0, 1);

//   // }

//   // public drawCage() : void {
//   //   let gl = this.ctx;
//   //   const vertexShader = this.loadShader(gl, gl.VERTEX_SHADER, vertexShaderCage);
//   //   const fragmentShader = this.loadShader(gl, gl.FRAGMENT_SHADER, fragmentShaderCage);

//   //   const shaderProgram = gl.createProgram();
//   //   gl.attachShader(shaderProgram, vertexShader);
//   //   gl.attachShader(shaderProgram, fragmentShader);
//   //   gl.linkProgram(shaderProgram);

//   //   const status = gl.getProgramParameter(shaderProgram, gl.LINK_STATUS);
//   //   if (!status) {
//   //     throw new TypeError(`couldn't link shader program:\n${gl.getProgramInfoLog(shaderProgram)}`);
//   //   }

//   //   gl.useProgram(shaderProgram);
//   //   gl.uniform2f(gl.getUniformLocation(shaderProgram, 'screenSize'), this.canvas2d.width, this.canvas2d.height);
  
//   //   const array = new Float32Array(1000);  // allow for 500 sprites
//   //   array[0] = 100;  // x-value
//   //   array[1] = 100;  // y-value
//   //   array[2] = 150;  // x1-value
//   //   array[3] = 150;  // y1-value
    

//   //   // Create a buffer object
//   //   var vertexBuffer = gl.createBuffer();
//   //   gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
//   //   gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);

//   //   // Assign the vertices in buffer object to a_Position variable
//   //   const loc = gl.getAttribLocation(shaderProgram, 'spritePosition');
//   //   gl.enableVertexAttribArray(loc);
//   //   gl.vertexAttribPointer(loc,
//   //       2,  // because it was a vec2
//   //       gl.FLOAT,  // vec2 contains floats
//   //       false,  // ignored
//   //       0,   // each value is next to each other
//   //       0);  // starts at start of array
     
//   //   // Clear canvas
//   //   gl.clear(gl.COLOR_BUFFER_BIT);   // clear screen
//   //   gl.useProgram(shaderProgram);    // activate our program
//   //   gl.drawArrays(gl.LINES, 0, 1);

//   // }

//   public draw(): void {
//     const gl: WebGLRenderingContext = this.ctx;
//     const bg: Vec4 = this.backgroundColor;
//     gl.clearColor(bg.r, bg.g, bg.b, bg.a);
//     gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
//     gl.enable(gl.CULL_FACE);
//     gl.enable(gl.DEPTH_TEST);
//     gl.frontFace(gl.CCW);
//     gl.cullFace(gl.BACK);

//     gl.bindFramebuffer(gl.FRAMEBUFFER, null); // null is the default frame buffer
//     this.drawScene(0, 200, 800, 600); 
      
//   }


//   private drawScene(x: number, y: number, width: number, height: number): void {
//     const gl: WebGLRenderingContext = this.ctx;
//     gl.viewport(x, y, width, height);
//     //this.sceneRenderPass.draw();
//     this.cageRenderPass.draw();
//     gl.disable(gl.DEPTH_TEST);
    
//     gl.enable(gl.DEPTH_TEST);      
//   }


//   // public getImage(){

//   //   let gl = this.ctx;
//   //   const icon = document.getElementById('icon') as HTMLImageElement;  // get the <img> tag

//   //   const glTexture = gl.createTexture();
//   //   gl.activeTexture(gl.TEXTURE0);  // this is the 0th texture
//   //   gl.bindTexture(gl.TEXTURE_2D, glTexture);

//   //   // actually upload bytes
//   //   gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, icon);

//   //   // generates a version for different resolutions, needed to draw
//   //   gl.generateMipmap(gl.TEXTURE_2D);
//   // }

//   public reset(): void {}

  /* 
    cageCoords - coordinates of closed polygon cage
    queryCoords - xy coordinates of the query point
  */
  function meanValCoordinates(cageCoords: Vec2[], pointCoord: Vec2) : number[] {
    const nSize = cageCoords.length;
    if (nSize <= 1) return;
    let dx, dy: number;
    let s: Vec2[] = [];
    
    for (let i = 0; i < nSize; i++) {
      dx = cageCoords[i].x - pointCoord.x;
      dy = cageCoords[i].y - pointCoord.y;
      s.push(new Vec2([dx, dy]));
    }

    let baryCoordinates: number[] = [];
    for (let i = 0; i < nSize; i++) {
      baryCoordinates.push(0.0);
    }

    let ip, im;
    let ri, rp, Ai, Di, dl, mu; // distance
    let eps = 0.0000001;

    for (let i = 0; i < nSize; i++) {
      ip = (i+1)%nSize;
      ri = Math.sqrt(s[i].x*s[i].x + s[i].y*s[i].y);
      Ai = -0.5*(s[i].x*s[ip][1] - s[ip].x*s[i].y);
      Di = s[ip].x*s[i].x + s[ip].y*s[i].y;

      if (ri <= eps) {
        baryCoordinates[i] = 1.0;
        return baryCoordinates;
      } else if (Math.abs(Ai) <= 0 && Di < 0.0) {
        dx = cageCoords[ip].x - cageCoords[i].x;
        dy = cageCoords[ip].y - cageCoords[i].y;
        dl = Math.sqrt(dx*dx + dy*dy);
        
        dx = pointCoord.x - cageCoords[i].x;
        dy = pointCoord.y - cageCoords[i].y;

        mu = Math.sqrt(dx*dx + dy*dy)/dl;
        baryCoordinates[i] = 1.0-mu;
        baryCoordinates[ip] = mu;
        return baryCoordinates;
      }

      let tanalpha: number[] = new Array(nSize);
      for (let i = 0; i < nSize; i++) {
        ip = (i+1) % nSize;
        im = (nSize-1+i) % nSize;
        ri = Math.sqrt(s[i].x*s[i].x + s[i].y*s[i].y);
        rp = Math.sqrt(s[ip].x*s[ip].x + s[ip].y*s[ip].y);
        Ai = 0.5*(s[i].x*s[ip].y - s[ip].x*s[i].y);
        Di = s[ip].x*s[i].x + s[ip].y*s[i].y;
        tanalpha[i] = (ri*rp - Di)/(2.0*Ai);
      }

      let wi, wsum: number;
      for (let i = 0; i < nSize; i++) {
        im = (nSize-1+1) % nSize;
        ri = Math.sqrt(s[i].x*s[i].x + s[i].y*s[i].y);
        wi = 2.0*(tanalpha[i] + tanalpha[im])/ri;
        wsum += wi;
        baryCoordinates[i] = wi;
      }

      if (Math.abs(wsum) > 0.0) {
        for (let i = 0; i < nSize; i++) {
          baryCoordinates[i] /= wsum;
        }
      }
      return baryCoordinates;
    }

    

  }


// export function initializeCanvas(): void {
//   const canvas = document.getElementById("glCanvas") as HTMLCanvasElement;
//   /* Start drawing */
//   const canvasAnimation: CageAnimation = new CageAnimation(canvas);
//   //canvasAnimation.draw();
//   canvasAnimation.start();
//   canvasAnimation.initScene();
//   //canvasAnimation.getImage();

// }
