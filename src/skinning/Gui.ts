import { Camera } from "../lib/webglutils/Camera.js";
import { CanvasAnimation } from "../lib/webglutils/CanvasAnimation.js";
import { SkinningAnimation } from "./App.js";
import { Mat4, Vec3, Vec4, Vec2, Mat2, Quat, Mat3 } from "../lib/TSM.js";
import { Bone, KeyFrame } from "./Scene.js";
import { RenderPass } from "../lib/webglutils/RenderPass.js";

/**
 * Might be useful for designing any animation GUI
 */
interface IGUI {
  viewMatrix(): Mat4;
  projMatrix(): Mat4;
  dragStart(me: MouseEvent): void;
  drag(me: MouseEvent): void;
  dragEnd(me: MouseEvent): void;
  onKeydown(ke: KeyboardEvent): void;
}

export enum Mode {
  playback,  
  edit  
}

/**
 * Handles Mouse and Button events along with
 * the the camera.
 */

export class GUI implements IGUI {
  private static readonly rotationSpeed: number = 0.05;
  private static readonly zoomSpeed: number = 0.1;
  private static readonly rollSpeed: number = 0.1;
  private static readonly panSpeed: number = 0.1;

  private camera: Camera;
  private dragging: boolean;
  private fps: boolean;
  private prevX: number;
  private prevY: number;

  private height: number;
  private viewPortHeight: number;
  private width: number;
  private viewPortWidth: number;

  private animation: SkinningAnimation;

  public time: number;
  
  public mode: Mode;
  

  public hoverX: number = 0;
  public hoverY: number = 0;

  public currIndexHit : number = 0;
  public highlightedBone : number = -1;
  public currentKeyFrame : number = -1;

  // Key Frames
  public allKeyFrames : KeyFrame[];
  public highlightedKeyFrame : number = -1;

  // For scrollable KeyFrame preview panel
  public startPanel : number;
  //public endPanel : number;

  // public allVerts : Float32Array;
  // public uvCoords : Float32Array;
  // public trimeshVerts : Uint32Array;

  // Saved KeyFrames: Creative Scenes
  public test : string = "0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0.43771979212760925,0.03507142886519432,0.10875184834003448,0.8918208479881287,0,0,0,1,0,0,0,1,0.8702287673950195,0.06972530484199524,0.2162090539932251,0.43714311718940735,0,0,0,1,0,0,0,1,0.8733251690864563,0.06997334212064743,0.21697837114334106,-0.4304967522621155,0,0,0,1";
  public pre_load1 : string = "0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,-0.09145543724298477,-0.014301261864602566,0.10185382515192032,0.9904834628105164,0,0,-2.4853779478917204e-8,1.000000238418579,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,-0.09145543724298477,-0.014301261864602566,0.10185382515192032,0.9904834628105164,0,0,-2.4853779478917204e-8,1.000000238418579,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0.03235052525997162,-0.008999275043606758,0.24367491900920868,0.9692757725715637,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,-0.09145543724298477,-0.014301261864602566,0.10185382515192032,0.9904834628105164,0,0,-2.4853779478917204e-8,1.000000238418579,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0.03760158643126488,-0.010460024699568748,0.28322747349739075,0.9582589268684387,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,-0.09145543724298477,-0.014301261864602566,0.10185382515192032,0.9904834628105164,0,0,-2.4853779478917204e-8,1.000000238418579,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,-0.05752909183502197,-0.0008915552170947194,0.2962242662906647,0.9533851742744446,-0.7469801306724548,0.2895575761795044,0.44559580087661743,0.399527907371521,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,-0.09145543724298477,-0.014301261864602566,0.10185382515192032,0.9904834628105164,0,0,-2.4853779478917204e-8,1.000000238418579,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0.44045689702033997,0.7208130955696106,0.03939700126647949,0.5337415933609009,-0.7469801306724548,0.2895575761795044,0.44559580087661743,0.399527907371521,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,-0.08006895333528519,-0.023826992139220238,0.14400115609169006,0.9860463738441467,-0.09145543724298477,-0.014301261864602566,0.10185382515192032,0.9904834628105164,-0.01890632137656212,-0.021964939311146736,0.17616212368011475,0.983934760093689,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0.17480987310409546,0.8286438584327698,0.1694900393486023,0.5040537714958191,-0.7469801306724548,0.2895575761795044,0.44559580087661743,0.399527907371521,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,-0.07261138409376144,-0.030587030574679375,-0.1584157645702362,0.9842255115509033,-0.09145543724298477,-0.014301261864602566,0.10185382515192032,0.9904834628105164,-0.01890632137656212,-0.021964939311146736,0.17616212368011475,0.983934760093689,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,-0.004370233975350857,-0.014216839335858822,0.05315854027867317,0.9984756708145142,-0.17611126601696014,-0.2290823757648468,-0.13753503561019897,0.9474168419837952,-0.9050039649009705,0.01213651243597269,-0.03159651160240173,0.4240565299987793,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,-0.07261138409376144,-0.030587030574679375,-0.1584157645702362,0.9842255115509033,-0.09145543724298477,-0.014301261864602566,0.10185382515192032,0.9904834628105164,-0.01890632137656212,-0.021964939311146736,0.17616212368011475,0.983934760093689,0,0,0,1,0,0,0,1,-0.0026206239126622677,0.044326309114694595,-0.8056756854057312,0.5906917452812195,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,-0.004370233975350857,-0.014216839335858822,0.05315854027867317,0.9984756708145142,-0.17611126601696014,-0.2290823757648468,-0.13753503561019897,0.9474168419837952,-0.9050039649009705,0.01213651243597269,-0.03159651160240173,0.4240565299987793,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,-0.07261138409376144,-0.030587030574679375,-0.1584157645702362,0.9842255115509033,-0.08909612149000168,-0.02109275944530964,0.11358169466257095,0.9893010258674622,-0.08892103284597397,-0.16966941952705383,0.10301613807678223,0.9760607481002808,-0.0013234128709882498,-0.2785482406616211,-0.06441813707351685,0.9582586884498596,-0.30810821056365967,0.057347334921360016,0.01976226642727852,0.9494179487228394,-0.017596270889043808,-0.0798092782497406,-0.9700594544410706,0.22871024906635284,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,-0.004370233975350857,-0.014216839335858822,0.05315854027867317,0.9984756708145142,-0.17611126601696014,-0.2290823757648468,-0.13753503561019897,0.9474168419837952,-0.9050039649009705,0.01213651243597269,-0.03159651160240173,0.4240565299987793,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1";

