import { Debugger } from "../lib/webglutils/Debugging.js";
import {
  CanvasAnimation,
  WebGLUtilities
} from "../lib/webglutils/CanvasAnimation.js";
import { Floor } from "../lib/webglutils/Floor.js";
import {
  vertexShaderSource,
  fragmentShaderSource,
  vertexShaderCage,
  fragmentShaderCage
} from "./Shaders.js";
import { Mat4, Vec4, Vec3 } from "../lib/TSM.js";
import { RenderPass } from "../lib/webglutils/RenderPass.js";
import { Camera } from "../lib/webglutils/Camera.js";


export class CageAnimation extends CanvasAnimation{

  private canvas2d: HTMLCanvasElement;
  private ctx2: CanvasRenderingContext2D | null;


  private backgroundColor: Vec4;

  private sceneRenderPass: RenderPass;
  private cageRenderPass: RenderPass;


  constructor(canvas: HTMLCanvasElement) {
    super(canvas);

    this.canvas2d = document.getElementById("textCanvas") as HTMLCanvasElement;
    this.ctx2 = this.canvas2d.getContext("2d");
    if (this.ctx2) {
      this.ctx2.font = "25px serif";
      this.ctx2.fillStyle = "#ffffffff";
    }
    this.ctx = Debugger.makeDebugContext(this.ctx);
    let gl = this.ctx;

    this.backgroundColor = new Vec4([0.0, 0.37254903, 0.37254903, 1.0]);

    this.sceneRenderPass = new RenderPass(this.extVAO, gl, vertexShaderSource, fragmentShaderSource);
    this.cageRenderPass = new RenderPass(this.extVAO, gl, vertexShaderCage, fragmentShaderCage);

  }


  public initScene(): void {
    this.initModel();
    this.initCage();
  }


  public initModel() : void {
    this.sceneRenderPass = new RenderPass(this.extVAO, this.ctx, vertexShaderSource, fragmentShaderSource);

    const array = new Uint32Array(1000);  // allow for 500 sprites
    array[0] = 128;  // x-value
    array[1] = 128;  // y-value

    const index = new Uint32Array(1);
    index[0] = 1;
    this.sceneRenderPass.setIndexBufferData(index);

    this.sceneRenderPass.addUniform("screenSize",
      (gl: WebGLRenderingContext, loc: WebGLUniformLocation) => {
        gl.uniform2f(loc, this.canvas2d.width, this.canvas2d.height);
    });
    this.sceneRenderPass.addAttribute("spritePosition",
      2,
      this.ctx.FLOAT,
      false,
      0,
      0,
      undefined,
      array
    );

    this.sceneRenderPass.setDrawData(this.ctx.POINTS, 1, this.ctx.UNSIGNED_INT, 0);
    this.sceneRenderPass.setup();
  }


  public initCage() : void {
    this.cageRenderPass = new RenderPass(this.extVAO, this.ctx, vertexShaderCage, fragmentShaderCage);

    const array = new Uint32Array(1000);  // allow for 500 sprites
    array[0] = 50;  // x-value
    array[1] = 50;  // y-value


    const index = new Uint32Array(2);
    index[0] = 1;
    this.cageRenderPass.setIndexBufferData(index);

    this.cageRenderPass.addUniform("screenSize",
      (gl: WebGLRenderingContext, loc: WebGLUniformLocation) => {
        gl.uniform2f(loc, this.canvas2d.width, this.canvas2d.height);
    });
    this.cageRenderPass.addAttribute("spritePosition",
      2,
      this.ctx.FLOAT,
      false,
      0,
      0,
      undefined,
      array
    );

    this.cageRenderPass.setDrawData(this.ctx.LINES, 1, this.ctx.UNSIGNED_INT, 0);
    this.cageRenderPass.setup();
  }

  // public loadShader(gl, type, source) {
  //   const shader = gl.createShader(type);
  //   gl.shaderSource(shader, source);
  //   gl.compileShader(shader);
  
  //   const status = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  //   if (!status) {
  //     throw new TypeError(`couldn't compile shader:\n${gl.getShaderInfoLog(shader)}`);
  //   }
  //   return shader;
  // }


  // public drawScene() : void {
  //   let gl = this.ctx;
  //   const vertexShader = this.loadShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  //   const fragmentShader = this.loadShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

  //   const shaderProgram = gl.createProgram();
  //   gl.attachShader(shaderProgram, vertexShader);
  //   gl.attachShader(shaderProgram, fragmentShader);
  //   gl.linkProgram(shaderProgram);
    
  //   const status = gl.getProgramParameter(shaderProgram, gl.LINK_STATUS);
  //   if (!status) {
  //     throw new TypeError(`couldn't link shader program:\n${gl.getProgramInfoLog(shaderProgram)}`);
  //   }

  //   //gl.useProgram(shaderProgram);
  //   gl.uniform2f(gl.getUniformLocation(shaderProgram, 'screenSize'), this.canvas2d.width, this.canvas2d.height);
  
