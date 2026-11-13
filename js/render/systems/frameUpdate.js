export function updateFrame(r, dt, state) {
    r.t += dt;
    r.flicker = state.flickerIntensity || 0;
    r.doorLocked = state.doorLocked;
    r.freezerKnock = state.freezerKnock;
    r.freezerOpen = state.freezerOpen ?? r.freezerOpen;

    if (state.lookingTable6) r.table6Stare += dt;
    else r.table6Stare = Math.max(0, r.table6Stare - dt * 2);

    r.baseYaw += (r.targetBaseYaw - r.baseYaw) * Math.min(1, dt * 5);

    if (r.lookHoldX || r.lookHoldY) {
      const maxYaw = r.maxLookYaw();
      const maxPitch = r.maxLookPitch();
      const lookSpeed = r.isMobileLook?.() ? 2.58 : 1.75;
      r.targetYaw = Math.max(-maxYaw, Math.min(maxYaw, r.targetYaw + r.lookHoldX * lookSpeed * dt));
      r.targetPitch = Math.max(-maxPitch, Math.min(maxPitch, r.targetPitch + r.lookHoldY * lookSpeed * dt));
      r.lookEnabled = true;
    } else {
      const maxYaw = r.maxLookYaw();
      const maxPitch = r.maxLookPitch();
      r.targetYaw = Math.max(-maxYaw, Math.min(maxYaw, r.targetYaw));
      r.targetPitch = Math.max(-maxPitch, Math.min(maxPitch, r.targetPitch));
    }

    if (r.lookEnabled) {
      r.yaw += (r.targetYaw - r.yaw) * Math.min(1, dt * 8);
      r.pitch += (r.targetPitch - r.pitch) * Math.min(1, dt * 8);
    } else {
      r.yaw += (0 - r.yaw) * Math.min(1, dt * 3);
      r.pitch += (0 - r.pitch) * Math.min(1, dt * 3);
    }

    const breath = Math.sin(r.t * 1.2) * 0.01;
    const camZ = r.lookingBehind ? 0.55 : 0.15;
    let shakeX = 0;
    let shakeY = 0;
    let shakeRoll = 0;
    if (r.jumpscare > 0) {
      const shakeAmt = Math.min(1, r.jumpscare / 1.8) * 0.055;
      shakeX = Math.sin(r.t * 62) * shakeAmt + Math.sin(r.t * 91) * shakeAmt * 0.45;
      shakeY = Math.cos(r.t * 73) * shakeAmt * 0.85;
      shakeRoll = Math.sin(r.t * 55) * shakeAmt * 1.4;
    }
    r.camera.position.set(shakeX, 1.62 + breath + shakeY, camZ);
    r.camera.rotation.order = "YXZ";
    r.camera.rotation.y = r.baseYaw - r.yaw;
    r.camera.rotation.x = r.pitch;
    r.camera.rotation.z = shakeRoll;

    const freezerTarget = r.freezerOpen ? -1.9 : 0;
    r.freezerDoorAngle += (freezerTarget - r.freezerDoorAngle) * Math.min(1, dt * 4);
    if (r.freezerDoorPivot) r.freezerDoorPivot.rotation.y = r.freezerDoorAngle;

    const doorTarget = r.doorLocked ? 0 : 1.7;
    r.doorAngle += (doorTarget - r.doorAngle) * Math.min(1, dt * 3.5);
    if (r.doorPivot) r.doorPivot.rotation.y = r.doorAngle;

    const flickerMul = 1 - r.flicker * (0.55 + 0.45 * Math.sin(r.t * 40));
    r.lamp.intensity = 5.2 * flickerMul;
    r.ambient.intensity = 0.75 * flickerMul;
    if (r.hemi) r.hemi.intensity = 0.55 * flickerMul;
    if (r.counterLight) r.counterLight.intensity = 3.6 * flickerMul;
    if (r.backLight) r.backLight.intensity = 4.2 * flickerMul;
    if (r.spotLamp) r.spotLamp.intensity = 1.4 * flickerMul;
    if (r.customerLight && r.customerGroup.visible) {
      r.customerLight.intensity = 3.2 * flickerMul;
    }
    const ovenOn = state.ovenOn !== false;
    if (ovenOn) {
      const ovenPulse = 3.2 + Math.sin(r.t * 7) * 0.5 + Math.random() * 0.2;
      r.ovenLight.intensity = ovenPulse * flickerMul;
      r.ovenMouth.material.emissiveIntensity = (2.0 + Math.sin(r.t * 8) * 0.5) * flickerMul;
      r.ovenMouth.material.color.setHex(0xffb040);
      if (r.ovenGlow) r.ovenGlow.material.opacity = 0.18 + Math.sin(r.t * 6) * 0.08;
      if (r.embers) r.embers.visible = true;
    } else {
      r.ovenLight.intensity = 0.05;
      r.ovenMouth.material.emissiveIntensity = 0.05;
      r.ovenMouth.material.color.setHex(0x2a1810);
      if (r.ovenGlow) r.ovenGlow.material.opacity = 0.02;
      if (r.embers) r.embers.visible = false;
    }
    const neonA = 0.7 + Math.sin(r.t * 17) * 0.15 + (Math.random() > 0.97 ? -0.5 : 0);
    if (r.neonLight) r.neonLight.intensity = Math.max(0.15, neonA) * 1.5 * flickerMul;

    // Niebla del congelador
    if (r.freezerMist) {
      const openAmt = Math.min(1, Math.abs(r.freezerDoorAngle) / 1.5);
      r.freezerMist.material.opacity = openAmt * 0.45;
      if (r.freezerLight) r.freezerLight.intensity = openAmt * 1.8;
      const mp = r.freezerMist.geometry.attributes.position;
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

    if (r.freezerKnock && r.freezerGroup) {
      r.freezerGroup.position.x = -4.3 + Math.sin(r.t * 40) * 0.035;
    } else if (r.freezerGroup) {
      r.freezerGroup.position.x = -4.3;
    }

    if (r.doorKnob) {
      r.doorKnob.material.color.setHex(r.doorLocked ? 0x33ff77 : 0xc83c28);
      r.doorKnob.material.emissive.setHex(r.doorLocked ? 0x22aa44 : 0x661100);
    }
    if (r.doorBolt) r.doorBolt.visible = r.doorLocked;

    // Velas parpadean
    Object.values(r.tables).forEach((t) => {
      if (t.flame) {
        t.flame.material.emissiveIntensity = 1.2 + Math.sin(r.t * 12 + t.group.position.x) * 0.5;
        t.flame.scale.y = 0.85 + Math.sin(r.t * 15) * 0.2;
      }
    });

    if (r.tables[6]?.ghost) {
      // Solo al mirar fijamente se vuelve un poco más visible (sigue siendo sutil)
      const lookBoost = Math.min(1, r.table6Stare / 3);
      const g = r.tables[6].ghost;
      const pulse = Math.sin(r.t * 1.6) * 0.012;
      g.material.opacity = 0.035 + lookBoost * 0.14 + pulse;
      g.material.emissiveIntensity = 0.06 + lookBoost * 0.28;
      g.scale.setScalar(1 + lookBoost * 0.12);
      if (r.tables[6].ghostBody) {
        const body = r.tables[6].ghostBody;
        body.material.opacity = 0.025 + lookBoost * 0.1;
        body.material.emissiveIntensity = 0.04 + lookBoost * 0.18;
      }
    }

    if (r.customer?.traits?.redEyes) {
      const pulse = 1.2 + Math.sin(r.t * 6) * 0.6;
      r.eyeL.material.emissiveIntensity = pulse;
      r.eyeR.material.emissiveIntensity = pulse;
    }

    if (r.rainPoints) {
      const pos = r.rainPoints.geometry.attributes.position;
      for (const drop of r.rain) {
        let y = pos.getY(drop.i) - drop.speed * dt;
        if (y < 0.9) y = 2.5;
        pos.setY(drop.i, y);
      }
      pos.needsUpdate = true;
    }

    const dpos = r.dust.geometry.attributes.position;
    for (let i = 0; i < dpos.count; i++) {
      let y = dpos.getY(i) + 0.05 * dt;
      if (y > 2.9) y = 0.1;
      dpos.setY(i, y);
      dpos.setX(i, dpos.getX(i) + Math.sin(r.t + i) * 0.002);
    }
    dpos.needsUpdate = true;

    if (r.embers) {
      const ep = r.embers.geometry.attributes.position;
      for (const e of r.emberData) {
        let y = ep.getY(e.i) + e.speed * dt;
        let x = Math.sin(r.t * 2 + e.wobble) * 0.2;
        if (y > 1.8) {
          y = 0.45;
          x = (Math.random() - 0.5) * 0.4;
        }
        ep.setY(e.i, y);
        ep.setX(e.i, x);
      }
      ep.needsUpdate = true;
    }

    if (r.jumpscare > 0) {
      r.jumpscare -= dt;
      r.jumpGroup.visible = true;
      if (r.jumpVoid) r.jumpVoid.visible = true;
      const life = Math.max(0, r.jumpscare);
      // Ease-out: aparece cerca de inmediato y se abalanza
      const t = Math.min(1, (1.8 - life) / 1.8);
      const rush = 1 - (1 - t) * (1 - t);
      const z = -(2.55 - rush * 0.95);
      r.jumpGroup.position.set(
        Math.sin(r.t * 80) * 0.06,
        Math.sin(r.t * 45) * 0.04,
        z,
      );
      r.jumpGroup.rotation.set(0, 0, Math.sin(r.t * 60) * 0.08);
      r.jumpGroup.scale.setScalar(1.12 + rush * 0.28);
      if (r.jumpJaw) r.jumpJaw.rotation.x = -0.55 - Math.sin(r.t * 45) * 0.3;
      if (r.jumpEyeL) {
        const pulse = 1.0 + Math.sin(r.t * 55) * 0.4;
        r.jumpEyeL.scale.setScalar(pulse);
        r.jumpEyeR.scale.setScalar(pulse);
      }
      if (r.jumpMist) {
        r.jumpMist.material.opacity = 0.2 + Math.sin(r.t * 18) * 0.12;
      }
      if (r.jumpLight) {
        r.jumpLight.intensity = 14 + Math.sin(r.t * 70) * 8;
      }
      // Apagar luces de la sala para vacío negro
      if (r.lamp) r.lamp.intensity = 0;
      if (r.ambient) r.ambient.intensity = 0;
      if (r.hemi) r.hemi.intensity = 0;
      if (r.counterLight) r.counterLight.intensity = 0;
      if (r.backLight) r.backLight.intensity = 0;
      if (r.backLight2) r.backLight2.intensity = 0;
      if (r.customerLight) r.customerLight.intensity = 0;
      if (r.fill) r.fill.intensity = 0;
      if (r.ovenLight) r.ovenLight.intensity = 0;
      if (r.windowLight) r.windowLight.intensity = 0;
      if (r.spotLamp) r.spotLamp.intensity = 0;
      if (r.jumpscare <= 0) {
        r.clearJumpscare?.();
      }
    } else if (r.camera.rotation.z) {
      r.camera.rotation.z = 0;
    }

    if (r.lookEnabled && r.hoverTarget) {
      r.canvas.style.cursor = "pointer";
    } else {
      r.canvas.style.cursor = r.lookEnabled ? "crosshair" : "default";
    }
  }
