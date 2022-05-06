import { Mat2, Mat3, Mat4, Quat, Vec3, Vec4 } from "../lib/TSM.js";
import { AttributeLoader, MeshGeometryLoader, BoneLoader, MeshLoader } from "./AnimationFileLoader.js";

export class Attribute {
  values: Float32Array;
  count: number;
  itemSize: number;

  constructor(attr: AttributeLoader) {
    this.values = attr.values;
    this.count = attr.count;
    this.itemSize = attr.itemSize;
  }
}

export class MeshGeometry {
  position: Attribute;
  normal: Attribute;
  uv: Attribute | null;
  skinIndex: Attribute; // which bones affect each vertex?
  skinWeight: Attribute; // with what weight?
  v0: Attribute; // position of each vertex of the mesh *in the coordinate system of bone skinIndex[0]'s joint*. Perhaps useful for LBS.
  v1: Attribute;
  v2: Attribute;
  v3: Attribute;

  constructor(mesh: MeshGeometryLoader) {
    this.position = new Attribute(mesh.position);
    this.normal = new Attribute(mesh.normal);
    if (mesh.uv) { this.uv = new Attribute(mesh.uv); }
    this.skinIndex = new Attribute(mesh.skinIndex);
    this.skinWeight = new Attribute(mesh.skinWeight);
    this.v0 = new Attribute(mesh.v0);
    this.v1 = new Attribute(mesh.v1);
    this.v2 = new Attribute(mesh.v2);
    this.v3 = new Attribute(mesh.v3);
  }
}

export class KeyFrame {
  public all_Ts: Quat[];
  public texture: WebGLTexture;

  constructor(){
    this.all_Ts = [];
  }

  public setTexture(texture2 : WebGLTexture) {
    this.texture = texture2;
  }
  
  public addT(newT : Quat){
    this.all_Ts.push(newT.copy());
  }

  public toString(){
    let str = "";
    for(let i = 0; i < this.all_Ts.length - 1; i++){
      let currT = this.all_Ts[i];
      str+=(currT.toString() + ",");
    }
    str+=(this.all_Ts[this.all_Ts.length - 1]);
    return str;
  }
  
}


export class Bone {
  public parent: number;
  public children: number[];
  public position: Vec3; // current position of the bone's joint *in world coordinates*. Used by the provided skeleton shader, so you need to keep this up to date.
  public endpoint: Vec3; // current position of the bone's second (non-joint) endpoint, in world coordinates
  public rotation: Quat; // current orientation of the joint *with respect to world coordinates*
  
  public initialPosition: Vec3; // position of the bone's joint *in world coordinates*
  public initialEndpoint: Vec3; // position of the bone's second (non-joint) endpoint, in world coordinates
  public T_i: Quat;
  public D_i: Mat4;
  public U_i: Mat4;
  public localRotation : Quat;

  public offset: number; // used when parsing the Collada file---you probably don't need to touch these
  public initialTransformation: Mat4;

  constructor(bone: BoneLoader) {
    this.parent = bone.parent;
    this.children = Array.from(bone.children);
    this.position = bone.position.copy();
    this.endpoint = bone.endpoint.copy();
    this.rotation = bone.rotation.copy();
    this.localRotation = Quat.identity.copy();
    this.offset = bone.offset;
    this.initialPosition = bone.initialPosition.copy();
    this.initialEndpoint = bone.initialEndpoint.copy();
    this.initialTransformation = bone.initialTransformation.copy();
    this.T_i = new Quat([0,0,0,1]);
  }
}

export class Mesh {
  public geometry: MeshGeometry;
  public worldMatrix: Mat4; // in this project all meshes and rigs have been transformed into world coordinates for you
  public rotation: Vec3;
  public bones: Bone[];
  public materialName: string;
  public imgSrc: String | null;

  private boneIndices: number[];
  private bonePositions: Float32Array;
  private boneIndexAttribute: Float32Array;

  constructor(mesh: MeshLoader) {
    this.geometry = new MeshGeometry(mesh.geometry);
    this.worldMatrix = mesh.worldMatrix.copy();
    this.rotation = mesh.rotation.copy();
    this.bones = [];
    mesh.bones.forEach(bone => {
      this.bones.push(new Bone(bone));
    });
    this.materialName = mesh.materialName;
    this.imgSrc = null;
    this.boneIndices = Array.from(mesh.boneIndices);
    this.bonePositions = new Float32Array(mesh.bonePositions);
    this.boneIndexAttribute = new Float32Array(mesh.boneIndexAttribute);
  }

  public getBoneIndices(): Uint32Array {
    return new Uint32Array(this.boneIndices);
  }

  public getBonePositions(): Float32Array {
    return this.bonePositions;
  }

