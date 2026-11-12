/**
 * Orquestador Three.js — sala modular, optimizado.
 */
import * as THREE from "three";
import { buildMaterials } from "./materials.js";
import { attachMeshHelpers } from "./mesh.js";
import { buildEntities, applyCustomer } from "./entities/index.js";
import { setupLights } from "./lights.js";
import { updateFrame } from "./systems/frameUpdate.js";

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
    this.ovenOn = true;
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

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x140e0a);
    this.scene.fog = new THREE.FogExp2(0x140e0a, 0.009);

    this.camera = new THREE.PerspectiveCamera(68, this.w / this.h, 0.05, 50);
    this.camera.position.set(0, 1.55, 0.2);
    this.camera.rotation.order = "YXZ";

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: "high-performance",
      stencil: false,
    });
    // Cap de pixel ratio: 1.5 basta y ahorra mucho fill-rate
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.setSize(this.w, this.h, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    this.raycaster = new THREE.Raycaster();
    this.ndc = new THREE.Vector2();

    this.root = new THREE.Group();
    this.scene.add(this.root);

    attachMeshHelpers(this);
    buildMaterials(this);
    buildEntities(this);
    setupLights(this);

    // Convención legacy: +Z construido → voltear a -Z (Three mira -Z)
    this.root.children.forEach((obj) => {
      obj.position.z *= -1;
    });
    // Partículas con Z en el buffer (padre en 0) también hay que invertir
    if (this.dust?.geometry?.attributes?.position) {
      const p = this.dust.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) p.setZ(i, -p.getZ(i));
      p.needsUpdate = true;
    }
    [
      this.lamp,
      this.ovenLight,
      this.fill,
      this.counterLight,
      this.customerLight,
      this.backLight,
      this.backLight2,
      this.doorLight,
      this.windowLight,
      this.menuLight,
      this.neonLight,
      this.spotLamp,
    ].forEach((l) => {
      if (l) l.position.z *= -1;
    });
    if (this.spotLamp?.target) this.spotLamp.target.position.z *= -1;

    // Sombras más baratas
    if (this.lamp?.shadow) {
      this.lamp.shadow.mapSize.set(512, 512);
    }

    window.addEventListener("resize", () => this.resize());
    this.resize();
  }

  resize() {
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.camera.aspect = this.w / this.h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.w, this.h, false);
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

  setOvenOn(on) {
    this.ovenOn = !!on;
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
    this.hoverTarget = hits.length ? hits[0].object.userData.interactId || null : null;
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
    this.jumpscare = 1.8;
    this.jumpGroup.visible = true;
    if (this.jumpLight) this.jumpLight.intensity = 12;
  }

  update(dt, state) {
    updateFrame(this, dt, state);
  }

  draw(state) {
    const hour = state?.hourDecimal ?? 23;
    this.scene.fog.density = hour >= 0 && hour < 5 ? 0.014 : 0.008;
    this.renderer.render(this.scene, this.camera);
  }
}
