/* global BABYLON */
import { nextId } from "../utils.js";

/**
 * El jugador mira hacia +Z; el cliente está delante (z≈2.2).
 * La cara debe mirar al jugador → rasgos en -Z (hacia la cámara).
 */
export function setupCustomer(r) {
  r.customerGroup = new BABYLON.TransformNode("customer", r.scene);
  r.customerGroup.position.set(0, 0, 2.2);
  r.customerGroup.parent = r.root;
  r.customerGroup.setEnabled(false);

  const cloth = r.mat(0x5a4038);
  const skin = r.mats.skin;
  const hair = r.mat(0x2a1a12);
  // Ojos legibles en penumbra (no negro puro).
  const eyeMat = r.mat(0x2a1814, { emissive: 0x110805 });
  eyeMat.unfreeze();
  const mouthMat = r.mat(0xa05060, { emissive: 0x2a1018 });
  mouthMat.unfreeze();

  r.customerBody = r.box(0.62, 1.05, 0.4, cloth, 0, 0.95, 0, r.customerGroup, { cast: true, animated: true });
  r.box(0.78, 0.3, 0.38, cloth, 0, 1.42, 0, r.customerGroup, { animated: true });
  r.box(0.14, 0.55, 0.14, cloth, -0.42, 1.05, 0.05, r.customerGroup, { animated: true });
  r.box(0.14, 0.55, 0.14, cloth, 0.42, 1.05, 0.05, r.customerGroup, { animated: true });

  r.customerHead = BABYLON.MeshBuilder.CreateSphere("chead", { diameter: 0.52, segments: 12 }, r.scene);
  r.customerHead.material = skin;
  r.customerHead.position.set(0, 1.72, 0);
  r.customerHead.parent = r.customerGroup;
  r.customerHead.metadata = { wantShadow: true, animated: true };
  r.customerHead.receiveShadows = true;
  r.customerHead.unfreezeWorldMatrix();

  // Cabello detrás de la cabeza (+Z = lejos del jugador).
  const hairMesh = BABYLON.MeshBuilder.CreateSphere("chair", { diameter: 0.54, segments: 10 }, r.scene);
  hairMesh.material = hair;
  hairMesh.scaling.set(1.05, 0.7, 1.05);
  hairMesh.position.set(0, 1.82, 0.04);
  hairMesh.parent = r.customerGroup;
  hairMesh.metadata = { animated: true };
  hairMesh.unfreezeWorldMatrix();

  // Cara hacia la cámara (-Z). Un poco fuera de la cabeza para que no se ocultan.
  r.eyeL = BABYLON.MeshBuilder.CreateSphere("eyeL", { diameter: 0.1, segments: 8 }, r.scene);
  r.eyeR = BABYLON.MeshBuilder.CreateSphere("eyeR", { diameter: 0.1, segments: 8 }, r.scene);
  r.eyeL.material = eyeMat;
  r.eyeR.material = eyeMat;
  r.eyeL.position.set(-0.09, 1.76, -0.24);
  r.eyeR.position.set(0.09, 1.76, -0.24);
  r.eyeL.parent = r.customerGroup;
  r.eyeR.parent = r.customerGroup;
  r.eyeL.metadata = { animated: true };
  r.eyeR.metadata = { animated: true };
  r.eyeL.unfreezeWorldMatrix();
  r.eyeR.unfreezeWorldMatrix();

  // Brillos
  const hlMat = r.mat(0xffffff, { emissive: 0xffffff });
  hlMat.unfreeze();
  const hl = BABYLON.MeshBuilder.CreateSphere("eyeHL", { diameter: 0.028, segments: 6 }, r.scene);
  const hr = BABYLON.MeshBuilder.CreateSphere("eyeHR", { diameter: 0.028, segments: 6 }, r.scene);
  hl.material = hlMat;
  hr.material = hlMat;
  hl.position.set(-0.075, 1.775, -0.28);
  hr.position.set(0.105, 1.775, -0.28);
  hl.parent = r.customerGroup;
  hr.parent = r.customerGroup;
  hl.metadata = { animated: true };
  hr.metadata = { animated: true };

  r.customerMouth = r.box(
    0.14, 0.035, 0.04,
    mouthMat,
    0, 1.58, -0.25,
    r.customerGroup,
    { animated: true, receive: false },
  );

  // Nariz sutil
  r.box(0.05, 0.06, 0.05, skin, 0, 1.68, -0.26, r.customerGroup, { animated: true, receive: false });

  r.customerShadow = BABYLON.MeshBuilder.CreateDisc("cshadow", { radius: 0.5, tessellation: 16 }, r.scene);
  r.customerShadow.material = r.mat(0x000000, { alpha: 0.4 });
  r.customerShadow.rotation.x = Math.PI / 2;
  r.customerShadow.position.y = 0.02;
  r.customerShadow.parent = r.customerGroup;
  r.customerShadow.metadata = { animated: true };

  r.teethGroup = new BABYLON.TransformNode("teeth", r.scene);
  r.teethGroup.parent = r.customerGroup;
  r.teethGroup.setEnabled(false);
  for (let i = 0; i < 10; i++) {
    r.box(
      0.025, 0.08, 0.02,
      r.mat(0xfff5e6),
      -0.12 + i * 0.025, 1.56, -0.26,
      r.teethGroup,
      { animated: true, receive: false },
    );
  }
}

export function applyCustomer(r, c) {
  r.customer = c;
  if (!c) {
    r.customerGroup.setEnabled(false);
    if (r.customerLight) {
      r.customerLight.intensity = 0;
      r.customerLight.setEnabled(false);
    }
    return;
  }
  r.customerGroup.setEnabled(true);
  // Por si algún child quedó disabled/frozen tras clones.
  for (const child of r.customerGroup.getChildMeshes?.(false) ?? []) {
    child.setEnabled(true);
    child.isVisible = true;
    child.unfreezeWorldMatrix?.();
  }
  if (r.customerLight) {
    r.customerLight.setEnabled(true);
    r.customerLight.intensity = 0.85;
  }
  const traits = c.traits || {};
  r.customerShadow.setEnabled(traits.shadow !== false);
  if (traits.redEyes) {
    const m = r.mat(0xff1111, { emissive: 0xff0000 });
    m.unfreeze();
    r.eyeL.material = m;
    r.eyeR.material = m.clone(`eyeR${nextId(r)}`);
    r.eyeR.material.unfreeze();
  } else {
    const m = r.mat(0x2a1814, { emissive: 0x110805 });
    m.unfreeze();
    r.eyeL.material = m;
    r.eyeR.material = m;
  }
  r.teethGroup.setEnabled(!!traits.tooManyTeeth);
  if (r.customerMouth) r.customerMouth.setEnabled(!traits.tooManyTeeth);
}
