const CACHE_NAME = 'lux-app-v2';
const ARQUIVOS = [
  './',
  './index.html',
  './banner.jpg',
  './foto-ilustr.png',
  './videobanner.mp4',
  './vip1.png',
  './vip2.png',
  './vip3.png',
  './vip4.png'
];

// Instala e guarda arquivos
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ARQUIVOS))
  );
});

// Atualiza cache
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(nomes => 
      Promise.all(nomes.filter(n => n !== CACHE_NAME).map(c => caches.delete(c)))
    )
  );
});

// Busca do cache primeiro
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(resp => resp || fetch(e.request))
  );
});
