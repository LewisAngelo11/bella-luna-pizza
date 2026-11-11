/* global BABYLON */
import { hex3 } from "../utils.js";

const JUMP_DUR = 1.2;
const OPT = { cast: false, receive: false, animated: true };

/**
 * Cara del susto, pegada a la cámara.
 * Rasgos en -Z (hacia el jugador). Grupo de render 1, con depth limpio,
 * para que el mostrador no se coma la barbilla.
 */
export function setupJumpscare(r) {
  r.jumpDur = JUMP_DUR;
  r._baseFov = r.camera.fov;

  const skin = r.mat(0x6a4038, { emissive: 0x2c1210, specular: 0x140808 });
  const skinDark = r.mat(0x3a2420, { emissive: 0x180c0a, specular: 0x100808 });
  const hollow = r.mat(0x070203, { emissive: 0x000000 });
  const eyeWhite = r.mat(0xd4c2ba, { emissive: 0x3a1414, specular: 0x888888 });
  const eyeDim = r.mat(0xc4b0a6, { emissive: 0x2a1010, specular: 0x666666 });
  const iris = r.mat(0x140406, { emissive: 0x220000 });
  const pupil = r.mat(0x040000, { emissive: 0x000000 });
  const gleam = r.mat(0xfff6f4, { emissive: 0xfff0ee, specular: 0xffffff });
  const tooth = r.mat(0xe6dcc4, { emissive: 0x3a3220, specular: 0x666655 });
  const toothDark = r.mat(0xb4a488, { emissive: 0x2a2416 });
  const mouth = r.mat(0x100206, { emissive: 0x4a1016 });
  const tongue = r.mat(0x6e2834, { emissive: 0x3a1018 });
  const lip = r.mat(0x4a1c22, { emissive: 0x2a0c10 });
  const hair = r.mat(0x0c0a09, { emissive: 0x050403 });
  const cloth = r.mat(0x100c0b, { emissive: 0x080606 });
  const nail = r.mat(0x241816, { emissive: 0x100a0a });

  r.jumpSkin = skin;
  r.jumpMouthMat = mouth;
  r.jumpEyeMat = eyeWhite;

  r.scene.setRenderingAutoClearDepthStencil(1, true, true, false);

  r.jumpGroup = new BABYLON.TransformNode("jump", r.scene);
  r.jumpGroup.parent = r.camera;
  r.jumpGroup.position.set(0, -0.04, 1.62);

  r.jumpRig = new BABYLON.TransformNode("jumpRig", r.scene);
  r.jumpRig.parent = r.jumpGroup;
  r.jumpRig.scaling.setAll(0.9);

  r.jumpHead = new BABYLON.TransformNode("jumpHead", r.scene);
  r.jumpHead.parent = r.jumpRig;

  const skull = BABYLON.MeshBuilder.CreateSphere("jumpSkull", { diameter: 0.96, segments: 16 }, r.scene);
  skull.material = skin;
  skull.scaling.set(1.04, 1.28, 0.86);
  place(skull, r.jumpHead, 0, 0.04, 0.02);

  const hairCap = BABYLON.MeshBuilder.CreateSphere("jumpHair", { diameter: 1.04, segments: 10 }, r.scene);
  hairCap.material = hair;
  hairCap.scaling.set(1.1, 0.48, 0.98);
  place(hairCap, r.jumpHead, 0, 0.38, 0.1);

  strand(r, hair, -0.32, 0.28, 0.02, 0.3, 0.25, 0.22);
  strand(r, hair, 0.24, 0.28, 0.06, 0.28, 0.2, -0.16);

  const sockL = BABYLON.MeshBuilder.CreateSphere("jumpSockL", { diameter: 0.2, segments: 8 }, r.scene);
  sockL.material = hollow;
  place(sockL, r.jumpHead, -0.2, 0.1, -0.32);

  const sockR = BABYLON.MeshBuilder.CreateSphere("jumpSockR", { diameter: 0.38, segments: 10 }, r.scene);
  sockR.material = hollow;
  place(sockR, r.jumpHead, 0.17, 0.0, -0.28);

  r.jumpEyeL = BABYLON.MeshBuilder.CreateSphere("jumpEyeL", { diameter: 0.16, segments: 10 }, r.scene);
  r.jumpEyeL.material = eyeDim;
  place(r.jumpEyeL, r.jumpHead, -0.2, 0.1, -0.4);

  const irisL = BABYLON.MeshBuilder.CreateSphere("jumpIrisL", { diameter: 0.095, segments: 8 }, r.scene);
  irisL.material = iris;
  place(irisL, r.jumpEyeL, 0.005, -0.005, -0.065);

  r.jumpPupilL = BABYLON.MeshBuilder.CreateSphere("jumpPupilL", { diameter: 0.042, segments: 6 }, r.scene);
  r.jumpPupilL.material = pupil;
  place(r.jumpPupilL, r.jumpEyeL, 0.005, -0.005, -0.085);
  r._pupilL = { x: 0.005, y: -0.005, z: -0.085 };

  r.jumpEyeR = BABYLON.MeshBuilder.CreateSphere("jumpEyeR", { diameter: 0.27, segments: 12 }, r.scene);
  r.jumpEyeR.material = eyeWhite;
  place(r.jumpEyeR, r.jumpHead, 0.17, -0.01, -0.4);

  const irisR = BABYLON.MeshBuilder.CreateSphere("jumpIrisR", { diameter: 0.15, segments: 8 }, r.scene);
  irisR.material = iris;
  place(irisR, r.jumpEyeR, 0.02, -0.02, -0.1);

  r.jumpPupilR = BABYLON.MeshBuilder.CreateSphere("jumpPupilR", { diameter: 0.06, segments: 6 }, r.scene);
  r.jumpPupilR.material = pupil;
  place(r.jumpPupilR, r.jumpEyeR, 0.025, -0.025, -0.14);
  r._pupilR = { x: 0.025, y: -0.025, z: -0.14 };

  const gleamR = BABYLON.MeshBuilder.CreateSphere("jumpGleam", { diameter: 0.028, segments: 6 }, r.scene);
  gleamR.material = gleam;
  place(gleamR, r.jumpEyeR, 0.04, 0.05, -0.13);

  const browL = r.box(0.15, 0.018, 0.016, hair, -0.19, 0.175, -0.36, r.jumpHead, OPT);
  browL.rotation.z = 0.18;
  const browR = r.box(0.2, 0.024, 0.018, hair, 0.16, 0.13, -0.38, r.jumpHead, OPT);
  browR.rotation.z = -0.32;

  const nose = r.box(0.065, 0.09, 0.08, skin, 0.03, -0.08, -0.4, r.jumpHead, OPT);
  nose.rotation.z = -0.08;
  r.box(0.026, 0.018, 0.025, hollow, 0.005, -0.115, -0.44, r.jumpHead, OPT);
  r.box(0.026, 0.018, 0.025, hollow, 0.05, -0.12, -0.44, r.jumpHead, OPT);

  const maw = BABYLON.MeshBuilder.CreateSphere("jumpMaw", { diameter: 0.38, segments: 10 }, r.scene);
  maw.material = mouth;
  maw.scaling.set(1.5, 0.95, 0.5);
  place(maw, r.jumpHead, 0.02, -0.22, -0.26);

  const lipUp = r.box(0.42, 0.028, 0.03, lip, 0.02, -0.13, -0.46, r.jumpHead, OPT);
  lipUp.rotation.z = -0.05;

  // Hilera de fuera: irregular, un colmillo salido.
  const uppers = [
    [-0.22, 0.042, 0.07, 0.14, -0.2],
    [-0.155, 0.05, 0.1, -0.1, -0.3],
    [-0.09, 0.048, 0.075, 0.06, -0.05],
    [-0.035, 0.038, 0.05, 0.2, 0],
    [0.015, 0.034, 0.055, -0.06, -0.1],
    [0.07, 0.05, 0.095, 0.12, -0.4],
    [0.135, 0.055, 0.16, -0.22, -0.6],
    [0.195, 0.04, 0.06, 0.1, -0.15],
    [0.245, 0.04, 0.09, -0.16, -0.25],
  ];
  for (const [x, w, h, tilt, jut] of uppers) {
    addTooth(r, r.jumpHead, tooth, x, -0.12 - h / 2, -0.48, w, h, tilt, jut);
  }

  // Segunda hilera, hundida: demasiados dientes.
  const inner = [
    [-0.15, 0.03, 0.06],
    [-0.08, 0.028, 0.085],
    [-0.01, 0.03, 0.05],
    [0.06, 0.026, 0.075],
    [0.13, 0.03, 0.055],
    [0.2, 0.028, 0.07],
  ];
  for (const [x, w, h] of inner) {
    addTooth(r, r.jumpHead, toothDark, x, -0.17 - h / 2, -0.34, w, h, 0.12, 0.25);
  }

  r.jumpJaw = new BABYLON.TransformNode("jumpJaw", r.scene);
  r.jumpJaw.parent = r.jumpHead;
  r.jumpJaw.position.set(0.02, -0.17, -0.08);
  r.jumpJaw.rotation.x = -0.14;

  const lipLo = r.box(0.5, 0.05, 0.04, lip, 0, -0.09, -0.42, r.jumpJaw, OPT);
  lipLo.rotation.x = 0.25;

  const tongueM = BABYLON.MeshBuilder.CreateSphere("jumpTongue", { diameter: 0.24, segments: 8 }, r.scene);
  tongueM.material = tongue;
  tongueM.scaling.set(1.35, 0.42, 0.9);
  place(tongueM, r.jumpJaw, 0.01, -0.07, -0.3);

  const lowers = [
    [-0.18, 0.04, 0.065, -0.12, 0.2],
    [-0.11, 0.046, 0.1, 0.14, 0.35],
    [-0.045, 0.034, 0.05, -0.06, 0.1],
    [0.02, 0.05, 0.12, 0.18, 0.4],
    [0.09, 0.04, 0.07, -0.14, 0.15],
    [0.155, 0.05, 0.14, 0.1, 0.45],
    [0.22, 0.036, 0.055, -0.2, 0.2],
  ];
  for (const [x, w, h, tilt, jut] of lowers) {
    addTooth(r, r.jumpJaw, tooth, x, 0.01 + h / 2, -0.4, w, h, tilt, jut);
  }

  const neck = BABYLON.MeshBuilder.CreateCylinder("jumpNeck", {
    diameterTop: 0.2,
    diameterBottom: 0.34,
    height: 0.28,
    tessellation: 8,
  }, r.scene);
  neck.material = skinDark;
  place(neck, r.jumpHead, 0, -0.42, 0.06);

  r.box(1.45, 0.36, 0.42, cloth, 0, -0.62, 0.16, r.jumpRig, OPT);

  const left = buildHand(r, -1, skinDark, nail);
  const right = buildHand(r, 1, skinDark, nail);
  r.jumpHandL = left.hand;
  r.jumpHandR = right.hand;
  r.jumpFingersL = left.fingers;
  r.jumpFingersR = right.fingers;

  r.jumpLight = new BABYLON.PointLight("jumpL", new BABYLON.Vector3(0, -0.48, -0.62), r.scene);
  r.jumpLight.parent = r.jumpGroup;
  r.jumpLight.position.set(0, -0.62, -0.28);
  r.jumpLight.diffuse = hex3(0xff6630);
  r.jumpLight.specular = hex3(0x220804);
  r.jumpLight.intensity = 1.8;
  r.jumpLight.range = 2.2;
  r.jumpLight.shadowEnabled = false;

  for (const m of r.jumpGroup.getChildMeshes(false)) {
    m.isPickable = false;
    m.receiveShadows = false;
    m.renderingGroupId = 1;
    m.unfreezeWorldMatrix?.();
    if (m.material) {
      m.material.fogEnabled = false;
      m.material.unfreeze?.();
    }
  }

  r.jumpLight.setEnabled(false);
  r.jumpGroup.setEnabled(false);
}

