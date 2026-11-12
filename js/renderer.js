/**
 * Renderer Three.js — sala detallada, look al ratón,
 * click en congelador/puerta, click derecho = mirar atrás.
 */
import * as THREE from "three";

function texCanvas(draw, w = 256, h = 256) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

function bumpFromColor(colorTex, amount = 1) {
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
  t.anisotropy = 8;
  t.repeat.copy(colorTex.repeat);
  return t;
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.t = 0;
    this.customer = null;
    this.doorLocked = true;
    this.freezerKnock = false;
    this.freezerOpen = false;
    this.flicker = 0;
    this.table6Stare = 0;
    this.lookingTable6 = false;
    this.hoverTable6 = false;
    this.hoverTarget = null;
    this.jumpscare = 0;
    this.pointerX = 0.5;
    this.pointerY = 0.5;
    this.lookEnabled = false;
    this.lookingBehind = false;
    this.yaw = 0;
    this.pitch = 0;
    this.targetYaw = 0;
    this.targetPitch = 0;
    this.baseYaw = 0;
    this.targetBaseYaw = 0;
    this.freezerDoorAngle = 0;
    this.doorAngle = 0;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x140e0a);
    this.scene.fog = new THREE.FogExp2(0x140e0a, 0.009);

    this.camera = new THREE.PerspectiveCamera(68, this.w / this.h, 0.05, 60);
    this.camera.position.set(0, 1.55, 0.2);
    this.camera.rotation.order = "YXZ";

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(this.w, this.h, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.45;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.raycaster = new THREE.Raycaster();
    this.ndc = new THREE.Vector2();
    this.interactables = [];

    this.root = new THREE.Group();
    this.scene.add(this.root);

    this.buildMaterials();
    this.buildRoom();
    this.setupCustomer();
    this.setupJumpscare();
    this.setupDust();
    this.setupEmbers();
    this.setupLights();

    this.root.children.forEach((obj) => {
      obj.position.z *= -1;
    });
    [
      this.lamp,
      this.ovenLight,
      this.fill,
      this.counterLight,
      this.customerLight,
      this.backLight,
      this.backLight2,
      this.windowLight,
      this.menuLight,
      this.spotLamp,
    ].forEach((l) => {
      if (l) l.position.z *= -1;
    });
    if (this.spotLamp?.target) this.spotLamp.target.position.z *= -1;

    window.addEventListener("resize", () => this.resize());
    this.resize();
  }

  buildMaterials() {
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
    }, 512, 512);
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
    }, 512, 512);
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
    }, 512, 512);
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
    }, 512, 256);
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

    this.mats = {
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

  resize() {
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.camera.aspect = this.w / this.h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.w, this.h, false);
  }

  box(w, h, d, mat, x, y, z, parent = this.root, opts = {}) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = opts.cast !== false;
    mesh.receiveShadow = opts.receive !== false;
    parent.add(mesh);
    return mesh;
  }

  markInteractable(mesh, id) {
    mesh.userData.interactId = id;
    this.interactables.push(mesh);
    return mesh;
  }

  buildRoom() {
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 16), this.mats.floor);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, 6.5);
    floor.receiveShadow = true;
    this.root.add(floor);

    this.box(12, 3.4, 0.25, this.mats.wall, 0, 1.7, 13.2);
    this.box(0.25, 3.4, 14, this.mats.wall, -5.7, 1.7, 6.5);
    this.box(0.25, 3.4, 14, this.mats.wall, 5.7, 1.7, 6.5);
    this.box(12, 0.2, 14, this.mats.wall, 0, 3.4, 6.5, this.root, { cast: false });

    this.box(12, 0.18, 0.1, this.mats.woodDark, 0, 0.09, 13.05);
    this.box(0.1, 0.18, 14, this.mats.woodDark, -5.55, 0.09, 6.5);
    this.box(0.1, 0.18, 14, this.mats.woodDark, 5.55, 0.09, 6.5);
    this.box(12, 0.12, 0.12, this.mats.wood, 0, 3.25, 13.05);
    this.box(0.12, 0.12, 14, this.mats.wood, -5.55, 3.25, 6.5);
    this.box(0.12, 0.12, 14, this.mats.wood, 5.55, 3.25, 6.5);

    this.box(12, 0.08, 0.06, this.mats.woodDark, 0, 1.15, 13.08);
    this.box(0.06, 0.08, 14, this.mats.woodDark, -5.58, 1.15, 6.5);
    this.box(0.06, 0.08, 14, this.mats.woodDark, 5.58, 1.15, 6.5);

    for (let i = 0; i < 5; i++) {
      this.box(0.18, 0.22, 13.5, this.mats.woodDark, -4 + i * 2, 3.25, 6.5);
    }

    this.buildWindow();
    this.buildMenuAndNeon();
    this.buildCounter();
    this.buildFreezer();
    this.buildOven();
    this.buildBackDoor();
    this.buildTables();
    this.buildDecor();
    this.buildRain();
  }

  buildWindow() {
    const frame = this.mats.wood;
    this.box(2.9, 0.14, 0.16, frame, -2.2, 2.68, 13.05);
    this.box(2.9, 0.14, 0.16, frame, -2.2, 0.82, 13.05);
    this.box(0.14, 2.0, 0.16, frame, -3.58, 1.75, 13.05);
    this.box(0.14, 2.0, 0.16, frame, -0.82, 1.75, 13.05);
    this.box(0.08, 1.85, 0.12, frame, -2.2, 1.75, 13.05);
    this.box(2.7, 0.08, 0.12, frame, -2.2, 1.75, 13.05);

    const glass = this.box(2.55, 1.75, 0.04, this.mats.glass, -2.2, 1.75, 13.1, this.root, { cast: false });

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

    this.box(2.55, 1.75, 0.02, new THREE.MeshStandardMaterial({
      map: night, emissiveMap: night, emissive: 0xffffff, emissiveIntensity: 0.35, roughness: 1,
    }), -2.2, 1.75, 13.22, this.root, { cast: false });

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
    this.root.add(drips);

    this.windowGlass = glass;
    this.windowLight = new THREE.PointLight(0x6688cc, 0.55, 8);
    this.windowLight.position.set(-2.2, 1.8, 12.3);
    this.scene.add(this.windowLight);
  }

  buildMenuAndNeon() {
    this.box(1.85, 0.08, 0.08, this.mats.wood, 1.3, 2.7, 13.05);
    this.box(1.85, 0.08, 0.08, this.mats.wood, 1.3, 1.05, 13.05);
    this.box(0.08, 1.75, 0.08, this.mats.wood, 0.42, 1.88, 13.05);
    this.box(0.08, 1.75, 0.08, this.mats.wood, 2.18, 1.88, 13.05);

    this.box(1.7, 1.6, 0.06, this.mats.paper, 1.3, 1.85, 13.05);
    this.box(1.55, 1.45, 0.02, new THREE.MeshStandardMaterial({ color: 0xe8d8b8, roughness: 0.9 }), 1.3, 1.85, 13.09);
    this.makeLabel("BELLA LUNA", 1.3, 2.45, 13.12, 0.2, 0x3a2010);
    ["Margarita  ···", "Pepperoni ···", "Diavola   ···", "Funghi    ···"].forEach((l, i) => {
      this.makeLabel(l, 1.3, 2.15 - i * 0.22, 13.12, 0.14, 0x4a3020);
    });

    const neonMat = new THREE.MeshStandardMaterial({
      color: 0xff2222, emissive: 0xff1111, emissiveIntensity: 1.8, roughness: 0.3,
    });
    this.neon = this.makeLabel("ABIERTO", 0.15, 2.95, 13.12, 0.34, 0xff4444);
    this.box(1.35, 0.04, 0.04, neonMat, 0.15, 3.12, 13.1, this.root, { cast: false });
    this.box(1.35, 0.04, 0.04, neonMat, 0.15, 2.78, 13.1, this.root, { cast: false });
    this.neonLight = new THREE.PointLight(0xff3b3b, 1.6, 10);
    this.neonLight.position.set(0.15, 2.8, 12.4);
    this.scene.add(this.neonLight);

    this.menuLight = new THREE.PointLight(0xffe8c0, 0.7, 5);
    this.menuLight.position.set(1.3, 2.0, 12.5);
    this.scene.add(this.menuLight);
  }

  buildCounter() {
    this.box(8.2, 0.85, 0.85, this.mats.woodDark, 0, 0.42, 1.15);
    this.box(8.4, 0.1, 1.1, this.mats.wood, 0, 0.9, 1.1);
    this.box(8.4, 0.03, 1.11, this.mats.metal, 0, 0.96, 1.1);

    for (let i = -3; i <= 3; i++) {
      this.box(0.95, 0.62, 0.05, this.mats.wood, i * 1.1, 0.4, 0.7);
      this.box(0.88, 0.04, 0.06, this.mats.metalDark, i * 1.1, 0.72, 0.68);
    }

    this.box(0.58, 0.4, 0.45, this.mats.metalDark, 2.7, 1.16, 0.95);
    this.box(0.5, 0.08, 0.12, this.mats.metal, 2.7, 1.38, 0.78);
    this.box(0.42, 0.14, 0.03, new THREE.MeshStandardMaterial({
      color: 0x33ff77, emissive: 0x22aa44, emissiveIntensity: 1.1,
    }), 2.7, 1.32, 0.7);
    for (let i = 0; i < 4; i++) {
      this.box(0.08, 0.04, 0.04, this.mats.metal, 2.5 + i * 0.12, 1.05, 0.72);
    }

    this.addPizza(-1.5, 0.98, 0.95);

    this.box(0.55, 0.03, 0.35, this.mats.wood, 0.3, 0.98, 0.95);
    this.box(0.28, 0.02, 0.04, this.mats.metal, 0.45, 1.01, 0.95);
    this.box(0.1, 0.025, 0.04, this.mats.woodDark, 0.25, 1.01, 0.95);

    this.box(0.12, 0.18, 0.12, this.mats.ceramic, -0.4, 1.07, 0.9);
    this.box(0.08, 0.14, 0.08, new THREE.MeshStandardMaterial({ color: 0xf5f0e8, roughness: 0.5 }), -0.65, 1.05, 0.9);
    this.box(0.08, 0.14, 0.08, new THREE.MeshStandardMaterial({ color: 0x2a1a12, roughness: 0.5 }), -0.8, 1.05, 0.9);

    this.box(0.28, 0.1, 0.22, this.mats.metalDark, -2.6, 1.01, 0.95);
    this.box(0.22, 0.08, 0.08, this.mats.metalDark, -2.6, 1.12, 0.95);
  }

  addPizza(x, y, z, parent = this.root, scale = 1) {
    const crust = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28 * scale, 0.28 * scale, 0.04 * scale, 32),
      new THREE.MeshStandardMaterial({ color: 0xc45a20, roughness: 0.75 })
    );
    crust.position.set(x, y, z);
    crust.castShadow = true;
    parent.add(crust);

    const sauce = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25 * scale, 0.25 * scale, 0.015 * scale, 32),
      new THREE.MeshStandardMaterial({ color: 0xa82818, roughness: 0.55 })
    );
    sauce.position.set(x, y + 0.022 * scale, z);
    parent.add(sauce);

    const cheese = new THREE.Mesh(
      new THREE.CylinderGeometry(0.235 * scale, 0.235 * scale, 0.018 * scale, 32),
      new THREE.MeshStandardMaterial({ color: 0xf0d060, roughness: 0.45, metalness: 0.05 })
    );
    cheese.position.set(x, y + 0.032 * scale, z);
    parent.add(cheese);

    const toppings = [
      [0xc0392b, 0.05], [0x2d6a3e, 0.04], [0x8b4513, 0.045], [0xc0392b, 0.05],
      [0xffffff, 0.035], [0x2d6a3e, 0.04], [0xc0392b, 0.048], [0x8b4513, 0.04],
    ];
    toppings.forEach((tp, i) => {
      const a = (i / toppings.length) * Math.PI * 2 + 0.3;
      const r = 0.08 + (i % 3) * 0.04;
      const t = new THREE.Mesh(
        new THREE.SphereGeometry(tp[1] * scale, 8, 8),
        new THREE.MeshStandardMaterial({ color: tp[0], roughness: 0.6 })
      );
      t.scale.y = 0.45;
      t.position.set(x + Math.cos(a) * r * scale, y + 0.045 * scale, z + Math.sin(a) * r * scale);
      parent.add(t);
    });

    for (let i = 0; i < 4; i++) {
      const slice = new THREE.Mesh(
        new THREE.BoxGeometry(0.48 * scale, 0.002, 0.012 * scale),
        new THREE.MeshBasicMaterial({ color: 0x5a3018, transparent: true, opacity: 0.35 })
      );
      slice.position.set(x, y + 0.042 * scale, z);
      slice.rotation.y = (i / 4) * Math.PI;
      parent.add(slice);
    }
  }

  buildFreezer() {
    this.freezerGroup = new THREE.Group();
    this.freezerGroup.position.set(-4.3, 0, 5.4);
    this.root.add(this.freezerGroup);

    const body = this.box(1.25, 2.1, 1.0, this.mats.metal, 0, 1.05, 0, this.freezerGroup);
    this.box(1.1, 1.9, 0.06, this.mats.metalDark, 0, 1.05, 0.22, this.freezerGroup);
    this.box(1.05, 1.75, 0.72, this.mats.ice, 0, 1.05, 0.02, this.freezerGroup);
    this.box(1.0, 0.04, 0.68, this.mats.metalDark, 0, 1.45, 0.02, this.freezerGroup);
    this.box(1.0, 0.04, 0.68, this.mats.metalDark, 0, 0.7, 0.02, this.freezerGroup);

    this.box(0.38, 0.22, 0.28, new THREE.MeshStandardMaterial({ color: 0x8899aa }), -0.25, 1.6, 0.02, this.freezerGroup);
    this.box(0.32, 0.16, 0.32, new THREE.MeshStandardMaterial({ color: 0x667788 }), 0.28, 0.85, 0.0, this.freezerGroup);
    this.box(0.25, 0.12, 0.2, new THREE.MeshStandardMaterial({ color: 0xaabbcc }), 0.15, 1.55, 0.1, this.freezerGroup);

    // Escarcha en estantes
    for (let i = 0; i < 12; i++) {
      const frost = new THREE.Mesh(
        new THREE.SphereGeometry(0.03 + Math.random() * 0.04, 6, 6),
        new THREE.MeshStandardMaterial({
          color: 0xd0e8f8, transparent: true, opacity: 0.45, roughness: 0.2, emissive: 0x88aacc, emissiveIntensity: 0.2,
        })
      );
      frost.position.set((Math.random() - 0.5) * 0.8, 0.55 + Math.random() * 1.2, 0.15 + Math.random() * 0.2);
      this.freezerGroup.add(frost);
    }

    this.freezerDoorPivot = new THREE.Group();
    this.freezerDoorPivot.position.set(-0.6, 1.05, 0.5);
    this.freezerGroup.add(this.freezerDoorPivot);

    this.freezerDoor = this.box(1.18, 2.0, 0.08, this.mats.metal, 0.6, 0, 0, this.freezerDoorPivot);
    this.box(0.72, 0.95, 0.03, this.mats.glass, 0.6, 0.15, 0.05, this.freezerDoorPivot, { cast: false });
    this.box(0.06, 0.4, 0.08, this.mats.metalDark, 1.08, 0, 0.08, this.freezerDoorPivot);
    this.box(0.08, 0.08, 0.1, this.mats.metal, 1.08, -0.25, 0.1, this.freezerDoorPivot);

    this.markInteractable(this.freezerDoor, "freezer");
    this.markInteractable(body, "freezer");

    this.makeLabel("CONGELADOR", -4.3, 2.3, 4.85, 0.15, 0xc8e0f0);

    // Niebla fría (partículas)
    const mistN = 40;
    const mistPos = new Float32Array(mistN * 3);
    for (let i = 0; i < mistN; i++) {
      mistPos[i * 3] = (Math.random() - 0.5) * 0.8;
      mistPos[i * 3 + 1] = 0.4 + Math.random() * 1.4;
      mistPos[i * 3 + 2] = 0.3 + Math.random() * 0.5;
    }
    const mistGeo = new THREE.BufferGeometry();
    mistGeo.setAttribute("position", new THREE.BufferAttribute(mistPos, 3));
    this.freezerMist = new THREE.Points(
      mistGeo,
      new THREE.PointsMaterial({ color: 0xb8d8f0, size: 0.08, transparent: true, opacity: 0, depthWrite: false })
    );
    this.freezerGroup.add(this.freezerMist);

    this.freezerLight = new THREE.PointLight(0x88ccff, 0, 3);
    this.freezerLight.position.set(0, 1.2, 0.3);
    this.freezerGroup.add(this.freezerLight);
  }

  buildOven() {
    this.ovenGroup = new THREE.Group();
    this.ovenGroup.position.set(4.1, 0, 5.3);
    this.root.add(this.ovenGroup);

    this.box(2.0, 1.2, 1.5, this.mats.oven, 0, 0.6, 0, this.ovenGroup);
    this.box(2.1, 0.14, 1.55, this.mats.metalDark, 0, 1.25, 0, this.ovenGroup);
    this.box(2.2, 0.4, 1.05, this.mats.metalDark, 0, 1.55, -0.1, this.ovenGroup);
    this.box(0.5, 0.8, 0.5, this.mats.metalDark, 0, 2.15, -0.15, this.ovenGroup);

    // Arco de ladrillo
    for (let i = 0; i < 11; i++) {
      const a = -Math.PI * 0.55 + (i / 10) * Math.PI * 1.1;
      const bx = Math.cos(a) * 0.58;
      const by = 0.65 + Math.sin(a) * 0.52;
      this.box(0.14, 0.12, 0.1, this.mats.brick, bx, by, -0.72, this.ovenGroup);
    }

    this.ovenMouth = new THREE.Mesh(
      new THREE.CircleGeometry(0.45, 32),
      new THREE.MeshStandardMaterial({
        color: 0xffaa44, emissive: 0xe85d04, emissiveIntensity: 2.6, side: THREE.DoubleSide,
      })
    );
    this.ovenMouth.position.set(0, 0.65, -0.74);
    this.ovenGroup.add(this.ovenMouth);

    const glow = new THREE.Mesh(
      new THREE.CircleGeometry(0.55, 32),
      new THREE.MeshBasicMaterial({ color: 0xff6622, transparent: true, opacity: 0.25, side: THREE.DoubleSide })
    );
    glow.position.set(0, 0.65, -0.73);
    this.ovenGroup.add(glow);
    this.ovenGlow = glow;

    // Leña dentro
    this.box(0.35, 0.06, 0.12, this.mats.woodDark, -0.1, 0.35, -0.5, this.ovenGroup);
    this.box(0.3, 0.05, 0.1, this.mats.woodDark, 0.12, 0.38, -0.48, this.ovenGroup);

    this.makeLabel("HORNO", 4.1, 1.95, 4.55, 0.16, 0xf4d35e);
  }

  buildBackDoor() {
    this.doorGroup = new THREE.Group();
    this.doorGroup.position.set(0, 0, -6.2);
    this.root.add(this.doorGroup);

    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x5a3a28, roughness: 0.9, side: THREE.DoubleSide, map: this.mats.wall.map,
    });
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, roughness: 0.85, map: this.mats.floor.map, bumpMap: this.mats.floor.bumpMap, bumpScale: 0.04,
    });

    const backFloor = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 7.5), floorMat);
    backFloor.rotation.x = -Math.PI / 2;
    backFloor.position.set(0, 0.01, 3.2);
    backFloor.receiveShadow = true;
    this.doorGroup.add(backFloor);

    this.box(0.2, 3.2, 7.2, wallMat, -2.5, 1.6, 3.2, this.doorGroup);
    this.box(0.2, 3.2, 7.2, wallMat, 2.5, 1.6, 3.2, this.doorGroup);
    this.box(5.2, 0.12, 7.2, this.mats.wall, 0, 3.15, 3.2, this.doorGroup, { cast: false });
    this.box(5.2, 3.2, 0.25, wallMat, 0, 1.6, -0.2, this.doorGroup);

    this.box(0.8, 0.9, 0.6, this.mats.woodDark, -1.8, 0.45, 5.5, this.doorGroup);
    this.box(0.7, 0.5, 0.5, this.mats.wood, -1.8, 1.15, 5.5, this.doorGroup);
    this.box(0.9, 1.1, 0.55, this.mats.metalDark, 1.85, 0.55, 4.2, this.doorGroup);
    this.box(1.2, 0.08, 0.4, this.mats.wood, -1.9, 2.0, 2.5, this.doorGroup);
    this.box(0.3, 0.25, 0.3, new THREE.MeshStandardMaterial({ color: 0xc4a882 }), -2.1, 2.2, 2.5, this.doorGroup);
    this.box(0.3, 0.25, 0.3, new THREE.MeshStandardMaterial({ color: 0xb89870 }), -1.7, 2.2, 2.5, this.doorGroup);
    this.box(0.55, 0.7, 0.45, this.mats.woodDark, 1.7, 0.35, 6.0, this.doorGroup);
    this.box(0.4, 0.35, 0.35, this.mats.wood, 1.7, 0.9, 6.0, this.doorGroup);

    for (const lz of [5.5, 3.0, 0.8]) {
      this.box(0.12, 0.18, 0.12, this.mats.metalDark, 0, 3.0, lz, this.doorGroup);
      const cord = this.box(0.02, 0.25, 0.02, this.mats.metalDark, 0, 3.12, lz, this.doorGroup, { cast: false });
      cord.position.y = 3.2;
      const b = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 12, 12),
        new THREE.MeshStandardMaterial({
          color: 0xffe0a0, emissive: 0xffcc66, emissiveIntensity: 1.6,
        })
      );
      b.position.set(0, 2.88, lz);
      this.doorGroup.add(b);
    }

    this.box(1.5, 0.14, 0.18, this.mats.wood, 0, 2.55, 0.05, this.doorGroup);
    this.box(0.14, 2.5, 0.18, this.mats.wood, -0.7, 1.25, 0.05, this.doorGroup);
    this.box(0.14, 2.5, 0.18, this.mats.wood, 0.7, 1.25, 0.05, this.doorGroup);

    this.doorPivot = new THREE.Group();
    this.doorPivot.position.set(-0.6, 1.25, 0.12);
    this.doorGroup.add(this.doorPivot);

    this.door = this.box(
      1.2, 2.35, 0.1,
      new THREE.MeshStandardMaterial({ color: 0x6a4030, roughness: 0.8, side: THREE.DoubleSide, map: this.mats.wood.map }),
      0.6, 0, 0, this.doorPivot
    );
    this.box(0.95, 0.8, 0.03, this.mats.woodDark, 0.6, 0.5, 0.07, this.doorPivot);
    this.box(0.95, 0.8, 0.03, this.mats.woodDark, 0.6, -0.5, 0.07, this.doorPivot);
    this.box(0.04, 2.2, 0.04, this.mats.metalDark, 0.6, 0, 0.08, this.doorPivot);

    this.doorKnob = this.box(0.09, 0.09, 0.12, new THREE.MeshStandardMaterial({
      color: 0xf4d35e, emissive: 0xaa8800, emissiveIntensity: 0.85, metalness: 0.7, roughness: 0.3,
    }), 1.05, 0, 0.12, this.doorPivot);

    this.doorBolt = this.box(0.22, 0.1, 0.08, this.mats.metal, 1.05, 0.28, 0.12, this.doorPivot);

    this.markInteractable(this.door, "door");
    this.markInteractable(this.doorKnob, "door");

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
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide })
      );
      mesh.position.set(0, y, z);
      this.doorGroup.add(mesh);
      return mesh;
    };
    this.doorLabel = mk("PUERTA TRASERA", 2.75, 0.25, 0.2, 0xffe0b0);
    this.doorStateLabel = mk("Click o [D]", 0.18, 0.25, 0.14, 0xf0d0a0);
  }

  buildTables() {
    this.tables = {};
    [
      { id: 1, x: -1.8, z: 8.5 },
      { id: 2, x: 0.4, z: 9.3 },
      { id: 6, x: -2.7, z: 6.1 },
    ].forEach((t) => {
      const g = new THREE.Group();
      g.position.set(t.x, 0, t.z);

      // Patas torneadas
      [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]].forEach(([lx, lz]) => {
        this.box(0.07, 0.76, 0.07, this.mats.woodDark, lx, 0.38, lz, g);
        this.box(0.1, 0.04, 0.1, this.mats.woodDark, lx, 0.04, lz, g);
      });
      const top = this.box(1.3, 0.07, 1.3, this.mats.wood, 0, 0.8, 0, g);
      this.box(1.15, 0.02, 1.15, this.mats.cloth, 0, 0.85, 0, g);

      // Silla
      this.box(0.48, 0.05, 0.48, this.mats.woodDark, 0, 0.48, 0.98, g);
      this.box(0.42, 0.55, 0.05, this.mats.woodDark, 0, 0.78, 1.2, g);
      [[-0.18, 0.78], [0.18, 0.78]].forEach(([lx, lz]) => {
        this.box(0.05, 0.45, 0.05, this.mats.woodDark, lx, 0.25, lz, g);
      });

      // Cubiertos / plato / vela
      this.box(0.22, 0.02, 0.22, this.mats.ceramic, 0, 0.88, 0, g);
      this.box(0.04, 0.01, 0.14, this.mats.metal, 0.28, 0.87, 0.05, g);
      this.box(0.03, 0.01, 0.12, this.mats.metal, -0.28, 0.87, 0.05, g);
      const glass = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.035, 0.12, 12),
        new THREE.MeshStandardMaterial({ color: 0xaad0e8, transparent: true, opacity: 0.4, roughness: 0.15, metalness: 0.1 })
      );
      glass.position.set(0.2, 0.94, -0.25);
      g.add(glass);

      const candle = this.box(0.035, 0.12, 0.035, this.mats.wax, -0.15, 0.94, -0.2, g);
      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.018, 0.05, 6),
        new THREE.MeshStandardMaterial({ color: 0xffaa44, emissive: 0xff6600, emissiveIntensity: 1.5 })
      );
      flame.position.set(-0.15, 1.04, -0.2);
      g.add(flame);
      candle.userData.flame = flame;

      const label = this.makeLabel(
        t.id === 6 ? "MESA 6" : `Mesa ${t.id}`,
        0, 0.12, 0.85, 0.13, t.id === 6 ? 0xff7755 : 0xaa8866
      );
      g.add(label);
      this.root.add(g);
      this.tables[t.id] = { group: g, top, ghost: null, flame };

      if (t.id === 6) {
        const ghost = new THREE.Mesh(
          new THREE.SphereGeometry(0.22, 16, 16),
          new THREE.MeshStandardMaterial({
            color: 0x660000, emissive: 0xaa0000, emissiveIntensity: 0.5, transparent: true, opacity: 0.3,
          })
        );
        ghost.position.set(0, 1.3, 0);
        g.add(ghost);
        // Cuerpo fantasmal
        const torso = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.18, 0.45, 12),
          new THREE.MeshStandardMaterial({
            color: 0x440000, emissive: 0x660000, emissiveIntensity: 0.3, transparent: true, opacity: 0.25,
          })
        );
        torso.position.set(0, 0.95, 0);
        g.add(torso);
        this.tables[6].ghost = ghost;
        this.tables[6].ghostBody = torso;
        this.markInteractable(top, "table6");
        this.markInteractable(ghost, "table6");
      }
    });
  }

  buildDecor() {
    // Lámpara de techo
    this.box(0.06, 0.55, 0.06, this.mats.metalDark, 0, 3.05, 5, this.root, { cast: false });
    const shade = new THREE.Mesh(
      new THREE.ConeGeometry(0.5, 0.4, 20, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x4a3020, side: THREE.DoubleSide, roughness: 0.75 })
    );
    shade.position.set(0, 2.8, 5);
    shade.castShadow = true;
    this.root.add(shade);
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xffe8b0, emissive: 0xffcc66, emissiveIntensity: 1.2 })
    );
    bulb.position.set(0, 2.7, 5);
    this.root.add(bulb);

    // Estante cajas de pizza
    this.box(2.0, 0.08, 0.55, this.mats.wood, 4.4, 2.2, 8);
    this.box(0.06, 0.7, 0.5, this.mats.woodDark, 3.45, 1.9, 8);
    this.box(0.06, 0.7, 0.5, this.mats.woodDark, 5.35, 1.9, 8);
    for (let i = 0; i < 5; i++) {
      this.box(0.38, 0.08, 0.38, new THREE.MeshStandardMaterial({ color: 0xd4b896, roughness: 0.85 }), 3.85 + i * 0.3, 2.3, 8);
      this.box(0.3, 0.02, 0.02, new THREE.MeshStandardMaterial({ color: 0xaa3030 }), 3.85 + i * 0.3, 2.35, 7.82);
    }

    // Planta marchita
    this.box(0.28, 0.32, 0.28, this.mats.ceramic, -4.5, 0.16, 9);
    this.box(0.04, 0.35, 0.04, new THREE.MeshStandardMaterial({ color: 0x3a2810 }), -4.5, 0.45, 9);
    for (let i = 0; i < 5; i++) {
      const leaf = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x2a3a18, roughness: 0.95 })
      );
      leaf.scale.set(1.2, 0.5, 0.8);
      const a = (i / 5) * Math.PI * 2;
      leaf.position.set(-4.5 + Math.cos(a) * 0.12, 0.55 + Math.random() * 0.1, 9 + Math.sin(a) * 0.12);
      this.root.add(leaf);
    }

    // Poster / cuadro
    this.box(0.9, 0.7, 0.04, this.mats.wood, 4.8, 2.3, 12.9);
    this.box(0.75, 0.55, 0.02, new THREE.MeshStandardMaterial({
      color: 0x2a1810, emissive: 0x441808, emissiveIntensity: 0.15,
    }), 4.8, 2.3, 12.93);

    // Reloj de pared
    const clock = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.05, 24),
      new THREE.MeshStandardMaterial({ color: 0xe8dcc8, roughness: 0.5 })
    );
    clock.rotation.x = Math.PI / 2;
    clock.position.set(-4.8, 2.4, 12.95);
    this.root.add(clock);
    this.box(0.02, 0.14, 0.02, this.mats.metalDark, -4.8, 2.45, 12.98);
    this.box(0.02, 0.1, 0.02, this.mats.metalDark, -4.75, 2.4, 12.98);

    // Alfombra cerca del mostrador
    this.box(3.5, 0.02, 1.2, new THREE.MeshStandardMaterial({ color: 0x4a2020, roughness: 0.95 }), 0, 0.015, 2.5, this.root, { cast: false });

    // Manchas / charcos sutiles
    for (const [x, z] of [[-3.2, 7.5], [2.5, 10.2], [1.2, 4.0]]) {
      const stain = new THREE.Mesh(
        new THREE.CircleGeometry(0.25 + Math.random() * 0.2, 12),
        new THREE.MeshBasicMaterial({ color: 0x1a0c08, transparent: true, opacity: 0.25 })
      );
      stain.rotation.x = -Math.PI / 2;
      stain.position.set(x, 0.012, z);
      this.root.add(stain);
    }
  }

  buildRain() {
    this.rain = [];
    const rainGeo = new THREE.BufferGeometry();
    const n = 220;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = -3.45 + Math.random() * 2.5;
      pos[i * 3 + 1] = 0.9 + Math.random() * 1.7;
      pos[i * 3 + 2] = 13.05 + Math.random() * 0.08;
      this.rain.push({ i, speed: 2.2 + Math.random() * 2.8 });
    }
    rainGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    this.rainPoints = new THREE.Points(
      rainGeo,
      new THREE.PointsMaterial({ color: 0xb0c8e8, size: 0.022, transparent: true, opacity: 0.55 })
    );
    this.root.add(this.rainPoints);
  }

  makeLabel(text, x, y, z, size = 0.2, color = 0x222222) {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 128;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, 512, 128);
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 4;
    ctx.fillStyle = `#${color.toString(16).padStart(6, "0")}`;
    ctx.font = "bold 56px Cinzel, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 256, 64);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({
      map: tex, transparent: true, side: THREE.DoubleSide, depthWrite: false,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size * 4.2, size), mat);
    mesh.position.set(x, y, z);
    this.root.add(mesh);
    return mesh;
  }

  setupLights() {
    this.ambient = new THREE.AmbientLight(0x6a4a38, 0.75);
    this.scene.add(this.ambient);

    this.hemi = new THREE.HemisphereLight(0xffe8c8, 0x1a1008, 0.55);
    this.scene.add(this.hemi);

    this.lamp = new THREE.PointLight(0xffd090, 5.2, 24);
    this.lamp.position.set(0, 2.7, 5);
    this.lamp.castShadow = true;
    this.lamp.shadow.mapSize.set(1024, 1024);
    this.lamp.shadow.bias = -0.002;
    this.lamp.shadow.camera.near = 0.3;
    this.lamp.shadow.camera.far = 18;
    this.scene.add(this.lamp);

    this.spotLamp = new THREE.SpotLight(0xffe0b0, 1.4, 14, Math.PI / 5, 0.45, 1);
    this.spotLamp.position.set(0, 3.1, 5);
    this.spotLamp.target.position.set(0, 0, 7);
    this.scene.add(this.spotLamp);
    this.scene.add(this.spotLamp.target);

    this.ovenLight = new THREE.PointLight(0xe85d04, 5.5, 16);
    this.ovenLight.position.set(4.1, 0.7, 4.5);
    this.scene.add(this.ovenLight);

    this.fill = new THREE.PointLight(0xdd9977, 2.2, 18);
    this.fill.position.set(-3, 2.2, 8);
    this.scene.add(this.fill);

    this.counterLight = new THREE.PointLight(0xfff0d0, 3.6, 12);
    this.counterLight.position.set(0, 2.3, 1.5);
    this.scene.add(this.counterLight);

    this.customerLight = new THREE.PointLight(0xffe8c8, 0, 6);
    this.customerLight.position.set(0, 2.0, 2.3);
    this.scene.add(this.customerLight);

    this.backLight = new THREE.PointLight(0xffe0b0, 4.2, 16);
    this.backLight.position.set(0, 2.4, -4.5);
    this.scene.add(this.backLight);

    this.backLight2 = new THREE.PointLight(0xffd8a0, 2.5, 10);
    this.backLight2.position.set(0, 2.2, -2.0);
    this.scene.add(this.backLight2);
  }

  setupCustomer() {
    this.customerGroup = new THREE.Group();
    this.customerGroup.visible = false;
    this.customerGroup.position.set(0, 0, 2.2);

    const cloth = new THREE.MeshStandardMaterial({ color: 0x5a4038, roughness: 0.85 });
    const skin = new THREE.MeshStandardMaterial({ color: 0xd4a888, roughness: 0.55 });
    const hair = new THREE.MeshStandardMaterial({ color: 0x2a1a12, roughness: 0.9 });

    this.customerBody = this.box(0.62, 1.05, 0.4, cloth, 0, 0.95, 0, this.customerGroup);
    this.box(0.78, 0.3, 0.38, cloth, 0, 1.42, 0, this.customerGroup);
    // Brazos
    this.box(0.14, 0.55, 0.14, cloth, -0.42, 1.05, 0.05, this.customerGroup);
    this.box(0.14, 0.55, 0.14, cloth, 0.42, 1.05, 0.05, this.customerGroup);
    this.box(0.12, 0.12, 0.12, skin, -0.42, 0.72, 0.08, this.customerGroup);
    this.box(0.12, 0.12, 0.12, skin, 0.42, 0.72, 0.08, this.customerGroup);

    this.customerHead = new THREE.Mesh(new THREE.SphereGeometry(0.26, 20, 20), skin);
    this.customerHead.position.set(0, 1.72, 0);
    this.customerHead.castShadow = true;
    this.customerGroup.add(this.customerHead);

    const hairMesh = new THREE.Mesh(new THREE.SphereGeometry(0.27, 16, 16), hair);
    hairMesh.scale.set(1.05, 0.7, 1.05);
    hairMesh.position.set(0, 1.82, -0.02);
    this.customerGroup.add(hairMesh);

    this.eyeL = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0x1a1010 })
    );
    this.eyeR = this.eyeL.clone();
    this.eyeL.position.set(-0.08, 1.75, 0.22);
    this.eyeR.position.set(0.08, 1.75, 0.22);
    this.customerGroup.add(this.eyeL, this.eyeR);

    // Brillo de ojos
    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    const hr = hl.clone();
    hl.position.set(-0.07, 1.76, 0.255);
    hr.position.set(0.09, 1.76, 0.255);
    this.customerGroup.add(hl, hr);

    this.box(0.05, 0.06, 0.05, skin, 0, 1.68, 0.24, this.customerGroup);
    this.customerMouth = this.box(
      0.12, 0.03, 0.02,
      new THREE.MeshStandardMaterial({ color: 0x8a4050 }),
      0, 1.58, 0.23, this.customerGroup
    );

    this.customerShadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.5, 22),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4 })
    );
    this.customerShadow.rotation.x = -Math.PI / 2;
    this.customerShadow.position.y = 0.02;
    this.customerGroup.add(this.customerShadow);

    this.teethGroup = new THREE.Group();
    this.teethGroup.visible = false;
    for (let i = 0; i < 12; i++) {
      this.box(0.025, 0.08, 0.02, new THREE.MeshStandardMaterial({ color: 0xfff5e6 }), -0.14 + i * 0.025, 1.56, 0.24, this.teethGroup);
    }
    this.customerGroup.add(this.teethGroup);
    this.root.add(this.customerGroup);
  }

  setupJumpscare() {
    this.jumpGroup = new THREE.Group();
    this.jumpGroup.visible = false;
    const face = new THREE.Mesh(
      new THREE.SphereGeometry(0.7, 20, 20),
      new THREE.MeshStandardMaterial({ color: 0x1a0000, emissive: 0x330000, emissiveIntensity: 0.5 })
    );
    this.jumpGroup.add(face);
    const el = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
    const er = el.clone();
    el.position.set(-0.22, 0.15, 0.55);
    er.position.set(0.22, 0.15, 0.55);
    this.jumpGroup.add(el, er);
    for (let i = 0; i < 14; i++) {
      this.box(0.06, 0.35 + Math.random() * 0.2, 0.05, new THREE.MeshBasicMaterial({ color: 0xfff0e0 }), -0.4 + i * 0.06, -0.35, 0.55, this.jumpGroup);
    }
    this.jumpGroup.position.set(0, 1.4, -1.2);
    this.scene.add(this.jumpGroup);
  }

  setupDust() {
    const n = 140;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = Math.random() * 2.8;
      pos[i * 3 + 2] = Math.random() * 12;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    this.dust = new THREE.Points(
      geo,
      new THREE.PointsMaterial({ color: 0xffe0b0, size: 0.02, transparent: true, opacity: 0.28 })
    );
    this.root.add(this.dust);
  }

  setupEmbers() {
    const n = 50;
    const pos = new Float32Array(n * 3);
    this.emberData = [];
    for (let i = 0; i < n; i++) {
      pos[i * 3] = 4.1 + (Math.random() - 0.5) * 0.5;
      pos[i * 3 + 1] = 0.5 + Math.random() * 0.8;
      pos[i * 3 + 2] = 4.6 + Math.random() * 0.4;
      this.emberData.push({
        i,
        speed: 0.3 + Math.random() * 0.6,
        wobble: Math.random() * Math.PI * 2,
      });
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    this.embers = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        color: 0xff6622, size: 0.035, transparent: true, opacity: 0.75, depthWrite: false,
      })
    );
    this.root.add(this.embers);
  }

  setCustomer(c) {
    this.customer = c;
    if (!c) {
      this.customerGroup.visible = false;
      if (this.customerLight) this.customerLight.intensity = 0;
      return;
    }
    this.customerGroup.visible = true;
    if (this.customerLight) this.customerLight.intensity = 3.2;
    const traits = c.traits || {};
    this.customerShadow.visible = traits.shadow !== false;
    if (traits.redEyes) {
      const m = new THREE.MeshStandardMaterial({ color: 0xff1111, emissive: 0xff0000, emissiveIntensity: 1.5 });
      this.eyeL.material = m;
      this.eyeR.material = m;
    } else {
      const m = new THREE.MeshStandardMaterial({ color: 0x1a1010 });
      this.eyeL.material = m;
      this.eyeR.material = m;
    }
    this.teethGroup.visible = !!traits.tooManyTeeth;
    if (this.customerMouth) this.customerMouth.visible = !traits.tooManyTeeth;
  }

  setLookingBehind(v) {
    this.lookingBehind = !!v;
    this.targetBaseYaw = this.lookingBehind ? Math.PI : 0;
    this.pointerX = 0.5;
    this.pointerY = 0.5;
    this.targetYaw = 0;
    this.targetPitch = 0;
    this.yaw = 0;
    this.pitch = 0;
  }

  toggleLookingBehind() {
    this.setLookingBehind(!this.lookingBehind);
    return this.lookingBehind;
  }

  setFreezerOpen(open) {
    this.freezerOpen = !!open;
  }

  setPointer(clientX, clientY, enabled) {
    this.lookEnabled = enabled;
    this.pointerX = clientX / this.w;
    this.pointerY = clientY / this.h;

    const maxYaw = this.lookingBehind ? 0.4 : 0.55;
    const maxPitch = 0.28;
    this.targetYaw = (this.pointerX - 0.5) * 2 * maxYaw;
    this.targetPitch = (0.5 - this.pointerY) * 2 * maxPitch;

    this.pick(clientX, clientY);
  }

  pick(clientX, clientY) {
    this.ndc.x = (clientX / this.w) * 2 - 1;
    this.ndc.y = -(clientY / this.h) * 2 + 1;
    this.raycaster.setFromCamera(this.ndc, this.camera);
    const hits = this.raycaster.intersectObjects(this.interactables, false);
    if (hits.length) {
      this.hoverTarget = hits[0].object.userData.interactId || null;
    } else {
      this.hoverTarget = null;
    }
    this.hoverTable6 = this.hoverTarget === "table6";
    this.lookingTable6 = this.hoverTable6 && !this.lookingBehind;
  }

  getHoverTarget() {
    return this.hoverTarget;
  }

  isOverTable6() {
    return this.hoverTable6 && !this.lookingBehind;
  }

  table6Hitbox() {
    if (!this.tables[6]) return { x: 0, y: 0, w: 0, h: 0 };
    const p = this.tables[6].group.position.clone();
    p.y = 1.1;
    p.project(this.camera);
    const sx = (p.x * 0.5 + 0.5) * this.w;
    const sy = (-p.y * 0.5 + 0.5) * this.h;
    const r = 70;
    return { x: sx - r, y: sy - r, w: r * 2, h: r * 2.2 };
  }

  triggerJumpscare() {
    this.jumpscare = 1.2;
    this.jumpGroup.visible = true;
  }

  update(dt, state) {
    this.t += dt;
    this.flicker = state.flickerIntensity || 0;
    this.doorLocked = state.doorLocked;
    this.freezerKnock = state.freezerKnock;
    this.freezerOpen = state.freezerOpen ?? this.freezerOpen;

    if (state.lookingTable6) this.table6Stare += dt;
    else this.table6Stare = Math.max(0, this.table6Stare - dt * 2);

    this.baseYaw += (this.targetBaseYaw - this.baseYaw) * Math.min(1, dt * 5);
    if (this.lookEnabled) {
      this.yaw += (this.targetYaw - this.yaw) * Math.min(1, dt * 8);
      this.pitch += (this.targetPitch - this.pitch) * Math.min(1, dt * 8);
    } else {
      this.yaw += (0 - this.yaw) * Math.min(1, dt * 3);
      this.pitch += (0 - this.pitch) * Math.min(1, dt * 3);
    }

    const breath = Math.sin(this.t * 1.2) * 0.01;
    const camZ = this.lookingBehind ? 0.55 : 0.15;
    this.camera.position.set(0, 1.62 + breath, camZ);
    this.camera.rotation.order = "YXZ";
    this.camera.rotation.y = this.baseYaw - this.yaw;
    this.camera.rotation.x = this.pitch;

    const freezerTarget = this.freezerOpen ? -1.9 : 0;
    this.freezerDoorAngle += (freezerTarget - this.freezerDoorAngle) * Math.min(1, dt * 4);
    if (this.freezerDoorPivot) this.freezerDoorPivot.rotation.y = this.freezerDoorAngle;

    const doorTarget = this.doorLocked ? 0 : 1.7;
    this.doorAngle += (doorTarget - this.doorAngle) * Math.min(1, dt * 3.5);
    if (this.doorPivot) this.doorPivot.rotation.y = this.doorAngle;

    const flickerMul = 1 - this.flicker * (0.55 + 0.45 * Math.sin(this.t * 40));
    this.lamp.intensity = 5.2 * flickerMul;
    this.ambient.intensity = 0.75 * flickerMul;
    if (this.hemi) this.hemi.intensity = 0.55 * flickerMul;
    if (this.counterLight) this.counterLight.intensity = 3.6 * flickerMul;
    if (this.backLight) this.backLight.intensity = 4.2 * flickerMul;
    if (this.spotLamp) this.spotLamp.intensity = 1.4 * flickerMul;
    if (this.customerLight && this.customerGroup.visible) {
      this.customerLight.intensity = 3.2 * flickerMul;
    }
    const ovenPulse = 3.2 + Math.sin(this.t * 7) * 0.5 + Math.random() * 0.2;
    this.ovenLight.intensity = ovenPulse * flickerMul;
    this.ovenMouth.material.emissiveIntensity = (2.0 + Math.sin(this.t * 8) * 0.5) * flickerMul;
    if (this.ovenGlow) this.ovenGlow.material.opacity = 0.18 + Math.sin(this.t * 6) * 0.08;
    const neonA = 0.7 + Math.sin(this.t * 17) * 0.15 + (Math.random() > 0.97 ? -0.5 : 0);
    if (this.neonLight) this.neonLight.intensity = Math.max(0.15, neonA) * 1.5 * flickerMul;

    // Niebla del congelador
    if (this.freezerMist) {
      const openAmt = Math.min(1, Math.abs(this.freezerDoorAngle) / 1.5);
      this.freezerMist.material.opacity = openAmt * 0.45;
      if (this.freezerLight) this.freezerLight.intensity = openAmt * 1.8;
      const mp = this.freezerMist.geometry.attributes.position;
      for (let i = 0; i < mp.count; i++) {
        let z = mp.getZ(i) + openAmt * 0.35 * dt;
        let y = mp.getY(i) + 0.15 * dt;
        if (z > 1.2 || y > 2.0) {
          z = 0.3 + Math.random() * 0.2;
          y = 0.5 + Math.random() * 0.8;
        }
        mp.setZ(i, z);
        mp.setY(i, y);
      }
      mp.needsUpdate = true;
    }

    if (this.freezerKnock && this.freezerGroup) {
      this.freezerGroup.position.x = -4.3 + Math.sin(this.t * 40) * 0.035;
    } else if (this.freezerGroup) {
      this.freezerGroup.position.x = -4.3;
    }

    if (this.doorKnob) {
      this.doorKnob.material.color.setHex(this.doorLocked ? 0xf4d35e : 0xc83c28);
      this.doorKnob.material.emissive.setHex(this.doorLocked ? 0xaa8800 : 0x661100);
    }
    if (this.doorBolt) this.doorBolt.visible = this.doorLocked;

    // Velas parpadean
    Object.values(this.tables).forEach((t) => {
      if (t.flame) {
        t.flame.material.emissiveIntensity = 1.2 + Math.sin(this.t * 12 + t.group.position.x) * 0.5;
        t.flame.scale.y = 0.85 + Math.sin(this.t * 15) * 0.2;
      }
    });

    if (this.tables[6]?.ghost) {
      const lookBoost = Math.min(1, this.table6Stare / 3);
      const g = this.tables[6].ghost;
      g.material.opacity = 0.25 + lookBoost * 0.55 + Math.sin(this.t * 3) * 0.08;
      g.material.emissiveIntensity = 0.3 + lookBoost * 1.2;
      g.scale.setScalar(1 + lookBoost * 0.5);
      if (this.tables[6].ghostBody) {
        this.tables[6].ghostBody.material.opacity = 0.15 + lookBoost * 0.4;
      }
    }

    if (this.customer?.traits?.redEyes) {
      const pulse = 1.2 + Math.sin(this.t * 6) * 0.6;
      this.eyeL.material.emissiveIntensity = pulse;
      this.eyeR.material.emissiveIntensity = pulse;
    }

    if (this.rainPoints) {
      const pos = this.rainPoints.geometry.attributes.position;
      for (const r of this.rain) {
        let y = pos.getY(r.i) - r.speed * dt;
        if (y < 0.9) y = 2.5;
        pos.setY(r.i, y);
      }
      pos.needsUpdate = true;
    }

    const dpos = this.dust.geometry.attributes.position;
    for (let i = 0; i < dpos.count; i++) {
      let y = dpos.getY(i) + 0.05 * dt;
      if (y > 2.9) y = 0.1;
      dpos.setY(i, y);
      dpos.setX(i, dpos.getX(i) + Math.sin(this.t + i) * 0.002);
    }
    dpos.needsUpdate = true;

    if (this.embers) {
      const ep = this.embers.geometry.attributes.position;
      for (const e of this.emberData) {
        let y = ep.getY(e.i) + e.speed * dt;
        let x = 4.1 + Math.sin(this.t * 2 + e.wobble) * 0.2;
        if (y > 1.8) {
          y = 0.45;
          x = 4.1 + (Math.random() - 0.5) * 0.4;
        }
        ep.setY(e.i, y);
        ep.setX(e.i, x);
      }
      ep.needsUpdate = true;
    }

    if (this.jumpscare > 0) {
      this.jumpscare -= dt;
      this.jumpGroup.visible = true;
      const z = this.lookingBehind ? 1.1 : -(1.0 + (1.2 - this.jumpscare) * 0.3);
      this.jumpGroup.position.set(Math.sin(this.t * 50) * 0.08, 1.4, z);
      this.jumpGroup.scale.setScalar(1.2 + (1.2 - this.jumpscare));
      if (this.jumpscare <= 0) this.jumpGroup.visible = false;
    }

    if (this.lookEnabled && this.hoverTarget) {
      this.canvas.style.cursor = "pointer";
    } else {
      this.canvas.style.cursor = this.lookEnabled ? "crosshair" : "default";
    }
  }

  draw(state) {
    const hour = state?.hourDecimal ?? 23;
    this.scene.fog.density = hour >= 0 && hour < 5 ? 0.014 : 0.008;
    this.renderer.render(this.scene, this.camera);
  }
}
