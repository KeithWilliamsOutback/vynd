// VYND Driver App — Service Worker
// ── BUMP THIS VERSION NUMBER every time you push to GitHub ──
const VERSION = 'vynd-driver-v1.0.1';

const CACHE = VERSION;

// Files to cache for offline use
const PRECACHE = [
  './vynd-driver.html',
];

// Install — cache the app shell
self.addEventListener('install', event => {
  console.log('[SW] Installing', VERSION);
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE))
  );
  // Take over immediately — don't wait for old SW to finish
  self.skipWaiting();
});

// Activate — delete old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating', VERSION);
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => {
        console.log('[SW] Deleting old cache:', k);
        return caches.delete(k);
      }))
    ).then(() => self.clients.claim())
  );
});

// Fetch — network first, cache fallback
// This means the app always tries to get the latest from GitHub
// and only falls back to cache when offline
self.addEventListener('fetch', event => {
  // Only handle same-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache the fresh response
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline — serve from cache
        return caches.match(event.request);
      })
  );
});

// Message from app — skip waiting and reload all clients
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