  /**
   *
   * @param canvas required to get the width and height of the canvas
   * @param animation required as a back pointer for some of the controls
   * @param sponge required for some of the controls
   */
  constructor(canvas: HTMLCanvasElement, animation: SkinningAnimation) {
    this.height = canvas.height;
    this.viewPortHeight = this.height - 200;
    console.log("WIIIIIIIIIIIIIDTH:", canvas.width);
    this.width = canvas.width;
    //this.viewPortWidth = canvas.width + 320;
    this.viewPortWidth = canvas.width - 320;
    this.prevX = 0;
    this.prevY = 0;

    this.allKeyFrames = [];

    this.animation = animation;
    this.startPanel = 0;
    //this.endPanel = 0;
    
    this.reset();
    
    this.registerEventListeners(canvas);
  }

  public getNumKeyFrames(): number {
    // TODO
    // Used in the status bar in the GUI
    return this.allKeyFrames.length;
    //return 0;
  }
  public getTime(): number { return this.time; }
  
  public getMaxTime(): number { 
    // TODO
    // The animation should stop after the last keyframe
    return this.allKeyFrames.length - 1;
    //return 0;
  }

  /**
   * Resets the state of the GUI
   */
  public reset(): void {
    this.fps = false;
    this.dragging = false;
    this.time = 0;
    this.mode = Mode.edit;
    this.camera = new Camera(
      new Vec3([0, 0, -6]),
      new Vec3([0, 0, 0]),
      new Vec3([0, 1, 0]),
      45,
      //this.width / this.viewPortHeight,
      this.viewPortWidth / this.viewPortHeight,
      0.1,
      1000.0
    );
  }

  /**
   * Sets the GUI's camera to the given camera
   * @param cam a new camera
   */
  public setCamera(
    pos: Vec3,
    target: Vec3,
    upDir: Vec3,
    fov: number,
    aspect: number,
    zNear: number,
    zFar: number
  ) {
    this.camera = new Camera(pos, target, upDir, fov, aspect, zNear, zFar);
  }

  /**
   * Returns the view matrix of the camera
   */
  public viewMatrix(): Mat4 {
    return this.camera.viewMatrix();
  }

