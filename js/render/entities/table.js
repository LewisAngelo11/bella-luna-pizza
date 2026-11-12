import * as THREE from "three";
import { addChair } from "./chair.js";

/** Una mesa con mantel, cubiertos, vela y silla. */
export function buildTable(r, { id, x, z }) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);

  [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]].forEach(([lx, lz]) => {
    r.box(0.07, 0.76, 0.07, r.mats.woodDark, lx, 0.38, lz, g);
    r.box(0.1, 0.04, 0.1, r.mats.woodDark, lx, 0.04, lz, g);
  });
  const top = r.box(1.3, 0.07, 1.3, r.mats.wood, 0, 0.8, 0, g);
  r.box(1.15, 0.02, 1.15, r.mats.cloth, 0, 0.85, 0, g);

  addChair(r, g);

  r.box(0.22, 0.02, 0.22, r.mats.ceramic, 0, 0.88, 0, g);
  r.box(0.04, 0.01, 0.14, r.mats.metal, 0.28, 0.87, 0.05, g);
  r.box(0.03, 0.01, 0.12, r.mats.metal, -0.28, 0.87, 0.05, g);

  const glass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.035, 0.12, 12),
    new THREE.MeshStandardMaterial({
      color: 0xaad0e8, transparent: true, opacity: 0.4, roughness: 0.15, metalness: 0.1,
    }),
  );
  glass.position.set(0.2, 0.94, -0.25);
  g.add(glass);

  const candle = r.box(0.035, 0.12, 0.035, r.mats.wax, -0.15, 0.94, -0.2, g);
  const flame = new THREE.Mesh(
    new THREE.ConeGeometry(0.018, 0.05, 6),
    new THREE.MeshStandardMaterial({ color: 0xffaa44, emissive: 0xff6600, emissiveIntensity: 1.5 }),
  );
  flame.position.set(-0.15, 1.04, -0.2);
  g.add(flame);
  candle.userData.flame = flame;

  const label = r.makeLabel(
    id === 6 ? "MESA 6" : `Mesa ${id}`,
    0, 0.12, 0.85, 0.13, id === 6 ? 0xc08070 : 0xaa8866,
  );
  g.add(label);
  r.root.add(g);

  const entry = { group: g, top, ghost: null, flame };
  r.tables[id] = entry;

  if (id === 6) {
    // Silueta muy tenue: apenas se nota si no miras fijamente
    const ghost = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 12, 12),
      new THREE.MeshStandardMaterial({
        color: 0x2a0808,
        emissive: 0x3a0505,
        emissiveIntensity: 0.08,
        transparent: true,
        opacity: 0.04,
        depthWrite: false,
      }),
    );
    ghost.position.set(0, 1.28, 0);
    g.add(ghost);
    const torso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.15, 0.4, 10),
      new THREE.MeshStandardMaterial({
        color: 0x1a0606,
        emissive: 0x280404,
        emissiveIntensity: 0.05,
        transparent: true,
        opacity: 0.03,
        depthWrite: false,
      }),
    );
    torso.position.set(0, 0.95, 0);
    g.add(torso);
    entry.ghost = ghost;
    entry.ghostBody = torso;
    r.markInteractable(top, "table6");
    r.markInteractable(ghost, "table6");
  }

  return entry;
}
