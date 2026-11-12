import {
  RULES,
  NORMAL_CUSTOMERS,
  ANOMALIES,
  ACTIONS,
  DEATHS,
} from "./rules.js";
import { Renderer } from "./renderer.js";
import { AudioEngine } from "./audio.js";

export class Game {
  constructor() {
    this.canvas = document.getElementById("game");
    this.renderer = new Renderer(this.canvas);
    this.audio = new AudioEngine();

    this.playing = false;
    this.timeMinutes = 22 * 60; // 22:00
    this.endMinutes = 6 * 60 + 24 * 60; // 06:00 next day as absolute
    this.fear = 0; // 0 = sane, 100 = break
    this.doorLocked = true;
    this.freezerOpen = false;
    this.freezerKnock = false;
    this.freezerKnockTimer = 0;
    this.lookingTable6 = false;
    this.table6Timer = 0;
    this.flickerIntensity = 0;
    this.flickerTimer = 0;
    this.eyesClosed = false;
    this.eyesClosedNeeded = false;
    this.currentCustomer = null;
    this.customerQueueTimer = 8;
    this.phoneActive = false;
    this.phoneRings = 0;
    this.phoneTimer = 0;
    this.phoneNextIn = 45;
    this.eventCooldown = 0;
    this.bannerTimer = 0;
    this.servedCount = 0;
    this.refusedCount = 0;
    this.hoverTable6 = false;
    this.lastTs = 0;
    this.dripTimer = 0;

    this.briefingOnly = false;
    this.paused = false;
    this.bindUI();
    this.populateRules();
    this.showScreen("menu");
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  populateRules() {
    const list = document.getElementById("rules-list");
    const mini = document.getElementById("rules-mini");
    list.innerHTML = RULES.map((r) => `<li>${r.text}</li>`).join("");
    mini.innerHTML = RULES.map((r) => `<li>${r.text}</li>`).join("");
  }

  bindUI() {
    document.getElementById("btn-start").onclick = () => this.beginBriefing(false);
    document.getElementById("btn-rules-preview").onclick = () => this.beginBriefing(true);
    document.getElementById("btn-letter-next").onclick = () => this.showScreen("intro");
    document.getElementById("btn-intro-next").onclick = () => {
      this.updateRulesButtons();
      this.showScreen("rules");
    };
    document.getElementById("btn-close-rules").onclick = () => {
      if (this.playing) {
        this.showScreen("hud");
        return;
      }
      if (this.briefingOnly) {
        this.showScreen("menu");
        return;
      }
      this.startShift();
    };
    document.getElementById("btn-rules-back-menu").onclick = () => this.showScreen("menu");
    document.getElementById("btn-restart").onclick = () => this.beginBriefing(false);
    document.getElementById("btn-menu").onclick = () => {
      this.playing = false;
      this.paused = false;
      this.showScreen("menu");
    };

    document.getElementById("btn-pause").onclick = () => this.pauseGame();
    document.getElementById("btn-resume").onclick = () => this.resumeGame();
    document.getElementById("btn-pause-quit").onclick = () => this.quitToMenu();

    document.getElementById("btn-toggle-rules").onclick = () => this.toggleRulesPanel();
    document.getElementById("btn-check-freezer").onclick = () => this.checkFreezer();
    document.getElementById("btn-lock-door").onclick = () => this.toggleDoor();
    document.getElementById("btn-look-back").onclick = () => {
      if (!this.playing) return;
      const behind = this.renderer.toggleLookingBehind();
      this.audio.click();
      this.showBanner(behind ? "Mirando hacia la puerta trasera." : "Mirando la sala.");
    };
    document.getElementById("btn-close-eyes").onmousedown = () => this.setEyesClosed(true);
    document.getElementById("btn-close-eyes").onmouseup = () => this.setEyesClosed(false);
    document.getElementById("btn-close-eyes").onmouseleave = () => this.setEyesClosed(false);

    document.querySelectorAll("[data-phone]").forEach((btn) => {
      btn.onclick = () => this.handlePhone(btn.dataset.phone);
    });

    window.addEventListener("keydown", (e) => {
      if (e.code === "Escape") {
        e.preventDefault();
        if (this.paused) this.resumeGame();
        else if (this.playing) this.pauseGame();
        return;
      }
      if (!this.playing || this.paused) return;
      if (e.code === "KeyR") this.toggleRulesPanel();
      if (e.code === "KeyF") this.checkFreezer();
      if (e.code === "KeyD") this.toggleDoor();
      if (e.code === "Space") {
        e.preventDefault();
        this.setEyesClosed(true);
      }
    });
    window.addEventListener("keyup", (e) => {
      if (e.code === "Space") this.setEyesClosed(false);
    });

    // Look suave + clicks en el mundo 3D
    window.addEventListener("mousemove", (e) => this.onPointer(e, false));
    this.canvas.addEventListener("mousedown", (e) => this.onPointer(e, true));
    this.canvas.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      if (!this.playing) return;
      const behind = this.renderer.toggleLookingBehind();
      this.audio.click();
      this.showBanner(
        behind
          ? "Te giras. La puerta trasera queda frente a ti. [Click o D]"
          : "Vuelves a mirar la sala."
      );
    });
  }

  onPointer(e, click) {
    this.renderer.setPointer(e.clientX, e.clientY, this.playing && !this.paused);
    if (!this.playing || this.paused) {
      this.lookingTable6 = false;
      this.hoverTable6 = false;
      return;
    }
    const over = this.renderer.isOverTable6();
    this.hoverTable6 = over;
    this.lookingTable6 = over;

    if (!click) return;
    if (e.button === 2) return; // click derecho lo maneja contextmenu

    const target = this.renderer.getHoverTarget();
    if (target === "freezer") {
      this.checkFreezer(true);
      return;
    }
    if (target === "door") {
      this.toggleDoor();
      return;
    }
    if (target === "table6") {
      this.showBanner("Estás mirando la Mesa 6…");
    }
  }

  beginBriefing(previewOnly) {
    this.briefingOnly = !!previewOnly;
    this.audio?.click?.();
    this.updateRulesButtons();
    this.showScreen("letter");
  }

  updateRulesButtons() {
    const startBtn = document.getElementById("btn-close-rules");
    const backBtn = document.getElementById("btn-rules-back-menu");
    if (this.briefingOnly) {
      startBtn.textContent = "Volver al menú";
      backBtn.classList.add("hidden");
    } else if (this.playing) {
      startBtn.textContent = "Cerrar";
      backBtn.classList.add("hidden");
    } else {
      startBtn.textContent = "Empezar el turno";
      backBtn.classList.add("hidden");
    }
  }

  showScreen(name) {
    ["menu", "letter", "intro", "rules", "hud", "pause", "end"].forEach((id) => {
      document.getElementById(`screen-${id}`).classList.toggle("active", id === name);
    });
  }

  pauseGame() {
    if (!this.playing || this.paused) return;
    this.paused = true;
    this.setEyesClosed(false);
    this.audio?.click?.();
    // Mantener HUD debajo; la pausa se superpone
    document.getElementById("screen-hud").classList.add("active");
    document.getElementById("screen-pause").classList.add("active");
  }

  resumeGame() {
    if (!this.paused) return;
    this.paused = false;
    this.audio?.click?.();
    document.getElementById("screen-pause").classList.remove("active");
    this.showScreen("hud");
  }

  quitToMenu() {
    this.paused = false;
    this.playing = false;
    this.setEyesClosed(false);
    this.renderer.setCustomer(null);
    this.hideCustomerPanel();
    this.hidePhone();
    this.audio?.click?.();
    this.audio?.stopAmbient?.();
    this.showScreen("menu");
  }

  async startShift() {
    await this.audio.init();
    this.audio.resume();
    this.audio.ovenHumStart();

    this.playing = true;
    this.paused = false;
    this.timeMinutes = 22 * 60;
    this.fear = 0;
    this.doorLocked = true;
    this.freezerOpen = false;
    this.freezerKnock = false;
    this.freezerKnockTimer = 25 + Math.random() * 40;
    this.lookingTable6 = false;
    this.renderer.setLookingBehind(false);
    this.renderer.setFreezerOpen(false);
    this.table6Timer = 0;
    this.flickerIntensity = 0;
    this.flickerTimer = 35 + Math.random() * 40;
    this.eyesClosed = false;
    this.eyesClosedNeeded = false;
    this.currentCustomer = null;
    this.customerQueueTimer = 6;
    this.phoneActive = false;
    this.phoneRings = 0;
    this.phoneTimer = 0;
    this.phoneNextIn = 50 + Math.random() * 40;
    this.eventCooldown = 0;
    this.bannerTimer = 0;
    this.servedCount = 0;
    this.refusedCount = 0;
    this.renderer.setCustomer(null);
    this.hideCustomerPanel();
    this.hidePhone();
    document.getElementById("eyes-closed").classList.add("hidden");
    document.getElementById("rules-panel").classList.remove("open");
    this.updateFearUI();
    this.updateClockUI();
    this.showScreen("hud");
    this.showBanner("Turno iniciado. Click derecho: mirar atrás. Click: congelador/puerta.");
  }

  toggleRulesPanel() {
    document.getElementById("rules-panel").classList.toggle("open");
    this.audio.click();
  }

  setEyesClosed(v) {
    if (!this.playing) return;
    this.eyesClosed = v;
    document.getElementById("eyes-closed").classList.toggle("hidden", !v);
  }

  checkFreezer(fromClick = false) {
    if (!this.playing) return;
    this.audio.click();

    // Abrir mientras hay golpes = muerte
    if (!this.freezerOpen && this.freezerKnock) {
      this.renderer.setFreezerOpen(true);
      this.freezerOpen = true;
      this.die("freezer_opened");
      return;
    }

    this.freezerOpen = !this.freezerOpen;
    this.renderer.setFreezerOpen(this.freezerOpen);

    if (this.freezerOpen) {
      this.showBanner(
        fromClick
          ? "Abres el congelador. Escarcha, paquetes… y un silencio demasiado denso."
          : "Abres el congelador. [F] o click para cerrar."
      );
      this.addFear(4);
    } else {
      this.showBanner("Cierras el congelador. Mejor así.");
      this.addFear(-1);
    }
  }

  toggleDoor() {
    if (!this.playing) return;
    this.audio.click();
    this.doorLocked = !this.doorLocked;
    this.showBanner(
      this.doorLocked
        ? "Cierras la puerta trasera y echas el cerrojo."
        : "Abres la puerta trasera. La noche se siente más cerca."
    );
  }

  showBanner(text, dur = 3.2) {
    const el = document.getElementById("event-banner");
    el.textContent = text;
    el.classList.remove("hidden");
    this.bannerTimer = dur;
  }

  hideCustomerPanel() {
    document.getElementById("customer-panel").classList.add("hidden");
    document.getElementById("action-buttons").innerHTML = "";
  }

  hidePhone() {
    document.getElementById("phone-ui").classList.add("hidden");
  }

  spawnCustomer() {
    if (this.currentCustomer || this.phoneActive) return;

    const hour = this.getDisplayHour();
    const pastMidnight = hour >= 0 && hour < 6;
    const beforeMidnight = hour >= 22 && hour < 24;
    const isDeepNight = pastMidnight || hour >= 23;

    const anomalyChance = 0.3 + (isDeepNight ? 0.28 : 0) + this.fear * 0.002;
    let customer;

    if (Math.random() < anomalyChance) {
      const pool = ANOMALIES.filter((a) => {
        if (a.requiresAfterMidnight && !pastMidnight) return false;
        if (a.requiresBeforeMidnight && !beforeMidnight) return false;
        return true;
      });
      if (pool.length) {
        const pick = pool[Math.floor(Math.random() * pool.length)];
        customer = { ...pick, anomaly: true };
      }
    }

    if (!customer) {
      const pick = NORMAL_CUSTOMERS[Math.floor(Math.random() * NORMAL_CUSTOMERS.length)];
      customer = { ...pick, anomaly: false };
    }

    this.currentCustomer = customer;
    this.renderer.setCustomer(customer);
    this.showCustomerUI(customer);
    this.audio.tone(220, 0.1, "triangle", 0.05);
    this.showBanner("Alguien se acerca al mostrador…");
  }

  showCustomerUI(customer) {
    const panel = document.getElementById("customer-panel");
    panel.classList.remove("hidden");
    document.getElementById("customer-desc").textContent = customer.desc;
    document.getElementById("customer-order").textContent = customer.order;

    const actions = ["serve_pizza", "serve_garlic", "serve_lookaway", "refuse"];
    const box = document.getElementById("action-buttons");
    box.innerHTML = "";
    actions.forEach((key) => {
      const a = ACTIONS[key];
      const btn = document.createElement("button");
      btn.className = "btn small";
      btn.textContent = `${a.icon} ${a.label}`;
      btn.onclick = () => this.resolveCustomer(key);
      box.appendChild(btn);
    });
  }

  resolveCustomer(action) {
    const c = this.currentCustomer;
    if (!c) return;
    this.audio.click();

    const correct = c.correct;
    let ok = action === correct;

    // casos especiales: servir pizza a ojos rojos es malo, etc. ya cubierto por correct

    if (ok) {
      if (action === "refuse" || action === "serve_lookaway" || action === "serve_garlic") {
        this.refusedCount++;
        this.showBanner(c.anomaly ? "Hiciste lo correcto. Se va… despacio." : "Pedido atendido.");
        this.addFear(-3);
      } else {
        this.servedCount++;
        this.showBanner("Pedido servido. El horno crepita.");
        this.addFear(-2);
      }
      this.clearCustomer();
    } else {
      if (c.anomaly && c.wrongDeath) {
        this.die("customer", c.wrongDeath, `Regla relacionada: ${c.ruleBroken || "juicio"}`);
      } else {
        this.showBanner("Eso no era lo que pedían… sientes que algo se tensa en el aire.");
        this.addFear(18);
        this.flashBlood();
        this.clearCustomer();
        if (this.fear >= 100) this.die("fear");
      }
    }
  }

  clearCustomer() {
    this.currentCustomer = null;
    this.renderer.setCustomer(null);
    this.hideCustomerPanel();
    this.customerQueueTimer = 10 + Math.random() * 14;
  }

  startPhone() {
    if (this.phoneActive || this.currentCustomer) return;
    this.phoneActive = true;
    this.phoneRings = 1;
    this.phoneTimer = 0;
    document.getElementById("phone-ui").classList.remove("hidden");
    document.getElementById("ring-count").textContent = "1";
    this.audio.ring();
    this.showBanner("El teléfono del mostrador…");
  }

  handlePhone(action) {
    if (!this.phoneActive) return;
    this.audio.click();
    const rings = this.phoneRings;

    // Regla: 2 timbres → contestar; 3 → colgar
    if (action === "answer") {
      if (rings === 2) {
        this.showBanner("Una voz lejana: «Gracias por respetar las reglas.» Cuelga.");
        this.addFear(-4);
        this.endPhone();
      } else {
        this.die("phone_wrong");
      }
    } else if (action === "hang") {
      if (rings === 3) {
        this.showBanner("Cuelgas a tiempo. El silencio es una bendición.");
        this.addFear(-3);
        this.endPhone();
      } else {
        this.die("phone_wrong");
      }
    }
  }

  endPhone() {
    this.phoneActive = false;
    this.phoneRings = 0;
    this.hidePhone();
    this.phoneNextIn = 55 + Math.random() * 50;
  }

  addFear(n) {
    this.fear = Math.max(0, Math.min(100, this.fear + n));
    this.updateFearUI();
  }

  updateFearUI() {
    const fill = document.getElementById("fear-fill");
    // cordura = 100 - fear
    fill.style.transform = `scaleX(${(100 - this.fear) / 100})`;
  }

  getDisplayHour() {
    // returns hour in 0-23, minutes as decimal optionally via getHourDecimal
    let m = this.timeMinutes;
    if (m >= 24 * 60) m -= 24 * 60;
    return Math.floor(m / 60);
  }

  getHourDecimal() {
    let m = this.timeMinutes;
    if (m >= 24 * 60) m -= 24 * 60;
    return m / 60;
  }

  updateClockUI() {
    let m = this.timeMinutes;
    if (m >= 24 * 60) m -= 24 * 60;
    const hh = String(Math.floor(m / 60)).padStart(2, "0");
    const mm = String(Math.floor(m % 60)).padStart(2, "0");
    document.getElementById("clock").textContent = `${hh}:${mm}`;
  }

  flashBlood() {
    const el = document.getElementById("blood-flash");
    el.classList.add("on");
    setTimeout(() => el.classList.remove("on"), 200);
  }

  die(kind, customMsg, customDetail) {
    this.playing = false;
    this.paused = false;
    document.getElementById("screen-pause").classList.remove("active");
    this.audio.jumpscare();
    this.renderer.triggerJumpscare();
    this.flashBlood();

    const d = DEATHS[kind] || DEATHS.fear;
    const title = document.getElementById("end-title");
    title.textContent = d.title;
    title.classList.remove("win");
    document.getElementById("end-message").textContent = customMsg || d.message;
    document.getElementById("end-detail").textContent = customDetail || d.detail;

    setTimeout(() => this.showScreen("end"), 900);
  }

  win() {
    this.playing = false;
    this.paused = false;
    document.getElementById("screen-pause").classList.remove("active");
    this.audio.winChime();
    const d = DEATHS.win;
    const title = document.getElementById("end-title");
    title.textContent = d.title;
    title.classList.add("win");
    document.getElementById("end-message").textContent = d.message;
    document.getElementById("end-detail").textContent =
      `${d.detail} Atendiste ${this.servedCount} pedidos y rechazaste ${this.refusedCount} amenazas.`;
    this.showScreen("end");
  }

  update(dt) {
    if (!this.playing || this.paused) {
      this.renderer.update(dt, {
        flickerIntensity: this.paused ? 0.08 : 0.05,
        lookingTable6: false,
        doorLocked: this.doorLocked ?? true,
        freezerKnock: false,
        freezerOpen: this.freezerOpen ?? false,
        hourDecimal: this.playing ? this.getHourDecimal() : 23,
        hoverTable6: false,
      });
      return;
    }

    // 8 horas de turno (~22:00→06:00) en ~4.5 minutos reales
    const timeScale = 1.8;
    this.timeMinutes += dt * timeScale;

    // victoria a las 6:00
    if (this.timeMinutes >= 24 * 60 + 6 * 60) {
      this.win();
      return;
    }

    this.updateClockUI();

    // Mesa 6
    if (this.lookingTable6 && !this.eyesClosed) {
      this.table6Timer += dt;
      if (this.table6Timer >= 3) {
        this.die("table6");
        return;
      }
      if (this.table6Timer > 1.5) {
        this.showBanner(`Aparta la vista de la Mesa 6… (${(3 - this.table6Timer).toFixed(1)}s)`);
      }
    } else {
      this.table6Timer = Math.max(0, this.table6Timer - dt * 1.5);
    }

    // Puerta trasera después de 02:00
    const hour = this.getDisplayHour();
    const past2 = hour >= 2 && hour < 6;
    if (past2 && !this.doorLocked) {
      this.eventCooldown += dt;
      if (this.eventCooldown > 4) {
        this.die("door_unlocked");
        return;
      }
    } else {
      this.eventCooldown = 0;
    }

    // Congelador
    if (!this.freezerKnock) {
      this.freezerKnockTimer -= dt;
      if (this.freezerKnockTimer <= 0) {
        if (this.freezerOpen) {
          // Lo dejaste abierto: lo que golpeaba ya no necesita permiso
          this.die("freezer_opened");
          return;
        }
        this.freezerKnock = true;
        this._knockLeft = 8 + Math.random() * 6;
        this.showBanner("…golpes sordos desde el congelador. No lo abras.");
        this.audio.knock();
      }
    } else {
      if (Math.random() < 0.04) this.audio.knock();
      this._knockLeft -= dt;
      if (this._knockLeft <= 0) {
        this.freezerKnock = false;
        this.freezerKnockTimer = 40 + Math.random() * 50;
        this.showBanner("Los golpes cesan. No abras esa puerta.");
      }
    }

    // Flicker de luces
    this.flickerTimer -= dt;
    if (this.flickerTimer <= 0 && this.flickerIntensity === 0) {
      this.flickerIntensity = 1;
      this.eyesClosedNeeded = true;
      this._flickerLeft = 3.5 + Math.random() * 1.5;
      this.showBanner("Las luces parpadean. Cierra los ojos. [Espacio]");
      this.audio.noiseBurst(0.15, 0.1);
    }
    if (this.flickerIntensity > 0) {
      this._flickerLeft -= dt;
      if (!this.eyesClosed) {
        this._flickerUnsafe = (this._flickerUnsafe ?? 0) + dt;
        if (this._flickerUnsafe > 1.6) {
          this.die("flicker_eyes");
          return;
        }
      } else {
        this._flickerUnsafe = 0;
      }
      if (this._flickerLeft <= 0) {
        this.flickerIntensity = 0;
        this.eyesClosedNeeded = false;
        this._flickerUnsafe = 0;
        this.flickerTimer = 30 + Math.random() * 45;
        if (this.eyesClosed) this.showBanner("Las luces se estabilizan. Puedes abrir los ojos.");
      }
    }

    // Teléfono
    if (!this.phoneActive) {
      this.phoneNextIn -= dt;
      if (this.phoneNextIn <= 0) this.startPhone();
    } else {
      this.phoneTimer += dt;
      if (this.phoneTimer >= 1.8 && this.phoneRings < 3) {
        this.phoneRings++;
        this.phoneTimer = 0;
        document.getElementById("ring-count").textContent = String(this.phoneRings);
        this.audio.ring();
      }
      if (this.phoneRings >= 3 && this.phoneTimer > 2.5) {
        // no actuó a tiempo tras el 3er timbre
        this.die("phone_wrong");
        return;
      }
    }

    // Clientes
    if (!this.currentCustomer && !this.phoneActive) {
      this.customerQueueTimer -= dt;
      if (this.customerQueueTimer <= 0) this.spawnCustomer();
    }

    // ambient
    this.dripTimer -= dt;
    if (this.dripTimer <= 0) {
      this.audio.drip();
      this.dripTimer = 2 + Math.random() * 5;
    }

    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
      if (this.bannerTimer <= 0) {
        document.getElementById("event-banner").classList.add("hidden");
      }
    }

    const note = document.getElementById("ambient-note");
    if (this.freezerKnock) note.textContent = "Algo golpea el metal del congelador…";
    else if (this.flickerIntensity > 0) note.textContent = "El neón chisporrotea.";
    else if (hour >= 0 && hour < 4) note.textContent = "La lluvia no debería sonar así.";
    else note.textContent = "Huele a orégano y a algo más viejo.";

    document.getElementById("shift-status").textContent =
      hour >= 0 && hour < 6 ? "MADRUGADA" : "ABIERTO";

    this.renderer.update(dt, {
      flickerIntensity: this.flickerIntensity,
      lookingTable6: this.lookingTable6,
      doorLocked: this.doorLocked,
      freezerKnock: this.freezerKnock,
      freezerOpen: this.freezerOpen,
      hourDecimal: this.getHourDecimal(),
      hoverTable6: this.hoverTable6,
    });
  }

  loop(ts) {
    const dt = Math.min(0.05, (ts - (this.lastTs || ts)) / 1000);
    this.lastTs = ts;
    this.update(dt);
    this.renderer.draw({
      hourDecimal: this.getHourDecimal(),
      hoverTable6: this.hoverTable6,
    });
    requestAnimationFrame(this.loop);
  }
}
