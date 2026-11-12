import * as THREE from "three";

/** Manchas en el suelo. */
export function buildStains(r) {
  for (const [x, z] of [[-3.2, 7.5], [2.5, 10.2], [1.2, 4.0]]) {
    const stain = new THREE.Mesh(
      new THREE.CircleGeometry(0.25 + Math.random() * 0.2, 12),
      new THREE.MeshBasicMaterial({ color: 0x1a0c08, transparent: true, opacity: 0.25 }),
    );
    stain.rotation.x = -Math.PI / 2;
    stain.position.set(x, 0.012, z);
    r.root.add(stain);
  }
}
