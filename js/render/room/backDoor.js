/* global BABYLON */

export function buildBackDoor(r) {
  r.doorGroup = new BABYLON.TransformNode("doorHall", r.scene);
  r.doorGroup.position.set(0, 0, -6.2);
  r.doorGroup.parent = r.root;

  const wallMat = r.mat(0x5a3a28, { map: r.mats.wall.diffuseTexture, backFace: true });
  const backFloor = BABYLON.MeshBuilder.CreateGround("backFloor", { width: 5.5, height: 7.5 }, r.scene);
  backFloor.material = r.mats.floor;
  backFloor.position.set(0, 0.01, 3.2);
  backFloor.parent = r.doorGroup;
  backFloor.receiveShadows = true;

  r.box(0.2, 3.2, 7.2, wallMat, -2.5, 1.6, 3.2, r.doorGroup);
  r.box(0.2, 3.2, 7.2, wallMat, 2.5, 1.6, 3.2, r.doorGroup);
  r.box(5.2, 0.12, 7.2, r.mats.wall, 0, 3.15, 3.2, r.doorGroup, { cast: false });
  r.box(5.2, 3.2, 0.25, wallMat, 0, 1.6, -0.2, r.doorGroup);

  r.box(0.8, 0.9, 0.6, r.mats.woodDark, -1.8, 0.45, 5.5, r.doorGroup);
  r.box(0.9, 1.1, 0.55, r.mats.metalDark, 1.85, 0.55, 4.2, r.doorGroup);
  r.box(0.55, 0.7, 0.45, r.mats.woodDark, 1.7, 0.35, 6.0, r.doorGroup);

  for (const lz of [5.5, 3.0, 0.8]) {
    r.box(0.12, 0.18, 0.12, r.mats.metalDark, 0, 3.0, lz, r.doorGroup);
    const bulb = BABYLON.MeshBuilder.CreateSphere(`bulb${lz}`, { diameter: 0.16, segments: 8 }, r.scene);
    bulb.material = r.mat(0xffc080, { emissive: 0xff9940 });
    bulb.position.set(0, 2.88, lz);
    bulb.parent = r.doorGroup;
  }

  r.box(1.5, 0.14, 0.18, r.mats.wood, 0, 2.55, 0.05, r.doorGroup);
  r.box(0.14, 2.5, 0.18, r.mats.wood, -0.7, 1.25, 0.05, r.doorGroup);
  r.box(0.14, 2.5, 0.18, r.mats.wood, 0.7, 1.25, 0.05, r.doorGroup);

  r.doorPivot = new BABYLON.TransformNode("doorPivot", r.scene);
  r.doorPivot.position.set(-0.6, 1.25, 0.12);
  r.doorPivot.parent = r.doorGroup;

  r.door = r.box(
    1.2, 2.35, 0.1,
    r.mat(0x6a4030, { map: r.mats.wood.diffuseTexture, backFace: true }),
    0.6, 0, 0, r.doorPivot, { cast: true, animated: true }
  );
  r.box(0.95, 0.8, 0.03, r.mats.woodDark, 0.6, 0.5, 0.07, r.doorPivot, { animated: true });
  r.box(0.95, 0.8, 0.03, r.mats.woodDark, 0.6, -0.5, 0.07, r.doorPivot, { animated: true });

  r.doorKnob = r.box(0.09, 0.09, 0.12, r.mat(0xf4d35e, { emissive: 0xaa8800 }), 1.05, 0, 0.12, r.doorPivot, { animated: true });
  r.doorKnob.material.unfreeze();
  r.doorBolt = r.box(0.22, 0.1, 0.08, r.mats.metal, 1.05, 0.28, 0.12, r.doorPivot, { animated: true });

  r.markInteractable(r.door, "door");
  r.markInteractable(r.doorKnob, "door");
  for (const m of r.doorPivot.getChildMeshes?.(false) ?? []) {
    m.unfreezeWorldMatrix();
    m.metadata = { ...(m.metadata || {}), animated: true, static: false };
  }

  r.makeLabel("PUERTA TRASERA", 0, 2.75, 0.25, 0.2, 0xffe0b0, r.doorGroup);
  r.makeLabel("Click o [D]", 0, 0.18, 0.25, 0.14, 0xf0d0a0, r.doorGroup);
}
