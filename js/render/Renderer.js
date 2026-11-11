/**
 * Orquestador Babylon.js — perfil de rendimiento.
 * La construcción de la escena vive en módulos de js/render/.
 */
/* global BABYLON */
import { hex3 } from "./utils.js";
import { buildMaterials } from "./materials.js";
import { attachMeshHelpers } from "./mesh.js";
import { buildRoom } from "./room/index.js";
import { setupLights } from "./lights.js";
import { setupDust, setupEmbers } from "./particles.js";
import { setupCustomer, applyCustomer } from "./actors/customer.js";
import { setupJumpscare, updateJumpscare } from "./actors/jumpscare.js";
import { setupMenuExterior, setMenuMode, updateMenuExterior } from "./menu/MenuExterior.js?v=menu-win18";
import { updateFrame } from "./systems/frameUpdate.js";
import { PerfMonitor } from "./systems/perfMonitor.js";

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
    this.interactables = [];
    this._meshId = 0;
    this._fpsAcc = 0;
    this._fpsFrames = 0;
    this._scale = 1.35;
    this._targetFps = 60;
    this._suspended = false;
    this._pageHidden = document.hidden;

    this.engine = new BABYLON.Engine(canvas, false, {
      adaptToDeviceRatio: false,
      powerPreference: "high-performance",
      preserveDrawingBuffer: false,
      stencil: false,
      audioEngine: false,
    });
    this.engine.setHardwareScalingLevel(this._scale);

    this.scene = new BABYLON.Scene(this.engine);
    this.scene.clearColor = new BABYLON.Color4(0.02, 0.012, 0.008, 1);
    this.scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
    this.scene.fogColor = hex3(0x0a0604);
    this.scene.fogDensity = 0.02;
    this.scene.shadowsEnabled = true;
    this.scene.autoClear = true;
    this.scene.skipPointerMovePicking = true;

    this.camera = new BABYLON.FreeCamera("cam", new BABYLON.Vector3(0, 1.55, 0.2), this.scene);
    this.camera.fov = (68 * Math.PI) / 180;
    this.camera.minZ = 0.05;
    this.camera.maxZ = 50;
    this.camera.rotation = new BABYLON.Vector3(0, 0, 0);
    this.camera.inputs.clear();

    this.root = new BABYLON.TransformNode("root", this.scene);

    buildMaterials(this);
    attachMeshHelpers(this);
    buildRoom(this);
    setupCustomer(this);
    setupJumpscare(this);
    setupDust(this);
    setupEmbers(this);
    setupLights(this);
    setupMenuExterior(this);

    // Luces de gameplay (excluye menú) para poder apagarlas en el menú.
    this._gameLights = this.scene.lights.filter((l) => !String(l.name).startsWith("menu"));

    this.perf = new PerfMonitor({ engine: this.engine, scene: this.scene });
    this.perf.attach();

    window.addEventListener("resize", () => this.resize());
    document.addEventListener("visibilitychange", () => {
      this._pageHidden = document.hidden;
      if (document.hidden) {
        this.rainSystem?.stop?.();
        this.dustSystem?.stop?.();
        this.emberSystem?.stop?.();
      } else {
        this.rainSystem?.start?.();
        this.dustSystem?.start?.();
        this.emberSystem?.start?.();
      }
    });
    this.resize();
  }

  /** Pausa partículas pesadas (pausa de juego). */
  setSuspended(v) {
    this._suspended = !!v;
    if (this._suspended) {
      this.rainSystem?.stop?.();
      this.dustSystem?.stop?.();
      this.emberSystem?.stop?.();
    } else if (!this.menuMode) {
      this.rainSystem?.start?.();
      this.dustSystem?.start?.();
      this.emberSystem?.start?.();
    }
  }

  /** Menú 3D exterior vs sala de gameplay. */
  setMenuMode(on) {
    setMenuMode(this, on);
  }

  isMenuMode() {
    return !!this.menuMode;
  }

  getGameVersion() {
    return this.gameVersion || "0.3.0";
  }

  resize() {
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.engine.resize();
  }

  setCustomer(c) {
    applyCustomer(this, c);
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

  setPointer(clientX, clientY, enabled, forcePick = false) {
    this.lookEnabled = enabled;
    this.pointerX = clientX / this.w;
    this.pointerY = clientY / this.h;
    const maxYaw = this.lookingBehind ? 0.4 : 0.55;
    const maxPitch = 0.28;
    this.targetYaw = (this.pointerX - 0.5) * 2 * maxYaw;
    this.targetPitch = (0.5 - this.pointerY) * 2 * maxPitch;
    if (enabled) {
      this.pick(clientX, clientY);
    } else {
      this.hoverTarget = null;
      this.hoverTable6 = false;
      this.lookingTable6 = false;
    }
  }

  pick(clientX, clientY) {
    const pick = this.scene.pick(
      clientX,
      clientY,
      (m) => !!m.metadata?.interactId,
      false,
      this.camera,
    );
    this.hoverTarget = pick?.hit ? pick.pickedMesh.metadata.interactId : null;
    this.hoverTable6 = this.hoverTarget === "table6";
    this.lookingTable6 = this.hoverTable6 && !this.lookingBehind;
  }

  getHoverTarget() {
    return this.hoverTarget;
  }

  isOverTable6() {
    return this.hoverTable6 && !this.lookingBehind;
  }

  triggerJumpscare() {
    this.jumpscare = this.jumpDur || 1.2;
    if (this.jumpLight) this.jumpLight.setEnabled(true);
    this.jumpGroup?.setEnabled(true);
    updateJumpscare(this, 0);
  }

  update(dt, state) {
    if (this._pageHidden) return;
    if (this.menuMode) {
      updateMenuExterior(this, dt);
      return;
    }
    if (this._suspended) return;
    updateFrame(this, dt, state);
  }

  draw(state) {
    if (this._pageHidden) return;
    if (!this.menuMode) {
      const hour = state?.hourDecimal ?? 23;
      this.scene.fogDensity = hour >= 0 && hour < 5 ? 0.032 : 0.022;
    }
    const now = performance.now();
    if (this._lastDraw != null && now - this._lastDraw < 1000 / this._targetFps) return;
    this._lastDraw = now;
    const t0 = performance.now();
    this.scene.render();
    const manualFrameMs = performance.now() - t0;
    this.perf?.sample({ manualFrameMs });
  }
}
