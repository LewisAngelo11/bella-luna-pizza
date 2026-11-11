/* global BABYLON */

export function buildOven(r) {
  r.ovenGroup = new BABYLON.TransformNode("oven", r.scene);
  r.ovenGroup.position.set(4.1, 0, 5.3);
  r.ovenGroup.parent = r.root;

  r.box(2.0, 1.2, 1.5, r.mats.oven, 0, 0.6, 0, r.ovenGroup, { cast: true });
  r.box(2.1, 0.14, 1.55, r.mats.metalDark, 0, 1.25, 0, r.ovenGroup, { cast: true });
  r.box(2.2, 0.4, 1.05, r.mats.metalDark, 0, 1.55, -0.1, r.ovenGroup);
  r.box(0.5, 0.8, 0.5, r.mats.metalDark, 0, 2.15, -0.15, r.ovenGroup);

  for (let i = 0; i < 9; i++) {
    const a = -Math.PI * 0.55 + (i / 8) * Math.PI * 1.1;
    r.box(0.14, 0.12, 0.1, r.mats.brick, Math.cos(a) * 0.58, 0.65 + Math.sin(a) * 0.52, -0.72, r.ovenGroup);
  }

  r.ovenMouth = BABYLON.MeshBuilder.CreateDisc("ovenMouth", { radius: 0.45, tessellation: 20 }, r.scene);
  r.ovenMouth.material = r.mat(0xffaa44, { emissive: 0xe85d04, backFace: true });
  r.ovenMouth.material.unfreeze();
  r.ovenMouth.position.set(0, 0.65, -0.74);
  r.ovenMouth.parent = r.ovenGroup;

  r.ovenGlow = BABYLON.MeshBuilder.CreateDisc("ovenGlow", { radius: 0.55, tessellation: 16 }, r.scene);
  r.ovenGlow.material = r.mat(0xff6622, { alpha: 0.25, backFace: true });
  r.ovenGlow.material.unfreeze();
  r.ovenGlow.position.set(0, 0.65, -0.73);
  r.ovenGlow.parent = r.ovenGroup;

  r.box(0.35, 0.06, 0.12, r.mats.woodDark, -0.1, 0.35, -0.5, r.ovenGroup);
  r.makeLabel("HORNO", 4.1, 1.95, 4.55, 0.16, 0xf4d35e);
}
