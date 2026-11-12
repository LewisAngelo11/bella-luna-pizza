import * as THREE from "three";

/** Estantería, cajas y lámpara del pasillo de cocina. */
export function buildKitchenProps(r) {
  r.box(1.2, 0.08, 0.45, r.mats.wood, 3.6, 1.75, -4.2);
  r.box(0.08, 1.55, 0.08, r.mats.woodDark, 3.15, 0.95, -4.2);
  r.box(0.08, 1.55, 0.08, r.mats.woodDark, 4.05, 0.95, -4.2);
  r.box(0.5, 0.4, 0.4, r.mats.woodDark, 3.4, 0.35, -3.6);
  r.box(0.45, 0.35, 0.35, r.mats.wood, 3.9, 0.32, -3.5);

  r.box(0.95, 1.05, 0.55, r.mats.metalDark, 3.8, 0.55, -5.4);
  r.box(0.75, 0.08, 0.5, r.mats.metal, 3.8, 1.12, -5.4);

  r.box(0.15, 0.2, 0.15, r.mats.metalDark, 0, 3.2, -4.0);
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0xffe0a0, emissive: 0xffcc66, emissiveIntensity: 2.0 }),
  );
  bulb.position.set(0, 2.95, -4.0);
  r.root.add(bulb);
}
