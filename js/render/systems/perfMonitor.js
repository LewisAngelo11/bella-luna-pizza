/**
 * Instrumentación de rendimiento (Babylon Scene + Engine).
 * Off por defecto. Activar con ?perf=1 o tecla P.
 * Al activar captura un baseline para comparar después de optimizaciones.
 */
/* global BABYLON */

const PERF_QUERY = "perf";

function isDevHost() {
  const h = location.hostname;
  return h === "localhost" || h === "127.0.0.1" || h === "";
}

function wantsPerfOnLoad() {
  const q = new URLSearchParams(location.search).get(PERF_QUERY);
  if (q === "1" || q === "true") return true;
  if (q === "0" || q === "false") return false;
  return false;
}

function ms(counter) {
  if (!counter) return null;
  const avg = counter.lastSecAverage;
  const cur = counter.current;
  // Preferir media del último segundo cuando ya hay muestras; si no, el valor actual.
  if (typeof avg === "number" && Number.isFinite(avg) && avg > 0) return avg;
  if (typeof cur === "number" && Number.isFinite(cur)) return cur;
  if (typeof avg === "number" && Number.isFinite(avg)) return avg;
  return null;
}

function perFrameCount(counter) {
  if (!counter) return null;
  const cur = counter.current;
  if (typeof cur === "number" && Number.isFinite(cur)) return cur;
  const avg = counter.lastSecAverage;
  if (typeof avg === "number" && Number.isFinite(avg)) return avg;
  return null;
}

function fmt(n, digits = 1) {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toFixed(digits);
}

function countShadowCasters(scene) {
  let n = 0;
  for (const light of scene.lights) {
    const gen = light.getShadowGenerator?.();
    if (!gen) continue;
    const list = gen.getShadowMap?.()?.renderList;
    if (list) n += list.length;
  }
  return n;
}

function countUniqueGeometries(scene) {
  const ids = new Set();
  for (const m of scene.meshes) {
    if (m.geometry) ids.add(m.geometry.uniqueId);
  }
  return ids.size;
}

function classifyBottleneck(frameMs, gpuMs, renderMs) {
  if (frameMs == null) return "—";
  if (gpuMs != null && gpuMs > 0) {
    if (gpuMs > frameMs * 0.55 && gpuMs > 8) return "GPU-bound (probable)";
    if (frameMs - gpuMs > 8 && frameMs > 12) return "CPU-bound (probable)";
    return "Equilibrado / indeterminado";
  }
  if (renderMs != null && renderMs > frameMs * 0.7 && frameMs > 12) {
    return "Render/CPU scene (sin GPU timer)";
  }
  return "Indeterminado (sin GPU timer)";
}

export class PerfMonitor {
  /**
   * @param {{ engine: any, scene: any }} opts
   */
  constructor({ engine, scene }) {
    this.engine = engine;
    this.scene = scene;
    this.enabled = false;
    this._sceneInst = null;
    this._engineInst = null;
    this._hud = null;
    this._lastUi = 0;
    this._fpsSamples = [];
    this.baseline = null;
    this._keyHandler = (e) => {
      if (e.code !== "KeyP" || e.repeat) return;
      if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
      // En producción solo si ya venía ?perf=1 o estamos en localhost
      if (!isDevHost() && !wantsPerfOnLoad() && !this.enabled) return;
      this.toggle();
    };
  }

  /** Llamar tras construir la escena. */
  attach() {
    window.addEventListener("keydown", this._keyHandler);
    if (wantsPerfOnLoad()) this.enable();
  }

  dispose() {
    window.removeEventListener("keydown", this._keyHandler);
    this.disable();
  }

  toggle() {
    if (this.enabled) this.disable();
    else this.enable();
  }

