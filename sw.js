/* Bella Luna Pizza — service worker (cache shell + assets del origen) */
const CACHE = "bella-luna-v35";

const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/style.css",
  "./js/main.js",
  "./js/game.js",
  "./js/rules.js",
  "./js/audio.js",
  "./js/renderer.js",
  "./js/menu/MenuScene.js",
  "./js/render/Renderer.js",
  "./js/render/lights.js",
  "./js/render/materials.js",
  "./js/render/mesh.js",
  "./js/render/texUtils.js",
  "./js/render/systems/frameUpdate.js",
  "./js/render/entities/index.js",
  "./vendor/three.module.js",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/apple-touch-icon.png",
  "./assets/favicon-32.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      // Uno a uno: si falla un asset opcional no tumba toda la instalación
      await Promise.all(
        PRECACHE.map((url) => cache.add(url).catch(() => null))
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);

      // Shell HTML: preferir red si hay, si no cache
      if (req.mode === "navigate" || url.pathname.endsWith(".html") || url.pathname.endsWith("/")) {
        return network.then((res) => res || cached).catch(() => cached);
      }

      // JS/CSS/assets: cache primero (rápido + offline)
      return cached || network;
    })
  );
});