function place(mesh, parent, x, y, z) {
  mesh.parent = parent;
  mesh.position.set(x, y, z);
  mesh.isPickable = false;
  mesh.receiveShadows = false;
  mesh.renderingGroupId = 1;
  mesh.unfreezeWorldMatrix();
  return mesh;
}

function strand(r, mat, x, y, z, len, tiltX, tiltZ) {
  const mesh = r.box(0.016, len, 0.014, mat, x, y, z, r.jumpHead, OPT);
  mesh.rotation.x = tiltX;
  mesh.rotation.z = tiltZ;
}

function addTooth(r, parent, mat, x, y, z, w, h, tiltZ, jut) {
  const mesh = r.box(w, h, 0.03, mat, x, y, z, parent, OPT);
  mesh.rotation.z = tiltZ;
  mesh.rotation.x = jut;
}

function buildHand(r, side, skin, nail) {
  const hand = new BABYLON.TransformNode(side < 0 ? "jumpHandL" : "jumpHandR", r.scene);
  hand.parent = r.jumpRig;
  hand.position.set(side * 0.48, -0.34, -0.18);
  hand.rotation.z = side * -0.18;
  hand.rotation.y = side * 0.15;
  hand.rotation.x = 0.3;
  hand.scaling.setAll(1.05);

  r.box(0.16, 0.2, 0.045, skin, 0, 0, 0, hand, OPT);

  const fingers = [];
  const specs = [[-0.05, 0.14], [-0.016, 0.17], [0.016, 0.16], [0.05, 0.13]];
  for (let i = 0; i < specs.length; i++) {
    const [x, len] = specs[i];
    const piv = new BABYLON.TransformNode(`jf${side}${i}`, r.scene);
    piv.parent = hand;
    piv.position.set(x, 0.1, 0);
    piv.rotation.x = -0.42 - i * 0.05;
    r.box(0.026, len, 0.022, skin, 0, len / 2, 0, piv, OPT);
    r.box(0.02, 0.028, 0.014, nail, 0, len + 0.008, -0.006, piv, OPT);
    fingers.push(piv);
  }

  const thumb = new BABYLON.TransformNode(`jth${side}`, r.scene);
  thumb.parent = hand;
  thumb.position.set(-side * 0.1, -0.02, -0.02);
  thumb.rotation.z = -side * 0.9;
  thumb.rotation.x = -0.7;
  r.box(0.03, 0.13, 0.026, skin, 0, 0.06, 0, thumb, OPT);

  return { hand, fingers };
}

