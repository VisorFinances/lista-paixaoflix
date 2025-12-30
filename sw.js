const CACHE_NAME = 'paixaoflix-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  // Apenas repassa a requisição, permitindo que o botão de "Instalar" apareça
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
