/**
 * Escena 3D del menú — exterior Bella Luna de noche.
 * Independiente del Renderer de gameplay. Sin sombras dinámicas.
 */
import * as THREE from "three";
import { texCanvas } from "../render/texUtils.js";

const VERSION = "v0.9.0 · turno nocturno";

export class MenuScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.active = false;
    this.t = 0;
    this.pointerX = 0.5;
    this.pointerY = 0.5;
    this.entering = false;
    this._enterAnim = null;
    this._box = new THREE.BoxGeometry(1, 1, 1);
    this._camFovBase = 46;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: "high-performance",
      alpha: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.38;
    this.renderer.shadowMap.enabled = false;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x121c28);
    this.scene.fog = new THREE.FogExp2(0x0c1420, 0.008);

    this.camera = new THREE.PerspectiveCamera(46, 1, 0.1, 120);
    // Desktop: UI izq. / local a la derecha. Móvil: se recentra en _syncMenuFraming()
    this._camBase = new THREE.Vector3(-6.2, 2.55, 11.4);
    this._lookBase = new THREE.Vector3(6, 1.85, -0.5);
    this._look = this._lookBase.clone();

    this.root = new THREE.Group();
    this.scene.add(this.root);

    this._buildTextures();
    this._buildLights();
    this._buildGround();
    this._buildSky();
    this._buildMountains();
    this._buildBuilding();
    this._buildNeon();
    this._buildAwning();
    this._buildInteriorGlow();
    this._buildProps();
    this._buildPines();
    this._buildFogWisps();

    this.root.rotation.y = -0.5;
    this._syncMenuFraming();
    this.camera.position.copy(this._camBase);
    this.camera.lookAt(this._look);

    this._onMove = (e) => {
      this.pointerX = e.clientX / window.innerWidth;
      this.pointerY = e.clientY / window.innerHeight;
    };
    this._onResize = () => this.resize();
    window.addEventListener("pointermove", this._onMove, { passive: true });
    window.addEventListener("resize", this._onResize);
    this.resize();
  }

  box(w, h, d, mat, x, y, z, parent = this.root) {
    const m = new THREE.Mesh(this._box, mat);
    m.scale.set(w, h, d);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  }

  _buildTextures() {
    this.tex = {};
    this.tex.brick = texCanvas((ctx, w, h) => {
      ctx.fillStyle = "#4a2c20";
      ctx.fillRect(0, 0, w, h);
      const bw = 32;
      const bh = 14;
      for (let y = 0; y < h; y += bh) {
        const off = (Math.floor(y / bh) % 2) * (bw / 2);
        for (let x = -bw; x < w + bw; x += bw) {
          const shade = 72 + Math.random() * 48;
          ctx.fillStyle = `rgb(${shade + 38},${shade + 8},${shade - 12})`;
          ctx.fillRect(x + off + 1, y + 1, bw - 2, bh - 2);
          ctx.fillStyle = "rgba(255,200,150,0.08)";
          ctx.fillRect(x + off + 2, y + 2, bw - 5, 3);
        }
      }
    }, 256, 256);
    this.tex.brick.repeat.set(6, 3);

    this.tex.asphalt = texCanvas((ctx, w, h) => {
      ctx.fillStyle = "#121418";
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 800; i++) {
        const v = 18 + Math.random() * 22;
        ctx.fillStyle = `rgba(${v},${v},${v + 4},${0.3 + Math.random() * 0.4})`;
        ctx.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1);
      }
      // reflejos húmedos
      for (let i = 0; i < 40; i++) {
        ctx.fillStyle = `rgba(80,60,40,${0.04 + Math.random() * 0.06})`;
        ctx.fillRect(Math.random() * w, Math.random() * h, 20 + Math.random() * 60, 2);
      }
    }, 256, 256);
    this.tex.asphalt.repeat.set(8, 8);

    // Estacionamiento frente al local: cajones pintados sobre asfalto
    this.tex.street = texCanvas((ctx, w, h) => {
      ctx.fillStyle = "#15171c";
      ctx.fillRect(0, 0, w, h);

      // grano de asfalto
      for (let i = 0; i < 2600; i++) {
        const v = 16 + Math.random() * 28;
        ctx.fillStyle = `rgba(${v},${v + 1},${v + 4},${0.25 + Math.random() * 0.45})`;
        ctx.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2.5, 1);
      }

      // grietas / desgaste
      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 14; i++) {
        ctx.beginPath();
        let x = Math.random() * w;
        let y = Math.random() * h;
        ctx.moveTo(x, y);
        for (let s = 0; s < 5; s++) {
          x += (Math.random() - 0.5) * 36;
          y += 6 + Math.random() * 18;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // manchas de aceite / humedad neutras
      for (let i = 0; i < 16; i++) {
        const x = Math.random() * w;
        const y = 60 + Math.random() * (h - 100);
        const rw = 18 + Math.random() * 50;
        const g = ctx.createRadialGradient(x, y, 0, x, y, rw);
        g.addColorStop(0, `rgba(10,10,12,${0.18 + Math.random() * 0.15})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(x, y, rw, rw * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
      }

    // —— Una sola fila de cajones apuntando al local (arriba = fachada) ——
      const curbY = 36;
      const stallTop = curbY + 12;
      const stallLen = h * 0.62;
      const stallBottom = stallTop + stallLen;
      const stalls = 7;
      const marginX = 40;
      const usable = w - marginX * 2;
      const stallW = usable / stalls;

      // borde de acera
      ctx.fillStyle = "#2c2e34";
      ctx.fillRect(0, 0, w, curbY);
      ctx.fillStyle = "rgba(220,220,220,0.12)";
      ctx.fillRect(0, curbY - 2, w, 2);

      ctx.strokeStyle = "rgba(230,225,200,0.8)";
      ctx.lineWidth = 5;
      ctx.lineCap = "butt";

      // línea frontal continua (tope hacia el restaurante)
      ctx.beginPath();
      ctx.moveTo(marginX, stallTop);
      ctx.lineTo(w - marginX, stallTop);
      ctx.stroke();

      // divisores de cada cajón
      for (let i = 0; i <= stalls; i++) {
        const x = marginX + i * stallW;
        ctx.beginPath();
        ctx.moveTo(x, stallTop);
        ctx.lineTo(x, stallBottom);
        ctx.stroke();
      }

      // línea trasera de la fila
      ctx.beginPath();
      ctx.moveTo(marginX, stallBottom);
      ctx.lineTo(w - marginX, stallBottom);
      ctx.stroke();

      // topes de rueda
      ctx.fillStyle = "#3a2a22";
      for (let i = 0; i < stalls; i++) {
        const cx = marginX + (i + 0.5) * stallW;
        ctx.fillRect(cx - stallW * 0.28, stallTop + 16, stallW * 0.56, 12);
      }

      // cajón discapacitados (segundo)
      {
        const i = 1;
        const cx = marginX + (i + 0.5) * stallW;
        const cy = stallTop + stallLen * 0.48;
        ctx.fillStyle = "rgba(70,120,220,0.35)";
        ctx.fillRect(marginX + i * stallW + 6, stallTop + 6, stallW - 12, stallLen - 12);
        ctx.strokeStyle = "rgba(240,240,255,0.85)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy + 8, 18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy - 12, 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - 2, cy - 4);
        ctx.lineTo(cx - 2, cy + 12);
        ctx.lineTo(cx + 16, cy + 12);
        ctx.stroke();
      }

      // asfalto libre detrás de los cajones (sin segunda fila)
      ctx.fillStyle = "rgba(18,20,26,0.35)";
      ctx.fillRect(0, stallBottom + 4, w, h - stallBottom - 4);
    }, 1024, 1024);
    this.tex.street.wrapS = this.tex.street.wrapT = THREE.ClampToEdgeWrapping;
    this.tex.street.repeat.set(1, 1);

    // Cristal: interior cálido + reflejo naranja en la superficie
    this.tex.glass = texCanvas((ctx, w, h) => {
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, "#3a2010");
      bg.addColorStop(0.45, "#6a3818");
      bg.addColorStop(1, "#2a160c");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // resplandor interior
      const glow = ctx.createRadialGradient(w * 0.5, h * 0.55, 4, w * 0.5, h * 0.5, w * 0.7);
      glow.addColorStop(0, "rgba(255,160,60,0.75)");
      glow.addColorStop(0.45, "rgba(255,100,30,0.35)");
      glow.addColorStop(1, "rgba(40,16,8,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // siluetas suaves de mesas / lámparas
      ctx.fillStyle = "rgba(20,10,6,0.35)";
      ctx.fillRect(w * 0.15, h * 0.62, w * 0.22, h * 0.12);
      ctx.fillRect(w * 0.62, h * 0.58, w * 0.2, h * 0.14);
      ctx.fillStyle = "rgba(255,180,80,0.55)";
      ctx.beginPath();
      ctx.arc(w * 0.28, h * 0.28, 6, 0, Math.PI * 2);
      ctx.arc(w * 0.72, h * 0.3, 5, 0, Math.PI * 2);
      ctx.fill();

      // reflejos naranjas en el vidrio (bandas diagonales)
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 5; i++) {
        const x = w * (0.08 + i * 0.18);
        const g2 = ctx.createLinearGradient(x, 0, x + 28, h);
        g2.addColorStop(0, "rgba(255,170,80,0)");
        g2.addColorStop(0.35, `rgba(255,140,50,${0.22 + i * 0.04})`);
        g2.addColorStop(0.7, "rgba(255,90,20,0.12)");
        g2.addColorStop(1, "rgba(255,120,40,0)");
        ctx.fillStyle = g2;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 22, 0);
        ctx.lineTo(x + 48, h);
        ctx.lineTo(x + 18, h);
        ctx.closePath();
        ctx.fill();
      }
      // brillo especular superior
      ctx.fillStyle = "rgba(255,210,160,0.28)";
      ctx.fillRect(0, 0, w, h * 0.08);
      ctx.restore();
    }, 256, 256);
    this.tex.glass.wrapS = this.tex.glass.wrapT = THREE.ClampToEdgeWrapping;

    this.tex.neonSign = texCanvas((ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#12080a";
      ctx.fillRect(0, 0, w, h);
      // pizza slice
      ctx.fillStyle = "#ffd866";
      ctx.shadowColor = "#ffaa22";
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.moveTo(36, 30);
      ctx.lineTo(90, 110);
      ctx.lineTo(20, 110);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#ff5522";
      [[40, 55], [55, 75], [38, 85]].forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
      });
      // Bella Luna
      ctx.fillStyle = "#fff0a0";
      ctx.font = "bold 42px Georgia, serif";
      ctx.textAlign = "left";
      ctx.shadowColor = "#ffcc44";
      ctx.shadowBlur = 22;
      ctx.fillText("Bella Luna", 105, 70);
      ctx.shadowBlur = 10;
      ctx.fillText("Bella Luna", 105, 70);
      // PIZZA
      ctx.fillStyle = "#ff4444";
      ctx.shadowColor = "#ff1100";
      ctx.shadowBlur = 26;
      ctx.font = "bold 48px Impact, sans-serif";
      ctx.fillText("PIZZA", 105, 125);
      ctx.shadowBlur = 12;
      ctx.fillText("PIZZA", 105, 125);
      // stars
      ctx.shadowBlur = 14;
      ctx.fillStyle = "#ffe888";
      [[95, 35], [280, 40], [300, 90]].forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      });
    }, 512, 160);

    this.tex.moon = texCanvas((ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      // Halo
      const halo = ctx.createRadialGradient(w * 0.5, h * 0.5, w * 0.16, w * 0.5, h * 0.5, w * 0.48);
      halo.addColorStop(0, "rgba(255,255,255,0.35)");
      halo.addColorStop(0.55, "rgba(210,225,255,0.12)");
      halo.addColorStop(1, "rgba(180,200,255,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.5, w * 0.48, 0, Math.PI * 2);
      ctx.fill();
      // Disco blanco nítido
      ctx.shadowColor = "#ffffff";
      ctx.shadowBlur = 28;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.5, w * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      const g = ctx.createRadialGradient(w * 0.44, h * 0.42, 2, w * 0.5, h * 0.5, w * 0.22);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.7, "#f4f7ff");
      g.addColorStop(1, "#dce6f8");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.5, w * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(160,175,200,0.22)";
      [[0.42, 0.42, 0.03], [0.56, 0.5, 0.022], [0.48, 0.58, 0.026]].forEach(([x, y, r]) => {
        ctx.beginPath();
        ctx.arc(w * x, h * y, w * r, 0, Math.PI * 2);
        ctx.fill();
      });
    }, 256, 256);

    // Luna creciente del letrero (neón)
    this.tex.crescent = texCanvas((ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#ffb030";
      ctx.shadowColor = "#ff7700";
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(w * 0.48, h * 0.5, w * 0.36, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "destination-out";
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(w * 0.66, h * 0.42, w * 0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
      // ojos / sonrisa sutiles
      ctx.fillStyle = "rgba(80,30,10,0.35)";
      ctx.beginPath();
      ctx.arc(w * 0.34, h * 0.42, 4, 0, Math.PI * 2);
      ctx.arc(w * 0.42, h * 0.38, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(80,30,10,0.4)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(w * 0.36, h * 0.55, 10, 0.15, Math.PI - 0.15);
      ctx.stroke();
    }, 256, 256);

    this.mats = {
      brick: new THREE.MeshStandardMaterial({
        map: this.tex.brick,
        color: 0xffe8d8,
        roughness: 0.88,
        metalness: 0.02,
        emissive: 0x3a1810,
        emissiveIntensity: 0.22,
      }),
      asphalt: new THREE.MeshStandardMaterial({
        map: this.tex.asphalt, color: 0xffffff, roughness: 0.35, metalness: 0.15,
      }),
      street: new THREE.MeshStandardMaterial({
        map: this.tex.street,
        color: 0xffffff,
        roughness: 0.72,
        metalness: 0.08,
      }),
      roof: new THREE.MeshStandardMaterial({ color: 0x1a1210, roughness: 0.9 }),
      trim: new THREE.MeshStandardMaterial({ color: 0x3a241c, roughness: 0.85 }),
      awningRed: new THREE.MeshStandardMaterial({ color: 0x8b1a1a, roughness: 0.8 }),
      awningWhite: new THREE.MeshStandardMaterial({ color: 0xe8dcc8, roughness: 0.75 }),
      glass: new THREE.MeshStandardMaterial({
        map: this.tex.glass,
        color: 0xffffff,
        emissive: 0xff7018,
        emissiveMap: this.tex.glass,
        emissiveIntensity: 1.85,
        transparent: true,
        opacity: 0.98,
        roughness: 0.08,
        metalness: 0.55,
      }),
      glassGlow: new THREE.MeshBasicMaterial({
        color: 0xff8028,
        transparent: true,
        opacity: 0.58,
        depthWrite: false,
      }),
      glassReflect: new THREE.MeshBasicMaterial({
        color: 0xff9a40,
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
      wood: new THREE.MeshStandardMaterial({ color: 0x4a3020, roughness: 0.85 }),
      metal: new THREE.MeshStandardMaterial({ color: 0x3a4248, roughness: 0.4, metalness: 0.7 }),
      neonBoard: new THREE.MeshBasicMaterial({ map: this.tex.neonSign }),
      crescent: new THREE.MeshBasicMaterial({
        map: this.tex.crescent, transparent: true, depthWrite: false,
      }),
      moon: new THREE.MeshBasicMaterial({
        map: this.tex.moon,
        transparent: true,
        depthTest: true,
        depthWrite: false,
        fog: false,
        toneMapped: false,
      }),
      foliage: new THREE.MeshStandardMaterial({ color: 0x0e1810, roughness: 1 }),
      car: new THREE.MeshStandardMaterial({ color: 0x5a1010, roughness: 0.45, metalness: 0.3 }),
      wet: new THREE.MeshStandardMaterial({
        color: 0x1a1c22, roughness: 0.18, metalness: 0.55,
        transparent: true, opacity: 0.45,
      }),
      puddleGlow: new THREE.MeshBasicMaterial({
        color: 0xff7818,
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
      sidewalk: new THREE.MeshStandardMaterial({
        color: 0x3a3836, roughness: 0.92, metalness: 0.05,
      }),
    };
  }

  _buildLights() {
    this.scene.add(new THREE.AmbientLight(0x2a3038, 0.55));
    const hemi = new THREE.HemisphereLight(0x445566, 0x1a100c, 0.55);
    this.scene.add(hemi);

    this.moonLight = new THREE.DirectionalLight(0xc0d0e8, 0.55);
    this.moonLight.position.set(-8, 12, 4);
    this.scene.add(this.moonLight);

    // Luz frontal cálida para leer el ladrillo
    this.facadeLight = new THREE.DirectionalLight(0xffc090, 0.65);
    this.facadeLight.position.set(-2, 4, 10);
    this.root.add(this.facadeLight);

    this.neonLight = new THREE.PointLight(0xff7744, 4.2, 24);
    this.neonLight.position.set(0, 5.2, 2.8);
    this.root.add(this.neonLight);

    this.interiorLight = new THREE.PointLight(0xff7a20, 7.4, 20);
    this.interiorLight.position.set(0, 1.9, 1.2);
    this.root.add(this.interiorLight);

    // Derrame cálido desde cada vano (fachada + reflejo en suelo)
    this.windowLights = [
      [-3.2, 2.0, 3.85],
      [3.2, 2.0, 3.85],
      [0, 1.4, 3.9],
    ].map(([x, y, z]) => {
      const pl = new THREE.PointLight(0xff7018, 6.4, 9.5);
      pl.position.set(x, y, z);
      this.root.add(pl);
      return pl;
    });

    // Luces internas detrás del cristal (más “volumen” naranja)
    this.windowBackLights = [
      [-3.2, 1.85, 2.6],
      [3.2, 1.85, 2.6],
      [0, 1.35, 2.5],
    ].map(([x, y, z]) => {
      const pl = new THREE.PointLight(0xff8a28, 5.2, 6.5);
      pl.position.set(x, y, z);
      this.root.add(pl);
      return pl;
    });

    // Lavado suave solo junto a la fachada (no tiñe toda la calle)
    this.groundWash = [
      [-3.2, 0.35, 4.5],
      [3.2, 0.35, 4.5],
      [0, 0.35, 4.6],
    ].map(([x, y, z]) => {
      const pl = new THREE.PointLight(0xff8844, 1.4, 3.2);
      pl.position.set(x, y, z);
      this.root.add(pl);
      return pl;
    });

    this.signLight = new THREE.PointLight(0xffee77, 2.6, 12);
    this.signLight.position.set(-0.2, 5.15, 3.2);
    this.root.add(this.signLight);
  }

  _buildGround() {
    // Fondo lejano (asfalto genérico)
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(50, 40), this.mats.asphalt);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(-2, 0, 4);
    this.root.add(ground);

    // Estacionamiento delante del establecimiento (una sola fila hacia la fachada)
    const street = new THREE.Mesh(new THREE.PlaneGeometry(20, 10), this.mats.street);
    street.rotation.x = -Math.PI / 2;
    street.position.set(0, 0.01, 7.4);
    this.root.add(street);
    this.streetMesh = street;

    // Capa húmeda que recoge el neón / interior
    const wet = new THREE.Mesh(new THREE.PlaneGeometry(20, 12), this.mats.wet);
    wet.rotation.x = -Math.PI / 2;
    wet.position.set(0, 0.025, 7.2);
    this.root.add(wet);

    // Reflejo mínimo justo bajo los vanos (no toda la calle)
    [
      [-3.2, 4.2, 1.0],
      [3.2, 4.2, 1.0],
      [0, 4.4, 0.75],
    ].forEach(([x, z, w]) => {
      const puddle = new THREE.Mesh(
        new THREE.PlaneGeometry(w, 1.8),
        this.mats.puddleGlow,
      );
      puddle.rotation.x = -Math.PI / 2;
      puddle.position.set(x, 0.04, z);
      this.root.add(puddle);
    });

    // Acera frente a la fachada
    this.box(14, 0.1, 3.4, this.mats.sidewalk, 0, 0.05, 3.35);
    // Bordillo
    this.box(14.2, 0.16, 0.22, this.mats.trim, 0, 0.08, 5.05);
  }

  _buildSky() {
    // Luna en espacio de cámara, capa más baja (pinos/montañas la tapan)
    const moon = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.mats.moon);
    moon.renderOrder = -1000;
    this.camera.add(moon);
    this.scene.add(this.camera);
    this.moonMesh = moon;
    this._placeMoon();

    // Nubes simples (planos oscuros), lejos del disco lunar
    for (let i = 0; i < 5; i++) {
      const c = this.box(
        6 + Math.random() * 5, 0.4, 2 + Math.random() * 2,
        new THREE.MeshBasicMaterial({ color: 0x121820, transparent: true, opacity: 0.32 }),
        -8 + i * 4.5, 8 + Math.random() * 2.5, -14 - Math.random() * 4,
        this.scene,
      );
      c.rotation.y = Math.random() * 0.5;
    }
  }

  /**
   * Cordillera de fondo a la DERECHA de la vista del jugador.
   * Posición = cámara + forward*dist + right*offset (no ejes mundo).
   * Capas con distancia distinta → sin z-fight / parpadeo.
   */
  _buildMountains() {
    const g = new THREE.Group();
    this.scene.add(g);
    this.mountains = g;

    const makeRidge = (color, points) => {
      const shape = new THREE.Shape();
      shape.moveTo(points[0][0], 0);
      for (let i = 0; i < points.length; i++) {
        shape.lineTo(points[i][0], points[i][1]);
      }
      shape.lineTo(points[points.length - 1][0], 0);
      shape.closePath();
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: 1.4,
        bevelEnabled: false,
      });
      geo.translate(0, 0, -0.7);
      return new THREE.Mesh(
        geo,
        new THREE.MeshBasicMaterial({
          color,
          fog: true,
          toneMapped: false,
          polygonOffset: true,
          polygonOffsetFactor: 1,
          polygonOffsetUnits: 1,
        }),
      );
    };

    // Ejes de la vista del menú
    const forward = this._lookBase.clone().sub(this._camBase).setY(0).normalize();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
    const cam = this._camBase;

    // dist = atrás; rightOff = derecha en pantalla; capas separadas anti-parpadeo
    const layers = [
      {
        color: 0x152030,
        dist: 46,
        rightOff: 34,
        hScale: 1.2,
        points: [
          [0, 2], [6, 9], [12, 5], [18, 14], [26, 7], [34, 16], [42, 8], [50, 12], [58, 3],
        ],
      },
      {
        color: 0x1c2a3c,
        dist: 38,
        rightOff: 32,
        hScale: 1.0,
        points: [
          [0, 1.5], [7, 7], [14, 4], [22, 11], [30, 6], [38, 13], [46, 5], [54, 2],
        ],
      },
      {
        color: 0x243448,
        dist: 30,
        rightOff: 22,
        hScale: 0.85,
        points: [
          [0, 1], [8, 5.5], [16, 3], [24, 9], [32, 4.5], [40, 7.5], [48, 2],
        ],
      },
    ];

    layers.forEach((L, i) => {
      const pos = cam.clone()
        .addScaledVector(forward, L.dist)
        .addScaledVector(right, L.rightOff);
      pos.y = 0;

      const mesh = makeRidge(L.color, L.points);
      mesh.position.copy(pos);
      mesh.scale.set(1, L.hScale, 1);
      mesh.lookAt(cam.x, 4, cam.z);
      mesh.rotateY(Math.PI);
      mesh.material.polygonOffsetFactor = 2 + i * 2;
      mesh.material.polygonOffsetUnits = 2 + i * 2;
      g.add(mesh);
    });
  }

  _buildBuilding() {
    const g = new THREE.Group();
    this.building = g;
    this.root.add(g);

    // Cuerpo ladrillo
    this.box(12, 4.2, 7, this.mats.brick, 0, 2.1, 0, g);
    // Techo
    this.box(12.4, 0.35, 7.4, this.mats.roof, 0, 4.35, 0, g);
    // Remate
    this.box(12.6, 0.2, 0.4, this.mats.trim, 0, 4.55, 3.55, g);

    // Marco ventanas / puerta
    this.box(11.5, 2.4, 0.15, this.mats.trim, 0, 1.8, 3.48, g);

    // Cristales con glow interior cálido + reflejo naranja
    this.windowL = this.box(3.4, 2.0, 0.08, this.mats.glass, -3.2, 1.85, 3.55, g);
    this.windowR = this.box(3.4, 2.0, 0.08, this.mats.glass, 3.2, 1.85, 3.55, g);
    // Puerta a ras de suelo (centro 1.35 → base en y≈0)
    this.doorGlass = this.box(1.6, 2.7, 0.08, this.mats.glass, 0, 1.35, 3.56, g);

    // Halo suave delante del cristal (más brillo / “bloom” barato)
    this.windowHalos = [
      [-3.2, 1.85, 3.55, 2.15],
      [3.2, 1.85, 3.55, 2.15],
      [0, 1.35, 1.75, 2.75],
    ].map(([x, y, w, h]) => {
      const halo = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        this.mats.glassGlow.clone(),
      );
      halo.position.set(x, y, 3.62);
      g.add(halo);
      return halo;
    });

    // Capa de reflejo naranja aditiva sobre ventanas y puerta
    this.windowReflects = [
      [-3.2, 1.85, 3.3, 1.9],
      [3.2, 1.85, 3.3, 1.9],
      [0, 1.35, 1.45, 2.6],
    ].map(([x, y, w, h]) => {
      const refl = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        this.mats.glassReflect.clone(),
      );
      refl.position.set(x, y, 3.66);
      g.add(refl);
      return refl;
    });

    // Marcos verticales (jambas de puerta hasta el suelo)
    [-5.0, 5.0].forEach((x) => {
      this.box(0.18, 2.3, 0.2, this.mats.trim, x, 1.8, 3.52, g);
    });
    [-1.4, 1.4].forEach((x) => {
      this.box(0.18, 2.7, 0.2, this.mats.trim, x, 1.35, 3.52, g);
    });
    this.box(11.2, 0.15, 0.2, this.mats.trim, 0, 2.95, 3.52, g);
    // Umbral inferior solo bajo ventanas (no corta la puerta)
    this.box(3.4, 0.15, 0.2, this.mats.trim, -3.2, 0.75, 3.52, g);
    this.box(3.4, 0.15, 0.2, this.mats.trim, 3.2, 0.75, 3.52, g);
    // Umbral de la puerta a ras de suelo
    this.box(1.7, 0.08, 0.28, this.mats.trim, 0, 0.04, 3.58, g);

    // Cartel ABIERTO
    const openTex = texCanvas((ctx, w, h) => {
      ctx.fillStyle = "#2a1810";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#33ff66";
      ctx.font = "bold 36px sans-serif";
      ctx.textAlign = "center";
      ctx.shadowColor = "#22ff55";
      ctx.shadowBlur = 8;
      ctx.fillText("ABIERTO", w / 2, h / 2 + 12);
    }, 256, 64);
    const openSign = new THREE.Mesh(
      new THREE.PlaneGeometry(0.9, 0.28),
      new THREE.MeshBasicMaterial({ map: openTex }),
    );
    openSign.position.set(0, 2.55, 3.65);
    g.add(openSign);
  }

  _buildNeon() {
    const board = new THREE.Mesh(
      new THREE.PlaneGeometry(5.5, 1.7),
      this.mats.neonBoard,
    );
    board.position.set(0, 5.15, 3.7);
    this.root.add(board);
    this.neonBoard = board;

    // Luna creciente neón al lado del letrero
    const crescent = new THREE.Mesh(
      new THREE.PlaneGeometry(1.35, 1.35),
      this.mats.crescent,
    );
    crescent.position.set(3.15, 5.25, 3.82);
    this.root.add(crescent);
    this.crescent = crescent;

    // Backboard del letrero
    this.box(5.8, 1.9, 0.15, this.mats.trim, 0, 5.15, 3.55);
  }

  _buildAwning() {
    const awn = new THREE.Group();
    awn.position.set(0, 3.15, 3.9);
    this.root.add(awn);
    const stripes = 10;
    const w = 11.2 / stripes;
    for (let i = 0; i < stripes; i++) {
      const mat = i % 2 === 0 ? this.mats.awningRed : this.mats.awningWhite;
      this.box(w * 0.98, 0.08, 1.4, mat, -5.5 + w * (i + 0.5), 0, 0.3, awn);
    }
    // Inclinación
    awn.rotation.x = 0.28;
    // Soportes
    [-4.5, 0, 4.5].forEach((x) => {
      this.box(0.06, 0.9, 0.06, this.mats.metal, x, 2.7, 4.2);
    });
  }

  _buildInteriorGlow() {
    // Mesas silueta dentro (muy simples, vistas a través del vidrio)
    const tableMat = new THREE.MeshStandardMaterial({
      color: 0x3a2818, emissive: 0x331808, emissiveIntensity: 0.25, roughness: 0.8,
    });
    [[-3, 1.2], [3, 1.2], [-2.5, -0.5], [2.5, -0.5]].forEach(([x, z]) => {
      this.box(1.1, 0.08, 1.1, tableMat, x, 0.85, z);
      this.box(0.1, 0.8, 0.1, tableMat, x, 0.4, z);
    });
    // Lámparas interiores más cálidas
    [[-3, 0.8], [3, 0.8], [0, 0.2]].forEach(([x, z]) => {
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xff9030 }),
      );
      bulb.position.set(x, 3.2, z);
      this.root.add(bulb);
    });
  }

  _buildProps() {
    // Banco
    this.box(1.8, 0.08, 0.5, this.mats.wood, -5.2, 0.55, 4.2);
    this.box(0.08, 0.5, 0.5, this.mats.wood, -6.0, 0.3, 4.2);
    this.box(0.08, 0.5, 0.5, this.mats.wood, -4.4, 0.3, 4.2);

    // Basura
    this.box(0.45, 0.7, 0.45, this.mats.metal, 5.5, 0.35, 4.0);

    // Pizarra
    const chalk = texCanvas((ctx, w, h) => {
      ctx.fillStyle = "#1a2218";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#c4a882";
      ctx.lineWidth = 8;
      ctx.strokeRect(6, 6, w - 12, h - 12);
      ctx.fillStyle = "#e8e0d0";
      ctx.font = "28px Georgia";
      ctx.textAlign = "center";
      ctx.fillText("Pizza", w / 2, 70);
      ctx.fillText("Siempre Mejor", w / 2, 110);
      ctx.fillText(":)", w / 2, 155);
    }, 256, 256);
    const board = new THREE.Mesh(
      new THREE.PlaneGeometry(1.1, 1.3),
      new THREE.MeshBasicMaterial({ map: chalk }),
    );
    board.position.set(6.2, 1.0, 4.3);
    board.rotation.y = -0.4;
    this.root.add(board);

    // Macetas
    [-4.2, 4.2].forEach((x) => {
      this.box(0.4, 0.35, 0.4, this.mats.wood, x, 0.2, 4.5);
      const bush = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), this.mats.foliage);
      bush.position.set(x, 0.55, 4.5);
      this.root.add(bush);
    });

    // Coche parcial (izquierda)
    const car = new THREE.Group();
    car.position.set(-11, 0, 6);
    car.rotation.y = 0.5;
    this.box(3.2, 0.7, 1.4, this.mats.car, 0, 0.55, 0, car);
    this.box(2.0, 0.55, 1.3, this.mats.car, -0.2, 1.15, 0, car);
    this.scene.add(car);

    // Valla
    for (let i = 0; i < 8; i++) {
      this.box(0.08, 1.2, 0.08, this.mats.metal, -10 + i * 0.7, 0.6, 2.5, this.scene);
    }
    this.box(5.5, 0.06, 0.06, this.mats.metal, -7.5, 1.1, 2.5, this.scene);
  }

  _buildPines() {
    // Siluetas oscuras; coordenadas LOCALES al root del restaurante
    const pineMat = new THREE.MeshBasicMaterial({ color: 0x121c16 });
    const trunkMat = new THREE.MeshBasicMaterial({ color: 0x1a140e });
    const coneGeo = new THREE.ConeGeometry(1, 1, 7);
    const trunkGeo = new THREE.CylinderGeometry(0.14, 0.2, 1, 5);

    const makePine = (x, z, scale) => {
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      g.scale.setScalar(scale);
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 1.0;
      trunk.scale.set(1, 2.0, 1);
      g.add(trunk);
      [
        [1.8, 1.5, 2.3],
        [1.3, 1.25, 3.5],
        [0.9, 1.1, 4.5],
        [0.55, 0.95, 5.3],
      ].forEach(([r, h, py]) => {
        const cone = new THREE.Mesh(coneGeo, pineMat);
        cone.scale.set(r, h, r);
        cone.position.y = py;
        g.add(cone);
      });
      this.root.add(g);
    };

    // Flanco derecho (junto al muro, visibles)
    [
      [7.4, 1.5, 1.15], [8.2, -0.5, 1.35], [8.8, -2.5, 1.25],
      [9.3, 0.8, 1.45], [7.8, -4.0, 1.2], [9.0, -5.5, 1.4],
    ].forEach(([x, z, s]) => makePine(x, z, s));

    // Flanco izquierdo / detrás
    [
      [-7.6, 0.5, 1.2], [-8.4, -1.8, 1.35], [-7.2, -3.5, 1.25],
      [-8.8, -5.0, 1.4], [-5.5, -5.5, 1.3], [-3.0, -6.2, 1.45],
    ].forEach(([x, z, s]) => makePine(x, z, s));

    // Fila trasera (asoman sobre el techo)
    [
      [-4.5, -7.0, 1.5], [-1.5, -7.5, 1.6], [1.5, -7.2, 1.55],
      [4.0, -7.6, 1.65], [6.0, -6.8, 1.45], [0.0, -8.5, 1.7],
      [3.0, -8.8, 1.6], [-2.5, -8.6, 1.55],
    ].forEach(([x, z, s]) => makePine(x, z, s));

    this._pineGeos = [coneGeo, trunkGeo];
  }

  _buildFogWisps() {
    const n = 40;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.3) * 18;
      pos[i * 3 + 1] = 0.2 + Math.random() * 1.5;
      pos[i * 3 + 2] = Math.random() * 12;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    this.fogPts = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        color: 0x8899aa, size: 0.35, transparent: true, opacity: 0.12, depthWrite: false,
      }),
    );
    this.root.add(this.fogPts);
  }

  _isMobileMenu() {
    return (
      window.matchMedia("(max-width: 720px)").matches ||
      window.matchMedia("(pointer: coarse)").matches
    );
  }

  _isMobileLandscape() {
    return this._isMobileMenu() && window.matchMedia("(orientation: landscape)").matches;
  }

  /** Desktop / móvil landscape: local a la derecha. Retrato: más al centro. */
  _syncMenuFraming() {
    if (this._isMobileLandscape() || !this._isMobileMenu()) {
      // Perspectiva similar a desktop
      this._camBase.set(-3.2, 2.55, 11.4);
      this._lookBase.set(6, 1.85, -0.5);
      this.root.position.set(10.2, 0, -1.8);
    } else {
      // Retrato: preview más centrado
      this._camBase.set(-9.2, 2.55, 11.2);
      this._lookBase.set(4.4, 1.85, -0.4);
      this.root.position.set(4.2, 0, -1.8);
    }
  }

  setActive(on) {
    this.active = !!on;
    this.canvas.style.opacity = on ? "1" : "0";
    this.canvas.style.pointerEvents = "none";
    if (on) {
      // Primero FOV/cámara base, luego resize + luna (si no, la luna queda anclada al FOV del approach)
      this._syncMenuFraming();
      if (!this.entering) this.resetCamera();
      this.resize();
    }
  }

  resetCamera() {
    this.entering = false;
    this._enterAnim = null;
    this._syncMenuFraming();
    this.camera.fov = this._camFovBase;
    this.camera.updateProjectionMatrix();
    this.camera.position.copy(this._camBase);
    this._look.copy(this._lookBase);
    this.camera.lookAt(this._look);
    this._placeMoon();
  }

  /**
   * Acercamiento cinematográfico a la puerta.
   * Resuelve la Promise al terminar (o de inmediato si ya está entrando).
   */
  playEnterAnimation(duration = 2.75) {
    if (this._enterAnim) {
      return new Promise((resolve) => {
        const prev = this._enterAnim.resolve;
        this._enterAnim.resolve = () => {
          prev?.();
          resolve();
        };
      });
    }

    this.root.updateMatrixWorld(true);
    const doorPos = new THREE.Vector3();
    if (this.doorGlass) this.doorGlass.getWorldPosition(doorPos);
    else doorPos.set(5.8, 1.35, 2.0);

    const outward = new THREE.Vector3(0, 0, 1).transformDirection(this.root.matrixWorld);
    outward.y = 0;
    if (outward.lengthSq() < 1e-6) outward.set(0, 0, 1);
    else outward.normalize();

    const toLook = doorPos.clone();
    toLook.y = 1.4;

    // Frente a la puerta, un poco más bajo (como caminar hacia ella)
    const toPos = doorPos.clone().addScaledVector(outward, 2.15);
    toPos.y = 1.48;

    // Punto intermedio: centra la fachada antes del close-up
    const midPos = this.camera.position.clone().lerp(toPos, 0.45);
    midPos.y = Math.max(midPos.y, 2.05);
    const midLook = this._look.clone().lerp(toLook, 0.55);

    return new Promise((resolve) => {
      this.entering = true;
      this._enterAnim = {
        t: 0,
        dur: duration,
        fromPos: this.camera.position.clone(),
        midPos,
        toPos,
        fromLook: this._look.clone(),
        midLook,
        toLook,
        fromFov: this.camera.fov,
        toFov: 36,
        resolve,
      };
    });
  }

  _easeInOutCubic(u) {
    return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
  }

  _sampleEnterPath(u) {
    // Dos segmentos: panorama → puerta
    const a = this._enterAnim;
    if (u < 0.55) {
      const t = this._easeInOutCubic(u / 0.55);
      return {
        pos: a.fromPos.clone().lerp(a.midPos, t),
        look: a.fromLook.clone().lerp(a.midLook, t),
        fov: a.fromFov + (42 - a.fromFov) * t,
      };
    }
    const t = this._easeInOutCubic((u - 0.55) / 0.45);
    return {
      pos: a.midPos.clone().lerp(a.toPos, t),
      look: a.midLook.clone().lerp(a.toLook, t),
      fov: 42 + (a.toFov - 42) * t,
    };
  }

  _placeMoon() {
    if (!this.moonMesh) return;
    // Más lejos que pinos/montañas → queda detrás en el depth buffer
    const z = 55;
    const halfH = Math.tan((this.camera.fov * Math.PI) / 360) * z;
    const halfW = halfH * this.camera.aspect;
    const size = Math.min(halfW, halfH) * 0.72;
    this.moonMesh.position.set(halfW * 0.88, halfH * 0.82, -z);
    this.moonMesh.userData.baseScale = size;
    this.moonMesh.scale.set(size, size, 1);
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this._syncMenuFraming();
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this._placeMoon();
  }

  update(dt) {
    if (!this.active) return;
    this.t += dt;

    if (this.entering && this._enterAnim) {
      const anim = this._enterAnim;
      anim.t += dt;
      const u = Math.min(1, anim.t / anim.dur);
      const sample = this._sampleEnterPath(u);
      this.camera.position.copy(sample.pos);
      this._look.copy(sample.look);
      this.camera.fov = sample.fov;
      this.camera.updateProjectionMatrix();
      this.camera.lookAt(this._look);

      if (u >= 1) {
        const done = anim.resolve;
        this._enterAnim = null;
        this.entering = false;
        done?.();
      }
    } else {
      // Parallax sutil con el ratón
      const tx = this._camBase.x + (this.pointerX - 0.5) * 1.35;
      const ty = this._camBase.y + (0.5 - this.pointerY) * 0.55;
      const k = Math.min(1, dt * 2.5);
      this.camera.position.x += (tx - this.camera.position.x) * k;
      this.camera.position.y += (ty - this.camera.position.y) * k;
      this._look.x = this._lookBase.x + (this.pointerX - 0.5) * 0.45;
      this._look.y = this._lookBase.y + (0.5 - this.pointerY) * 0.28;
      this.camera.lookAt(this._look);
    }

    // Neón parpadea
    const flicker = Math.random() > 0.97 ? 0.4 : 1;
    const pulse = 0.9 + Math.sin(this.t * 3.2) * 0.1;
    if (this.neonLight) this.neonLight.intensity = 4.2 * pulse * flicker;
    if (this.signLight) this.signLight.intensity = 2.6 * pulse * flicker;
    if (this.crescent) {
      this.crescent.scale.setScalar(0.96 + Math.sin(this.t * 4) * 0.04);
      this.crescent.material.opacity = 0.85 + pulse * 0.15 * flicker;
    }
    if (this.mats.glass) {
      this.mats.glass.emissiveIntensity = 1.7 + Math.sin(this.t * 1.5) * 0.28;
    }
    if (this.windowHalos) {
      const hop = 0.48 + Math.sin(this.t * 1.5) * 0.1;
      for (const h of this.windowHalos) h.material.opacity = hop;
    }
    if (this.windowReflects) {
      const rop = 0.22 + Math.sin(this.t * 1.8) * 0.08;
      for (const r of this.windowReflects) r.material.opacity = rop;
    }
    if (this.mats.puddleGlow) {
      this.mats.puddleGlow.opacity = 0.1 + Math.sin(this.t * 1.5) * 0.03;
    }
    if (this.windowLights) {
      const wPulse = 5.8 + Math.sin(this.t * 1.5) * 0.55;
      for (const pl of this.windowLights) pl.intensity = wPulse;
    }
    if (this.windowBackLights) {
      const bPulse = 4.6 + Math.sin(this.t * 1.35) * 0.4;
      for (const pl of this.windowBackLights) pl.intensity = bPulse;
    }
    if (this.groundWash) {
      const gPulse = 1.2 + Math.sin(this.t * 1.5) * 0.15;
      for (const pl of this.groundWash) pl.intensity = gPulse;
    }
    if (this.interiorLight) {
      this.interiorLight.intensity = 7.0 + Math.sin(this.t * 1.2) * 0.5;
    }

    // Niebla lenta
    if (this.fogPts) {
      const p = this.fogPts.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) {
        let x = p.getX(i) + dt * 0.15;
        if (x > 10) x = -8;
        p.setX(i, x);
      }
      p.needsUpdate = true;
    }

    // Luna respira (sin sacar del anclaje de esquina)
    if (this.moonMesh) {
      const base = this.moonMesh.userData.baseScale || this.moonMesh.scale.x;
      this.moonMesh.userData.baseScale = base;
      const s = base * (1 + Math.sin(this.t * 0.4) * 0.025);
      this.moonMesh.scale.set(s, s, 1);
    }
  }

  draw() {
    if (!this.active) return;
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.active = false;
    window.removeEventListener("pointermove", this._onMove);
    window.removeEventListener("resize", this._onResize);
    this.renderer.dispose();
  }
}

export { VERSION };
