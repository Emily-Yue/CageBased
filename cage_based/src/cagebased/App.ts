import { Mat4, Vec4, Vec3, Vec2 } from "../lib/TSM.js";


var isSetUp = true;
var isChangingHandle = false;
var cageVertices  = [];
var ogCageVertices = [];
var currentImageData = null;
var ogImageData = null;
var highlightedHandle = -1;

var imageWidth = 200;
var imageHeight = 100;
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
        var hit_count = 0;
        var index = 0;
        for(var i = 0; i < imageWidth; i++){
          for(var j = 0; j < imageHeight; j++){
            console.log(i, j);
            var pixelInfo = copiedPixel(i, j);
            if(pixelInfo == null) continue;
            hit_count++;
            currentImageData.data[index] = pixelInfo[0];
            currentImageData.data[index + 1] = pixelInfo[1];
            currentImageData.data[index + 2] = pixelInfo[2];
            currentImageData.data[index + 3] = pixelInfo[3];
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
  P_coords.x = coordX;
  P_coords.y = coordY;
  
  console.log(P_coords.x, P_coords.y);
  // find its barycentric coordinates
  var baryCoords = getBaryCoord(P_coords);
  //var baryCoords = meanValCoordinates(cageVertices, P_coords);
  for (let i = 0; i < baryCoords.length; i++) {
    console.log(baryCoords[i]);
  }

  // look up point with same coordinates on
  // undeformed shape
  // var U = baryCoords[0];
  // var V = baryCoords[1];
  // var W = 1 - U - V;
  // var newCoordsX = ogCageVertices[0].x*U + ogCageVertices[1].x*V + ogCageVertices[2].x*W;
  // var newCoordsY = ogCageVertices[0].y*U + ogCageVertices[1].y*V + ogCageVertices[2].y*W;

  var newCoordsX = 0;
  var newCoordsY = 0;
  for(var i = 0; i < baryCoords.length; i++){
    newCoordsX+=(ogCageVertices[i].x*baryCoords[i]);
    newCoordsY+=(ogCageVertices[i].x*baryCoords[i]);
  }
  var newPixelX = Math.floor(newCoordsX - imageStartX);
  var newPixelY = Math.floor(newCoordsY - imageStartY);
  console.log(newPixelX, newPixelY);



  // copy pixel at that point
  var rgba = new Vec4();
  var index = 0;
  for(var i = 0; i < imageWidth; i++){
    for(var j = 0; j < imageHeight; j++){
      if(i == newPixelX && j == newPixelY){
        var rgba = new Vec4();
        rgba.x = ogImageData.data[index];
        rgba.y = ogImageData.data[index + 1];
        rgba.z = ogImageData.data[index + 2];
        rgba.w = ogImageData.data[index + 3];
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

  //return [U, V, 1 - U - V];
  //return [V, U, 1 - U - V];
  return [ 1 - U - V, V, U];
  // return [ 1 - U - V, U, V];

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
  cageCoords - coordinates of closed polygon cage
  queryCoords - xy coordinates of the query point
*/
function meanValCoordinates(cageCoords: Vec2[], pointCoord: Vec2) : number[] {
  const nSize = cageCoords.length;
  if (nSize <= 1) return;
  let dx, dy: number;
  let s : Vec2[] = [];
  
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

  // for (let i = 0; i < nSize; i++) {
  //   ip = (i+1)%nSize;
  //   ri = Math.sqrt(s[i].x * s[i].x + s[i].y * s[i].y);
  //   Ai = 0.5*(s[i].x * s[ip].y - s[ip].x * s[i].y);
  //   Di = s[ip].x*s[i].x + s[ip].y*s[i].y;

  //   if (ri <= eps) {
  //     baryCoordinates[i] = 1.0;
  //     return baryCoordinates;
  //   } else if (Math.abs(Ai) <= 0 && Di < 0.0) {
  //     dx = cageCoords[ip].x - cageCoords[i].x;
  //     dy = cageCoords[ip].y - cageCoords[i].y;
  //     dl = Math.sqrt(dx*dx + dy*dy);
      
  //     dx = pointCoord.x - cageCoords[i].x;
  //     dy = pointCoord.y - cageCoords[i].y;

  //     mu = Math.sqrt(dx*dx + dy*dy)/dl;
  //     baryCoordinates[i] = 1.0-mu;
  //     baryCoordinates[ip] = mu;
  //     return baryCoordinates;
  //   }

  //   let tanalpha: number[] = new Array(nSize);
  //   for (let i = 0; i < nSize; i++) {
  //     ip = (i+1) % nSize;
  //     im = (nSize-1+i) % nSize;
  //     ri = Math.sqrt(s[i].x*s[i].x + s[i].y*s[i].y);
  //     rp = Math.sqrt(s[ip].x*s[ip].x + s[ip].y*s[ip].y);
  //     Ai = 0.5*(s[i].x*s[ip].y - s[ip].x*s[i].y);
  //     Di = s[ip].x*s[i].x + s[ip].y*s[i].y;
  //     tanalpha[i] = (ri*rp - Di)/(2.0*Ai);
  //   }

  // if (Math.abs(wsum) > 0.0) {
  //   for (let i = 0; i < nSize; i++) {
  //     baryCoordinates[i] /= wsum;
  //   }

  //   if (Math.abs(wsum) > 0.0) {
  //     for (let i = 0; i < nSize; i++) {
  //       baryCoordinates[i] /= wsum;
  //     }
  //   }
  //   console.log(baryCoordinates)
  //   return baryCoordinates;
  // }
  //   return baryCoordinates;
  // }
}


