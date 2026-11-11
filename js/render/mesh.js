/* global BABYLON */
import { makeTex, nextId } from "./utils.js";

/** Helpers de malla compartidos por los builders de sala/actores. */
export function attachMeshHelpers(r) {
  // Plantilla 1×1×1 visible=false pero ENABLED (clonar desde disabled rompe transforms).
  const boxTpl = BABYLON.MeshBuilder.CreateBox("_boxTpl", { size: 1 }, r.scene);
  boxTpl.isVisible = false;
  boxTpl.isPickable = false;
  boxTpl.position.set(0, -2000, 0);
  r._boxTpl = boxTpl;

  /** Cache de materiales one-shot por clave (color|opts). */
  r._matCache = new Map();
  r.mat = (color, opts = {}) => {
    const key = `${color}|${opts.emissive ?? ""}|${opts.alpha ?? ""}|${opts.backFace ? 1 : 0}|${opts.map?.name ?? ""}|${opts.specular ?? ""}`;
    if (r._matCache.has(key)) return r._matCache.get(key);
    const m = r.mats._std({ color, ...opts });
    r._matCache.set(key, m);
    return m;
  };

  /**
   * Caja con geometría compartida (clone de plantilla + scaling).
   * opts.cast — default true (como pre-Fase B / Three.js).
   * opts.receive — default true.
   */
  r.box = (w, h, d, mat, x, y, z, parent = r.root, opts = {}) => {
    const mesh = boxTpl.clone(`b${nextId(r)}`, null, true);
    mesh.isVisible = true;
    mesh.visibility = 1;
    mesh.setEnabled(true);
    mesh.material = mat;
    // parent= (no setParent): setParent preserva mundo y rompe coords locales
    // pensadas para pivotes (puertas / congelador).
    mesh.parent = parent || null;
    mesh.scaling.set(w, h, d);
    mesh.position.set(x, y, z);
    mesh.receiveShadows = opts.receive !== false;
    mesh.isPickable = !!opts.pickable;
    mesh.unfreezeWorldMatrix();
    const cast = opts.cast !== false;
    mesh.metadata = {
      ...(mesh.metadata || {}),
      animated: !!opts.animated,
      wantShadow: cast,
    };
    if (cast && r.shadowGen) r.shadowGen.addShadowCaster(mesh, false);
    return mesh;
  };

  r.markInteractable = (mesh, id) => {
    mesh.isPickable = true;
    mesh.metadata = { ...(mesh.metadata || {}), interactId: id, static: false, animated: true };
    mesh.unfreezeWorldMatrix();
    r.interactables.push(mesh);
    return mesh;
  };

  r.makeLabel = (text, x, y, z, size = 0.2, color = 0x222222, parent = r.root) => {
    const tex = makeTex(r.scene, `lbl${nextId(r)}`, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = `#${color.toString(16).padStart(6, "0")}`;
      ctx.font = "bold 56px Cinzel, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, w / 2, h / 2);
    }, 256, 64);
    tex.hasAlpha = true;
    const mat = new BABYLON.StandardMaterial(`lblm${nextId(r)}`, r.scene);
    mat.diffuseTexture = tex;
    mat.emissiveTexture = tex;
    mat.opacityTexture = tex;
    mat.diffuseColor = BABYLON.Color3.White();
    mat.emissiveColor = BABYLON.Color3.White();
    mat.specularColor = BABYLON.Color3.Black();
    mat.backFaceCulling = true;
    mat.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
    const mesh = BABYLON.MeshBuilder.CreatePlane(`lblp${nextId(r)}`, {
      width: size * 4.2, height: size,
    }, r.scene);
    mesh.material = mat;
    mesh.position.set(x, y, z);
    mesh.parent = parent;
    mesh.isPickable = false;
    mesh.receiveShadows = false;
    mesh.metadata = { static: true };
    return mesh;
  };

  r.addPizza = (x, y, z, parent = r.root, scale = 1) => {
    const crust = BABYLON.MeshBuilder.CreateCylinder(`pz${nextId(r)}`, {
      diameter: 0.56 * scale, height: 0.04 * scale, tessellation: 12,
    }, r.scene);
    crust.material = r.mat(0xc45a20);
    crust.position.set(x, y, z);
    crust.parent = parent;
    crust.receiveShadows = true;
    crust.metadata = { ...(crust.metadata || {}), wantShadow: true };
    if (r.shadowGen) r.shadowGen.addShadowCaster(crust, false);

    const sauce = BABYLON.MeshBuilder.CreateCylinder(`pz${nextId(r)}`, {
      diameter: 0.5 * scale, height: 0.015 * scale, tessellation: 12,
    }, r.scene);
    sauce.material = r.mat(0xa82818);
    sauce.position.set(x, y + 0.022 * scale, z);
    sauce.parent = parent;
    sauce.receiveShadows = false;

    const cheese = BABYLON.MeshBuilder.CreateCylinder(`pz${nextId(r)}`, {
      diameter: 0.47 * scale, height: 0.018 * scale, tessellation: 12,
    }, r.scene);
    cheese.material = r.mat(0xf0d060);
    cheese.position.set(x, y + 0.032 * scale, z);
    cheese.parent = parent;
    cheese.receiveShadows = false;
  };
}

/** Registra casters marcados con metadata.wantShadow (esferas, etc.). */
export function registerShadowCasters(r) {
  if (!r.shadowGen) return;
  let n = 0;
  for (const m of r.scene.meshes) {
    if (m === r._boxTpl) continue;
    if (m.name === "floor" || m.name === "backFloor") continue;
    if (m.metadata?.wantShadow) {
      r.shadowGen.addShadowCaster(m, false);
      n++;
    }
  }
  r._shadowCasterCount = n;
}