  /**
   * Returns the projection matrix of the camera
   */
  public projMatrix(): Mat4 {
    return this.camera.projMatrix();
  }

  /**
   * Callback function for the start of a drag event.
   * @param mouse
   */
  public dragStart(mouse: MouseEvent): void {
    if (mouse.offsetY > 600) {
      // outside the main panel
      return;
    }
    
    // TODO
    // Some logic to rotate the bones, instead of moving the camera, if there is a currently highlighted bone
    
    // TODO Keyframe Management, calculate what keyframe, it's clicking
    if(mouse.screenX >= this.viewPortWidth && mouse.buttons === 1){     
      // if there's only one, check if it's above 240
      if(this.allKeyFrames.length == 1){
        if(mouse.offsetY <= 240) {
          this.highlightedKeyFrame = 0;
          console.log("clicking first one");
        } else {
          this.highlightedKeyFrame = -1;
        }
      }

      // if there's two, check which one it is
      if(this.allKeyFrames.length == 2){
        if(mouse.offsetY  <= 240) {
          console.log("clicking first one");
          this.highlightedKeyFrame = 1;
        } else if(mouse.offsetY  > 240 && mouse.offsetY  <= 240+240){
          console.log("clicking second one");
          this.highlightedKeyFrame = 0;
        } else {
          this.highlightedKeyFrame = -1;
        }
      }

      // if there's 3 or more
      if(this.allKeyFrames.length >= 3){
        console.log(mouse.screenY);
        if(mouse.offsetY  <= 240) {
          console.log("clicking first one");
          this.highlightedKeyFrame = this.startPanel;//this.allKeyFrames.length - 1;
        } else if(mouse.offsetY  > 240 && mouse.offsetY  <= 480){
          console.log("clicking second one");
          this.highlightedKeyFrame = this.startPanel-1;//this.allKeyFrames.length - 2;
        } else {
          console.log("clicking the third one");
          this.highlightedKeyFrame = this.startPanel-2//this.allKeyFrames.length - 3;
        }
      }

    } else {
      this.highlightedKeyFrame = -1;
    }

    this.dragging = true;
    this.prevX = mouse.screenX;
    this.prevY = mouse.screenY;
    
  }

  public incrementTime(dT: number): void {
    if (this.mode === Mode.playback) {
      console.log("hit increment time");
      this.setPose(this.time);
      this.time += dT;
      if (this.time >= this.getMaxTime()) {
        this.time = 0;
        this.mode = Mode.edit;
      }
    }
  }


  public getHighlightedBone() : number {
    return this.highlightedBone;
  }

  public getHighlightedKeyFrame() : number {
    return this.highlightedKeyFrame;
  }

