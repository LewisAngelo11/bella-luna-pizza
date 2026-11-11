/** Motor de audio procedural con Web Audio API */

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.ambientNodes = [];
    this.enabled = false;
    this._hum = null;
  }

  async init() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.38;
    this.master.connect(this.ctx.destination);
    this.enabled = true;
  }

  resume() {
    if (this.ctx?.state === "suspended") this.ctx.resume();
  }

  tone(freq, dur = 0.15, type = "sine", gain = 0.08, detune = 0) {
    if (!this.enabled) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    o.detune.value = detune;
    g.gain.setValueAtTime(Math.max(0.0001, gain), t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  /** Ruido blanco con filtro y envolvente. */
  noiseBurst(dur = 0.2, gain = 0.12, opts = {}) {
    if (!this.enabled) return;
    const sr = this.ctx.sampleRate;
    const len = Math.floor(sr * dur);
    const buf = this.ctx.createBuffer(1, len, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const env = opts.fadeIn
        ? Math.min(1, i / (sr * 0.04)) * (1 - i / len)
        : 1 - i / len;
      data[i] = (Math.random() * 2 - 1) * env;
    }
    const src = this.ctx.createBufferSource();
    const g = this.ctx.createGain();
    const f = this.ctx.createBiquadFilter();
    f.type = opts.filter || "bandpass";
    f.frequency.value = opts.freq ?? 800;
    f.Q.value = opts.q ?? 1;
    src.buffer = buf;
    g.gain.value = gain;
    src.connect(f);
    f.connect(g);
    g.connect(this.master);
    src.start();
  }

  /** Buffer de ruido en loop (para viento / raspados). */
  _noiseLoop(seconds = 2) {
    const sr = this.ctx.sampleRate;
    const len = Math.floor(sr * seconds);
    const buf = this.ctx.createBuffer(1, len, sr);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      // Ruido rosa aproximado (más "aire" que blanco).
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
    return buf;
  }

  click() {
    this.tone(880, 0.05, "square", 0.04);
  }

  ring() {
    this.tone(740, 0.18, "square", 0.07);
    setTimeout(() => this.tone(880, 0.18, "square", 0.07), 180);
  }

  knock() {
    this.noiseBurst(0.08, 0.18, { filter: "lowpass", freq: 420, q: 0.7 });
    this.tone(90, 0.12, "triangle", 0.12);
  }

  /**
   * Ambiente nocturno: viento filtrado + gemido bajo muy lejano.
   * Sustituye el zumbido del horno.
   */
  ovenHumStart() {
    if (!this.enabled || this._hum) return;
    const t = this.ctx.currentTime;

    const windBuf = this._noiseLoop(3.5);
    const windSrc = this.ctx.createBufferSource();
    windSrc.buffer = windBuf;
    windSrc.loop = true;

    const windHp = this.ctx.createBiquadFilter();
    windHp.type = "highpass";
    windHp.frequency.value = 120;

    const windBp = this.ctx.createBiquadFilter();
    windBp.type = "bandpass";
    windBp.frequency.value = 380;
    windBp.Q.value = 0.55;

    const windGain = this.ctx.createGain();
    windGain.gain.value = 0.048;

    // LFO: el viento sube y baja (rafagas).
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.type = "sine";
    lfo.frequency.value = 0.07;
    lfoGain.gain.value = 160;
    lfo.connect(lfoGain);
    lfoGain.connect(windBp.frequency);

    const gust = this.ctx.createOscillator();
    const gustGain = this.ctx.createGain();
    gust.type = "sine";
    gust.frequency.value = 0.18;
    gustGain.gain.value = 0.018;
    gust.connect(gustGain);
    gustGain.connect(windGain.gain);

    windSrc.connect(windHp);
    windHp.connect(windBp);
    windBp.connect(windGain);
    windGain.connect(this.master);

    // Segundo capa: silbido fino ocasional.
    const hissSrc = this.ctx.createBufferSource();
    hissSrc.buffer = windBuf;
    hissSrc.loop = true;
    hissSrc.playbackRate.value = 1.35;
    const hissBp = this.ctx.createBiquadFilter();
    hissBp.type = "bandpass";
    hissBp.frequency.value = 1800;
    hissBp.Q.value = 1.2;
    const hissGain = this.ctx.createGain();
    hissGain.gain.value = 0.012;
    const hissLfo = this.ctx.createOscillator();
    const hissLfoG = this.ctx.createGain();
    hissLfo.type = "sine";
    hissLfo.frequency.value = 0.11;
    hissLfoG.gain.value = 0.01;
    hissLfo.connect(hissLfoG);
    hissLfoG.connect(hissGain.gain);
    hissSrc.connect(hissBp);
    hissBp.connect(hissGain);
    hissGain.connect(this.master);

    // Gemido lejano (casi inaudible, da cuerpo).
    const drone = this.ctx.createOscillator();
    const drone2 = this.ctx.createOscillator();
    const droneFilter = this.ctx.createBiquadFilter();
    const droneGain = this.ctx.createGain();
    drone.type = "sine";
    drone2.type = "triangle";
    drone.frequency.value = 48;
    drone2.frequency.value = 72.5;
    droneFilter.type = "lowpass";
    droneFilter.frequency.value = 140;
    droneGain.gain.value = 0.018;
    drone.connect(droneFilter);
    drone2.connect(droneFilter);
    droneFilter.connect(droneGain);
    droneGain.connect(this.master);

    windSrc.start(t);
    hissSrc.start(t);
    lfo.start(t);
    gust.start(t);
    hissLfo.start(t);
    drone.start(t);
    drone2.start(t);

    this._hum = { windSrc, hissSrc, lfo, gust, hissLfo, drone, drone2, windGain };
    this.ambientNodes.push(
      windSrc, hissSrc, lfo, gust, hissLfo, drone, drone2,
    );
  }

  /** Gota de lluvia lejana (sigue existiendo, más suave). */
  drip() {
    if (!this.enabled) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const f = this.ctx.createBiquadFilter();
    const g = this.ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(1400 + Math.random() * 600, t);
    o.frequency.exponentialRampToValueAtTime(400 + Math.random() * 200, t + 0.08);
    f.type = "bandpass";
    f.frequency.value = 2200;
    f.Q.value = 4;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.028, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    o.connect(f);
    f.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + 0.14);
  }

  /**
   * Grito demoníaco: formantes + raspado + caída de tono.
   */
  jumpscare() {
    if (!this.enabled) return;
    const t = this.ctx.currentTime;
    const dur = 1.05;

    // Impacto inicial (bocanada / choque).
    this.noiseBurst(0.22, 0.28, { filter: "bandpass", freq: 900, q: 0.8, fadeIn: false });
    this.noiseBurst(0.45, 0.14, { filter: "highpass", freq: 2400, q: 0.6 });

    // Cuerpo del grito: varias oscilaciones desentonadas (formantes).
    const formants = [
      { type: "sawtooth", f0: 420, f1: 95, gain: 0.12, detune: -18 },
      { type: "sawtooth", f0: 680, f1: 140, gain: 0.08, detune: 30 },
      { type: "square", f0: 980, f1: 210, gain: 0.05, detune: -40 },
      { type: "triangle", f0: 210, f1: 55, gain: 0.14, detune: 8 },
    ];

    const screamBus = this.ctx.createGain();
    screamBus.gain.setValueAtTime(0.0001, t);
    screamBus.gain.exponentialRampToValueAtTime(0.95, t + 0.03);
    screamBus.gain.setValueAtTime(0.95, t + 0.18);
    screamBus.gain.exponentialRampToValueAtTime(0.35, t + 0.55);
    screamBus.gain.exponentialRampToValueAtTime(0.001, t + dur);

    const band = this.ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.setValueAtTime(1400, t);
    band.frequency.exponentialRampToValueAtTime(520, t + 0.35);
    band.frequency.exponentialRampToValueAtTime(280, t + dur);
    band.Q.value = 1.4;

    const distort = this.ctx.createWaveShaper();
    distort.curve = this._makeDistortion(28);
    distort.oversample = "2x";

    screamBus.connect(band);
    band.connect(distort);
    distort.connect(this.master);

    for (const f of formants) {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = f.type;
      o.detune.value = f.detune;
      o.frequency.setValueAtTime(f.f0, t);
      o.frequency.exponentialRampToValueAtTime(f.f0 * 0.72, t + 0.12);
      o.frequency.exponentialRampToValueAtTime(f.f1, t + dur * 0.85);
      // Vibrato irregular (temblor de garganta).
      const vib = this.ctx.createOscillator();
      const vibG = this.ctx.createGain();
      vib.type = "sine";
      vib.frequency.value = 5.5 + Math.random() * 3;
      vibG.gain.value = 18 + Math.random() * 14;
      vib.connect(vibG);
      vibG.connect(o.frequency);
      g.gain.value = f.gain;
      o.connect(g);
      g.connect(screamBus);
      o.start(t);
      vib.start(t);
      o.stop(t + dur + 0.05);
      vib.stop(t + dur + 0.05);
    }

    // Raspado / fricción en la garganta.
    const gritBuf = this._noiseLoop(1.2);
    const grit = this.ctx.createBufferSource();
    grit.buffer = gritBuf;
    grit.loop = true;
    const gritF = this.ctx.createBiquadFilter();
    gritF.type = "bandpass";
    gritF.frequency.setValueAtTime(1600, t);
    gritF.frequency.exponentialRampToValueAtTime(500, t + 0.7);
    gritF.Q.value = 0.9;
    const gritG = this.ctx.createGain();
    gritG.gain.setValueAtTime(0.0001, t);
    gritG.gain.exponentialRampToValueAtTime(0.16, t + 0.04);
    gritG.gain.exponentialRampToValueAtTime(0.001, t + 0.85);
    grit.connect(gritF);
    gritF.connect(gritG);
    gritG.connect(this.master);
    grit.start(t);
    grit.stop(t + 0.9);

    // Subgrave (impacto en el pecho).
    const sub = this.ctx.createOscillator();
    const subG = this.ctx.createGain();
    sub.type = "sine";
    sub.frequency.setValueAtTime(55, t);
    sub.frequency.exponentialRampToValueAtTime(28, t + 0.7);
    subG.gain.setValueAtTime(0.0001, t);
    subG.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
    subG.gain.exponentialRampToValueAtTime(0.001, t + 0.75);
    sub.connect(subG);
    subG.connect(this.master);
    sub.start(t);
    sub.stop(t + 0.8);
  }

  _makeDistortion(amount = 20) {
    const n = 256;
    const curve = new Float32Array(n);
    const k = typeof amount === "number" ? amount : 20;
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = ((Math.PI + k) * x) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  /**
   * Voz genérica al aparecer un cliente: murmullo de formantes
   * (no dice palabras; suena a "hola" / "buenas" lejano).
   */
  customerVoice() {
    if (!this.enabled) return;
    const t = this.ctx.currentTime;
    const pitch = 140 + Math.random() * 90; // voz media, ligeramente variable
    const pattern = Math.random() < 0.5 ? "hello" : "mm";

    // Ruido de aliento (fricativo suave).
    this.noiseBurst(0.08, 0.04, { filter: "bandpass", freq: 2800, q: 1.2, fadeIn: true });

    if (pattern === "hello") {
      // Dos sílabas: "heh" → "oh"
      this._vowel(t + 0.02, pitch * 1.15, 0.12, 0.055, [500, 1600, 2500]);
      this._vowel(t + 0.16, pitch * 0.92, 0.2, 0.07, [450, 900, 2400]);
    } else {
      // Murmullo nasal corto + sílaba abierta.
      this._vowel(t + 0.02, pitch * 0.95, 0.14, 0.045, [300, 1100, 2200]);
      this._vowel(t + 0.18, pitch * 1.05, 0.16, 0.06, [520, 1200, 2450]);
    }

    // Pequeño tap de pasos / ropa (presencia física).
    setTimeout(() => {
      this.noiseBurst(0.05, 0.03, { filter: "lowpass", freq: 500, q: 0.6 });
    }, 40);
  }

  /** Formantes simples (F1/F2/F3) para una vocal. */
  _vowel(t, f0, dur, gain, formants) {
    const bus = this.ctx.createGain();
    bus.gain.setValueAtTime(0.0001, t);
    bus.gain.exponentialRampToValueAtTime(gain, t + 0.02);
    bus.gain.exponentialRampToValueAtTime(0.001, t + dur);
    bus.connect(this.master);

    // Fuente glótica (diente de sierra filtrada).
    const src = this.ctx.createOscillator();
    src.type = "sawtooth";
    src.frequency.value = f0;
    // Contorno leve de pitch (entonación).
    src.frequency.setValueAtTime(f0, t);
    src.frequency.linearRampToValueAtTime(f0 * (0.96 + Math.random() * 0.08), t + dur);

    for (let i = 0; i < formants.length; i++) {
      const bp = this.ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = formants[i];
      bp.Q.value = 8 + i * 2;
      const g = this.ctx.createGain();
      g.gain.value = 1 / (i + 1.2);
      src.connect(bp);
      bp.connect(g);
      g.connect(bus);
    }

    src.start(t);
    src.stop(t + dur + 0.03);
  }

  winChime() {
    [523, 659, 784].forEach((f, i) => {
      setTimeout(() => this.tone(f, 0.35, "sine", 0.08), i * 160);
    });
  }

  stopAmbient() {
    this.ambientNodes.forEach((n) => {
      try { n.stop(); } catch (_) { /* already stopped */ }
    });
    this.ambientNodes = [];
    this._hum = null;
  }
}
