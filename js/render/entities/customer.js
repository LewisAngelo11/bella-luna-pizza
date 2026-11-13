import * as THREE from "three";

/** Colores de camisa (solo torso / hombros). */
const SHIRT_COLORS = [
  0x1a1a1a, // negra
  0xf2efe8, // blanca
  0x2f4f8a, // azul
  0x6b4423, // café
];

export function setupCustomer(r) {
  r.customerGroup = new THREE.Group();
  r.customerGroup.visible = false;
  r.customerGroup.position.set(0, 0, 2.2);

  const cloth = new THREE.MeshStandardMaterial({ color: 0x5a4038, roughness: 0.85 });
  const clothDark = new THREE.MeshStandardMaterial({ color: 0x3a2820, roughness: 0.88 });
  const shirt = new THREE.MeshStandardMaterial({ color: SHIRT_COLORS[0], roughness: 0.82 });
  r.customerShirtMat = shirt;
  const skin = new THREE.MeshStandardMaterial({ color: 0xd4a888, roughness: 0.55 });
  const hair = new THREE.MeshStandardMaterial({ color: 0x2a1a12, roughness: 0.9 });

  // Piernas
  r.box(0.16, 0.58, 0.18, clothDark, -0.12, 0.32, 0.02, r.customerGroup);
  r.box(0.16, 0.58, 0.18, clothDark, 0.12, 0.32, 0.02, r.customerGroup);
  // Zapatos
  r.box(0.18, 0.08, 0.28, clothDark, -0.12, 0.05, 0.06, r.customerGroup, { cast: false });
  r.box(0.18, 0.08, 0.28, clothDark, 0.12, 0.05, 0.06, r.customerGroup, { cast: false });

  // Cadera / cintura (más estrecha) — pantalón, no camisa
  r.box(0.42, 0.22, 0.28, cloth, 0, 0.68, 0.01, r.customerGroup);

  // Torso + hombros (camisa; color aleatorio por cliente)
  r.customerBody = r.box(0.48, 0.55, 0.3, shirt, 0, 1.05, 0, r.customerGroup);
  r.box(0.56, 0.16, 0.26, shirt, 0, 1.36, 0, r.customerGroup);
  r.box(0.14, 0.14, 0.14, shirt, -0.32, 1.34, 0.02, r.customerGroup, { cast: false });
  r.box(0.14, 0.14, 0.14, shirt, 0.32, 1.34, 0.02, r.customerGroup, { cast: false });

  // Cuello
  r.box(0.12, 0.1, 0.12, skin, 0, 1.48, 0.02, r.customerGroup, { cast: false });

  // Brazos (más gruesos, caídos al lado del torso)
  r.box(0.13, 0.48, 0.13, cloth, -0.34, 1.05, 0.04, r.customerGroup);
  r.box(0.13, 0.48, 0.13, cloth, 0.34, 1.05, 0.04, r.customerGroup);
  // Manos
  r.box(0.11, 0.11, 0.11, skin, -0.34, 0.76, 0.06, r.customerGroup, { cast: false });
  r.box(0.11, 0.11, 0.11, skin, 0.34, 0.76, 0.06, r.customerGroup, { cast: false });

  // Cabeza
  r.customerHead = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 20), skin);
  r.customerHead.scale.set(1.0, 1.08, 0.95);
  r.customerHead.position.set(0, 1.72, 0.02);
  r.customerHead.castShadow = true;
  r.customerGroup.add(r.customerHead);

  // Cabello
  const hairMesh = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), hair);
  hairMesh.scale.set(1.08, 0.72, 1.05);
  hairMesh.position.set(0, 1.82, -0.02);
  hairMesh.castShadow = true;
  r.customerGroup.add(hairMesh);

  // Relleno suave en la cara: quita la sombra bajo la barbilla en clientes sin sombra
  r.customerFaceLight = new THREE.PointLight(0xfff2e0, 0, 1.6, 2);
  r.customerFaceLight.position.set(0, 1.78, 0.42);
  r.customerFaceLight.castShadow = false;
  r.customerGroup.add(r.customerFaceLight);

  // Ojos
  r.eyeL = new THREE.Mesh(
    new THREE.SphereGeometry(0.042, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0x1a1010 })
  );
  r.eyeR = r.eyeL.clone();
  r.eyeL.position.set(-0.075, 1.74, 0.22);
  r.eyeR.position.set(0.075, 1.74, 0.22);
  r.customerGroup.add(r.eyeL, r.eyeR);

  const hl = new THREE.Mesh(
    new THREE.SphereGeometry(0.011, 6, 6),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  const hr = hl.clone();
  hl.position.set(-0.065, 1.75, 0.25);
  hr.position.set(0.085, 1.75, 0.25);
  r.customerGroup.add(hl, hr);

  // Nariz / boca
  r.box(0.045, 0.055, 0.045, skin, 0, 1.68, 0.23, r.customerGroup, { cast: false });
  r.customerMouth = r.box(
    0.11, 0.028, 0.02,
    new THREE.MeshStandardMaterial({ color: 0x8a4050 }),
    0, 1.59, 0.22, r.customerGroup, { cast: false }
  );

  // Sombra en el suelo
  r.customerShadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.42, 22),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4 })
  );
  r.customerShadow.rotation.x = -Math.PI / 2;
  r.customerShadow.position.y = 0.02;
  r.customerGroup.add(r.customerShadow);

  // Dientes (anomalía)
  r.teethGroup = new THREE.Group();
  r.teethGroup.visible = false;
  for (let i = 0; i < 12; i++) {
    r.box(
      0.025, 0.08, 0.02,
      new THREE.MeshStandardMaterial({ color: 0xfff5e6 }),
      -0.14 + i * 0.025, 1.57, 0.23, r.teethGroup, { cast: false }
    );
  }
  r.customerGroup.add(r.teethGroup);

  // Guardar qué piezas proyectan sombra (para restaurar en clientes normales)
  r.customerGroup.traverse((obj) => {
    if (obj.isMesh && obj !== r.customerShadow) {
      obj.userData.castShadowDefault = !!obj.castShadow;
    }
  });

  r.root.add(r.customerGroup);
}