  enable() {
    if (this.enabled) return;
    this.enabled = true;

    const si = new BABYLON.SceneInstrumentation(this.scene);
    // Flags válidos en Babylon 7.49 (nombres exactos del runtime).
    si.captureFrameTime = true;
    si.captureRenderTime = true;
    si.captureInterFrameTime = true;
    si.captureDrawCallsCounter = true;
    si.captureActiveMeshesEvaluationTime = true;
    si.capturePhysicsTime = true;
    si.captureRenderTargetsRenderTime = true;
    si.captureParticlesRenderTime = true;
    si.captureCameraRenderTime = true;
    si.captureAnimationsTime = true;
    this._sceneInst = si;
    this._manualFrameMs = null;
    this._manualFrameAcc = [];

    const ei = new BABYLON.EngineInstrumentation(this.engine);
    ei.captureGPUFrameTime = true;
    this._engineInst = ei;

    this._ensureHud();
    this._hud.hidden = false;
    this._captureBaseline();
    this._renderHud(true);
  }

  disable() {
    if (!this.enabled && !this._hud) return;
    this.enabled = false;
    if (this._sceneInst) {
      this._sceneInst.dispose();
      this._sceneInst = null;
    }
    if (this._engineInst) {
      this._engineInst.dispose();
      this._engineInst = null;
    }
    if (this._hud) this._hud.hidden = true;
  }

  /**
   * Llamar cada frame de draw.
   * @param {{ manualFrameMs?: number }} [info]
   */
  sample(info = {}) {
    if (!this.enabled) return;
    if (typeof info.manualFrameMs === "number") {
      this._manualFrameMs = info.manualFrameMs;
      this._manualFrameAcc.push(info.manualFrameMs);
      if (this._manualFrameAcc.length > 60) this._manualFrameAcc.shift();
    }
    const fps = this.engine.getFps();
    this._fpsSamples.push(fps);
    if (this._fpsSamples.length > 120) this._fpsSamples.shift();

    const now = performance.now();
    if (now - this._lastUi < 250) return;
    this._lastUi = now;
    this._renderHud(false);
  }

  snapshot() {
    const si = this._sceneInst;
    const ei = this._engineInst;
    const sc = this.scene;
    const fps = this.engine.getFps();
    const avgFps = this._fpsSamples.length
      ? this._fpsSamples.reduce((a, b) => a + b, 0) / this._fpsSamples.length
      : fps;

    const instrFrameMs = ms(si?.frameTimeCounter);
    const manualAvg = this._manualFrameAcc.length
      ? this._manualFrameAcc.reduce((a, b) => a + b, 0) / this._manualFrameAcc.length
      : this._manualFrameMs;
    // Preferir wall-clock de scene.render; instrumentation a veces tarda en calentar.
    const frameMs = manualAvg ?? instrFrameMs;

    // GPU timer en Babylon suele venir en nanosegundos
    let gpuMs = ms(ei?.gpuFrameTimeCounter);
    if (gpuMs != null && gpuMs > 1000) gpuMs /= 1e6;

    const renderMs = ms(si?.renderTimeCounter);
    const meshEvalMs = ms(si?.activeMeshesEvaluationTimeCounter);
    const physicsMs = ms(si?.physicsTimeCounter);
    const rtMs = ms(si?.renderTargetsRenderTimeCounter);
    const particlesMs = ms(si?.particlesRenderTimeCounter);
    const cameraMs = ms(si?.cameraRenderTimeCounter);
    const animMs = ms(si?.animationsTimeCounter);

    const activeList = sc.getActiveMeshes?.();
    const activeMeshes = activeList?.length ?? activeList?.data?.length ?? null;

    return {
      fps: fps,
      fpsAvg: avgFps,
      frameMs,
      renderMs,
      meshSelectionMs: meshEvalMs,
      physicsMs,
      renderTargetsMs: rtMs,
      particlesMs,
      cameraMs,
      animationsMs: animMs,
      gpuMs,
      drawCalls: perFrameCount(si?.drawCallsCounter),
      activeMeshes,
      totalMeshes: sc.meshes.length,
      materials: sc.materials.length,
      textures: sc.textures.length,
      lights: sc.lights.length,
      activeLights: sc.lights.filter((l) => (l.intensity ?? 0) > 0.01).length,
      shadowCasters: countShadowCasters(sc),
      uniqueGeometries: countUniqueGeometries(sc),
      particles: sc.particleSystems?.length ?? 0,
      hwScale: this.engine.getHardwareScalingLevel(),
      bottleneck: classifyBottleneck(frameMs, gpuMs, renderMs),
      ts: Date.now(),
    };
  }

