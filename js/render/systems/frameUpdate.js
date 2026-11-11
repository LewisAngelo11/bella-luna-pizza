import { hex3 } from "../utils.js";
import { adaptQuality } from "./quality.js";
import { updateJumpscare } from "../actors/jumpscare.js";

// Colores reutilizados (evita new Color3 cada frame → menos GC).
const C_OVEN = hex3(0xe85d04);
const C_FLAME = hex3(0xff6600);
const C_GHOST = hex3(0xaa0000);
const C_EYE = hex3(0xff0000);
const C_KNOB_OK = hex3(0xf4d35e);
const C_KNOB_OK_E = hex3(0xaa8800);
const C_KNOB_BAD = hex3(0xc83c28);
const C_KNOB_BAD_E = hex3(0x661100);
const _tmp = hex3(0xffffff);

/** Animaciones, luces, cámara e interacción por frame. */
export function updateFrame(r, dt, state) {
  r.t += dt;
  r.flicker = state.flickerIntensity || 0;
  r.doorLocked = state.doorLocked;
  r.freezerKnock = state.freezerKnock;
  r.freezerOpen = state.freezerOpen ?? r.freezerOpen;
  adaptQuality(r, dt);

  if (state.lookingTable6) r.table6Stare += dt;
  else r.table6Stare = Math.max(0, r.table6Stare - dt * 2);

  // Cámara / puertas: cada frame (jugabilidad).
  r.baseYaw += (r.targetBaseYaw - r.baseYaw) * Math.min(1, dt * 5);
  if (r.lookEnabled) {
    r.yaw += (r.targetYaw - r.yaw) * Math.min(1, dt * 8);
    r.pitch += (r.targetPitch - r.pitch) * Math.min(1, dt * 8);
  } else {
    r.yaw += (0 - r.yaw) * Math.min(1, dt * 3);
    r.pitch += (0 - r.pitch) * Math.min(1, dt * 3);
  }

  const breath = Math.sin(r.t * 1.2) * 0.01;
  const camZ = r.lookingBehind ? -0.25 : 0.15;
  r.camera.position.set(0, 1.62 + breath, camZ);
  r.camera.rotation.y = r.baseYaw + r.yaw;
  r.camera.rotation.x = -r.pitch;

  const freezerTarget = r.freezerOpen ? -1.9 : 0;
  r.freezerDoorAngle += (freezerTarget - r.freezerDoorAngle) * Math.min(1, dt * 4);
  if (r.freezerDoorPivot) {
    r.freezerDoorPivot.rotation.y = r.freezerDoorAngle;
    r.freezerDoorPivot.computeWorldMatrix?.(true);
  }

  const doorTarget = r.doorLocked ? 0 : 1.7;
  r.doorAngle += (doorTarget - r.doorAngle) * Math.min(1, dt * 3.5);
  if (r.doorPivot) {
    r.doorPivot.rotation.y = r.doorAngle;
    r.doorPivot.computeWorldMatrix?.(true);
  }

  updateJumpscare(r, dt);
  updateFx(r, dt);

  r.canvas.style.cursor = r.lookEnabled && r.hoverTarget
    ? "pointer"
    : r.lookEnabled ? "crosshair" : "default";
}

