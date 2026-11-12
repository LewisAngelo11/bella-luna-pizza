import {
  RULES,
  NORMAL_CUSTOMERS,
  ANOMALIES,
  ACTIONS,
  DEATHS,
} from "./rules.js";
import { Renderer } from "./renderer.js";
import { AudioEngine } from "./audio.js";
import { MenuScene, VERSION as MENU_VERSION } from "./menu/MenuScene.js";

export class Game {
  constructor() {
    this.canvas = document.getElementById("game");
    this.menuCanvas = document.getElementById("menu-canvas");
    this.renderer = new Renderer(this.canvas);
    this.menuScene = new MenuScene(this.menuCanvas);
    this.audio = new AudioEngine();

    const ver = document.getElementById("menu-version");
    if (ver) ver.textContent = MENU_VERSION;

    this.playing = false;
    this.timeMinutes = 22 * 60; // 22:00
    this.endMinutes = 6 * 60 + 24 * 60; // 06:00 next day as absolute
    this.fear = 0; // 0 = sane, 100 = break
    this.doorLocked = true;
    this.doorAutoNextIn = 0;
    this.freezerOpen = false;
    this.freezerKnock = false;
    this.freezerKnockTimer = 0;
    this.freezerAutoPhase = null; // null | "grace" | "must_close"
    this.freezerAutoTimer = 0;
    this.freezerAutoCloseIn = -1;
    this.freezerAutoNextIn = 0;
    this.ovenOn = true;
    this.ovenOffDeadline = 0;
    this.ovenEventTimer = 0;
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
    this.menuScene.setActive(true);
    this._bindMenuAmbienceUnlock();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  /** Ambientación nocturna también en menú (requiere gesto del usuario). */
  async ensureAmbience() {
    await this.audio.init();
    this.audio.resume();
    this.audio.startAmbience();
  }

  _bindMenuAmbienceUnlock() {
    const unlock = () => {
      this.ensureAmbience();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("pointerdown", unlock, { passive: true });
    window.addEventListener("keydown", unlock);
  }

  populateRules() {
    const list = document.getElementById("rules-list");
    const mini = document.getElementById("rules-mini");
    list.innerHTML = RULES.map((r) => `<li>${r.text}</li>`).join("");
    mini.innerHTML = RULES.map((r) => `<li>${r.text}</li>`).join("");
  }

  bindUI() {
    document.getElementById("btn-start").onclick = () => this.beginBriefing(false);
    document.getElementById("btn-rules-preview").onclick = () => this.showInstructions();
    document.getElementById("btn-letter-next").onclick = () => this.showScreen("intro");
    document.getElementById("btn-intro-next").onclick = () => {
      if (this.briefingOnly) {
        this.showScreen("menu");
        return;
      }
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
      this.ensureAmbience();
      this.showScreen("menu");
    };

    document.getElementById("btn-pause").onclick = () => this.pauseGame();
    document.getElementById("btn-resume").onclick = () => this.resumeGame();
    document.getElementById("btn-pause-quit").onclick = () => this.quitToMenu();

    document.getElementById("btn-toggle-rules").onclick = () => this.toggleRulesPanel();
    document.getElementById("btn-check-freezer").onclick = () => this.checkFreezer();
    document.getElementById("btn-toggle-oven").onclick = () => this.toggleOven();
    document.getElementById("btn-lock-door").onclick = () => this.toggleDoor();
    document.getElementById("btn-look-back").onclick = () => {
      if (!this.playing) return;
      const behind = this.renderer.toggleLookingBehind();
      this.syncBehindControls(behind);
      this.audio.click();
      this.showBanner(behind ? "Mirando hacia la cocina / puerta trasera." : "Mirando la sala.");
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
      if (e.code === "KeyF" && !this.isLookingBehind()) this.checkFreezer();
      if (e.code === "KeyH" && this.isLookingBehind()) this.toggleOven();
      if (e.code === "KeyD" && this.isLookingBehind()) this.toggleDoor();
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
      this.syncBehindControls(behind);
      this.audio.click();
      this.showBanner(
        behind
          ? "Vista a la cocina."
          : "Vista al comedor."
      );
    });
  }

  /** Cocina atrás: horno/puerta. Sala al frente: congelador. */
  syncBehindControls(behind = this.renderer?.lookingBehind) {
    const on = !!behind;
    document.getElementById("btn-toggle-oven")?.classList.toggle("hidden", !on);
    document.getElementById("btn-lock-door")?.classList.toggle("hidden", !on);
    document.getElementById("btn-check-freezer")?.classList.toggle("hidden", on);
  }

  isLookingBehind() {
    return !!this.renderer?.lookingBehind;
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
      if (!this.isLookingBehind()) this.checkFreezer(true);
      return;
    }
    if (target === "oven") {
      if (this.isLookingBehind()) this.toggleOven(true);
      return;
    }
    if (target === "door") {
      if (this.isLookingBehind()) this.toggleDoor();
      return;
    }
    if (target === "table6") {
      this.showBanner("Estás mirando la Mesa 6…");
    }
  }

