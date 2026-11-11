/* global BABYLON */

export function buildDecor(r) {
  r.box(0.06, 0.55, 0.06, r.mats.metalDark, 0, 3.05, 5, r.root, { cast: false });
  const shade = BABYLON.MeshBuilder.CreateCylinder("shade", {
    diameterTop: 0.05, diameterBottom: 1.0, height: 0.4, tessellation: 12, enclose: false,
  }, r.scene);
  shade.material = r.mat(0x4a3020, { backFace: true });
  shade.position.set(0, 2.8, 5);
  shade.parent = r.root;
  shade.metadata = { ...(shade.metadata || {}), wantShadow: true };
  shade.receiveShadows = true;

  const bulb = BABYLON.MeshBuilder.CreateSphere("mainBulb", { diameter: 0.2, segments: 8 }, r.scene);
  bulb.material = r.mat(0xffc080, { emissive: 0xff9940 });
  bulb.position.set(0, 2.7, 5);
  bulb.parent = r.root;

  r.box(2.0, 0.08, 0.55, r.mats.wood, 4.4, 2.2, 8);
  for (let i = 0; i < 4; i++) {
    r.box(0.38, 0.08, 0.38, r.mat(0xd4b896), 3.9 + i * 0.35, 2.3, 8);
  }

  r.box(0.28, 0.32, 0.28, r.mats.ceramic, -4.5, 0.16, 9);
  r.box(0.9, 0.7, 0.04, r.mats.wood, 4.8, 2.3, 12.9);
  r.box(3.5, 0.02, 1.2, r.mat(0x4a2020), 0, 0.015, 2.5, r.root, { cast: false });
}
