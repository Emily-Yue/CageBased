import { Mat4, Vec4, Vec3, Vec2, epsilon } from "../lib/TSM.js";


// state variables
var isSetUp = true;
var isChangingHandle = false;

// cage info
var cageVertices  = [];
var ogCageVertices = [];

// image data
var ogImageData2D = [];

// UI
var highlightedHandle = -1;

// image info
var imageWidth = 200;
var imageHeight = 100;
var imageStartX = 400;
var imageStartY = 400;

// keyframe stuff
var all_cages = []

// our "main" function
export function initializeCanvas() {
  initImage();
  makeCage();
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
      // rerender cage
      makeCage();
    } else {
      // if currently in chaning handle mode
      if(isChangingHandle){
        // change handle
        var newPoint = new Vec2();
        newPoint.x = x;
        newPoint.y = y;
        cageVertices[highlightedHandle] = newPoint;

        // draw the new image on the canvas
        drawDeformedImage();
    
        // handle is changed, so turn back into false
        isChangingHandle = false;
        highlightedHandle = -1;
        makeCage();
      }
      // if not, then change highlighted back to -1
      else {
        highlightedHandle = -1;
      }
      
    }

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

  // add a keyframe if it's not setup mode
  if(keyName === 'k' && !isSetUp){
    var currentCage = [];
    for(var i = 0; i < cageVertices.length; i++){
      currentCage.push(cageVertices[i]);
    }
    all_cages.push(currentCage);

  }

  var keyNameNum = parseInt(keyName);

  if(keyNameNum >= 0 && keyNameNum < all_cages.length){
    var newCage = [];
    for(var i = 0; i < all_cages[keyNameNum].length; i++){
      newCage.push(all_cages[keyNameNum][i]);
    }
    cageVertices = newCage;
    context.clearRect(0, 0, canvas.width,canvas.height);
    makeCage();
    drawDeformedImage();
  }
  

  // play animations of all current keyframes if not in setup mode
  if(keyName === 'p' && !isSetUp){
    animate();
  }


}, false);


// helper methods

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function animate() {
  var dT = 0.1
  for (var i = 0; i <= all_cages.length -1; i+=dT) {        
    await sleep(100);
    drawOneFrame(i);
  }
}

//draw a frame at time i
function drawOneFrame(i) {

  var canvas = document.getElementById("textCanvas") as HTMLCanvasElement;
  var context = canvas.getContext('2d');

  var newCageVertices = setPose(i);
  var newCage = [];
  for(var index = 0; index < newCageVertices.length; index++){
    newCage.push(newCageVertices[index]);
  }
  cageVertices = newCage;
  context.clearRect(0, 0, canvas.width,canvas.height);
  makeCage();
  drawDeformedImage();
}


function setPose(t) {
    let F1Index = Math.floor(t);
    let F2Index = Math.ceil(t);
    
    let F1 = all_cages[F1Index];
    let F2 = all_cages[F2Index];

    let time = t - Math.floor(t);

    var lerpCageVertices = [];
    for(var i = 0; i < cageVertices.length; i++){
      // getting the vertex for each cage
      let C_i1 : Vec2 = F1[i]
      let C_i2 : Vec2 = F2[i];

      // interpolate x
      var newX = lerp(C_i1.x, C_i2.x, time);
      // interpolate y
      var newY = lerp(C_i1.y, C_i2.y, time);
      
      // create new vertex for new cage
      var newVertex : Vec2 = new Vec2();
      newVertex.x = newX;
      newVertex.y = newY;

      // add it to array
      lerpCageVertices.push(newVertex);

    }
  
    return lerpCageVertices;
  
}


function lerp(a, b, amount){
  return (1 - amount) * a + amount * b;
}


function copiedPixel(pixelNumX, pixelNumY) {
  var coordX = pixelNumX; 
  var coordY = pixelNumY; 

  var P_coords = new Vec2();
  P_coords.x = coordX;
  P_coords.y = coordY;
  
  
  // find its generalized barycentric coordinates (mean value coordinates)
  var baryCoords = meanValCoordinates(P_coords);
  var sum = 0;
  for (let i = 0; i < baryCoords.length; i++) {
    if(baryCoords[i] < 0 || baryCoords[i] > 1) {
      return null;
    }
    sum+=(baryCoords[i]);
  }
  if(sum > 1 + epsilon) {
    return null;
  }

  // look up point with same coordinates on
  // undeformed shape
  var newCoordsX = 0;
  var newCoordsY = 0;
  for(var i = 0; i < baryCoords.length; i++){
    newCoordsX+=(ogCageVertices[i].x*baryCoords[i]);
    newCoordsY+=(ogCageVertices[i].y*baryCoords[i]);
  }
  var newPixelX = Math.floor(newCoordsX - imageStartX);
  var newPixelY = Math.floor(newCoordsY - imageStartY);

  // copy pixel at that point
  var rgba = new Vec4();
  if(newPixelX >= 0 && newPixelX < imageWidth){
    if(newPixelY >= 0 && newPixelY < imageHeight){
      rgba.x = ogImageData2D[newPixelY][newPixelX].x;
      rgba.y = ogImageData2D[newPixelY][newPixelX].y;
      rgba.z = ogImageData2D[newPixelY][newPixelX].z;
      rgba.w = ogImageData2D[newPixelY][newPixelX].w;
      return rgba;
    } 
  }
  return null;

}

