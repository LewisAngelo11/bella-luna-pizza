/* global BABYLON */
import { makeTex } from "./utils.js";

function softParticleTex(scene, name, rgba) {
  return makeTex(scene, name, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, rgba);
    g.addColorStop(1, rgba.replace(/[\d.]+\)$/, "0)"));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }, 16, 16);
}

export function setupRain(r) {
  r.rain = [];
  r.rainSystem = new BABYLON.ParticleSystem("rain", 90, r.scene);
  r.rainSystem.particleTexture = makeTex(r.scene, "rpt", (ctx, w, h) => {
    ctx.fillStyle = "#fff";
    ctx.fillRect(w * 0.4, 0, w * 0.2, h);
  }, 16, 32);
  r.rainSystem.emitter = new BABYLON.Vector3(-2.2, 2.5, 13.08);
  r.rainSystem.minEmitBox = new BABYLON.Vector3(-1.2, 0, 0);
  r.rainSystem.maxEmitBox = new BABYLON.Vector3(1.2, 0, 0.05);
  r.rainSystem.color1 = new BABYLON.Color4(0.7, 0.8, 0.9, 0.45);
  r.rainSystem.color2 = new BABYLON.Color4(0.55, 0.7, 0.85, 0.25);
  r.rainSystem.colorDead = new BABYLON.Color4(0.5, 0.6, 0.7, 0);
  r.rainSystem.minSize = 0.015;
  r.rainSystem.maxSize = 0.03;
  r.rainSystem.minLifeTime = 0.35;
  r.rainSystem.maxLifeTime = 0.7;
  r.rainSystem.emitRate = 70;
  r.rainSystem.gravity = new BABYLON.Vector3(0, -9, 0);
  r.rainSystem.direction1 = new BABYLON.Vector3(0, -1, 0);
  r.rainSystem.direction2 = new BABYLON.Vector3(0.05, -1, 0);
  r.rainSystem.updateSpeed = 0.02;
  r.rainSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
  r.rainSystem.start();
}

export function setupDust(r) {
  r.dustSystem = new BABYLON.ParticleSystem("dust", 60, r.scene);
  r.dustSystem.particleTexture = softParticleTex(r.scene, "dustT", "rgba(255,224,176,1)");
  r.dustSystem.emitter = new BABYLON.Vector3(0, 1.2, 6);
  r.dustSystem.minEmitBox = new BABYLON.Vector3(-5, 0, -5);
  r.dustSystem.maxEmitBox = new BABYLON.Vector3(5, 1.5, 6);
  r.dustSystem.color1 = new BABYLON.Color4(1, 0.88, 0.7, 0.25);
  r.dustSystem.color2 = new BABYLON.Color4(0.9, 0.75, 0.55, 0.12);
  r.dustSystem.colorDead = new BABYLON.Color4(0.8, 0.7, 0.5, 0);
  r.dustSystem.minSize = 0.01;
  r.dustSystem.maxSize = 0.025;
  r.dustSystem.minLifeTime = 4;
  r.dustSystem.maxLifeTime = 8;
  r.dustSystem.emitRate = 12;
  r.dustSystem.gravity = new BABYLON.Vector3(0, 0.02, 0);
  r.dustSystem.direction1 = new BABYLON.Vector3(-0.05, 0.05, -0.05);
  r.dustSystem.direction2 = new BABYLON.Vector3(0.05, 0.1, 0.05);
  r.dustSystem.updateSpeed = 0.02;
  r.dustSystem.start();
}

export function setupEmbers(r) {
  r.emberSystem = new BABYLON.ParticleSystem("embers", 24, r.scene);
  r.emberSystem.particleTexture = softParticleTex(r.scene, "emberT", "rgba(255,180,60,1)");
  r.emberSystem.emitter = new BABYLON.Vector3(4.1, 0.55, 4.7);
  r.emberSystem.minEmitBox = new BABYLON.Vector3(-0.2, 0, -0.1);
  r.emberSystem.maxEmitBox = new BABYLON.Vector3(0.2, 0.1, 0.2);
  r.emberSystem.color1 = new BABYLON.Color4(1, 0.45, 0.1, 0.8);
  r.emberSystem.color2 = new BABYLON.Color4(1, 0.25, 0.05, 0.5);
  r.emberSystem.colorDead = new BABYLON.Color4(0.2, 0.05, 0, 0);
  r.emberSystem.minSize = 0.02;
  r.emberSystem.maxSize = 0.04;
  r.emberSystem.minLifeTime = 0.6;
  r.emberSystem.maxLifeTime = 1.4;
  r.emberSystem.emitRate = 18;
  r.emberSystem.gravity = new BABYLON.Vector3(0, 0.4, 0);
  r.emberSystem.direction1 = new BABYLON.Vector3(-0.1, 0.4, -0.1);
  r.emberSystem.direction2 = new BABYLON.Vector3(0.1, 0.8, 0.1);
  r.emberSystem.updateSpeed = 0.02;
  r.emberSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
  r.emberSystem.start();
}
