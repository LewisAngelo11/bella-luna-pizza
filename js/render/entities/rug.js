import * as THREE from "three";

/** Alfombra frente al mostrador. */
export function buildRug(r) {
  r.box(3.5, 0.02, 1.2, new THREE.MeshStandardMaterial({ color: 0x4a2020, roughness: 0.95 }), 0, 0.015, 2.5, r.root, { cast: false });
}
