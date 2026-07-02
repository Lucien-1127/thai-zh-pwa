// 八方帶財 — Service Worker v4
// Strategy: Cache-First for App Shell, Network-First for API

const CACHE = 'thai-zh-pwa-v4';
const SHELL = [
  '/thai-zh-pwa/',
  '/thai-zh-pwa/index.html',
  '/thai-zh-pwa/manifest.json',
  '/thai-zh-pwa/logo.svg',
  '/thai-zh-pwa/icon-192.png',
  '/thai-zh-pwa/icon-512.png'
];

// Install: precache app shell
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL))
  );
});

// Activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: Cache-First for shell, Network-First for everything else
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Never cache API calls (POST) or non-GET
  if (e.request.method !== 'GET') return;

  // App shell → Cache-First with network refresh
  if (SHELL.includes(url.pathname)) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        const fetchPromise = fetch(e.request).then(res => {
          if (res.ok) {
            caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          }
          return res;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Other (API calls, external) → Network-First with cache fallback
  e.respondWith(
    fetch(e.request).then(res => {
      if (res.ok && url.origin === location.origin) {
        caches.open(CACHE).then(c => c.put(e.request, res.clone()));
      }
      return res;
    }).catch(() => caches.match(e.request))
  );
});
