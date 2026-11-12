/** Silla de madera — se añade a un padre (mesa). */
export function addChair(r, parent, x = 0, z = 0.98) {
  r.box(0.48, 0.05, 0.48, r.mats.woodDark, x, 0.48, z, parent);
  r.box(0.42, 0.55, 0.05, r.mats.woodDark, x, 0.78, z + 0.22, parent);
  [[-0.18, 0.78], [0.18, 0.78]].forEach(([lx, lz]) => {
    r.box(0.05, 0.45, 0.05, r.mats.woodDark, x + lx, 0.25, lz, parent);
  });
}
