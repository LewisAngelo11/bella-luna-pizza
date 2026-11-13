import * as THREE from "three";

/** Puerta trasera de la cocina. */
export function buildDoor(r) {
  r.doorGroup = new THREE.Group();
  r.doorGroup.position.set(0, 0, -7.05);
  r.root.add(r.doorGroup);

  r.box(1.7, 0.18, 0.22, r.mats.wood, 0, 2.58, 0.1, r.doorGroup);
  r.box(0.18, 2.55, 0.22, r.mats.wood, -0.78, 1.25, 0.1, r.doorGroup);
  r.box(0.18, 2.55, 0.22, r.mats.wood, 0.78, 1.25, 0.1, r.doorGroup);
  r.box(1.7, 0.14, 0.2, r.mats.woodDark, 0, 0.07, 0.1, r.doorGroup);

  r.doorPivot = new THREE.Group();
  r.doorPivot.position.set(-0.6, 1.25, 0.1);
  r.doorGroup.add(r.doorPivot);

  const doorMat = new THREE.MeshStandardMaterial({
    color: 0x6a4030, roughness: 0.8, side: THREE.DoubleSide, map: r.mats.wood.map,
  });
  // Tras el flip de root, la cara al jugador (interior) es local −Z
  r.door = r.box(1.2, 2.35, 0.12, doorMat, 0.6, 0, 0, r.doorPivot);
  r.box(0.95, 0.8, 0.03, r.mats.woodDark, 0.6, 0.5, -0.08, r.doorPivot);
  r.box(0.95, 0.8, 0.03, r.mats.woodDark, 0.6, -0.5, -0.08, r.doorPivot);
  r.box(0.04, 2.2, 0.04, r.mats.metalDark, 0.6, 0, -0.09, r.doorPivot);

  r.doorKnob = r.box(0.1, 0.1, 0.14, new THREE.MeshStandardMaterial({
    color: 0x33ff77, emissive: 0x22aa44, emissiveIntensity: 0.9, metalness: 0.7, roughness: 0.3,
  }), 1.05, 0, -0.14, r.doorPivot);

  r.doorBolt = r.box(0.22, 0.1, 0.08, r.mats.metal, 1.05, 0.28, -0.14, r.doorPivot);

  r.markInteractable(r.door, "door");
  r.markInteractable(r.doorKnob, "door");

  const mk = (text, y, z, size, color) => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 128;
    const ctx = c.getContext("2d");
    ctx.fillStyle = `#${color.toString(16).padStart(6, "0")}`;
    ctx.font = "bold 52px Cinzel, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 256, 64);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(size * 4.5, size),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, depthWrite: false }),
    );
    mesh.position.set(0, y, z);
    // Mirar al interior (jugador) tras el flip de Z
    mesh.rotation.y = Math.PI;
    r.doorGroup.add(mesh);
    return mesh;
  };
  r.doorLabel = mk("PUERTA TRASERA", 2.78, -0.2, 0.2, 0xffe0b0);
  r.doorStateLabel = mk("Click o [D]", 0.16, -0.2, 0.14, 0xf0d0a0);
}