  //   const array = new Float32Array(1000);  // allow for 500 sprites
  //   array[0] = 500;  // x-value
  //   array[1] = 500;  // y-value

  //   const glBuffer = gl.createBuffer();
  //   gl.bindBuffer(gl.ARRAY_BUFFER, glBuffer);
  //   gl.bufferData(gl.ARRAY_BUFFER, array, gl.DYNAMIC_DRAW);  // upload data


  //   const loc = gl.getAttribLocation(shaderProgram, 'spritePosition');
  //   gl.enableVertexAttribArray(loc);
  //   gl.vertexAttribPointer(loc,
  //       2,  // because it was a vec2
  //       gl.FLOAT,  // vec2 contains floats
  //       false,  // ignored
  //       0,   // each value is next to each other
  //       0);  // starts at start of array

  //   gl.clear(gl.COLOR_BUFFER_BIT);   // clear screen
  //   gl.useProgram(shaderProgram);    // activate our program
  //   gl.drawArrays(gl.POINTS, 0, 1);

  // }

  // public drawCage() : void {
  //   let gl = this.ctx;
  //   const vertexShader = this.loadShader(gl, gl.VERTEX_SHADER, vertexShaderCage);
  //   const fragmentShader = this.loadShader(gl, gl.FRAGMENT_SHADER, fragmentShaderCage);

  //   const shaderProgram = gl.createProgram();
  //   gl.attachShader(shaderProgram, vertexShader);
  //   gl.attachShader(shaderProgram, fragmentShader);
  //   gl.linkProgram(shaderProgram);

  //   const status = gl.getProgramParameter(shaderProgram, gl.LINK_STATUS);
  //   if (!status) {
  //     throw new TypeError(`couldn't link shader program:\n${gl.getProgramInfoLog(shaderProgram)}`);
  //   }

  //   gl.useProgram(shaderProgram);
  //   gl.uniform2f(gl.getUniformLocation(shaderProgram, 'screenSize'), this.canvas2d.width, this.canvas2d.height);
  
  //   const array = new Float32Array(1000);  // allow for 500 sprites
  //   array[0] = 100;  // x-value
  //   array[1] = 100;  // y-value
  //   array[2] = 150;  // x1-value
  //   array[3] = 150;  // y1-value
    

  //   // Create a buffer object
  //   var vertexBuffer = gl.createBuffer();
  //   gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  //   gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);

  //   // Assign the vertices in buffer object to a_Position variable
  //   const loc = gl.getAttribLocation(shaderProgram, 'spritePosition');
  //   gl.enableVertexAttribArray(loc);
  //   gl.vertexAttribPointer(loc,
  //       2,  // because it was a vec2
  //       gl.FLOAT,  // vec2 contains floats
  //       false,  // ignored
  //       0,   // each value is next to each other
  //       0);  // starts at start of array
     
  //   // Clear canvas
  //   gl.clear(gl.COLOR_BUFFER_BIT);   // clear screen
  //   gl.useProgram(shaderProgram);    // activate our program
  //   gl.drawArrays(gl.LINES, 0, 1);

  // }

  public draw(): void {
    const gl: WebGLRenderingContext = this.ctx;
    const bg: Vec4 = this.backgroundColor;
    gl.clearColor(bg.r, bg.g, bg.b, bg.a);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    gl.frontFace(gl.CCW);
    gl.cullFace(gl.BACK);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null); // null is the default frame buffer
    this.drawScene(0, 200, 800, 600); 

    //this.drawCage(); 
    // this.getImage(); 
    // this.drawScene();
      
  }


  private drawScene(x: number, y: number, width: number, height: number): void {
    const gl: WebGLRenderingContext = this.ctx;
    gl.viewport(x, y, width, height);
    this.sceneRenderPass.draw();
    gl.disable(gl.DEPTH_TEST);
    this.cageRenderPass.draw();
    gl.enable(gl.DEPTH_TEST);      
  }


  // public getImage(){

  //   let gl = this.ctx;
  //   const icon = document.getElementById('icon') as HTMLImageElement;  // get the <img> tag

  //   const glTexture = gl.createTexture();
  //   gl.activeTexture(gl.TEXTURE0);  // this is the 0th texture
  //   gl.bindTexture(gl.TEXTURE_2D, glTexture);

  //   // actually upload bytes
  //   gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, icon);

  //   // generates a version for different resolutions, needed to draw
  //   gl.generateMipmap(gl.TEXTURE_2D);
  // }

  public reset(): void {}

}

export function initializeCanvas(): void {
  const canvas = document.getElementById("glCanvas") as HTMLCanvasElement;
  /* Start drawing */
  const canvasAnimation: CageAnimation = new CageAnimation(canvas);
  //canvasAnimation.draw();
  canvasAnimation.start();
  canvasAnimation.initScene();
  //canvasAnimation.getImage();

}
