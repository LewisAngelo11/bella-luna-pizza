import { Game } from "./game.js?v=menu-win18";

window.addEventListener("DOMContentLoaded", () => {
  try {
    window.__bella = new Game();
  } catch (err) {
    console.error("[Bella Luna] boot failed", err);
    throw err;
  }
});
