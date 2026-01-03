const CACHE_NAME = 'paixaoflix-v3'; // Mudamos para v2 para forçar o update

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Força o novo Service Worker a assumir o controle na hora
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache); // Apaga o cache antigo (v1)
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
