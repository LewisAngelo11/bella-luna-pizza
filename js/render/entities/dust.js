import * as THREE from "three";

/** Polvo ambientado en comedor y cocina. */
export function setupDust(r) {
  const n = 50;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 10;
    pos[i * 3 + 1] = Math.random() * 2.8;
    pos[i * 3 + 2] = -6 + Math.random() * 18;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  r.dust = new THREE.Points(
    geo,
    new THREE.PointsMaterial({ color: 0xffe0b0, size: 0.02, transparent: true, opacity: 0.28 }),
  );
  r.root.add(r.dust);
}
