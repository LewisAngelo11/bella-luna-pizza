import * as THREE from "three";

/** Sala completa: comedor (+Z) + cocina (−Z). Un solo suelo/techo/paredes. */
export function buildShell(r) {
  // Suelo continuo: z −7.5 … 13.5 (centro 3, profundidad 21)
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 21), r.mats.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, 3);
  floor.receiveShadow = true;
  r.root.add(floor);

  // Pared fondo comedor
  r.box(12, 3.4, 0.25, r.mats.wall, 0, 1.7, 13.2);
  // Pared fondo cocina — hueco estrecho (~1.4) para la puerta
  r.box(5.15, 3.4, 0.28, r.mats.wall, -3.55, 1.7, -7.2);
  r.box(5.15, 3.4, 0.28, r.mats.wall, 3.55, 1.7, -7.2);
  r.box(1.5, 0.9, 0.28, r.mats.wall, 0, 2.95, -7.2);

  // Laterales a todo lo largo
  r.box(0.25, 3.4, 21, r.mats.wall, -5.7, 1.7, 3);
  r.box(0.25, 3.4, 21, r.mats.wall, 5.7, 1.7, 3);

  // Techo continuo
  r.box(12, 0.2, 21, r.mats.wall, 0, 3.4, 3, r.root, { cast: false });

  // Rodapiés
  r.box(12, 0.18, 0.1, r.mats.woodDark, 0, 0.09, 13.05);
  r.box(12, 0.18, 0.1, r.mats.woodDark, 0, 0.09, -7.05);
  r.box(0.1, 0.18, 21, r.mats.woodDark, -5.55, 0.09, 3);
  r.box(0.1, 0.18, 21, r.mats.woodDark, 5.55, 0.09, 3);

  // Molduras techo
  r.box(12, 0.12, 0.12, r.mats.wood, 0, 3.25, 13.05);
  r.box(12, 0.12, 0.12, r.mats.wood, 0, 3.25, -7.05);
  r.box(0.12, 0.12, 21, r.mats.wood, -5.55, 3.25, 3);
  r.box(0.12, 0.12, 21, r.mats.wood, 5.55, 3.25, 3);

  // Friso medio
  r.box(12, 0.08, 0.06, r.mats.woodDark, 0, 1.15, 13.08);
  r.box(12, 0.08, 0.06, r.mats.woodDark, 0, 1.15, -7.08);
  r.box(0.06, 0.08, 21, r.mats.woodDark, -5.58, 1.15, 3);
  r.box(0.06, 0.08, 21, r.mats.woodDark, 5.58, 1.15, 3);

  // Vigas techo (pocas = menos draw calls)
  for (let i = 0; i < 6; i++) {
    r.box(0.18, 0.22, 20.5, r.mats.woodDark, -4.5 + i * 1.8, 3.25, 3);
  }
}
