import * as THREE from "three";

/** Lámpara de techo del comedor. */
export function buildLamp(r) {
  r.box(0.06, 0.55, 0.06, r.mats.metalDark, 0, 3.05, 5, r.root, { cast: false });
  const shade = new THREE.Mesh(
    new THREE.ConeGeometry(0.5, 0.4, 20, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x4a3020, side: THREE.DoubleSide, roughness: 0.75 }),
  );
  shade.position.set(0, 2.8, 5);
  shade.castShadow = true;
  r.root.add(shade);
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xffe8b0, emissive: 0xffcc66, emissiveIntensity: 1.2 }),
  );
  bulb.position.set(0, 2.7, 5);
  r.root.add(bulb);
}