  /**
   * The callback function for a drag event.
   * This event happens after dragStart and
   * before dragEnd.
   * @param mouse
   */
  public drag(mouse: MouseEvent): void {
    let x = mouse.offsetX;
    let y = mouse.offsetY;
    const dx = mouse.screenX - this.prevX;
    const dy = mouse.screenY - this.prevY;
    
    
    // TODO
    // You will want logic here:
    // 1) To highlight a bone, if the mouse is hovering over a bone;
    //screen coordinates -> normalized device coordinates -> camera coordinates -> world coordinates 
    if(!this.dragging){
      // get amount moved
      let mouseDiff_x = mouse.offsetX;
      let mouseDiff_y = mouse.offsetY;

      // make vector (screen coords)
      let mouseDragVec = new Vec4([mouseDiff_x, mouseDiff_y, 0.0, 1.0]);

      // normalized device coordinates
      // let NDC_vec = new Vec4([-1 + 2.0*mouseDragVec.x/this.width, 1 + -2.0*mouseDragVec.y/this.viewPortHeight, 0.0, 1.0]);
      let NDC_vec = new Vec4([-1 + 2.0*mouseDragVec.x/this.viewPortWidth, 1 + -2.0*mouseDragVec.y/this.viewPortHeight, 0.0, 1.0]);
      // camera coordinates
      let cam_coord = this.projMatrix().inverse(new Mat4()).multiplyVec4(NDC_vec);

      //world coordinates
      let world_coordVec4 = this.viewMatrix().inverse(new Mat4()).multiplyVec4(cam_coord);
      
      // world coords 3Vec
      let world_coord = new Vec3([world_coordVec4.x , world_coordVec4.y, world_coordVec4.z]);

      // find quat fromaxisangle from dragging
      // let axis = Vec3.cross(this.camera.forward().negate(), world_coord);
      let axis = this.camera.forward(); // in world coordinates, might need to change
      let quat_axis = new Quat([axis.x, axis.y, axis.z, 1]);
      
      world_coord = world_coord.scale(1/world_coordVec4.w); //normalize by w
      let dirVector = world_coord.subtract(this.camera.pos());
      dirVector = dirVector.normalize();
      
      // ray-cylinder collision checking for all bones
      let meshes = this.animation.getScene().meshes;

      for (let i = 0; i < meshes.length; i++) {
        for (let b = 0; b < meshes[i].bones.length; b++) {
          let currBone = meshes[i].bones[b];
          // console.log("bone position");
          // console.log(currBone.initialPosition.x, currBone.initialPosition.y, currBone.initialPosition.z);
          // console.log(currBone.initialEndpoint.x, currBone.initialEndpoint.y, currBone.initialEndpoint.z);
          let t = this.rayIntersection(dirVector,
            this.camera.pos(), 0.1, 
            currBone.position, currBone.endpoint);
          if ( t >= 0) {
              this.currIndexHit++;
              this.highlightedBone = b; 
              break;
          } else {
              this.highlightedBone = -1;
          }
        }
      }
      this.prevX = mouse.screenX;
      this.prevY = mouse.screenY;
      return;
    }
    // 2) To rotate a bone, if the mouse button is pressed and currently highlighting a bone.
    if(this.dragging && this.highlightedBone != -1){

      // get bone that is being selected
      let bone =  this.animation.getScene().meshes[0].bones[this.highlightedBone];

      // get amount moved
      let mouseDiff_x = dx;//mouse.screenX - this.prevX;
      let mouseDiff_y = dy;//mouse.screenY - this.prevY;

      // make vector (screen coords)
      let mouseDragVec = new Vec4([mouseDiff_x, mouseDiff_y, 0.0, 0.0]);
      //console.log("mouse drag vec", mouseDragVec);

      // normalized device coordinates
      let NDC_vec = new Vec4([2.0*mouseDragVec.x/this.viewPortWidth, -2.0*mouseDragVec.y/this.viewPortHeight, 0.0, 0.0]);

      // camera coordinates
      let cam_coord = this.projMatrix().inverse(new Mat4()).multiplyVec4(NDC_vec);

      //world coordinates
      let world_coordVec4 = this.viewMatrix().inverse(new Mat4()).multiplyVec4(cam_coord);
    
      // world coords 3Vec
      let world_coord = new Vec3([world_coordVec4.x , world_coordVec4.y, world_coordVec4.z]);
      world_coord = world_coord.scale(20);
    

      // find quat fromaxisangle from dragging
      let axis = Vec3.cross(this.camera.forward().negate(new Vec3()), world_coord);
      axis = Vec3.cross(this.camera.up(), world_coord);
      //axis = this.camera.forward()//.negate(new Vec3());
      
      this.animation.getScene().meshes[0].rotateBone(axis, bone);
      this.prevX = mouse.screenX;
      this.prevY = mouse.screenY;
      return;

    }

    // moving the camera
    if (this.dragging && mouse.screenX <= this.viewPortWidth) {
      // const dx = mouse.screenX - this.prevX;
      // const dy = mouse.screenY - this.prevY;
      this.prevX = mouse.screenX;
      this.prevY = mouse.screenY;

      /* Left button, or primary button */
      const mouseDir: Vec3 = this.camera.right();
      mouseDir.scale(-dx);
      mouseDir.add(this.camera.up().scale(dy));
      mouseDir.normalize();

      if (dx === 0 && dy === 0) {
        return;
      }

      switch (mouse.buttons) {
        case 1: {
          let rotAxis: Vec3 = Vec3.cross(this.camera.forward(), mouseDir);
          rotAxis = rotAxis.normalize();

          if (this.fps) {
            this.camera.rotate(rotAxis, GUI.rotationSpeed);
          } else {
            this.camera.orbitTarget(rotAxis, GUI.rotationSpeed);
          }
          break;
        }
        case 2: {
          /* Right button, or secondary button */
          this.camera.offsetDist(Math.sign(mouseDir.y) * GUI.zoomSpeed);
          break;
        }
        default: {
          break;
        }
      }
    } 


  }