  _captureBaseline() {
    // Esperar ~1.2s para que lastSecAverage de SceneInstrumentation tenga muestras reales.
    const capture = () => {
      this.baseline = this.snapshot();
      try {
        sessionStorage.setItem("bella-luna-perf-baseline", JSON.stringify(this.baseline));
      } catch (_) { /* ignore */ }
      this._renderHud(true);
    };
    setTimeout(capture, 1200);
  }

  _ensureHud() {
    if (this._hud) return;
    const el = document.createElement("aside");
    el.id = "perf-hud";
    el.setAttribute("aria-live", "polite");
    el.innerHTML = `
      <header>
        <strong>PERF</strong>
        <span class="perf-hint">P = toggle · ?perf=1</span>
      </header>
      <pre class="perf-body"></pre>
      <footer class="perf-foot"></footer>
    `;
    document.body.appendChild(el);
    this._hud = el;
  }

  _renderHud(forceBaselineNote) {
    if (!this._hud || !this.enabled) return;
    const s = this.snapshot();
    const b = this.baseline;
    const delta = (key, digits = 1, invertGood = true) => {
      if (!b || s[key] == null || b[key] == null) return "";
      const d = s[key] - b[key];
      if (Math.abs(d) < 0.05) return " (=)";
      const better = invertGood ? d < 0 : d > 0;
      const sign = d > 0 ? "+" : "";
      return ` (${sign}${fmt(d, digits)}${better ? " ✓" : ""})`;
    };

    const body = this._hud.querySelector(".perf-body");
    const foot = this._hud.querySelector(".perf-foot");
    body.textContent = [
      `FPS          ${fmt(s.fps, 0)}   avg ${fmt(s.fpsAvg, 0)}`,
      `Frame        ${fmt(s.frameMs)} ms${delta("frameMs")}`,
      `Render       ${fmt(s.renderMs)} ms${delta("renderMs")}`,
      `Mesh eval    ${fmt(s.meshSelectionMs)} ms`,
      `RenderTargets${fmt(s.renderTargetsMs)} ms${delta("renderTargetsMs")}`,
      `Particles    ${fmt(s.particlesMs)} ms`,
      `Animations   ${fmt(s.animationsMs)} ms`,
      `Physics      ${fmt(s.physicsMs)} ms`,
      `GPU frame    ${fmt(s.gpuMs)} ms${delta("gpuMs")}`,
      ``,
      `Draw calls   ${s.drawCalls ?? "—"}${delta("drawCalls", 0)}`,
      `Active mesh  ${s.activeMeshes ?? "—"} / ${s.totalMeshes}`,
      `Materials    ${s.materials}   Tex ${s.textures}`,
      `Lights       ${s.activeLights}/${s.lights}`,
      `Shadow cast  ${s.shadowCasters}${delta("shadowCasters", 0)}`,
      `Unique geo   ${s.uniqueGeometries}${delta("uniqueGeometries", 0)}`,
      `Particlesys  ${s.particles}`,
      `HW scale     ${fmt(s.hwScale, 2)}`,
      ``,
      `Bottleneck   ${s.bottleneck}`,
    ].join("\n");

    foot.textContent = b
      ? `Baseline @ ${new Date(b.ts).toLocaleTimeString()} · Δ vs baseline en ( )`
      : forceBaselineNote
        ? "Capturando baseline…"
        : "Sin baseline";
  }
}
