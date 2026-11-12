import * as THREE from "three";

export function texCanvas(draw, w = 256, h = 256) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  t.needsUpdate = true;
  return t;
}

export function bumpFromColor(colorTex, amount = 1) {
  const img = colorTex.image;
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, c.width, c.height);
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = Math.min(255, ((d[i] + d[i + 1] + d[i + 2]) / 3) * amount);
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  ctx.putImageData(data, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  t.repeat.copy(colorTex.repeat);
  return t;
}
