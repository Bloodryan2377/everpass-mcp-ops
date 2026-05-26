/* EverPass Mobile Command Center — service worker
 * Strategy:
 *   - cache-first for app SHELL (HTML/CSS/JS/icons/manifest) — fast cold start, offline shell
 *   - network-only for DATA (data/mobile/*.json) — never fake freshness
 *   - bypass cache entirely for cross-origin requests
 */
// 2026-05-26: bumped version to force shell-cache eviction after mobile UX fix.
// Old caches kept "Morning failed 2026-05-23" pill, stale generated_at label,
// and the always-on AOS DOWN chip alive on returning visitors. New SW activates
// immediately via skipWaiting + clients.claim and purges every prior shell-* key.
const VERSION = 'epmcc-v2-2026-05-26-ux-fix';
const SHELL_CACHE = `shell-${VERSION}`;
const SHELL_URLS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './styles/core.css',
  './styles/cockpit.css',
  './styles/dispatch.css',
  './styles/results.css',
  './styles/aos.css',
  './scripts/app.js',
  './scripts/data.js',
  './scripts/cockpit.js',
  './scripts/dispatch.js',
  './scripts/results.js',
  './scripts/list-view.js',
  './scripts/aos.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon-180.png',
  './icons/favicon-32.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== SHELL_CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return; // bypass cross-origin
  if (event.request.method !== 'GET') return;

  // Data: NEVER serve stale. Network only; if the network is unavailable, surface the failure.
  if (url.pathname.includes('/data/mobile/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Shell: cache-first, fall back to network.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(event.request, copy));
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
