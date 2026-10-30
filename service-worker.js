const CACHE_PREFIX = "insieme-sestri-pwa-";
const CACHE_NAME = CACHE_PREFIX + "v5";

const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/app-icon.svg",
  "/logo.jpeg",
  "/Sfondo.jpg",
  "/site-content.js",
  "/content/site.json"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async cache => {
        // Un singolo file non disponibile non deve impedire l'installazione.
        await Promise.allSettled(
          APP_SHELL.map(async url => {
            const response = await fetch(url, { cache: "reload" });
            if (response.ok) await cache.put(url, response);
          })
        );
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

async function updateCache(request, cache) {
  const response = await fetch(request, { cache: "no-cache" });
  if (response && response.ok && response.type !== "opaque") {
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Le pagine devono essere aggiornate dalla rete; la copia locale è un ripiego offline.
  if (request.mode === "navigate") {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await updateCache(request, cache);
        await cache.put("/index.html", response.clone());
        return response;
      } catch (error) {
        return (await cache.match(request)) ||
          (await cache.match("/index.html")) ||
          Response.error();
      }
    })());
    return;
  }

  const pathname = url.pathname;
  const isRefreshableAsset = /\.(?:html?|js|css|json|webmanifest)$/i.test(pathname);

  // Script, contenuti e manifest: rete prima, cache solo se offline.
  if (isRefreshableAsset) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        return await updateCache(request, cache);
      } catch (error) {
        return (await cache.match(request)) || Response.error();
      }
    })());
    return;
  }

  // Immagini e risorse statiche: risposta immediata dalla cache e aggiornamento in background.
  const cachePromise = caches.open(CACHE_NAME);
  const networkUpdate = cachePromise.then(cache => updateCache(request, cache)).catch(() => null);
  event.waitUntil(networkUpdate);

  event.respondWith(cachePromise.then(async cache => {
    const cached = await cache.match(request);
    if (cached) return cached;
    return (await networkUpdate) || Response.error();
  }));
});
