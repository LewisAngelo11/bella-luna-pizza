import * as THREE from "three";

/** Shared unit box — scale instead of new BoxGeometry per mesh. */
export function attachMeshHelpers(r) {
  r._boxGeo = new THREE.BoxGeometry(1, 1, 1);
  r._matCache = new Map();

  r.mat = (color, opts = {}) => {
    const key = `${color}|${opts.emissive ?? ""}|${opts.opacity ?? ""}|${opts.roughness ?? ""}|${opts.metalness ?? ""}|${opts.side ?? ""}`;
    if (r._matCache.has(key)) return r._matCache.get(key);
    const m = new THREE.MeshStandardMaterial({
      color,
      roughness: opts.roughness ?? 0.8,
      metalness: opts.metalness ?? 0,
      emissive: opts.emissive ?? 0x000000,
      emissiveIntensity: opts.emissiveIntensity ?? 1,
      transparent: opts.opacity != null && opts.opacity < 1,
      opacity: opts.opacity ?? 1,
      side: opts.side ?? THREE.FrontSide,
      map: opts.map,
    });
    r._matCache.set(key, m);
    return m;
  };

  r.box = (w, h, d, mat, x, y, z, parent = r.root, opts = {}) => {
    const mesh = new THREE.Mesh(r._boxGeo, mat);
    mesh.scale.set(w, h, d);
    mesh.position.set(x, y, z);
    const vol = Math.abs(w * h * d);
    mesh.castShadow = opts.cast === true || (opts.cast !== false && vol >= 0.8);
    mesh.receiveShadow = opts.receive === true || (opts.receive !== false && vol >= 1.2);
    parent.add(mesh);
    return mesh;
  };

  r.markInteractable = (mesh, id) => {
    mesh.userData.interactId = id;
    r.interactables.push(mesh);
    return mesh;
  };

  r.makeLabel = (text, x, y, z, size = 0.2, color = 0x222222, parent = null) => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 64;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, 256, 64);
    ctx.fillStyle = `#${color.toString(16).padStart(6, "0")}`;
    ctx.font = "bold 42px Cinzel, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 128, 32);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({
      map: tex, transparent: true, side: THREE.DoubleSide, depthWrite: false,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size * 4.2, size), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    (parent || r.root).add(mesh);
    return mesh;
  };

  r.addPizza = (x, y, z, parent = r.root, scale = 1) => {
    const crust = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28 * scale, 0.28 * scale, 0.04 * scale, 12),
      r.mat(0xc45a20, { roughness: 0.85 }),
    );
    crust.position.set(x, y, z);
    crust.castShadow = false;
    parent.add(crust);
    return crust;
  };
}
