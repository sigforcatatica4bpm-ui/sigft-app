const CACHE_NAME = 'sigft-v2';

const APP_ASSETS = [
  '/sigft-app/',
  '/sigft-app/index.html',
  '/sigft-app/manifest.webmanifest',
  '/sigft-app/sigft-icon-180.png',
  '/sigft-app/sigft-icon-192.png',
  '/sigft-app/sigft-icon-512.png',
  '/sigft-app/sigft-icon-maskable-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_ASSETS))
  );

  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const responseClone = response.clone();

        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseClone);
          });

        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
