import * as THREE from "three";

/** Planta marchita. */
export function buildPlant(r) {
  r.box(0.28, 0.32, 0.28, r.mats.ceramic, -4.5, 0.16, 9);
  r.box(0.04, 0.35, 0.04, new THREE.MeshStandardMaterial({ color: 0x3a2810 }), -4.5, 0.45, 9);
  for (let i = 0; i < 5; i++) {
    const leaf = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x2a3a18, roughness: 0.95 }),
    );
    leaf.scale.set(1.2, 0.5, 0.8);
    const a = (i / 5) * Math.PI * 2;
    leaf.position.set(-4.5 + Math.cos(a) * 0.12, 0.55 + Math.random() * 0.1, 9 + Math.sin(a) * 0.12);
    r.root.add(leaf);
  }
}