// function that will draw the image based on the deformed cage currently stored in cageVerticies
function drawDeformedImage(){

  var canvas = document.getElementById("textCanvas") as HTMLCanvasElement;
  var context = canvas.getContext('2d');

  var index = 0;
  context.clearRect(0, 0, canvas.width,canvas.height);
  makeCage();

  // figure out bounding box of pixels to rerender on the canvas
  let minX: number = cageVertices[0].x;
  let minY: number = cageVertices[0].y;
  let maxX: number = cageVertices[0].x;
  let maxY: number = cageVertices[0].y;
  for (let v = 0; v < cageVertices.length; v++) {
    let currV = cageVertices[v].copy();
    minX = Math.min(minX, currV.x);
    minY = Math.min(minY, currV.y);
    maxX = Math.max(maxX, currV.x);
    maxY = Math.max(maxY, currV.y);
  }

  minX = Math.floor(minX);
  minY = Math.floor(minY);
  maxX = Math.floor(maxX);
  maxY = Math.floor(maxY);

  for (let i = minX; i < maxX; i++) {
   for (let j = minY; j < maxY; j++) {
      var pixelInfo =  copiedPixel(i, j); 
      if(pixelInfo == null) {
        continue;
      }
      var r = pixelInfo.x;
      var g = pixelInfo.y;
      var b = pixelInfo.z;
      var a = pixelInfo.w;
    
      context.fillStyle = "rgba("+r+","+g+","+b+","+(a/255)+")";

      context.fillRect( i, j, 1, 1 );
      index+=4;
    }
  }


}


// initial image that is rendered
function initImage(){
  var canvas = document.getElementById("textCanvas") as HTMLCanvasElement;
  var context = canvas.getContext('2d');
  const image = document.getElementById('source') as HTMLImageElement;

  // draw the image
  context.drawImage(image, imageStartX, imageStartY, imageWidth, imageHeight);

  // initialize the 2d arrays
  var currentImageDataObj = context.getImageData(imageStartX, imageStartY, imageWidth, imageHeight);
  var index = 0;
  for(var i = 0; i < imageHeight; i++){
    var currentRow = [];
    var currentRow2 = [];
    for(var j = 0; j < imageWidth; j++){
      var pixel = new Vec4();
      var pixel2 = new Vec4();
      pixel.x = currentImageDataObj.data[index];
      pixel.y = currentImageDataObj.data[index + 1];
      pixel.z = currentImageDataObj.data[index + 2];
      pixel.w = currentImageDataObj.data[index + 3];
      currentRow.push(pixel);

      pixel2.x = currentImageDataObj.data[index];
      pixel2.y = currentImageDataObj.data[index + 1];
      pixel2.z = currentImageDataObj.data[index + 2];
      pixel2.w = currentImageDataObj.data[index + 3];
      currentRow2.push(pixel2);
      
      index+=4;
    }
    ogImageData2D.push(currentRow2);
  }

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
      drawPoint(context, cageVertices[i].x, cageVertices[i].y, '', 'blue', 10);
    } else {
      drawPoint(context, cageVertices[i].x, cageVertices[i].y, '', 'red', 10);
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

/* 
  Reference Paper: Mean Value Coordinates for Arbitrary Planar Polygons
                   by Kai Hormann & Michael Floater
  cageCoords - coordinates of closed polygon cage
  pointCoord - xy coordinates of the query point
*/
function meanValCoordinates(pointCoord: Vec2) : number[] {
  const nSize = cageVertices.length;
  if (nSize <= 1) return;
  let dx, dy: number;

  // storing distances of the points in s
  let s : Vec2[] = [];
  for (let i = 0; i < nSize; i++) {
    dx = cageVertices[i].x - pointCoord.x;
    dy = cageVertices[i].y - pointCoord.y;
    s.push(new Vec2([dx, dy]));
  }

  // initializing barycentric coordinates
  let baryCoordinates: number[] = [];
  for (let i = 0; i < nSize; i++) {
    baryCoordinates.push(0.0);
  }

  let ip, im; // ip=i+1, im=i-1
  let ri, rp, Ai, Di, dl, mu; // distances
  let eps = 0.000001;

  // check for any coords close to cage point
  for (let i = 0; i < nSize; i++) {
    ip = (i+1)%nSize;
    ri = Math.sqrt(s[i].x*s[i].x + s[i].y*s[i].y);
    Ai = 0.5*(s[i].x*s[ip].y - s[ip].x*s[i].y);
    Di = s[ip].x*s[i].x + s[ip].y*s[i].y;

    if (ri <= eps) {
      baryCoordinates[i] = 1.0;
      return baryCoordinates;
    } 
    else if (Math.abs(Ai) <= 0 && Di < 0.0) {
      dx = cageVertices[ip].x - cageVertices[i].x;
      dy = cageVertices[ip].y - cageVertices[i].y;
      dl = Math.sqrt(dx*dx + dy*dy);
      
      dx = pointCoord.x - cageVertices[i].x;
      dy = pointCoord.y - cageVertices[i].y;

      mu = Math.sqrt(dx*dx + dy*dy)/dl;
      baryCoordinates[i] = 1.0-mu;
      baryCoordinates[ip] = mu;
      return baryCoordinates;
    }
  }

  // source/reference for tan(alpha/2) calculations: https://gist.github.com/zhangzhensong/e425a3baa5f70bcfea6c
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

  let wi = 0.0;
  let wsum = 0.0;
  for( var i = 0; i < nSize; i++) {
    im = (nSize-1+i)%nSize;
    ri = Math.sqrt( s[i].x*s[i].x + s[i].y*s[i].y);
    wi = 2.0*( tanalpha[i] + tanalpha[im] )/ri;
    wsum += wi;
    baryCoordinates[i] = wi;
  }

  if( Math.abs(wsum ) > 0.0){
    for( var i = 0; i < nSize; i++){
      baryCoordinates[i] /= wsum;
    }
  }

  return baryCoordinates;
}