  public getModeString(): string {
    switch (this.mode) {
      case Mode.edit: { return "edit: " + this.getNumKeyFrames() + " keyframes"; }
      case Mode.playback: { return "playback: " + this.getTime().toFixed(2) + " / " + this.getMaxTime().toFixed(2); }
    }
  }

  public rayIntersection(rayDir: Vec3, rayOrigin: Vec3, r: number, a: Vec3, b: Vec3) {
    //let dir = (a.subtract(b)).normalize();

    let dir = Vec3.difference(a,b);
    dir = dir.normalize();

    // Check the intersection with the upper plane
    let dotP1 = Vec3.dot(dir, rayDir);
    if (dotP1 < 0) {
      let d1 = -Vec3.dot(dir, a);
      let t1 = -(d1 + Vec3.dot(dir, rayOrigin))/dotP1;
      //let p1 = rayOrigin.add(rayDir.scale(t1));
      let scaled = new Vec3;
      rayDir.scale(t1, scaled);
      let p1 = Vec3.sum(rayOrigin, scaled);

      let p1suba = Vec3.difference(p1, a);
      if ((p1suba).squaredLength() <= r*r) {
        return t1;
      }  
    }

    // Check the intersection with the lower plane
    let dir_neg = new Vec3;
    dir.negate(dir_neg);
    let dotP2 = Vec3.dot(dir_neg, rayDir);
    if (dotP2 < 0){
        
      //let d2 = -Vec3.dot(dir.negate(), b);
      let _dir = new Vec3;
      dir.negate(_dir);
      let d2 = -Vec3.dot(_dir, b);
      
      //let t2 = -(d2 + Vec3.dot(dir.negate(), rayOrigin))/dotP2;  
      let t2 = -(d2 + Vec3.dot(_dir, rayOrigin))/dotP2; 
      //let p2 = rayOrigin.add(rayDir.scale(t2));
      let scaled2 = new Vec3;
      rayDir.scale(t2, scaled2);
      let p2 = Vec3.sum(rayOrigin, scaled2);

      let p2subb = Vec3.difference(p2, b);
      if ((p2subb).squaredLength() <= r*r)
        return t2;
    }

    // Check the intersection with the lateral
    // let AB = b.subtract(a);
    // let AO = rayOrigin.subtract(a);
    let AB = Vec3.difference(b,a);
    let AO = Vec3.difference(rayOrigin, a);
    let AOxAB = Vec3.cross(AO, AB);
    let VxAB = Vec3.cross(rayDir, AB);
    let ab2 = Vec3.dot(AB, AB);
    let A = Vec3.dot(VxAB, VxAB);
    let B = 2 * Vec3.dot(VxAB, AOxAB);
    let C = (Vec3.dot(AOxAB, AOxAB)) - (r*r * ab2);

    let discr = B*B-4*A*C;

    if (discr < 0) return -1;

    let t1 = (-B + Math.sqrt(discr))/(2*A);
    let t2 = (-B - Math.sqrt(discr))/(2*A);

    let t = (t1 < t2) ? t1:t2;
    if (t < 0) {
      t = (t1 > t2) ? t1:t2;
    }

    if (t >= 0) {
      //let point = rayOrigin.add(rayDir.scale(t));
      let scaled3 = new Vec3;
      rayDir.scale(t, scaled3);
      let point = Vec3.sum(rayOrigin, scaled3);

      // let dotA = Vec3.dot(point.subtract(a),dir);
      // let dotB = Vec3.dot(point.subtract(b), dir.negate());
      let _dir = new Vec3;
      dir.negate(_dir);
      let dotA = Vec3.dot(Vec3.difference(point, a), dir);
      let dotB = Vec3.dot(Vec3.difference(point, b), _dir);

      if (dotA > 0 || dotB > 0) {
        t = -1;
      }
    
    }

    // Return the smallest t greater than 0, because it was the first intersection
    return t;
  }

  /**
   * Callback function for the end of a drag event
   * @param mouse
   */
  public dragEnd(mouse: MouseEvent): void {
    this.dragging = false;
    this.prevX = 0;
    this.prevY = 0;
    
    // TODO
    // Maybe your bone highlight/dragging logic needs to do stuff here too
    this.highlightedBone = -1;
    
  }