function setCustomerBodyShadows(r, enabled) {
  r.customerGroup?.traverse((obj) => {
    if (!obj.isMesh || obj === r.customerShadow) return;
    obj.castShadow = enabled ? !!obj.userData.castShadowDefault : false;
  });
}

export function applyCustomer(r, c) {
  r.customer = c;
  if (!c) {
    r.customerGroup.visible = false;
    if (r.customerLight) r.customerLight.intensity = 0;
    if (r.customerFaceLight) r.customerFaceLight.intensity = 0;
    return;
  }
  r.customerGroup.visible = true;
  if (r.customerLight) r.customerLight.intensity = 3.2;
  if (r.customerShirtMat) {
    const hex = SHIRT_COLORS[(Math.random() * SHIRT_COLORS.length) | 0];
    r.customerShirtMat.color.setHex(hex);
  }
  const traits = c.traits || {};
  const hasShadow = traits.shadow !== false;
  r.customerShadow.visible = hasShadow;
  // Sin sombra: ni blob en el suelo ni proyección del cuerpo; luz suave en la cara
  setCustomerBodyShadows(r, hasShadow);
  if (r.customerFaceLight) r.customerFaceLight.intensity = hasShadow ? 0 : 1.15;
  if (traits.redEyes) {
    const m = new THREE.MeshStandardMaterial({
      color: 0xff1111, emissive: 0xff0000, emissiveIntensity: 1.5,
    });
    r.eyeL.material = m;
    r.eyeR.material = m;
  } else {
    const m = new THREE.MeshStandardMaterial({ color: 0x1a1010 });
    r.eyeL.material = m;
    r.eyeR.material = m;
  }
  r.teethGroup.visible = !!traits.tooManyTeeth;
  if (r.customerMouth) r.customerMouth.visible = !traits.tooManyTeeth;
}
