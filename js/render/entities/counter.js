import * as THREE from "three";

export function buildCounter(r) {
    r.box(8.2, 0.85, 0.85, r.mats.woodDark, 0, 0.42, 1.15);
    r.box(8.4, 0.1, 1.1, r.mats.wood, 0, 0.9, 1.1);
    r.box(8.4, 0.03, 1.11, r.mats.metal, 0, 0.96, 1.1);

    for (let i = -3; i <= 3; i++) {
      r.box(0.95, 0.62, 0.05, r.mats.wood, i * 1.1, 0.4, 0.7);
      r.box(0.88, 0.04, 0.06, r.mats.metalDark, i * 1.1, 0.72, 0.68);
    }

    r.box(0.58, 0.4, 0.45, r.mats.metalDark, 2.7, 1.16, 0.95);
    r.box(0.5, 0.08, 0.12, r.mats.metal, 2.7, 1.38, 0.78);
    r.box(0.42, 0.14, 0.03, new THREE.MeshStandardMaterial({
      color: 0x33ff77, emissive: 0x22aa44, emissiveIntensity: 1.1,
    }), 2.7, 1.32, 0.7);
    for (let i = 0; i < 4; i++) {
      r.box(0.08, 0.04, 0.04, r.mats.metal, 2.5 + i * 0.12, 1.05, 0.72);
    }

    r.addPizza(-1.5, 0.98, 0.95);

    r.box(0.55, 0.03, 0.35, r.mats.wood, 0.3, 0.98, 0.95);
    r.box(0.28, 0.02, 0.04, r.mats.metal, 0.45, 1.01, 0.95);
    r.box(0.1, 0.025, 0.04, r.mats.woodDark, 0.25, 1.01, 0.95);

    r.box(0.12, 0.18, 0.12, r.mats.ceramic, -0.4, 1.07, 0.9);
    r.box(0.08, 0.14, 0.08, new THREE.MeshStandardMaterial({ color: 0xf5f0e8, roughness: 0.5 }), -0.65, 1.05, 0.9);
    r.box(0.08, 0.14, 0.08, new THREE.MeshStandardMaterial({ color: 0x2a1a12, roughness: 0.5 }), -0.8, 1.05, 0.9);

    r.box(0.28, 0.1, 0.22, r.mats.metalDark, -2.6, 1.01, 0.95);
    r.box(0.22, 0.08, 0.08, r.mats.metalDark, -2.6, 1.12, 0.95);
  }