  // helper method that calculates cylinder intersections
  // Takes in paramters: E - starting point of ray, D - direction of ray, cylinder_min and max - min and max of the cylinder z values
  public intersection(E : Float32Array, D : Float32Array, cylinder_min : number, cylinder_max : number) : boolean {
    // first find infinite unit cylinder
    let x_d = D[0];
    let y_d = D[1];
    let z_d = D[2];
    let x_e = E[0];
    let y_e = E[1];
    let z_e = E[2];

    let a = x_d*x_d + y_d*y_d;
    let b = 2*x_e*x_d + 2*y_e*y_d;
    let c = x_e*x_e + y_e*y_e - 1;

    if( a == 0.0) {
      return false;
    }

    let discriminant = b*b - 4.0*a*c;

    if(discriminant <  0.0) {
      return false;
    }

    let t1 = (-b + Math.sqrt(discriminant)) / (2*a);
    let t2 = (-b - Math.sqrt(discriminant)) / (2*a);

    let z_1 = z_e + t1*z_d;
    let z_2 = z_e + t2*z_d;

    let z_min = cylinder_min;
    let z_max = cylinder_max;

    if((z_min < z_1 && z_1 < z_max) || (z_min < z_2 && z_2 < z_max)){
      return true;
    } else {
      return false;
    }

  }


  /*
  setPose(time t):
    compute the two keyframes F1, F2 that straddle t
    convert t to a number between 0 and 1, encoding how far t is between F1 and F2
    for each bone i:
      slerp T_i stored in F1 and F2
      set the skeleton's T_i to the computed quaternion
    update the whole skeleton's position, endpoint, and rotation values 


  */
  public setPose(t : number){
    let F1Index = Math.floor(t);
    let F2Index = Math.ceil(t);
    //console.log("f1, f2", F1Index, F2Index);
    let F1 = this.allKeyFrames[F1Index];
    let F2 = this.allKeyFrames[F2Index];


    let time = t - Math.floor(t);

    var allBones = this.animation.getScene().meshes[0].bones;
    for(var i = 0; i < allBones.length; i++){
        let T_i1 = F1.all_Ts[i];
        let T_i2 = F2.all_Ts[i];
        var newQuat : Quat = new Quat();
        Quat.slerp(T_i1, T_i2, time, newQuat);
        let currBone = allBones[i];
        if(currBone.localRotation.equals(newQuat)) {
          continue;
        } 
        currBone.localRotation = newQuat;  

        //this.animation.getScene().meshes[0].rotateBoneWithT(newQuat, currBone);
         this.animation.getScene().meshes[0].update_bone(currBone);
    }

  }

  /* For the aditional feature: Add the ability to save/load an animation to/from a clipboard string. 
  It should be possible to create an animation, save the string, close and reopen the browser, 
  and completely recover the saved keyframes from the string. */

  // method that copys whatever str is to the clipboard
  public copyToClipboard(str : string) {
    const el = document.createElement('textarea');
    el.value = str;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  };

  
  // Method that read from clipboard. If permissions aren't set right, will not read from clipboard
  public getClipboardValue() : boolean{
    if(!navigator.clipboard) {
      console.log("Sorry can't load the animation due to clipboard permissions");
      return  false;
    }
    return true;

    // // reading from clipboard
    // let stringRead = "";
    // navigator.clipboard.readText()
    // .then(text => {
    //   // `text` contains the text read from the clipboard
    //   console.log()
    // })
    // .catch(err => {
    //   // maybe user didn't grant access to read from clipboard
    //   console.log('Something went wrong', err);
    // });
    // console.log("html element", el);
    // stringRead = el.innerText;
    // document.body.removeChild(el);
    // return stringRead;

  }

  // methods takes in string representation of a keyframe list and load that list into the current GUI's list of keyframes
  public stringToKeyFrameList(str : string){
    let stringArr = str.split(",");
    let arr = [];
    for(var i = 0; i < stringArr.length; i++){
      let num = parseFloat(stringArr[i]);
      arr.push(num);
    }

    // figure out number of quats
    let numQuat = stringArr.length / 4;

    //figure out number of keyframes
    let numKeyFrames = numQuat / this.animation.getScene().meshes[0].bones.length;

    let currIndex : number = 0;
    for(var i = 0; i < numKeyFrames; i++){
      let newKeyFrame : KeyFrame = new KeyFrame();
      for(var j = 0; j < this.animation.getScene().meshes[0].bones.length; j++) {
        let newT : Quat = new Quat([arr[currIndex], arr[currIndex + 1], arr[currIndex + 2], arr[currIndex + 3]]);
        newKeyFrame.addT(newT);
        currIndex+=4;
      }
      
      this.allKeyFrames.push(newKeyFrame);
    }

    for(var i = 0; i < numKeyFrames; i++){
      let newKeyFrame = this.allKeyFrames[i]
      this.setPose(i);
      let currTexture = this.animation.createSceneTexture();
      newKeyFrame.setTexture(currTexture);
    }
    
    this.startPanel = this.getNumKeyFrames()-1;
    console.log(this.allKeyFrames);
  }

