import * as THREE from "three";
import { texCanvas } from "../texUtils.js";

export function buildWindow(r) {
    const frame = r.mats.wood;
    r.box(2.9, 0.14, 0.16, frame, -2.2, 2.68, 13.05);
    r.box(2.9, 0.14, 0.16, frame, -2.2, 0.82, 13.05);
    r.box(0.14, 2.0, 0.16, frame, -3.58, 1.75, 13.05);
    r.box(0.14, 2.0, 0.16, frame, -0.82, 1.75, 13.05);
    r.box(0.08, 1.85, 0.12, frame, -2.2, 1.75, 13.05);
    r.box(2.7, 0.08, 0.12, frame, -2.2, 1.75, 13.05);

    const glass = r.box(2.55, 1.75, 0.04, r.mats.glass, -2.2, 1.75, 13.1, r.root, { cast: false });

    const night = texCanvas((ctx, w, h) => {
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, "#040812");
      sky.addColorStop(0.55, "#0a1228");
      sky.addColorStop(1, "#12101a");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 14; i++) {
        const bx = i * 38 - 10;
        const bh = 40 + Math.random() * 90;
        ctx.fillStyle = `rgb(${8 + Math.random() * 10},${10 + Math.random() * 12},${18 + Math.random() * 20})`;
        ctx.fillRect(bx, h - bh, 32, bh);
        for (let wy = 0; wy < 6; wy++) {
          for (let wx = 0; wx < 2; wx++) {
            if (Math.random() > 0.45) {
              ctx.fillStyle = `rgba(255,${180 + Math.random() * 60},100,${0.25 + Math.random() * 0.5})`;
              ctx.fillRect(bx + 6 + wx * 12, h - bh + 8 + wy * 14, 6, 8);
            }
          }
        }
      }
      ctx.fillStyle = "rgba(220,230,255,0.85)";
      ctx.beginPath();
      ctx.arc(w * 0.78, h * 0.22, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(180,200,255,0.15)";
      ctx.beginPath();
      ctx.arc(w * 0.78, h * 0.22, 28, 0, Math.PI * 2);
      ctx.fill();
    }, 512, 256);

    r.box(2.55, 1.75, 0.02, new THREE.MeshStandardMaterial({
      map: night, emissiveMap: night, emissive: 0xffffff, emissiveIntensity: 0.35, roughness: 1,
    }), -2.2, 1.75, 13.22, r.root, { cast: false });

    const dripTex = texCanvas((ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < 35; i++) {
        const x = Math.random() * w;
        ctx.strokeStyle = `rgba(180,210,240,${0.15 + Math.random() * 0.25})`;
        ctx.lineWidth = 1 + Math.random();
        ctx.beginPath();
        ctx.moveTo(x, Math.random() * h * 0.3);
        ctx.quadraticCurveTo(x + 4, h * 0.5, x - 2, h);
        ctx.stroke();
      }
    }, 256, 256);
    const drips = new THREE.Mesh(
      new THREE.PlaneGeometry(2.5, 1.7),
      new THREE.MeshBasicMaterial({ map: dripTex, transparent: true, opacity: 0.55, depthWrite: false })
    );
    drips.position.set(-2.2, 1.75, 13.12);
    r.root.add(drips);

    r.windowGlass = glass;
    r.windowLight = new THREE.PointLight(0x6688cc, 0.55, 8);
    r.windowLight.position.set(-2.2, 1.8, 12.3);
    r.scene.add(r.windowLight);
  }
