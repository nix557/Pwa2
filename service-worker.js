// Nama cache unik
const CACHE_NAME = 'gemini-chat-cache-v1';
// Daftar file yang akan di-cache saat instalasi
const urlsToCache = [
  '/',
  '/index.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Event 'install': dijalankan saat service worker diinstal
self.addEventListener('install', event => {
  // Tunggu hingga cache dibuka dan semua file inti aplikasi ditambahkan ke dalamnya
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Event 'fetch': dijalankan setiap kali ada permintaan jaringan dari aplikasi
self.addEventListener('fetch', event => {
  event.respondWith(
    // Coba cari respons dari cache terlebih dahulu
    caches.match(event.request)
      .then(response => {
        // Jika respons ditemukan di cache, kembalikan dari cache
        if (response) {
          return response;
        }
        // Jika tidak, lakukan permintaan jaringan seperti biasa
        return fetch(event.request);
      }
    )
  );
});