function crushRoom(r) {
  const lights = [
    r.lamp, r.hemi, r.dirLight, r.spotLamp, r.fill,
    r.counterLight, r.backLight, r.backLight2,
    r.ovenLight, r.windowLight, r.neonLight, r.customerLight,
  ];
  for (const light of lights) {
    if (light) light.intensity *= 0.07;
  }
}

/** Pose, embestida y temblor. dt = 0 deja el timer quieto (primer frame, antes del draw). */
export function updateJumpscare(r, dt) {
  if (!(r.jumpscare > 0) || !r.jumpGroup) return;

  r.jumpscare -= dt;
  const dur = r.jumpDur || JUMP_DUR;
  const elapsed = Math.max(0, dur - Math.max(r.jumpscare, 0));
  const lungeT = Math.min(1, elapsed / 0.14);
  const lunge = 1 - Math.pow(1 - lungeT, 3);
  const trauma = Math.exp(-elapsed * 3.2);
  const snap = Math.min(1, Math.max(0, (elapsed - 0.07) / 0.09));
  const reachT = Math.min(1, elapsed / 0.26);
  const reach = 1 - Math.pow(1 - reachT, 2);
  const shake = 0.012 + trauma * 0.05;

  r.jumpGroup.setEnabled(true);
  if (r.jumpLight) r.jumpLight.setEnabled(true);

  r.jumpGroup.position.set(
    Math.sin(r.t * 71) * shake,
    -0.04 + Math.sin(r.t * 63) * shake * 0.65,
    1.62 - lunge * 0.34,
  );
  r.jumpRig.scaling.setAll(0.9 + lunge * 0.22 + Math.sin(r.t * 24) * 0.012);

  r.jumpHead.rotation.x = -0.1 + Math.sin(r.t * 39) * 0.05;
  r.jumpHead.rotation.y = Math.sin(r.t * 27) * 0.09;
  r.jumpHead.rotation.z = Math.sin(r.t * 56) * (0.045 + trauma * 0.26);

  const chatter = elapsed > 0.2 ? Math.sin(r.t * 46) * 0.05 : 0;
  r.jumpJaw.rotation.x = -0.14 - snap * 0.68 - chatter;

  r.jumpEyeL.scaling.set(1, 0.35 + (Math.sin(r.t * 17) * 0.5 + 0.5) * 0.6, 1);
  r.jumpEyeR.scaling.setAll(1 + trauma * 0.2 + Math.sin(r.t * 15) * 0.05);

  const dartL = Math.random() > 0.94;
  const dartR = Math.random() > 0.92;
  r.jumpPupilL.position.set(
    r._pupilL.x + (dartL ? 0.028 : Math.sin(r.t * 31) * 0.008),
    r._pupilL.y + (dartL ? -0.02 : 0),
    r._pupilL.z,
  );
  r.jumpPupilR.position.set(
    r._pupilR.x + (dartR ? -0.04 : Math.sin(r.t * 28) * 0.012),
    r._pupilR.y + (dartR ? 0.03 : Math.cos(r.t * 22) * 0.008),
    r._pupilR.z,
  );
  const pinch = 0.5 + (1 - snap) * 0.65;
  r.jumpPupilL.scaling.setAll(pinch);
  r.jumpPupilR.scaling.setAll(pinch * 0.8);

  const flap = Math.sin(r.t * 34) * 0.04;
  r.jumpHandL.position.set(-0.46, -0.32 + flap, -0.16 - reach * 0.14);
  r.jumpHandR.position.set(0.42, -0.36 - flap, -0.14 - reach * 0.16);
  const curl = -0.4 - reach * 0.28;
  for (const piv of r.jumpFingersL) piv.rotation.x = curl + Math.sin(r.t * 40) * 0.07;
  for (const piv of r.jumpFingersR) piv.rotation.x = curl + Math.cos(r.t * 36) * 0.07;

  if (r.jumpLight) {
    const blink = Math.random() > 0.9 ? 0.45 : 1;
    r.jumpLight.intensity = (1.15 + lunge * 1.15 + Math.sin(r.t * 48) * 0.25) * blink;
    const hot = Math.random() > 0.92;
    r.jumpLight.diffuse.set(1, hot ? 0.94 : 0.28, hot ? 0.88 : 0.14);
  }
  if (r.jumpMouthMat) {
    const g = 0.25 + snap * 0.85 + Math.sin(r.t * 36) * 0.08;
    r.jumpMouthMat.emissiveColor.set(g, g * 0.09, g * 0.07);
  }
  if (r.jumpSkin) {
    const e = 0.2 + lunge * 0.14 + (Math.random() > 0.92 ? 0.22 : 0);
    r.jumpSkin.emissiveColor.set(e, e * 0.3, e * 0.2);
  }
  if (r.jumpEyeMat) {
    const p = 0.16 + Math.sin(r.t * 21) * 0.05 + snap * 0.06;
    r.jumpEyeMat.emissiveColor.set(p, p * 0.28, p * 0.22);
  }

  crushRoom(r);

  const mag = 0.012 + trauma * 0.055;
  r.camera.position.x += Math.sin(r.t * 88) * mag;
  r.camera.position.y += Math.cos(r.t * 76) * mag * 0.65;
  r.camera.rotation.z = Math.sin(r.t * 57) * (0.012 + trauma * 0.05);
  r.camera.rotation.x += Math.sin(r.t * 83) * mag;
  r.camera.fov = (r._baseFov || r.camera.fov) + trauma * 0.12 + lunge * 0.06;

  if (r.jumpscare <= 0) {
    r.jumpscare = 0;
    r.jumpGroup.setEnabled(false);
    if (r.jumpLight) {
      r.jumpLight.intensity = 0;
      r.jumpLight.setEnabled(false);
    }
    r.camera.rotation.z = 0;
    if (r._baseFov) r.camera.fov = r._baseFov;
  }
}