function updateFx(r) {
  const flickerMul = (1 - r.flicker * (0.55 + 0.45 * Math.sin(r.t * 40)))
    * (r.jumpscare > 0 ? 0.07 : 1);
  r.lamp.intensity = 1.05 * flickerMul;
  r.hemi.intensity = 0.06 * flickerMul;
  if (r.dirLight) r.dirLight.intensity = 0.72 * flickerMul;
  if (r.spotLamp) r.spotLamp.intensity = 0.42 * flickerMul;
  if (r.fill) r.fill.intensity = 0.08 * flickerMul;
  r.counterLight.intensity = 0.7 * flickerMul;
  r.backLight.intensity = 0.28 * flickerMul;
  if (r.backLight2) r.backLight2.intensity = 0.1 * flickerMul;

  if (r.windowLight) r.windowLight.setEnabled(true);
  if (r.neonLight) r.neonLight.setEnabled(true);
  if (r.ovenLight) r.ovenLight.setEnabled(true);
  if (r.backLight) r.backLight.setEnabled(true);
  if (r.counterLight) r.counterLight.setEnabled(true);

  if (r.customerLight && r.customerGroup.isEnabled()) {
    r.customerLight.setEnabled(true);
    r.customerLight.intensity = 0.85 * flickerMul;
  }

  r.ovenLight.intensity = (1.2 + Math.sin(r.t * 7) * 0.18) * flickerMul;
  if (r.ovenMouth?.material) {
    const e = 0.55 + Math.sin(r.t * 8) * 0.15;
    _tmp.copyFrom(C_OVEN);
    _tmp.scaleInPlace(e * flickerMul);
    r.ovenMouth.material.emissiveColor.copyFrom(_tmp);
  }
  if (r.ovenGlow?.material) {
    r.ovenGlow.material.alpha = 0.18 + Math.sin(r.t * 6) * 0.08;
  }
  if (r.neonLight && r.neonLight.isEnabled()) {
    const neonA = 0.28 + Math.sin(r.t * 17) * 0.08 + (Math.random() > 0.97 ? -0.2 : 0);
    r.neonLight.intensity = Math.max(0.05, neonA) * flickerMul;
  }

  const openAmt = Math.min(1, Math.abs(r.freezerDoorAngle) / 1.5);
  if (r.freezerLight) {
    const on = openAmt > 0.05;
    r.freezerLight.setEnabled(on);
    r.freezerLight.intensity = openAmt * 0.6;
  }

  if (r.freezerKnock && r.freezerGroup) {
    r.freezerGroup.position.x = -4.55 + Math.sin(r.t * 40) * 0.035;
  } else if (r.freezerGroup) {
    r.freezerGroup.position.x = -4.55;
  }

  if (r.doorKnob?.material) {
    if (r.doorLocked) {
      r.doorKnob.material.diffuseColor.copyFrom(C_KNOB_OK);
      r.doorKnob.material.emissiveColor.copyFrom(C_KNOB_OK_E);
    } else {
      r.doorKnob.material.diffuseColor.copyFrom(C_KNOB_BAD);
      r.doorKnob.material.emissiveColor.copyFrom(C_KNOB_BAD_E);
    }
  }
  if (r.doorBolt) r.doorBolt.setEnabled(r.doorLocked);

  Object.values(r.tables).forEach((t) => {
    if (t.flame?.material) {
      const pulse = 0.7 + Math.sin(r.t * 12 + t.group.position.x) * 0.3;
      _tmp.copyFrom(C_FLAME);
      _tmp.scaleInPlace(pulse);
      t.flame.material.emissiveColor.copyFrom(_tmp);
      t.flame.scaling.y = 0.85 + Math.sin(r.t * 15) * 0.2;
    }
  });

  if (r.tables[6]?.ghost) {
    const lookBoost = Math.min(1, r.table6Stare / 3);
    const g = r.tables[6].ghost;
    g.material.alpha = 0.25 + lookBoost * 0.55 + Math.sin(r.t * 3) * 0.08;
    _tmp.copyFrom(C_GHOST);
    _tmp.scaleInPlace(0.3 + lookBoost * 1.0);
    g.material.emissiveColor.copyFrom(_tmp);
    g.scaling.setAll(1 + lookBoost * 0.5);
    if (r.tables[6].ghostBody) {
      r.tables[6].ghostBody.material.alpha = 0.15 + lookBoost * 0.4;
    }
  }

  if (r.customer?.traits?.redEyes) {
    const pulse = 0.8 + Math.sin(r.t * 6) * 0.4;
    _tmp.copyFrom(C_EYE);
    _tmp.scaleInPlace(pulse);
    if (r.eyeL.material) r.eyeL.material.emissiveColor.copyFrom(_tmp);
    if (r.eyeR.material) r.eyeR.material.emissiveColor.copyFrom(_tmp);
  }
}
