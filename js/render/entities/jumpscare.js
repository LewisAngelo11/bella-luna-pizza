import * as THREE from "three";

/**
 * Demonio jumpscare. Rasgos en +Z (miran a la cámara en la sala).
 * Si miras atrás: frameUpdate pone rotation.y = π.
 */
export function setupJumpscare(r) {
  r.jumpGroup = new THREE.Group();
  r.jumpGroup.visible = false;

  const skin = new THREE.MeshBasicMaterial({ color: 0xc5d0c0 });
  const skinDark = new THREE.MeshBasicMaterial({ color: 0x5a6858 });
  const voidMat = new THREE.MeshBasicMaterial({ color: 0x030006 });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const eyeCore = new THREE.MeshBasicMaterial({ color: 0xfff8d0 });
  const toothMat = new THREE.MeshBasicMaterial({ color: 0xfff8e8 });
  const bloodMat = new THREE.MeshBasicMaterial({ color: 0xb00000 });
  const hornMat = new THREE.MeshBasicMaterial({ color: 0x140606 });

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.9, 20, 16), skin);
  head.scale.set(1.15, 1.35, 1.0);
  r.jumpGroup.add(head);

  // Cuernos hacia arriba/atrás
  const hornGeo = new THREE.ConeGeometry(0.13, 0.8, 7);
  const hornL = new THREE.Mesh(hornGeo, hornMat);
  const hornR = hornL.clone();
  hornL.position.set(-0.48, 1.0, -0.15);
  hornR.position.set(0.48, 1.0, -0.15);
  hornL.rotation.set(-0.25, 0, -0.55);
  hornR.rotation.set(-0.25, 0, 0.55);
  r.jumpGroup.add(hornL, hornR);

  // Cejas
  r.box(0.42, 0.1, 0.18, skinDark, -0.4, 0.48, 0.82, r.jumpGroup);
  r.box(0.42, 0.1, 0.18, skinDark, 0.4, 0.48, 0.82, r.jumpGroup);

  // Cuencas
  const sockGeo = new THREE.SphereGeometry(0.3, 12, 10);
  const sockL = new THREE.Mesh(sockGeo, voidMat);
  const sockR = sockL.clone();
  sockL.scale.set(1.15, 0.9, 0.45);
  sockR.scale.set(1.15, 0.9, 0.45);
  sockL.position.set(-0.4, 0.22, 0.85);
  sockR.position.set(0.4, 0.22, 0.85);
  r.jumpGroup.add(sockL, sockR);

  // Ojos rojos
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 12), eyeMat);
  const eyeR = eyeL.clone();
  eyeL.position.set(-0.4, 0.22, 1.0);
  eyeR.position.set(0.4, 0.22, 1.0);
  r.jumpGroup.add(eyeL, eyeR);
  r.jumpEyeL = eyeL;
  r.jumpEyeR = eyeR;

  const coreL = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), eyeCore);
  const coreR = coreL.clone();
  coreL.position.set(-0.4, 0.22, 1.12);
  coreR.position.set(0.4, 0.22, 1.12);
  r.jumpGroup.add(coreL, coreR);

  // Sangre
  for (const x of [-0.4, 0.4]) {
    r.box(0.05, 0.4, 0.05, bloodMat, x, -0.08, 0.95, r.jumpGroup);
  }

  // Nariz
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.28, 6), voidMat);
  nose.position.set(0, 0.0, 1.0);
  r.jumpGroup.add(nose);

  // Boca
  const maw = new THREE.Mesh(new THREE.SphereGeometry(0.45, 14, 12), voidMat);
  maw.scale.set(1.4, 1.0, 0.5);
  maw.position.set(0, -0.45, 0.8);
  r.jumpGroup.add(maw);

  // Mandíbula
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.32, 0.5), skin);
  jaw.position.set(0, -0.8, 0.55);
  jaw.rotation.x = -0.65;
  r.jumpGroup.add(jaw);
  r.jumpJaw = jaw;

  // Dientes arriba (punta hacia abajo)
  for (let i = 0; i < 13; i++) {
    const h = 0.26 + (i % 3) * 0.1;
    const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.042, h, 5), toothMat);
    tooth.position.set(-0.52 + i * 0.085, -0.18, 1.05);
    tooth.rotation.x = Math.PI;
    r.jumpGroup.add(tooth);
  }
  // Dientes abajo
  for (let i = 0; i < 11; i++) {
    const h = 0.18 + (i % 2) * 0.12;
    const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.038, h, 5), toothMat);
    tooth.position.set(-0.42 + i * 0.085, -0.78, 0.95);
    r.jumpGroup.add(tooth);
  }

  r.box(0.38, 0.1, 0.4, bloodMat, 0, -0.52, 0.7, r.jumpGroup);

  r.jumpLight = new THREE.PointLight(0xff0000, 0, 10);
  r.jumpLight.position.set(0, 0.15, 1.2);
  r.jumpGroup.add(r.jumpLight);

  r.jumpGroup.position.set(0, 1.55, -1.8);
  r.scene.add(r.jumpGroup);
}