  public getBoneIndexAttribute(): Float32Array {
    return this.boneIndexAttribute;
  }

  public getBoneTranslations(): Float32Array {
    let trans = new Float32Array(3 * this.bones.length);
    this.bones.forEach((bone, index) => {
      let res = bone.position.xyz;
      for (let i = 0; i < res.length; i++) {
        trans[3 * index + i] = res[i];
      }
    });
    return trans;
  }

  public getBoneRotations(): Float32Array {
    let trans = new Float32Array(4 * this.bones.length);
    this.bones.forEach((bone, index) => {
      let res = bone.rotation.xyzw;
      for (let i = 0; i < res.length; i++) {
        trans[4 * index + i] = res[i];
      }
    });
    return trans;
  }

  public rotateBone(rotAxisAngleWorld: Vec3, bone: Bone) {
    var worldToLocalRot: Quat = new Quat(); // destination
    bone.rotation.inverse(worldToLocalRot);
    let localAxisRotAngle = worldToLocalRot.multiplyVec3(rotAxisAngleWorld);
    let localAxisRotNorm = localAxisRotAngle.length() /// 20;
    localAxisRotAngle.normalize();
    var localRotQuat = Quat.fromAxisAngle(localAxisRotAngle, localAxisRotNorm);
    
    // update local rotation
    bone.localRotation = bone.localRotation.multiply(localRotQuat); 
  
    // update all variables in bone
    this.update_bone(bone);
    
  }

  public update_bone(bone: Bone) {
    // update position, endpoint, etc.

    // base case
    if (bone.parent != -1) { // if bone has a parent
      // can trust parent's rotations, position, etc.
      let parent_position = this.bones[bone.parent].position;
      let parent_rotation = this.bones[bone.parent].rotation;
      
      // translation from parent to ourselves (in local coords)
      let local_translation = new Vec3();
      Vec3.difference(bone.initialPosition, this.bones[bone.parent].initialPosition, local_translation);
      
      // figure out new position
      this.bones[bone.parent].rotation.multiplyVec3(local_translation).add(this.bones[bone.parent].position, bone.position);

      let endpoint_change: Vec3 = new Vec3();
      Vec3.difference(bone.initialEndpoint, bone.initialPosition, endpoint_change);
      //Vec3.difference(bone.initialEndpoint, bone.initialPosition).add(local_translation, endpoint_change);

      let endpoint_change_rotated: Vec3 = new Vec3();
      bone.localRotation.multiplyVec3(endpoint_change).add(local_translation, endpoint_change_rotated); // endpoint to parent coord sys

      // put endpoint in parent's coordinates
      this.bones[bone.parent].rotation.multiplyVec3(endpoint_change_rotated).add(this.bones[bone.parent].position, bone.endpoint);

      bone.rotation = this.bones[bone.parent].rotation.copy().multiply(bone.localRotation);
    } else { // bone has no parent, it is the root bone
      // position doesn't change, do need to update endpoint
      let endpoint_change: Vec3 = new Vec3();
      Vec3.difference(bone.initialEndpoint, bone.initialPosition, endpoint_change);

      let endpoint_change_rotated: Vec3 = new Vec3();
      bone.localRotation.multiplyVec3(endpoint_change).add(bone.initialPosition, endpoint_change_rotated);
      bone.endpoint = endpoint_change_rotated;
      bone.rotation = bone.localRotation;
    }

    // update position, endpoint, and rotations for child bones
    for (let i = 0; i < bone.children.length; i++) {
      let child_bone_id = bone.children[i];
      this.update_bone(this.bones[child_bone_id]);
    }
  }

  public rotateBoneWithT(localTransformation: Quat, bone: Bone) {
    var localRotQuat = localTransformation.copy();
    
    // update local rotation
    bone.localRotation = bone.localRotation.multiply(localRotQuat); 
  
    // update all variables in bone
    this.update_bone(bone);
    
  }

  // public updateBone(curr: Bone) {
  //   for (let i = 0; i < curr.children.length; i++) {
  //     let currChild = this.bones[curr.children[i]];

  //     // get new D_i
  //     let D_i_new = this.getD_i(currChild);
  //     currChild.D_i = D_i_new;

  //     // bet new U_i
  //     let U_i_new = this.getU_i(currChild);
  //     currChild.U_i = U_i_new;

  //     // update variables

  //     // update position
  //     let posVec4 = new Vec4([currChild.position.x, currChild.position.y, currChild.position.z, 1]);
  //     let local_coords_position = U_i_new.inverse(new Mat4()).multiplyVec4(posVec4);
  //     let newPosVec4 = D_i_new.multiplyVec4(local_coords_position);
  //     currChild.position = new Vec3([newPosVec4.x, newPosVec4.y, newPosVec4.z]);
      
