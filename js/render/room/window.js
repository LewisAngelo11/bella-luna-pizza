/* global BABYLON */
import { hex3, makeTex } from "../utils.js";

export function buildWindow(r) {
  const frame = r.mats.wood;
  r.box(2.9, 0.14, 0.16, frame, -2.2, 2.68, 13.05);
  r.box(2.9, 0.14, 0.16, frame, -2.2, 0.82, 13.05);
  r.box(0.14, 2.0, 0.16, frame, -3.58, 1.75, 13.05);
  r.box(0.14, 2.0, 0.16, frame, -0.82, 1.75, 13.05);
  r.box(0.08, 1.85, 0.12, frame, -2.2, 1.75, 13.05);
  r.box(2.7, 0.08, 0.12, frame, -2.2, 1.75, 13.05);

  r.windowGlass = r.box(2.55, 1.75, 0.04, r.mats.glass, -2.2, 1.75, 13.1, r.root, { cast: false });

  const night = makeTex(r.scene, "night", (ctx, w, h) => {
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#040812");
    sky.addColorStop(0.55, "#0a1228");
    sky.addColorStop(1, "#12101a");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 12; i++) {
      const bx = i * 42 - 10;
      const bh = 40 + Math.random() * 90;
      ctx.fillStyle = `rgb(${8 + Math.random() * 10},${10 + Math.random() * 12},${18 + Math.random() * 20})`;
      ctx.fillRect(bx, h - bh, 32, bh);
      for (let wy = 0; wy < 5; wy++) {
        if (Math.random() > 0.45) {
          ctx.fillStyle = `rgba(255,${180 + Math.random() * 60},100,${0.25 + Math.random() * 0.5})`;
          ctx.fillRect(bx + 8, h - bh + 8 + wy * 14, 8, 8);
        }
      }
    }
    ctx.fillStyle = "rgba(220,230,255,0.85)";
    ctx.beginPath();
    ctx.arc(w * 0.78, h * 0.22, 14, 0, Math.PI * 2);
    ctx.fill();
  }, 256, 128);

  const nightMat = r.mat(0xffffff, { map: night, emissive: 0x223344 });
  nightMat.emissiveTexture = night;
  r.box(2.55, 1.75, 0.02, nightMat, -2.2, 1.75, 13.22, r.root, { cast: false });

  r.windowLight = new BABYLON.PointLight("winL", new BABYLON.Vector3(-2.2, 1.8, 12.3), r.scene);
  r.windowLight.diffuse = hex3(0x4a6088);
  r.windowLight.intensity = 0.08;
  r.windowLight.range = 5;
}
