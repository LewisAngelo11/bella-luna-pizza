/** Escalado de resolución adaptativo según FPS medio. */
export function adaptQuality(r, dt) {
  r._fpsAcc += dt;
  r._fpsFrames++;
  if (r._fpsAcc < 1) return;
  const fps = r._fpsFrames / r._fpsAcc;
  r._fpsAcc = 0;
  r._fpsFrames = 0;
  if (fps < 28) r._scale = Math.min(2.0, r._scale + 0.1);
  else if (fps > 50) r._scale = Math.max(1.15, r._scale - 0.05);
  r.engine.setHardwareScalingLevel(r._scale);
}
