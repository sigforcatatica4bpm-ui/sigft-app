const CACHE_NAME = 'sigft-shell-2026-10-12-v1';
const ROOT = new URL('./', self.location.href);
const SHELL_URL = new URL('index.html', ROOT).href;
const ASSETS = ['index.html','manifest.webmanifest','sigft-icon-180.png','sigft-icon-192.png','sigft-icon-512.png','sigft-icon-maskable-512.png'].map(path => new URL(path, ROOT).href);
const OWN_CACHE = name => name === 'sigft-v2' || name.startsWith('sigft-shell-');

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(ASSETS.map(url => new Request(url, {cache:'reload'})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => OWN_CACHE(name) && name !== CACHE_NAME).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  // Nunca interceptar Apps Script, Google, APIs ou requisições de gravação.
  if(request.method !== 'GET' || url.origin !== ROOT.origin) return;
  const isShell = url.pathname === ROOT.pathname || url.pathname === new URL(SHELL_URL).pathname;
  const isAsset = ASSETS.includes(url.href);
  if(!isShell && !isAsset) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cacheKey = isShell ? SHELL_URL : url.href;
    try {
      const response = await fetch(request, {cache:'no-store'});
      if(response.ok && response.type !== 'opaque') {
        try { await cache.put(cacheKey, response.clone()); } catch(error) { /* Falha de cache não impede a resposta online. */ }
        return response;
      }
      const cached = await cache.match(cacheKey);
      return cached || response;
    } catch(error) {
      const cached = await cache.match(cacheKey);
      if(cached) return cached;
      return new Response('Sem conexão. Conecte-se à internet e abra o SIGFT novamente.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
    }
  })());
});