  beginBriefing(previewOnly) {
    this.briefingOnly = !!previewOnly;
    this.ensureAmbience();
    this.audio?.click?.();
    this.updateRulesButtons();
    this.updateIntroButtons();
    this.showScreen("letter");
  }

  /** Solo la sección "Antes de abrir" (sin reglamento). */
  showInstructions() {
    this.briefingOnly = true;
    this.ensureAmbience();
    this.audio?.click?.();
    this.updateIntroButtons();
    this.showScreen("intro");
  }

  updateIntroButtons() {
    const introBtn = document.getElementById("btn-intro-next");
    if (!introBtn) return;
    if (this.briefingOnly) {
      introBtn.textContent = "Volver al menú";
    } else {
      introBtn.textContent = "Ver el reglamento";
    }
  }

  updateRulesButtons() {
    const startBtn = document.getElementById("btn-close-rules");
    const backBtn = document.getElementById("btn-rules-back-menu");
    if (this.playing) {
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
    const onMenu = name === "menu";
    this.menuScene?.setActive(onMenu);
    if (this.canvas) this.canvas.style.opacity = onMenu ? "0" : "1";

    // Sonido de papel al abrir carta / instrucciones / reglamento
    if (name === "letter" || name === "intro" || name === "rules") {
      this.ensureAmbience().then(() => this.audio?.paperFlip?.());
    }
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
    this.ensureAmbience();
    this.showScreen("menu");
  }

  async startShift() {
    await this.audio.init();
    this.audio.resume();
    this.audio.startAmbience();

    this.playing = true;
    this.paused = false;
    this.timeMinutes = 22 * 60;
    this.fear = 0;
    this.doorLocked = true;
    this.doorAutoNextIn = 0; // se arma al cruzar las 02:00
    this.freezerOpen = false;
    this.freezerKnock = false;
    this.freezerKnockTimer = 25 + Math.random() * 40;
    this.freezerAutoPhase = null;
    this.freezerAutoTimer = 0;
    this.freezerAutoCloseIn = -1;
    this.freezerAutoNextIn = 40 + Math.random() * 45;
    this.ovenOn = true;
    this.ovenOffDeadline = 0;
    this.ovenEventTimer = 45 + Math.random() * 50;
    this.lookingTable6 = false;
    this.renderer.setLookingBehind(false);
    this.syncBehindControls(false);
    this.renderer.setFreezerOpen(false);
    this.renderer.setOvenOn(true);
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
    this.showBanner("Turno iniciado. Click: congelador / horno / puerta. Click derecho: mirar atrás.");
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
    if (!this.playing || this.isLookingBehind()) return;
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
      // Cerrar a tiempo cancela la emergencia de apertura sola
      if (this.freezerAutoPhase) {
        this.freezerAutoPhase = null;
        this.freezerAutoTimer = 0;
        this.freezerAutoCloseIn = -1;
        this.freezerAutoNextIn = 35 + Math.random() * 50;
        this.showBanner("Cierras el congelador a tiempo. El frío se queda dentro.");
      } else {
        this.showBanner("Cierras el congelador. Mejor así.");
      }
      this.addFear(-1);
    }
  }

  toggleOven(fromClick = false) {
    if (!this.playing || !this.isLookingBehind()) return;
    this.audio.click();

    if (!this.ovenOn) {
      // Encender (cancela emergencia si venía de apagón solo)
      this.ovenOn = true;
      this.ovenOffDeadline = 0;
      this.ovenEventTimer = 40 + Math.random() * 55;
      this.renderer.setOvenOn(true);
      this.showBanner(
        fromClick
          ? "Reavivas las brasas. El horno vuelve a respirar."
          : "Enciendes el horno."
      );
      this.addFear(-1);
      return;
    }

    // Apagar manualmente (sin jumpscare; el peligro es cuando se apaga solo)
    this.ovenOn = false;
    this.ovenOffDeadline = 0;
    this.renderer.setOvenOn(false);
    this.showBanner("Apagas el horno. Puedes volver a encenderlo con [H] o click.");
  }