  /**
   * Callback function for a key press event
   * @param key
   */
  public onKeydown(key: KeyboardEvent): void {
    switch (key.code) {
      case "Digit1": {
        this.animation.setScene("/static/assets/skinning/split_cube.dae");
        break;
      }
      case "Digit2": {
        this.animation.setScene("/static/assets/skinning/long_cubes.dae");
        break;
      }
      case "Digit3": {
        this.animation.setScene("/static/assets/skinning/simple_art.dae");
        break;
      }      
      case "Digit4": {
        this.animation.setScene("/static/assets/skinning/mapped_cube.dae");
        break;
      }
      case "Digit5": {
        this.animation.setScene("/static/assets/skinning/robot.dae");
        break;
      }
      case "Digit6": {
        this.animation.setScene("/static/assets/skinning/head.dae");
        break;
      }
      case "Digit7": {
        this.animation.setScene("/static/assets/skinning/wolf.dae");
        break;
      }
      case "KeyW": {
        this.camera.offset(
            this.camera.forward().negate(),
            GUI.zoomSpeed,
            true
          );
        break;
      }
      case "KeyA": {
        this.camera.offset(this.camera.right().negate(), GUI.zoomSpeed, true);
        break;
      }
      case "KeyS": {
        this.camera.offset(this.camera.forward(), GUI.zoomSpeed, true);
        break;
      }
      case "KeyD": {
        this.camera.offset(this.camera.right(), GUI.zoomSpeed, true);
        break;
      }
      case "KeyR": {
        this.animation.reset();
        // TODO: Resets the pose of the skeleton to its rest pose and deletes all keyframes.
        this.allKeyFrames = [];
        break;
      }
      case "ArrowLeft": {
        this.camera.roll(GUI.rollSpeed, false);
        break;
      }
      case "ArrowRight": {
        this.camera.roll(GUI.rollSpeed, true);
        break;
      }
      case "ArrowUp": {
        this.camera.offset(this.camera.up(), GUI.zoomSpeed, true);
        break;
      }
      case "ArrowDown": {
        this.camera.offset(this.camera.up().negate(), GUI.zoomSpeed, true);
        break;
      }
      case "KeyK": {
        if (this.mode === Mode.edit) {
            // add keyframe
            var newKeyFrame : KeyFrame = new KeyFrame();
            // go through every bone, add the T_i quat in order of the bones
            let allBones = this.animation.getScene().meshes[0].bones;
            for(var i = 0; i < allBones.length; i++ ) {
              let currTi = allBones[i].localRotation;
              newKeyFrame.addT(currTi);
            }        

            // create texture with this keyframe
            let currTexture = this.animation.createSceneTexture();
            newKeyFrame.setTexture(currTexture);

            // add the keyframe to our list
            this.allKeyFrames.push(newKeyFrame);

            // moving frames to most recent 3 on a key K press
            this.startPanel = this.getNumKeyFrames()-1;
        }
        break;
      }      
      case "KeyP": {
        if (this.mode === Mode.edit && this.getNumKeyFrames() > 1)
        {
          this.mode = Mode.playback;
          this.time = 0;
        } else if (this.mode === Mode.playback) {
          this.mode = Mode.edit;
        }
        break;
      }
      case "KeyU":{
        if(this.highlightedKeyFrame != -1){
          // check if there is a keyframe with that index: 
          if(this.highlightedKeyFrame < this.allKeyFrames.length){
            // if so replace keyframe
            if (this.mode === Mode.edit) {
              // Add keyframe
              var newKeyFrame : KeyFrame = new KeyFrame();
              // go through every bone, add the T_i quat in order of the bones
              let allBones = this.animation.getScene().meshes[0].bones;
              for(var i = 0; i < allBones.length; i++ ){
                let currTi = allBones[i].localRotation;
                newKeyFrame.addT(currTi);
              }
              let currTexture = this.animation.createSceneTexture();
              newKeyFrame.setTexture(currTexture);
              // replace the keyframe at the specific index
              this.allKeyFrames[this.highlightedKeyFrame] = newKeyFrame;
            } 
            console.log("allkey frames", this.allKeyFrames);
          }
        }
        break;
      }
      case "Delete" : {
        // check if there is a highlightedKeyFrame
        if(this.highlightedKeyFrame != -1){
          // check if there is a keyframe with that index: 
          if(this.highlightedKeyFrame < this.allKeyFrames.length){
            // if so delete keyframe
            if (this.mode === Mode.edit) {
              // deleting the element with that index
              this.allKeyFrames.splice(this.highlightedKeyFrame, 1);
              // adjust startPanel
              if(this.startPanel >= this.allKeyFrames.length){
                this.startPanel--;
              }
            } 
          }
        }
        break;
      }
      case "Equal": {
        // check if there is a highlightedKeyFrame
        if(this.highlightedKeyFrame != -1){
          // check if there is a keyframe with that index: 
          if(this.highlightedKeyFrame < this.allKeyFrames.length){
            // if so set pose to that keyframe 
            if (this.mode === Mode.edit) {
              // setPose(t) where t = the index of the keyframe
              this.setPose(this.highlightedKeyFrame);
            } 
          }
        }
        break;
      }
      case "KeyC":{
        // Pressing KeyC should save whatever keyframes there are right now by saving it as a string in your clipboard
        if(this.mode == Mode.edit && this.getNumKeyFrames() > 0){
          let currKeyframes = this.allKeyFrames;
          let strKeyFrames = "";
          for(let i = 0; i < this.allKeyFrames.length - 1; i++){
            strKeyFrames+=(currKeyframes[i].toString() + ",");
          }
          strKeyFrames+=(currKeyframes[this.allKeyFrames.length - 1].toString());
          this.copyToClipboard(strKeyFrames);
          console.log(strKeyFrames);
        }
        break;
      }
      case "KeyV":{
        // Pressing KeyV should load whatever string is saved to the clipboard and load it in as the current keyframes
        // Note if permissiosn aren't correct, might not work, due to browser security issues.
        if(!this.getClipboardValue()) return;
        // reading from clipboard
        let stringRead = "";
        navigator.clipboard.readText()
        .then(text => {
          // `text` contains the text read from the clipboard
          if(text === ""){
            console.log("No KeyFrames Saved");
          } else {
            // clear current keyframe list if there is any
            this.allKeyFrames = [];
            this.stringToKeyFrameList(text);
          }
        })
        .catch(err => {
          // maybe user didn't grant access to read from clipboard
          console.log('Something went wrong', err);
        });
        break;
      }
      case "KeyT": { // scroll up 1 frame on the preview keyframe panel
        console.log("start panel:", this.startPanel);
        // console.log("end panel:", this.endPanel);
        if (this.startPanel < this.getNumKeyFrames()-1 && this.getNumKeyFrames() > 3) {
          //console.log("KeyT pressed & entered");
          this.startPanel += 1;
        }
        break;
      }
      case "KeyG": { // scroll down 1 frame on the preview keyframe panel
        console.log("start panel:", this.startPanel);
        //console.log("end panel:", this.endPanel);
        if (this.startPanel > 2 && this.getNumKeyFrames() > 3) {
          //console.log("KeyG pressed & entered");
          this.startPanel -= 1;
        }
        break;
      }
      case "KeyQ": {
        this.allKeyFrames = [];
        this.stringToKeyFrameList(this.pre_load1);
        break;
      }
      default: {
        console.log("Key : '", key.code, "' was pressed.");
        break;
      }
    }
  }


  /**
   * Registers all event listeners for the GUI
   * @param canvas The canvas being used
   */
  private registerEventListeners(canvas: HTMLCanvasElement): void {
    /* Event listener for key controls */
    window.addEventListener("keydown", (key: KeyboardEvent) =>
      this.onKeydown(key)
    );

    /* Event listener for mouse controls */
    canvas.addEventListener("mousedown", (mouse: MouseEvent) =>
      this.dragStart(mouse)
    );

    canvas.addEventListener("mousemove", (mouse: MouseEvent) =>
      this.drag(mouse)
    );

    canvas.addEventListener("mouseup", (mouse: MouseEvent) =>
      this.dragEnd(mouse)
    );

    /* Event listener to stop the right click menu */
    canvas.addEventListener("contextmenu", (event: any) =>
      event.preventDefault()
    );


  }

 
}
