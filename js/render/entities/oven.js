import * as THREE from "three";

/**
 * Horno de pizzas.
 * En cocina (−Z build → +Z tras flip): la cara al jugador es local −Z.
 */
export function buildOven(r) {
  r.ovenGroup = new THREE.Group();
  r.ovenGroup.position.set(-2.4, 0, -3.4);
  r.root.add(r.ovenGroup);

  // Cuerpo detrás de la boca (local +Z = lejos del jugador tras el flip)
  r.box(2.05, 1.3, 1.2, r.mats.oven, 0, 0.65, 0.25, r.ovenGroup);
  r.box(2.2, 0.12, 1.3, r.mats.metalDark, 0, 1.36, 0.25, r.ovenGroup);
  r.box(1.55, 0.35, 0.9, r.mats.metalDark, 0, 1.68, 0.15, r.ovenGroup);
  r.box(0.45, 0.9, 0.45, r.mats.metalDark, 0, 2.25, 0.1, r.ovenGroup);

  // Cavidad (hacia la boca / jugador = −Z)
  r.box(1.25, 1.05, 0.75, new THREE.MeshStandardMaterial({
    color: 0x080402, roughness: 1,
  }), 0, 0.7, -0.1, r.ovenGroup, { cast: false });

  // Brasas
  r.box(1.0, 0.05, 0.55, new THREE.MeshStandardMaterial({
    color: 0x4a1808, emissive: 0x882200, emissiveIntensity: 1.2, roughness: 0.9,
  }), 0, 0.3, -0.15, r.ovenGroup, { cast: false });
  r.box(0.38, 0.07, 0.12, r.mats.woodDark, -0.12, 0.36, -0.05, r.ovenGroup);
  r.box(0.32, 0.06, 0.1, r.mats.woodDark, 0.15, 0.38, -0.22, r.ovenGroup);

  // Arco de ladrillo en la boca (−Z)
  for (let i = 0; i < 13; i++) {
    const a = (i / 12) * Math.PI;
    r.box(
      0.15, 0.13, 0.18,
      r.mats.brick,
      Math.cos(a) * 0.72,
      0.52 + Math.sin(a) * 0.62,
      -0.55,
      r.ovenGroup,
    );
  }
  r.box(0.17, 0.75, 0.18, r.mats.brick, -0.72, 0.42, -0.55, r.ovenGroup);
  r.box(0.17, 0.75, 0.18, r.mats.brick, 0.72, 0.42, -0.55, r.ovenGroup);
  r.box(1.5, 0.14, 0.18, r.mats.brick, 0, 0.1, -0.55, r.ovenGroup);

  // Boca / fuego — mira al jugador (normal −Z)
  r.ovenMouth = new THREE.Mesh(
    new THREE.CircleGeometry(0.58, 28),
    new THREE.MeshStandardMaterial({
      color: 0xffb040,
      emissive: 0xff3a00,
      emissiveIntensity: 4.8,
      side: THREE.DoubleSide,
    }),
  );
  r.ovenMouth.position.set(0, 0.7, -0.52);
  r.ovenMouth.rotation.y = Math.PI;
  r.ovenGroup.add(r.ovenMouth);

  const glow = new THREE.Mesh(
    new THREE.CircleGeometry(0.78, 28),
    new THREE.MeshBasicMaterial({
      color: 0xff5511, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false,
    }),
  );
  glow.position.set(0, 0.7, -0.5);
  glow.rotation.y = Math.PI;
  r.ovenGroup.add(glow);
  r.ovenGlow = glow;

  // Marco metálico
  r.box(1.45, 0.05, 0.1, r.mats.metal, 0, 1.28, -0.58, r.ovenGroup);
  r.box(0.05, 1.15, 0.1, r.mats.metal, -0.7, 0.7, -0.58, r.ovenGroup);
  r.box(0.05, 1.15, 0.1, r.mats.metal, 0.7, 0.7, -0.58, r.ovenGroup);

  // Pala delante de la boca
  r.box(0.85, 0.05, 0.5, r.mats.metal, 0, 0.52, -0.95, r.ovenGroup);
  r.box(0.07, 0.48, 0.07, r.mats.metalDark, -0.32, 0.24, -1.05, r.ovenGroup);
  r.box(0.07, 0.48, 0.07, r.mats.metalDark, 0.32, 0.24, -1.05, r.ovenGroup);

  const tag = r.makeLabel("HORNO", 0, 0, 0, 0.17, 0xf4d35e, r.ovenGroup);
  tag.position.set(0, 1.95, -0.7);
  tag.rotation.y = Math.PI;

  // Interactivo: cuerpo + boca
  r.markInteractable(r.ovenMouth, "oven");
  r.markInteractable(glow, "oven");
  r.ovenGroup.traverse((obj) => {
    if (obj.isMesh && obj !== r.ovenMouth && obj !== glow) {
      r.markInteractable(obj, "oven");
    }
  });
}