  toggleDoor() {
    if (!this.playing || !this.isLookingBehind()) return;
    this.audio.click();
    this.doorLocked = !this.doorLocked;
    if (this.doorLocked) {
      this.eventCooldown = 0;
      // Tras cerrar de madrugada, puede volver a abrirse sola más tarde
      const hour = this.getDisplayHour();
      if (hour >= 2 && hour < 6) {
        this.doorAutoNextIn = 20 + Math.random() * 40;
      }
      this.showBanner("Cierras la puerta trasera y echas el cerrojo.");
    } else {
      this.eventCooldown = 0;
      this.showBanner("Abres la puerta trasera. La noche se siente más cerca.");
    }
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
    this.audio.customerEnter();
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
    setTimeout(() => el.classList.remove("on"), 700);
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
        ovenOn: this.ovenOn !== false,
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
        this.showBanner('Algo raro se ve en la mesa 6…');
      }
    } else {
      this.table6Timer = Math.max(0, this.table6Timer - dt * 1.5);
    }

    // Puerta trasera después de 02:00
    const hour = this.getDisplayHour();
    const past2 = hour >= 2 && hour < 6;

    // A partir de las 02:00 puede abrirse sola
    if (past2) {
      if (this.doorLocked) {
        if (this.doorAutoNextIn <= 0) {
          this.doorAutoNextIn = 12 + Math.random() * 28;
        } else {
          this.doorAutoNextIn -= dt;
          if (this.doorAutoNextIn <= 0) {
            this.doorLocked = false;
            this.eventCooldown = 0;
            this.audio.noiseBurst?.(0.25, 0.07, {
              freq: 220, filter: "lowpass", color: "brown",
            });
            this.showBanner("La puerta trasera está abierta");
          }
        }
      }
    } else {
      this.doorAutoNextIn = 0;
    }

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
    // —— Horno: apagón espontáneo ——
    if (this.ovenOn && this.ovenOffDeadline <= 0) {
      this.ovenEventTimer -= dt;
      if (this.ovenEventTimer <= 0) {
        this.ovenOn = false;
        this.ovenOffDeadline = 5;
        this.renderer.setOvenOn(false);
        this.audio.noiseBurst?.(0.35, 0.1, { freq: 180, filter: "lowpass", color: "brown" });
        this.showBanner("¡El horno se apagó!");
      }
    } else if (!this.ovenOn && this.ovenOffDeadline > 0) {
      this.ovenOffDeadline -= dt;
      if (this.ovenOffDeadline <= 0) {
        this.die("oven_cold");
        return;
      }
    }

    // —— Congelador: se abre solo ——
    if (!this.freezerAutoPhase && !this.freezerKnock && !this.freezerOpen) {
      this.freezerAutoNextIn -= dt;
      if (this.freezerAutoNextIn <= 0) {
        this.freezerOpen = true;
        this.renderer.setFreezerOpen(true);
        this.freezerAutoPhase = "grace";
        this.freezerAutoTimer = 5;
        this.freezerAutoCloseIn = Math.random() < 0.55 ? 1.2 + Math.random() * 3.5 : -1;
        this.audio.noiseBurst?.(0.2, 0.08, { freq: 320, filter: "bandpass", Q: 2, color: "pink" });
        this.showBanner(
          this.freezerAutoCloseIn > 0
            ? "El congelador se abrió solo…"
            : "El congelador se abrió solo. No se ve que vaya a cerrarse…"
        );
      }
    } else if (this.freezerAutoPhase === "grace") {
      this.freezerAutoTimer -= dt;
      if (this.freezerAutoCloseIn > 0) {
        this.freezerAutoCloseIn -= dt;
        if (this.freezerAutoCloseIn <= 0 && this.freezerOpen) {
          this.freezerOpen = false;
          this.renderer.setFreezerOpen(false);
          this.freezerAutoPhase = null;
          this.freezerAutoTimer = 0;
          this.freezerAutoCloseIn = -1;
          this.freezerAutoNextIn = 35 + Math.random() * 50;
          this.showBanner("El congelador se cerró solo. Por ahora.");
        }
      }
      if (this.freezerAutoPhase === "grace" && this.freezerAutoTimer <= 0 && this.freezerOpen) {
        this.freezerAutoPhase = "must_close";
        this.freezerAutoTimer = 5;
        this.showBanner("¡El congelador sigue abierto!");
      }
    } else if (this.freezerAutoPhase === "must_close") {
      this.freezerAutoTimer -= dt;
      if (this.freezerAutoTimer <= 0 && this.freezerOpen) {
        this.die("freezer_ajar");
        return;
      }
    }

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
        this.showBanner("…golpes sordos desde el congelador.");
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
      this.showBanner("Las luces parpadean. Cierra los ojos.");
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
    if (!this.ovenOn && this.ovenOffDeadline > 0) {
      note.textContent = 'Horno apagado.';
    } else if (this.freezerAutoPhase === "must_close") {
      note.textContent = 'Cierra el congelador.';
    } else if (this.freezerAutoPhase === "grace") {
      note.textContent = "El congelador quedó abierto…";
    } else if (this.freezerKnock) note.textContent = "Algo golpea el metal del congelador…";
    else if (this.flickerIntensity > 0) note.textContent = "El neón chisporrotea.";
    else if (!this.ovenOn) note.textContent = "El horno está apagado.";
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
      ovenOn: this.ovenOn,
      hourDecimal: this.getHourDecimal(),
      hoverTable6: this.hoverTable6,
    });
  }

  loop(ts) {
    const dt = Math.min(0.05, (ts - (this.lastTs || ts)) / 1000);
    this.lastTs = ts;
    if (this.menuScene?.active) {
      this.menuScene.update(dt);
      this.menuScene.draw();
    } else {
      this.update(dt);
      this.renderer.draw({
        hourDecimal: this.getHourDecimal(),
        hoverTable6: this.hoverTable6,
      });
    }
    requestAnimationFrame(this.loop);
  }
}
