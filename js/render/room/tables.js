/* global BABYLON */

export function buildTables(r) {
  r.tables = {};
  [
    { id: 1, x: -1.8, z: 8.5 },
    { id: 2, x: 0.4, z: 9.3 },
    { id: 6, x: -2.7, z: 6.1 },
  ].forEach((t) => {
    const g = new BABYLON.TransformNode(`table${t.id}`, r.scene);
    g.position.set(t.x, 0, t.z);
    g.parent = r.root;

    [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]].forEach(([lx, lz]) => {
      r.box(0.07, 0.76, 0.07, r.mats.woodDark, lx, 0.38, lz, g);
    });
    const top = r.box(1.3, 0.07, 1.3, r.mats.wood, 0, 0.8, 0, g, { cast: true });
    r.box(1.15, 0.02, 1.15, r.mats.cloth, 0, 0.85, 0, g);
    r.box(0.48, 0.05, 0.48, r.mats.woodDark, 0, 0.48, 0.98, g);
    r.box(0.42, 0.55, 0.05, r.mats.woodDark, 0, 0.78, 1.2, g);
    r.box(0.22, 0.02, 0.22, r.mats.ceramic, 0, 0.88, 0, g);

    const flame = BABYLON.MeshBuilder.CreateCylinder(`flame${t.id}`, {
      diameterTop: 0.01, diameterBottom: 0.036, height: 0.05, tessellation: 6,
    }, r.scene);
    flame.material = r.mat(0xffaa44, { emissive: 0xff6600 });
    flame.material.unfreeze();
    flame.position.set(-0.15, 1.04, -0.2);
    flame.parent = g;
    r.box(0.035, 0.12, 0.035, r.mats.wax, -0.15, 0.94, -0.2, g);

    r.makeLabel(t.id === 6 ? "MESA 6" : `Mesa ${t.id}`, 0, 0.12, 0.85, 0.13, t.id === 6 ? 0xff7755 : 0xaa8866, g);
    r.tables[t.id] = { group: g, top, ghost: null, flame };

    if (t.id === 6) {
      const ghost = BABYLON.MeshBuilder.CreateSphere("ghost6", { diameter: 0.44, segments: 10 }, r.scene);
      ghost.material = r.mat(0x660000, { emissive: 0xaa0000, alpha: 0.1 });
      ghost.material.unfreeze();
      ghost.position.set(0, 1.3, 0);
      ghost.parent = g;
      const torso = BABYLON.MeshBuilder.CreateCylinder("ghostBody", {
        diameterTop: 0.24, diameterBottom: 0.36, height: 0.45, tessellation: 10,
      }, r.scene);
      torso.material = r.mat(0x440000, { emissive: 0x660000, alpha: 0.1 });
      torso.material.unfreeze();
      torso.position.set(0, 0.95, 0);
      torso.parent = g;
      r.tables[6].ghost = ghost;
      r.tables[6].ghostBody = torso;
      r.markInteractable(top, "table6");
      r.markInteractable(ghost, "table6");
    }
  });
}
