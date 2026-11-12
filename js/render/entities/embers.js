import * as THREE from "three";

/** Brasas del horno (hijas de ovenGroup). */
export function setupEmbers(r) {
  const n = 20;
  const pos = new Float32Array(n * 3);
  r.emberData = [];
  for (let i = 0; i < n; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 0.5;
    pos[i * 3 + 1] = 0.5 + Math.random() * 0.8;
    pos[i * 3 + 2] = -0.45 + Math.random() * 0.25;
    r.emberData.push({
      i,
      speed: 0.3 + Math.random() * 0.6,
      wobble: Math.random() * Math.PI * 2,
    });
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  r.embers = new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      color: 0xff6622, size: 0.035, transparent: true, opacity: 0.75, depthWrite: false,
    }),
  );
  (r.ovenGroup || r.root).add(r.embers);
}
