/**
 * SERVICE WORKER - MESURAGE APP
 * Stratégie : cache uniquement le shell statique, jamais l'API, jamais l'externe
 */

const CACHE_NAME = 'mesurage-app-shell-v2';
const CACHE_URLS = [
  './',
  './index.html',
  './styles.css',
  './manifest.json',
  './src/services/api.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CACHE_URLS))
      .catch((err) => console.warn('[SW] Mise en cache initiale partielle:', err))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Jamais de cross-origin (pas de fonts externes, pas de dépendance Internet)
  if (url.origin !== self.location.origin) return;

  // Jamais l'API : les données doivent toujours être fraîches
  if (url.pathname.startsWith('/api/')) return;

  // Document HTML (index.html, navigation) : network-first, pour que toute
  // modification du code soit visible immédiatement, sans purge manuelle du cache.
  // Le cache ne sert que de secours si le serveur est injoignable (hors-ligne).
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Assets statiques (CSS, images, polices locales) : cache-first, changent rarement.
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});