  //     // update endpoint
  //     let endVec4 = new Vec4([currChild.endpoint.x, currChild.endpoint.y, currChild.endpoint.z, 1]);
  //     let local_coords_endpoint = U_i_new.inverse(new Mat4()).multiplyVec4(endVec4);
  //     let newEndVec4 = D_i_new.multiplyVec4(local_coords_endpoint);
  //     currChild.endpoint = new Vec3([newEndVec4.x, newEndVec4.y, newEndVec4.z]);
      

  //     // update rotation
  //     let rot_mat = new Mat3([D_i_new.row(0)[0], D_i_new.row(1)[0], D_i_new.row(2)[0],
  //                             D_i_new.row(0)[1], D_i_new.row(1)[1], D_i_new.row(2)[1],
  //                             D_i_new.row(0)[2], D_i_new.row(1)[2], D_i_new.row(2)[2]]);
  //     // let rot_mat = new Mat3([D_i_new.row(0)[0], D_i_new.row(0)[1], D_i_new.row(0)[2],
  //     //                         D_i_new.row(1)[0], D_i_new.row(1)[1], D_i_new.row(1)[2],
  //     //                         D_i_new.row(2)[0], D_i_new.row(2)[1], D_i_new.row(2)[2]]);
      
  //     currChild.rotation = Quat.product(rot_mat.toQuat(), currChild.rotation);
  //     this.updateBone(currChild);
  //   }
  // }

  // public getD_i(curr: Bone) {
  //   let T_i = curr.T_i.toMat4()//curr.rotation.copy().inverse().toMat4();
  //   // let P_i = new Mat4([1, 0, 0, curr.initialPosition.x, 
  //   //                     0, 1, 0, curr.initialPosition.y,
  //   //                     0, 0, 1, curr.initialPosition.z,
  //   //                     0, 0, 0, 1]);
  //   let P_i = new Mat4([
  //   1, 0, 0, 0, 
  //   0, 1, 0, 0,
  //   0, 0, 1, 0,
  //   curr.position.x, curr.position.y, curr.position.z, 1]);

  //   if (curr.parent >= 0) {
  //     let parent = this.bones[curr.parent];
  //     let B_jiVec = Vec3.difference(curr.initialPosition, parent.initialPosition);
  //     //let B_jiVec = Vec3.difference(curr.initialPosition, parent.initialPosition);
  //     let D_j = this.getD_i(parent);
  //     // let B_ji = new Mat4([1, 0, 0, B_jiVec.x,
  //     //                      0, 1, 0, B_jiVec.y,
  //     //                      0, 0, 1, B_jiVec.z, 
  //     //                      0, 0, 0, 1]);
  //     let B_ji = new Mat4([
  //       1, 0, 0, 0,
  //       0, 1, 0, 0,
  //       0, 0, 1, 0, 
  //       B_jiVec.x, B_jiVec.y, B_jiVec.z, 1]);
  //     return (D_j.copy()).multiply((B_ji.copy()).multiply(T_i));
  //   } else {
  //     return (P_i.copy()).multiply(T_i);
  //   }
  // }


  // public getU_i(curr: Bone) {
  //   let T_i = Mat4.identity.copy();
  //   // let P_i = new Mat4([1, 0, 0, curr.initialPosition.x, 
  //   //                     0, 1, 0, curr.initialPosition.y,
  //   //                     0, 0, 1, curr.initialPosition.z,
  //   //                     0, 0, 0, 1]);
  //   let P_i = new Mat4([1, 0, 0, 0, 
  //     0, 1, 0, 0,
  //     0, 0, 1, 0,
  //     curr.initialPosition.x, curr.initialPosition.y, curr.initialPosition.z, 1]);
  //   if (curr.parent >= 0) {
  //     let parent = this.bones[curr.parent];
  //     let B_jiVec = Vec3.difference(curr.initialPosition, parent.initialPosition);
  //     let D_j = this.getD_i(parent);
  //     // let B_ji = new Mat4([1, 0, 0, B_jiVec.x,
  //     //                      0, 1, 0, B_jiVec.y,
  //     //                      0, 0, 1, B_jiVec.z, 
  //     //                      0, 0, 0, 1]);
  //     let B_ji = new Mat4([1, 0, 0, 0,
  //       0, 1, 0, 0,
  //       0, 0, 1, 0, 
  //       B_jiVec.x, B_jiVec.y, B_jiVec.z, 1]);
  //     return (D_j.copy()).multiply(B_ji.copy().multiply(T_i));
  //   } else {
  //     return (P_i.copy()).multiply(T_i);
  //   }
  // }

}