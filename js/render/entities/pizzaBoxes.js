import * as THREE from "three";

/** Estante con cajas de pizza. */
export function buildPizzaBoxes(r) {
  r.box(2.0, 0.08, 0.55, r.mats.wood, 4.4, 2.2, 8);
  r.box(0.06, 0.7, 0.5, r.mats.woodDark, 3.45, 1.9, 8);
  r.box(0.06, 0.7, 0.5, r.mats.woodDark, 5.35, 1.9, 8);
  for (let i = 0; i < 5; i++) {
    r.box(0.38, 0.08, 0.38, new THREE.MeshStandardMaterial({ color: 0xd4b896, roughness: 0.85 }), 3.85 + i * 0.3, 2.3, 8);
    r.box(0.3, 0.02, 0.02, new THREE.MeshStandardMaterial({ color: 0xaa3030 }), 3.85 + i * 0.3, 2.35, 7.82);
  }
}
