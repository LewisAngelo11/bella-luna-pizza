/* global BABYLON */
import { hex3, makeTex, nextId } from "./utils.js";

export function buildMaterials(r) {
  const woodMap = makeTex(r.scene, "wood", (ctx, w, h) => {
    const base = ctx.createLinearGradient(0, 0, w, 0);
    base.addColorStop(0, "#4a2818");
    base.addColorStop(0.35, "#6b3d24");
    base.addColorStop(0.55, "#5a3420");
    base.addColorStop(1, "#3e2214");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) {
      const y = Math.random() * h;
      ctx.strokeStyle = `rgba(${20 + Math.random() * 30},${10 + Math.random() * 12},6,${0.12 + Math.random() * 0.3})`;
      ctx.lineWidth = 0.8 + Math.random() * 3.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(w * 0.25, y + 10, w * 0.55, y - 8, w, y + 5);
      ctx.stroke();
    }
  }, 256, 256, 2.2, 2.2);

  const plasterMap = makeTex(r.scene, "plaster", (ctx, w, h) => {
    ctx.fillStyle = "#3d281c";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      const v = Math.random();
      ctx.fillStyle = v > 0.5
        ? `rgba(255,220,180,${Math.random() * 0.05})`
        : `rgba(0,0,0,${Math.random() * 0.1})`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 3, 1 + Math.random() * 3);
    }
  }, 256, 256, 3.5, 2.2);

  const tileMap = makeTex(r.scene, "tile", (ctx, w, h) => {
    const n = 4;
    const s = w / n;
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? "#1a100c" : "#2e1e16";
        ctx.fillRect(x * s, y * s, s, s);
        ctx.strokeStyle = "rgba(0,0,0,0.35)";
        ctx.strokeRect(x * s + 1, y * s + 1, s - 2, s - 2);
      }
    }
  }, 256, 256, 6, 8);

  const brickMap = makeTex(r.scene, "brick", (ctx, w, h) => {
    ctx.fillStyle = "#2a1814";
    ctx.fillRect(0, 0, w, h);
    const bw = 42;
    const bh = 20;
    for (let row = 0; row < h / bh + 1; row++) {
      const off = (row % 2) * (bw / 2);
      for (let col = -1; col < w / bw + 1; col++) {
        const x = col * bw + off;
        const y = row * bh;
        ctx.fillStyle = `rgb(${90 + Math.random() * 40},${40 + Math.random() * 20},${28 + Math.random() * 12})`;
        ctx.fillRect(x + 1, y + 1, bw - 2, bh - 2);
      }
    }
  }, 256, 256, 2, 2);

  const metalMap = makeTex(r.scene, "metal", (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#7a858c");
    g.addColorStop(0.5, "#a8b0b6");
    g.addColorStop(1, "#5a646c");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 30; i++) {
      ctx.strokeStyle = `rgba(255,255,255,${Math.random() * 0.08})`;
      ctx.beginPath();
      ctx.moveTo(0, Math.random() * h);
      ctx.lineTo(w, Math.random() * h);
      ctx.stroke();
    }
  }, 128, 128);

  const clothMap = makeTex(r.scene, "cloth", (ctx, w, h) => {
    ctx.fillStyle = "#7a2828";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 30; i++) {
      ctx.strokeStyle = `rgba(40,10,10,${0.08 + Math.random() * 0.12})`;
      ctx.beginPath();
      ctx.moveTo(0, Math.random() * h);
      ctx.lineTo(w, Math.random() * h);
      ctx.stroke();
    }
  }, 128, 128);

  const paperMap = makeTex(r.scene, "paper", (ctx, w, h) => {
    ctx.fillStyle = "#e4d4b4";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 400; i++) {
      ctx.fillStyle = `rgba(120,80,40,${Math.random() * 0.06})`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
    ctx.fillStyle = "rgba(160,40,30,0.12)";
    ctx.fillRect(20, 20, w - 40, 8);
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = `rgba(60,40,20,${0.15 + Math.random() * 0.1})`;
      ctx.fillRect(30, 50 + i * 28, w - 80 - Math.random() * 40, 3);
    }
  }, 256, 256);

  const std = (opts = {}) => {
    const m = new BABYLON.StandardMaterial(`m${nextId(r)}`, r.scene);
    if (opts.map) m.diffuseTexture = opts.map;
    m.diffuseColor = hex3(opts.color ?? 0xffffff);
    m.specularColor = hex3(opts.specular ?? 0x222222);
    m.emissiveColor = hex3(opts.emissive ?? 0x000000);
    m.roughness = opts.roughness ?? 0.8;
    if (opts.alpha != null) {
      m.alpha = opts.alpha;
      m.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
    }
    if (opts.backFace) m.backFaceCulling = false;
    // Por defecto Babylon solo usa 4 luces → la sombra quedaba fuera del shader.
    m.maxSimultaneousLights = 10;
    return m;
  };

  r.mats = {
    wall: std({ map: plasterMap }),
    floor: std({ map: tileMap, specular: 0x444444 }),
    wood: std({ map: woodMap }),
    woodDark: std({ map: woodMap, color: 0x2a1810 }),
    metal: std({ map: metalMap, specular: 0x888888 }),
    metalDark: std({ color: 0x3a4248, specular: 0x666666 }),
    oven: std({ map: brickMap }),
    brick: std({ map: brickMap }),
    door: std({ map: woodMap, color: 0x3a2214 }),
    paper: std({ map: paperMap }),
    cloth: std({ map: clothMap }),
    skin: std({ color: 0xb8886c, specular: 0x333333 }),
    ice: std({ color: 0xa8d0e8, alpha: 0.5, emissive: 0x112233 }),
    glass: std({ color: 0x88aacc, alpha: 0.32, specular: 0xaaaaaa }),
    ceramic: std({ color: 0xe8e0d4 }),
    wax: std({ color: 0xf0e0b8 }),
    _std: std,
  };
}
