import { Game } from "./game.js";

window.addEventListener("DOMContentLoaded", () => {
  new Game();
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((err) => {
      console.warn("Service worker no registrado:", err);
    });
  });
}
