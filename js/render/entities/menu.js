import * as THREE from "three";

/** Carta en la pared del fondo. */
export function buildMenu(r) {
  r.box(1.85, 0.08, 0.08, r.mats.wood, 1.3, 2.7, 13.05);
  r.box(1.85, 0.08, 0.08, r.mats.wood, 1.3, 1.05, 13.05);
  r.box(0.08, 1.75, 0.08, r.mats.wood, 0.42, 1.88, 13.05);
  r.box(0.08, 1.75, 0.08, r.mats.wood, 2.18, 1.88, 13.05);

  r.box(1.7, 1.6, 0.06, r.mats.paper, 1.3, 1.85, 13.05);
  r.box(1.55, 1.45, 0.02, new THREE.MeshStandardMaterial({ color: 0xe8d8b8, roughness: 0.9 }), 1.3, 1.85, 13.09);
  r.makeLabel("BELLA LUNA", 1.3, 2.45, 13.12, 0.2, 0x3a2010);
  ["Margarita  ···", "Pepperoni ···", "Diavola   ···", "Funghi    ···"].forEach((l, i) => {
    r.makeLabel(l, 1.3, 2.15 - i * 0.22, 13.12, 0.14, 0x4a3020);
  });

  r.menuLight = new THREE.PointLight(0xffe8c0, 0.7, 5);
  r.menuLight.position.set(1.3, 2.0, 12.5);
  r.scene.add(r.menuLight);
}
