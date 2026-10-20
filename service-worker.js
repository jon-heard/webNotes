const CACHE_NAME = 'web-notes-shell-v2';
const SHELL_FILES = ['./', './manifest.webmanifest', './icon.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key.startsWith('web-notes-shell-') && key !== CACHE_NAME)
        .map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.searchParams.has('action')) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(async response => {
      if (response.ok) {
        try {
          await caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
        } catch (_) {
          // Navigation still succeeds if browser storage is unavailable.
        }
      }
      return response;
    }).catch(async () => {
      const exact = await caches.match(request);
      return exact || await caches.match('./') || Response.error();
    }));
    return;
  }

  if (url.pathname.endsWith('/manifest.webmanifest') || url.pathname.endsWith('/icon.png')) {
    event.respondWith(caches.match(request).then(cached => cached || fetch(request)));
  }
});

