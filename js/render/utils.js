/* global BABYLON */

export function hex3(hex) {
  return new BABYLON.Color3(
    ((hex >> 16) & 255) / 255,
    ((hex >> 8) & 255) / 255,
    (hex & 255) / 255
  );
}

export function makeTex(scene, name, draw, w = 256, h = 256, u = 1, v = 1) {
  const tex = new BABYLON.DynamicTexture(name, { width: w, height: h }, scene, false);
  tex.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
  tex.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
  tex.uScale = u;
  tex.vScale = v;
  const ctx = tex.getContext();
  draw(ctx, w, h);
  tex.update();
  return tex;
}

export function nextId(r) {
  return r._meshId++;
}
