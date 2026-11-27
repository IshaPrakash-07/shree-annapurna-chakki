const CACHE_NAME = "chakki-owner-v5";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./manifest.json",
  "./assets/logo.png",
  "./js/i18n.js",
  "./js/data.js",
  "./js/app.js",
  "./assets/grains/gehu.jpg",
  "./assets/grains/bajara.jpg",
  "./assets/grains/jwari.jpg",
  "./assets/grains/laddu.jpg",
  "./assets/grains/bati.jpg",
  "./assets/grains/chana-daal.jpg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => null)
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request)
          .then((resp) => {
            const copy = resp.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, copy)).catch(() => null);
            return resp;
          })
          .catch(() => cached)
      );
    })
  );
});
