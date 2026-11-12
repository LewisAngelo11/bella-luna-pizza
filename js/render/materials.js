import * as THREE from "three";
import { texCanvas, bumpFromColor } from "./texUtils.js";

export function buildMaterials(r) {
    const woodMap = texCanvas((ctx, w, h) => {
      const base = ctx.createLinearGradient(0, 0, w, 0);
      base.addColorStop(0, "#4a2818");
      base.addColorStop(0.35, "#6b3d24");
      base.addColorStop(0.55, "#5a3420");
      base.addColorStop(1, "#3e2214");
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 70; i++) {
        const y = Math.random() * h;
        ctx.strokeStyle = `rgba(${20 + Math.random() * 30},${10 + Math.random() * 12},6,${0.12 + Math.random() * 0.3})`;
        ctx.lineWidth = 0.8 + Math.random() * 3.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(w * 0.25, y + 10, w * 0.55, y - 8, w, y + 5);
        ctx.stroke();
      }
      for (let i = 0; i < 40; i++) {
        ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.12})`;
        ctx.beginPath();
        ctx.ellipse(Math.random() * w, Math.random() * h, 2 + Math.random() * 6, 1 + Math.random() * 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }, 256, 256);
    woodMap.repeat.set(2.2, 2.2);

    const plasterMap = texCanvas((ctx, w, h) => {
      ctx.fillStyle = "#3d281c";
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 2200; i++) {
        const v = Math.random();
        ctx.fillStyle = v > 0.5
          ? `rgba(255,220,180,${Math.random() * 0.05})`
          : `rgba(0,0,0,${Math.random() * 0.1})`;
        ctx.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 3, 1 + Math.random() * 3);
      }
      for (let i = 0; i < 18; i++) {
        ctx.strokeStyle = "rgba(18,8,4,0.22)";
        ctx.lineWidth = 1 + Math.random();
        ctx.beginPath();
        const x0 = Math.random() * w;
        ctx.moveTo(x0, 0);
        ctx.lineTo(x0 + (Math.random() - 0.5) * 40, h);
        ctx.stroke();
      }
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = `rgba(10,5,2,${0.08 + Math.random() * 0.12})`;
        ctx.beginPath();
        ctx.ellipse(Math.random() * w, Math.random() * h, 20 + Math.random() * 50, 8 + Math.random() * 20, Math.random(), 0, Math.PI * 2);
        ctx.fill();
      }
    }, 256, 256);
    plasterMap.repeat.set(3.5, 2.2);

    const tileMap = texCanvas((ctx, w, h) => {
      const n = 4;
      const s = w / n;
      for (let y = 0; y < n; y++) {
        for (let x = 0; x < n; x++) {
          const dark = (x + y) % 2 === 0;
          const g = ctx.createLinearGradient(x * s, y * s, (x + 1) * s, (y + 1) * s);
          if (dark) {
            g.addColorStop(0, "#221610");
            g.addColorStop(1, "#140e0a");
          } else {
            g.addColorStop(0, "#3a261c");
            g.addColorStop(1, "#2a1a12");
          }
          ctx.fillStyle = g;
          ctx.fillRect(x * s, y * s, s, s);
          for (let i = 0; i < 30; i++) {
            ctx.fillStyle = `rgba(${Math.random() > 0.5 ? 255 : 0},${Math.random() > 0.5 ? 200 : 0},100,${Math.random() * 0.05})`;
            ctx.fillRect(x * s + Math.random() * s, y * s + Math.random() * s, 2, 2);
          }
          ctx.strokeStyle = "rgba(8,4,2,0.55)";
          ctx.lineWidth = 3;
          ctx.strokeRect(x * s + 1.5, y * s + 1.5, s - 3, s - 3);
        }
      }
    }, 256, 256);
    tileMap.repeat.set(9, 12);

    const metalMap = texCanvas((ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "#5a646e");
      g.addColorStop(0.35, "#a8b2bc");
      g.addColorStop(0.55, "#78828c");
      g.addColorStop(1, "#3a444e");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 50; i++) {
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.07})`;
        ctx.fillRect(0, Math.random() * h, w, 1 + Math.random() * 2);
      }
      for (let i = 0; i < 80; i++) {
        ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.08})`;
        ctx.fillRect(Math.random() * w, Math.random() * h, 1, 6 + Math.random() * 10);
      }
    }, 256, 256);

    const brickMap = texCanvas((ctx, w, h) => {
      ctx.fillStyle = "#2a1810";
      ctx.fillRect(0, 0, w, h);
      const bw = 64;
      const bh = 28;
      for (let row = 0; row < h / bh + 1; row++) {
        const off = (row % 2) * (bw / 2);
        for (let col = -1; col < w / bw + 1; col++) {
          const x = col * bw + off;
          const y = row * bh;
          const shade = 90 + Math.floor(Math.random() * 40);
          ctx.fillStyle = `rgb(${shade},${40 + Math.random() * 25},${20 + Math.random() * 15})`;
          ctx.fillRect(x + 2, y + 2, bw - 4, bh - 4);
          ctx.fillStyle = `rgba(255,180,120,${Math.random() * 0.08})`;
          ctx.fillRect(x + 4, y + 4, bw * 0.4, 3);
        }
      }
    }, 256, 128);
    brickMap.repeat.set(3, 2);

    const clothMap = texCanvas((ctx, w, h) => {
      ctx.fillStyle = "#7a2828";
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 40; i++) {
        ctx.strokeStyle = `rgba(40,10,10,${0.08 + Math.random() * 0.12})`;
        ctx.beginPath();
        ctx.moveTo(0, Math.random() * h);
        ctx.lineTo(w, Math.random() * h);
        ctx.stroke();
      }
      for (let i = 0; i < 200; i++) {
        ctx.fillStyle = `rgba(255,200,160,${Math.random() * 0.04})`;
        ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      }
    }, 256, 256);

    const paperMap = texCanvas((ctx, w, h) => {
      ctx.fillStyle = "#e4d4b4";
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 900; i++) {
        ctx.fillStyle = `rgba(120,80,40,${Math.random() * 0.06})`;
        ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      }
      ctx.fillStyle = "rgba(160,40,30,0.12)";
      ctx.fillRect(20, 20, w - 40, 8);
      for (let i = 0; i < 12; i++) {
        ctx.fillStyle = `rgba(60,40,20,${0.15 + Math.random() * 0.1})`;
        ctx.fillRect(30, 50 + i * 28, w - 80 - Math.random() * 40, 3);
      }
    }, 256, 256);

    const woodBump = bumpFromColor(woodMap, 1.1);
    const plasterBump = bumpFromColor(plasterMap, 0.9);
    const tileBump = bumpFromColor(tileMap, 1.2);
    const brickBump = bumpFromColor(brickMap, 1.15);

    r.mats = {
      wall: new THREE.MeshStandardMaterial({
        map: plasterMap, bumpMap: plasterBump, bumpScale: 0.035, roughness: 0.93, color: 0xffffff,
      }),
      floor: new THREE.MeshStandardMaterial({
        map: tileMap, bumpMap: tileBump, bumpScale: 0.05, roughness: 0.72, metalness: 0.05, color: 0xffffff,
      }),
      wood: new THREE.MeshStandardMaterial({
        map: woodMap, bumpMap: woodBump, bumpScale: 0.04, roughness: 0.78, color: 0xffffff,
      }),
      woodDark: new THREE.MeshStandardMaterial({
        color: 0x2a1810, roughness: 0.88, map: woodMap, bumpMap: woodBump, bumpScale: 0.03,
      }),
      metal: new THREE.MeshStandardMaterial({
        map: metalMap, roughness: 0.32, metalness: 0.78, color: 0xffffff,
      }),
      metalDark: new THREE.MeshStandardMaterial({ color: 0x3a4248, roughness: 0.38, metalness: 0.7 }),
      oven: new THREE.MeshStandardMaterial({
        color: 0xffffff, roughness: 0.85, map: brickMap, bumpMap: brickBump, bumpScale: 0.06,
      }),
      brick: new THREE.MeshStandardMaterial({
        map: brickMap, bumpMap: brickBump, bumpScale: 0.05, roughness: 0.9, color: 0xffffff,
      }),
      door: new THREE.MeshStandardMaterial({ color: 0x3a2214, roughness: 0.82, map: woodMap }),
      paper: new THREE.MeshStandardMaterial({ map: paperMap, roughness: 0.95, color: 0xffffff }),
      cloth: new THREE.MeshStandardMaterial({ map: clothMap, roughness: 0.92, color: 0xffffff }),
      skin: new THREE.MeshStandardMaterial({ color: 0xb8886c, roughness: 0.65 }),
      ice: new THREE.MeshStandardMaterial({
        color: 0xa8d0e8, roughness: 0.22, metalness: 0.15, transparent: true, opacity: 0.5,
        emissive: 0x224466, emissiveIntensity: 0.18,
      }),
      glass: new THREE.MeshStandardMaterial({
        color: 0x88aacc, roughness: 0.08, metalness: 0.15, transparent: true, opacity: 0.32,
      }),
      ceramic: new THREE.MeshStandardMaterial({ color: 0xe8e0d4, roughness: 0.35, metalness: 0.05 }),
      wax: new THREE.MeshStandardMaterial({ color: 0xf0e0b8, roughness: 0.7 }),
    };
  }
