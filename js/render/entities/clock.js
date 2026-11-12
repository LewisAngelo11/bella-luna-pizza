import * as THREE from "three";

/** Reloj de pared. */
export function buildClock(r) {
  const clock = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 0.05, 24),
    new THREE.MeshStandardMaterial({ color: 0xe8dcc8, roughness: 0.5 }),
  );
  clock.rotation.x = Math.PI / 2;
  clock.position.set(-4.8, 2.4, 12.95);
  r.root.add(clock);
  r.box(0.02, 0.14, 0.02, r.mats.metalDark, -4.8, 2.45, 12.98);
  r.box(0.02, 0.1, 0.02, r.mats.metalDark, -4.75, 2.4, 12.98);
}
