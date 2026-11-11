/* global BABYLON */

/** Paredes, suelo y molduras base de la sala. */
export function buildShell(r) {
  const floor = BABYLON.MeshBuilder.CreateGround("floor", { width: 12, height: 16 }, r.scene);
  floor.material = r.mats.floor;
  floor.position.set(0, 0, 6.5);
  floor.parent = r.root;
  floor.receiveShadows = true;

  r.box(12, 3.4, 0.25, r.mats.wall, 0, 1.7, 13.2);
  r.box(0.25, 3.4, 14, r.mats.wall, -5.7, 1.7, 6.5);
  r.box(0.25, 3.4, 14, r.mats.wall, 5.7, 1.7, 6.5);
  r.box(12, 0.2, 14, r.mats.wall, 0, 3.4, 6.5, r.root, { cast: false });

  r.box(12, 0.18, 0.1, r.mats.woodDark, 0, 0.09, 13.05);
  r.box(0.1, 0.18, 14, r.mats.woodDark, -5.55, 0.09, 6.5);
  r.box(0.1, 0.18, 14, r.mats.woodDark, 5.55, 0.09, 6.5);
  r.box(12, 0.12, 0.12, r.mats.wood, 0, 3.25, 13.05);
  r.box(0.12, 0.12, 14, r.mats.wood, -5.55, 3.25, 6.5);
  r.box(0.12, 0.12, 14, r.mats.wood, 5.55, 3.25, 6.5);

  for (let i = 0; i < 5; i++) {
    r.box(0.18, 0.22, 13.5, r.mats.woodDark, -4 + i * 2, 3.25, 6.5);
  }
}
