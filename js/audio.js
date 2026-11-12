/** Motor de audio procedural con Web Audio API */

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.ambientGain = null;
    this.sfxGain = null;
    this.scareGain = null;
    this.ambientNodes = [];
    this._nightTimer = null;
    this.enabled = false;
  }

  async init() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.4;
    this.master.connect(this.ctx.destination);

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.value = 0.95;
    this.ambientGain.connect(this.master);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.7;
    this.sfxGain.connect(this.master);

    // Bus del jumpscare: más alto y con compresión suave vía clamp del gain
    this.scareGain = this.ctx.createGain();
    this.scareGain.gain.value = 1.35;
    this.scareGain.connect(this.master);

    this.enabled = true;
  }

  resume() {
    if (this.ctx?.state === "suspended") this.ctx.resume();
  }

  _now() {
    return this.ctx.currentTime;
  }

  tone(freq, dur = 0.15, type = "sine", gain = 0.08, detune = 0, dest = null) {
    if (!this.enabled) return;
    const t = this._now();
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    o.detune.value = detune;
    g.gain.setValueAtTime(Math.max(0.0001, gain), t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g);
    g.connect(dest || this.sfxGain || this.master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  /** Ruido de un disparo (no loop). */
  _noiseBuffer(dur, color = "white") {
    const sr = this.ctx.sampleRate;
    const len = Math.max(1, Math.floor(sr * dur));
    const buf = this.ctx.createBuffer(1, len, sr);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      let n = Math.random() * 2 - 1;
      if (color === "brown") {
        last = (last + 0.02 * n) / 1.02;
        n = last * 3.5;
      } else if (color === "pink") {
        last = 0.98 * last + 0.02 * n;
        n = last * 2.5;
      }
      data[i] = Math.max(-1, Math.min(1, n));
    }
    return buf;
  }

  noiseBurst(dur = 0.2, gain = 0.12, opts = {}) {
    if (!this.enabled) return;
    const src = this.ctx.createBufferSource();
    const g = this.ctx.createGain();
    const f = this.ctx.createBiquadFilter();
    f.type = opts.filter || "bandpass";
    f.frequency.value = opts.freq ?? 800;
    f.Q.value = opts.Q ?? 1;
    src.buffer = this._noiseBuffer(dur, opts.color || "white");
    const t = this._now();
    g.gain.setValueAtTime(Math.max(0.0001, gain), t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(opts.dest || this.sfxGain || this.master);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  /** Distorsión suave → agresiva (WaveShaper). */
  _distortion(amount = 40) {
    const n = 256;
    const curve = new Float32Array(n);
    const k = amount;
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = ((Math.PI + k) * x) / (Math.PI + k * Math.abs(x));
    }
    const sh = this.ctx.createWaveShaper();
    sh.curve = curve;
    sh.oversample = "2x";
    return sh;
  }

  click() {
    this.tone(880, 0.05, "square", 0.04);
  }

  /** Hoja de papel al pasar / abrir carta o reglamento. */
  paperFlip() {
    if (!this.enabled) return;
    this.noiseBurst(0.12, 0.055, {
      freq: 2400, filter: "bandpass", Q: 0.7, color: "pink",
    });
    setTimeout(() => {
      this.noiseBurst(0.18, 0.07, {
        freq: 1600, filter: "bandpass", Q: 0.55, color: "pink",
      });
    }, 40);
    setTimeout(() => {
      this.noiseBurst(0.1, 0.035, {
        freq: 900, filter: "highpass", Q: 0.5, color: "white",
      });
    }, 90);
  }

  ring() {
    this.tone(740, 0.18, "square", 0.07);
    setTimeout(() => this.tone(880, 0.18, "square", 0.07), 180);
  }

  knock() {
    this.noiseBurst(0.08, 0.18, { freq: 200, filter: "lowpass" });
    this.tone(90, 0.12, "triangle", 0.12);
  }

  drip() {
    this.tone(1200 + Math.random() * 400, 0.04, "sine", 0.025);
  }

  /**
   * Acercamiento a la puerta del menú (~2.8 s):
   * viento que crece, pasos en el estacionamiento, zumbido del neón y llegada.
   */
  menuApproach(duration = 2.85) {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const t0 = this._now();
    const dur = Math.max(1.5, duration);

    // Viento / whoosh que aumenta al acercarse
    {
      const src = this.ctx.createBufferSource();
      src.buffer = this._noiseBuffer(dur + 0.4, "brown");
      const f = this.ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.setValueAtTime(220, t0);
      f.frequency.exponentialRampToValueAtTime(520, t0 + dur * 0.75);
      f.frequency.exponentialRampToValueAtTime(280, t0 + dur);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.001, t0);
      g.gain.exponentialRampToValueAtTime(0.16, t0 + dur * 0.55);
      g.gain.exponentialRampToValueAtTime(0.22, t0 + dur * 0.85);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur + 0.25);
      src.connect(f);
      f.connect(g);
      g.connect(this.sfxGain || this.master);
      src.start(t0);
      src.stop(t0 + dur + 0.3);
    }

    // Drone grave (tensión / caminar de noche)
    {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      const f = this.ctx.createBiquadFilter();
      o.type = "sine";
      o.frequency.setValueAtTime(46, t0);
      o.frequency.linearRampToValueAtTime(58, t0 + dur);
      f.type = "lowpass";
      f.frequency.value = 110;
      g.gain.setValueAtTime(0.001, t0);
      g.gain.exponentialRampToValueAtTime(0.05, t0 + dur * 0.4);
      g.gain.exponentialRampToValueAtTime(0.07, t0 + dur * 0.9);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur + 0.2);
      o.connect(f);
      f.connect(g);
      g.connect(this.sfxGain || this.master);
      o.start(t0);
      o.stop(t0 + dur + 0.25);
    }

    // Zumbido del neón acercándose
    {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = "sawtooth";
      o.frequency.value = 118;
      g.gain.setValueAtTime(0.001, t0);
      g.gain.exponentialRampToValueAtTime(0.012, t0 + dur * 0.5);
      g.gain.exponentialRampToValueAtTime(0.028, t0 + dur * 0.9);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur + 0.15);
      const f = this.ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = 240;
      f.Q.value = 4;
      o.connect(f);
      f.connect(g);
      g.connect(this.sfxGain || this.master);
      o.start(t0 + dur * 0.2);
      o.stop(t0 + dur + 0.2);
    }

    // Pasos en asfalto húmedo (ritmo de caminata)
    const stepTimes = [0.28, 0.62, 0.96, 1.28, 1.58, 1.88, 2.14, 2.38, 2.58];
    stepTimes.forEach((at, i) => {
      if (at > dur - 0.15) return;
      const delay = Math.max(0, (at - 0.02) * 1000);
      setTimeout(() => {
        if (!this.enabled) return;
        const vol = 0.055 + Math.min(0.07, i * 0.007);
        this.noiseBurst(0.09, vol, {
          freq: 95 + (i % 2) * 25,
          filter: "lowpass",
          color: "brown",
        });
        setTimeout(() => {
          this.noiseBurst(0.06, vol * 0.35, {
            freq: 180,
            filter: "bandpass",
            Q: 1.2,
            color: "pink",
          });
        }, 40);
      }, delay);
    });

    // Llegada a la puerta: madera / cristal + golpe suave
    setTimeout(() => {
      if (!this.enabled) return;
      this.noiseBurst(0.35, 0.1, {
        freq: 380,
        filter: "bandpass",
        Q: 2.2,
        color: "pink",
      });
      this.tone(160, 0.35, "triangle", 0.04, -18);
      setTimeout(() => {
        this.noiseBurst(0.12, 0.12, { freq: 110, filter: "lowpass", color: "brown" });
        this.tone(90, 0.22, "sine", 0.035);
      }, 120);
    }, Math.max(0, (dur - 0.35) * 1000));
  }

  /** Cliente entra: timbre + puerta + paso. */
  customerEnter() {
    if (!this.enabled) return;
    // Timbre de puerta
    this.tone(980, 0.12, "triangle", 0.09);
    setTimeout(() => this.tone(1310, 0.18, "triangle", 0.08), 90);
    // Chirrido de puerta
    setTimeout(() => {
      this.noiseBurst(0.35, 0.1, { freq: 450, filter: "bandpass", Q: 2, color: "pink" });
      this.tone(180, 0.28, "sawtooth", 0.045, -20);
    }, 120);
    // Pasos suaves
    setTimeout(() => this.noiseBurst(0.07, 0.08, { freq: 120, filter: "lowpass" }), 320);
    setTimeout(() => this.noiseBurst(0.06, 0.07, { freq: 100, filter: "lowpass" }), 480);
    setTimeout(() => this.noiseBurst(0.08, 0.09, { freq: 140, filter: "lowpass" }), 640);
  }

  /** Viento nocturno + capa grave (loop). Ambientación por defecto. */
  nightWindStart() {
    if (!this.enabled || this._wind) return;
    const t = this._now();
    const buf = this._noiseBuffer(4, "brown");
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 380;
    filter.Q.value = 0.7;

    const g = this.ctx.createGain();
    g.gain.value = 0.14;

    // LFO que mueve el filtro (ráfagas)
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.type = "sine";
    lfo.frequency.value = 0.07;
    lfoGain.gain.value = 220;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    // Capa de aullido lejano (oscilador muy grave)
    const moan = this.ctx.createOscillator();
    const moanG = this.ctx.createGain();
    const moanF = this.ctx.createBiquadFilter();
    moan.type = "sine";
    moan.frequency.value = 48;
    moanF.type = "lowpass";
    moanF.frequency.value = 90;
    moanG.gain.value = 0.032;
    const moanLfo = this.ctx.createOscillator();
    const moanLfoG = this.ctx.createGain();
    moanLfo.frequency.value = 0.04;
    moanLfoG.gain.value = 12;
    moanLfo.connect(moanLfoG);
    moanLfoG.connect(moan.frequency);

    src.connect(filter);
    filter.connect(g);
    g.connect(this.ambientGain || this.master);
    moan.connect(moanF);
    moanF.connect(moanG);
    moanG.connect(this.ambientGain || this.master);

    src.start(t);
    lfo.start(t);
    moan.start(t);
    moanLfo.start(t);

    this._wind = { src, lfo, moan, moanLfo, g };
    this.ambientNodes.push(src, lfo, moan, moanLfo);
    this._scheduleNightSounds();
  }

  /** Eventos sueltos de noche: grillos, búho, crujidos. */
  _scheduleNightSounds() {
    if (!this.enabled) return;
    const schedule = () => {
      if (!this.enabled || !this._wind) return;
      const roll = Math.random();
      if (roll < 0.35) this._crickets();
      else if (roll < 0.55) this._owl();
      else if (roll < 0.75) this._creak();
      else if (roll < 0.9) this._distantBark();
      else this._windGust();
      const wait = 2800 + Math.random() * 6500;
      this._nightTimer = setTimeout(schedule, wait);
    };
    this._nightTimer = setTimeout(schedule, 1500 + Math.random() * 2000);
  }

  _crickets() {
    const n = 3 + Math.floor(Math.random() * 5);
    for (let i = 0; i < n; i++) {
      setTimeout(() => {
        this.tone(4200 + Math.random() * 900, 0.035, "square", 0.012, Math.random() * 40, this.ambientGain);
      }, i * (55 + Math.random() * 40));
    }
  }

  _owl() {
    this.tone(420, 0.22, "sine", 0.035, 0, this.ambientGain);
    setTimeout(() => this.tone(310, 0.28, "sine", 0.03, -10, this.ambientGain), 260);
  }

  _creak() {
    this.noiseBurst(0.4, 0.06, {
      freq: 280 + Math.random() * 200,
      filter: "bandpass",
      Q: 4,
      color: "pink",
      dest: this.ambientGain,
    });
    this.tone(90 + Math.random() * 40, 0.35, "sawtooth", 0.02, -30, this.ambientGain);
  }

  _distantBark() {
    this.tone(160, 0.15, "triangle", 0.04, 0, this.ambientGain);
    setTimeout(() => this.tone(130, 0.2, "triangle", 0.03, -15, this.ambientGain), 140);
  }

  _windGust() {
    this.noiseBurst(1.2, 0.09, {
      freq: 500,
      filter: "lowpass",
      color: "brown",
      dest: this.ambientGain,
    });
  }

  /**
   * Grito demoníaco: formantes + vibrato + distorsión brutal + eco.
   */
  jumpscare() {
    if (!this.enabled) return;
    const t = this._now();
    const dest = this.scareGain || this.master;
    if (this.scareGain) this.scareGain.gain.value = 1.7;

    // Impacto de pecho
    this.tone(28, 0.7, "sine", 0.7, 0, dest);
    this.tone(42, 0.55, "sawtooth", 0.4, 0, dest);

    // --- Núcleo del grito (voz sintética inhumana) ---
    const fund = this.ctx.createOscillator();
    const harm = this.ctx.createOscillator();
    const sub = this.ctx.createOscillator();
    fund.type = "sawtooth";
    harm.type = "sawtooth";
    sub.type = "square";

    // Barrido tipo aullido: grave → agudo → grave
    fund.frequency.setValueAtTime(110, t);
    fund.frequency.exponentialRampToValueAtTime(520, t + 0.18);
    fund.frequency.exponentialRampToValueAtTime(380, t + 0.45);
    fund.frequency.exponentialRampToValueAtTime(90, t + 1.6);

    harm.frequency.setValueAtTime(220, t);
    harm.frequency.exponentialRampToValueAtTime(980, t + 0.2);
    harm.frequency.exponentialRampToValueAtTime(700, t + 0.5);
    harm.frequency.exponentialRampToValueAtTime(160, t + 1.55);
    harm.detune.value = 18;

    sub.frequency.setValueAtTime(55, t);
    sub.frequency.exponentialRampToValueAtTime(130, t + 0.25);
    sub.frequency.exponentialRampToValueAtTime(45, t + 1.5);

    // Vibrato demoníaco (LFO rápido e irregular)
    const vib = this.ctx.createOscillator();
    const vibG = this.ctx.createGain();
    vib.frequency.value = 7.5;
    vibG.gain.value = 55;
    vib.connect(vibG);
    vibG.connect(fund.frequency);
    vibG.connect(harm.frequency);

    // Formantes (bandas tipo vocal "AAA/EEE" distorsionada)
    const f1 = this.ctx.createBiquadFilter();
    const f2 = this.ctx.createBiquadFilter();
    const f3 = this.ctx.createBiquadFilter();
    f1.type = "bandpass"; f1.Q.value = 6;
    f2.type = "bandpass"; f2.Q.value = 5;
    f3.type = "bandpass"; f3.Q.value = 4;
    f1.frequency.setValueAtTime(600, t);
    f1.frequency.exponentialRampToValueAtTime(900, t + 0.3);
    f1.frequency.exponentialRampToValueAtTime(450, t + 1.4);
    f2.frequency.setValueAtTime(1400, t);
    f2.frequency.exponentialRampToValueAtTime(2200, t + 0.25);
    f2.frequency.exponentialRampToValueAtTime(1100, t + 1.4);
    f3.frequency.setValueAtTime(2800, t);
    f3.frequency.exponentialRampToValueAtTime(3500, t + 0.2);
    f3.frequency.exponentialRampToValueAtTime(1800, t + 1.3);

    const dist = this._distortion(120);
    const screamG = this.ctx.createGain();
    screamG.gain.setValueAtTime(0.001, t);
    screamG.gain.exponentialRampToValueAtTime(0.85, t + 0.06);
    screamG.gain.setValueAtTime(0.75, t + 0.5);
    screamG.gain.exponentialRampToValueAtTime(0.001, t + 1.7);

    // Eco cavernoso
    const delay = this.ctx.createDelay(1.0);
    delay.delayTime.value = 0.12;
    const delayG = this.ctx.createGain();
    delayG.gain.value = 0.45;
    const delay2 = this.ctx.createDelay(1.0);
    delay2.delayTime.value = 0.28;
    const delay2G = this.ctx.createGain();
    delay2G.gain.value = 0.28;

    const merge = this.ctx.createGain();
    merge.gain.value = 1;

    fund.connect(merge);
    harm.connect(merge);
    sub.connect(merge);
    merge.connect(f1);
    merge.connect(f2);
    merge.connect(f3);
    f1.connect(dist);
    f2.connect(dist);
    f3.connect(dist);
    dist.connect(screamG);
    screamG.connect(dest);
    screamG.connect(delay);
    delay.connect(delayG);
    delayG.connect(dest);
    screamG.connect(delay2);
    delay2.connect(delay2G);
    delay2G.connect(dest);

    fund.start(t); harm.start(t); sub.start(t); vib.start(t);
    fund.stop(t + 1.75); harm.stop(t + 1.75); sub.stop(t + 1.75); vib.stop(t + 1.75);

    // Ruido de garganta / raspado encima del grito
    const noise = this.ctx.createBufferSource();
    noise.buffer = this._noiseBuffer(1.6, "pink");
    const nF = this.ctx.createBiquadFilter();
    nF.type = "bandpass";
    nF.Q.value = 1.8;
    nF.frequency.setValueAtTime(1800, t);
    nF.frequency.exponentialRampToValueAtTime(900, t + 1.2);
    const nDist = this._distortion(90);
    const nG = this.ctx.createGain();
    nG.gain.setValueAtTime(0.001, t);
    nG.gain.exponentialRampToValueAtTime(0.55, t + 0.05);
    nG.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
    noise.connect(nF);
    nF.connect(nDist);
    nDist.connect(nG);
    nG.connect(dest);
    noise.start(t);
    noise.stop(t + 1.65);

    // Segundo aullido encima (más agudo, demonio)
    setTimeout(() => {
      if (!this.enabled) return;
      const o = this.ctx.createOscillator();
      const o2 = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      const d = this._distortion(100);
      const bp = this.ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 1600;
      bp.Q.value = 4;
      o.type = "sawtooth";
      o2.type = "square";
      const now = this._now();
      o.frequency.setValueAtTime(700, now);
      o.frequency.exponentialRampToValueAtTime(1400, now + 0.15);
      o.frequency.exponentialRampToValueAtTime(200, now + 0.9);
      o2.frequency.setValueAtTime(710, now);
      o2.frequency.exponentialRampToValueAtTime(1500, now + 0.12);
      o2.frequency.exponentialRampToValueAtTime(180, now + 0.85);
      g.gain.setValueAtTime(0.001, now);
      g.gain.exponentialRampToValueAtTime(0.6, now + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.95);
      o.connect(d); o2.connect(d);
      d.connect(bp); bp.connect(g); g.connect(dest);
      o.start(now); o2.start(now);
      o.stop(now + 1); o2.stop(now + 1);
    }, 220);

    // Chillido final rasgado
    setTimeout(() => {
      if (!this.enabled) return;
      this.tone(1800, 0.55, "sawtooth", 0.35, 120, dest);
      this.tone(2400, 0.4, "square", 0.2, -80, dest);
      this.noiseBurst(0.4, 0.35, { freq: 1200, filter: "bandpass", Q: 2, dest });
    }, 500);
  }

  winChime() {
    [523, 659, 784].forEach((f, i) => {
      setTimeout(() => this.tone(f, 0.35, "sine", 0.08), i * 160);
    });
  }

  /** Arranca la ambientación de turno (viento / noche). */
  startAmbience() {
    this.nightWindStart();
  }

  stopAmbient() {
    if (this._nightTimer) {
      clearTimeout(this._nightTimer);
      this._nightTimer = null;
    }
    this.ambientNodes.forEach((n) => {
      try { n.stop(); } catch (_) {}
    });
    this.ambientNodes = [];
    this._wind = null;
  }
}
