import * as THREE from "three";

export function buildRain(r) {
    r.rain = [];
    const rainGeo = new THREE.BufferGeometry();
    const n = 220;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = -3.45 + Math.random() * 2.5;
      pos[i * 3 + 1] = 0.9 + Math.random() * 1.7;
      pos[i * 3 + 2] = 13.05 + Math.random() * 0.08;
      r.rain.push({ i, speed: 2.2 + Math.random() * 2.8 });
    }
    rainGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    r.rainPoints = new THREE.Points(
      rainGeo,
      new THREE.PointsMaterial({ color: 0xb0c8e8, size: 0.022, transparent: true, opacity: 0.55 })
    );
    r.root.add(r.rainPoints);
  }
