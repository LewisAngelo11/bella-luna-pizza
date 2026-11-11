/** Motor de audio procedural con Web Audio API */

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.ambientNodes = [];
    this.enabled = false;
  }

  async init() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.35;
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
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  noiseBurst(dur = 0.2, gain = 0.12) {
    if (!this.enabled) return;
    const sr = this.ctx.sampleRate;
    const len = Math.floor(sr * dur);
    const buf = this.ctx.createBuffer(1, len, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    }
    const src = this.ctx.createBufferSource();
    const g = this.ctx.createGain();
    const f = this.ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 800;
    src.buffer = buf;
    g.gain.value = gain;
    src.connect(f);
    f.connect(g);
    g.connect(this.master);
    src.start();
  }

  click() {
    this.tone(880, 0.05, "square", 0.04);
  }

  ring() {
    this.tone(740, 0.18, "square", 0.07);
    setTimeout(() => this.tone(880, 0.18, "square", 0.07), 180);
  }

  knock() {
    this.noiseBurst(0.08, 0.18);
    this.tone(90, 0.12, "triangle", 0.12);
  }

  ovenHumStart() {
    if (!this.enabled || this._hum) return;
    const o = this.ctx.createOscillator();
    const o2 = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = "sawtooth";
    o2.type = "sine";
    o.frequency.value = 55;
    o2.frequency.value = 110;
    g.gain.value = 0.025;
    o.connect(g);
    o2.connect(g);
    g.connect(this.master);
    o.start();
    o2.start();
    this._hum = { o, o2, g };
    this.ambientNodes.push(o, o2);
  }

  drip() {
    this.tone(1200 + Math.random() * 400, 0.04, "sine", 0.03);
  }

  jumpscare() {
    if (!this.enabled) return;
    this.noiseBurst(0.45, 0.35);
    this.tone(40, 0.6, "sawtooth", 0.22);
    this.tone(55, 0.5, "square", 0.12, 30);
  }

  winChime() {
    [523, 659, 784].forEach((f, i) => {
      setTimeout(() => this.tone(f, 0.35, "sine", 0.08), i * 160);
    });
  }

  stopAmbient() {
    this.ambientNodes.forEach((n) => {
      try { n.stop(); } catch (_) {}
    });
    this.ambientNodes = [];
    this._hum = null;
  }
}
