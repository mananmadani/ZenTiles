/* ════════════════════════════════════════
   ZenTiles — service-worker.js
   Strategy: Cache-First for all core assets
   ════════════════════════════════════════ */

const CACHE_NAME    = 'zentiles-v1.0.0';
const ASSETS_TO_CACHE = [
  'index.html',
  'style.css',
  'app.js',
  'ZenTiles.png',
  'manifest.json'
];

// ── Install: pre-cache all core assets ───────────────────────────────────────
self.addEventListener('install', event => {
  console.log('[ZenTiles SW] Installing and caching core assets...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ZenTiles SW] Cache opened:', CACHE_NAME);
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        console.log('[ZenTiles SW] All assets cached successfully.');
        return self.skipWaiting(); // Activate immediately
      })
      .catch(err => console.error('[ZenTiles SW] Cache install failed:', err))
  );
});

// ── Activate: clean up old caches ────────────────────────────────────────────
self.addEventListener('activate', event => {
  console.log('[ZenTiles SW] Activating...');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME)
            .map(name => {
              console.log('[ZenTiles SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim()) // Take control of all open tabs
  );
});

// ── Fetch: Cache-First strategy ───────────────────────────────────────────────
//   1. Check cache — return immediately if found (fully offline capable)
//   2. On cache miss — fetch from network, clone & store in cache, then serve
self.addEventListener('fetch', event => {
  // Only intercept GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // ✅ Cache hit — return the cached response
        if (cachedResponse) {
          console.log('[ZenTiles SW] Serving from cache:', event.request.url);
          return cachedResponse;
        }

        // 🌐 Cache miss — fetch from network
        console.log('[ZenTiles SW] Fetching from network:', event.request.url);
        return fetch(event.request)
          .then(networkResponse => {
            // Don't cache bad responses or non-basic (cross-origin) responses
            if (
              !networkResponse ||
              networkResponse.status !== 200 ||
              networkResponse.type !== 'basic'
            ) {
              return networkResponse;
            }

            // Clone the response (stream can only be consumed once)
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
              console.log('[ZenTiles SW] Cached new resource:', event.request.url);
            });

            return networkResponse;
          })
          .catch(() => {
            // Offline fallback — serve index.html for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('index.html');
            }
            // For other resources, just fail gracefully
            return new Response('Offline – resource not in cache.', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});
