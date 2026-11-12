import * as THREE from "three";

/** Letrero neón ABIERTO. */
export function buildNeon(r) {
  const neonMat = new THREE.MeshStandardMaterial({
    color: 0xff2222, emissive: 0xff1111, emissiveIntensity: 1.8, roughness: 0.3,
  });
  r.neon = r.makeLabel("ABIERTO", 0.15, 2.95, 13.12, 0.34, 0xff4444);
  r.box(1.35, 0.04, 0.04, neonMat, 0.15, 3.12, 13.1, r.root, { cast: false });
  r.box(1.35, 0.04, 0.04, neonMat, 0.15, 2.78, 13.1, r.root, { cast: false });
  r.neonLight = new THREE.PointLight(0xff3b3b, 1.6, 10);
  r.neonLight.position.set(0.15, 2.8, 12.4);
  r.scene.add(r.neonLight);
}
