import * as THREE from "three";

/** Cuadro / poster en la pared. */
export function buildPoster(r) {
  r.box(0.9, 0.7, 0.04, r.mats.wood, 4.8, 2.3, 12.9);
  r.box(0.75, 0.55, 0.02, new THREE.MeshStandardMaterial({
    color: 0x2a1810, emissive: 0x441808, emissiveIntensity: 0.15,
  }), 4.8, 2.3, 12.93);
}
