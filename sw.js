// Nama cache untuk versi aplikasi Anda
const CACHE_NAME = 'nix-ai-asisten-v1';

// Daftar URL aset inti yang akan di-cache saat instalasi
const urlsToCache = [
  './index.html',
  'https://cdn.jsdelivr.net/npm/marked/marked.min.js',
  'https://cdn.jsdelivr.net/npm/dompurify/dist/purify.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js'
];

// Event 'install': Menyimpan aset ke dalam cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache dibuka, menambahkan aset inti.');
        return cache.addAll(urlsToCache);
      })
  );
});

// Event 'fetch': Menyajikan aset dari cache atau mengambil dari jaringan
self.addEventListener('fetch', event => {
  // Hanya tangani permintaan GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Jangan cache permintaan ke API Google
  if (event.request.url.includes('generativelanguage.googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(response => {
        // Jika ada di cache, kembalikan dari cache
        if (response) {
          return response;
        }

        // Jika tidak ada di cache, ambil dari jaringan
        return fetch(event.request).then(networkResponse => {
          // Simpan respons jaringan yang valid ke dalam cache untuk penggunaan berikutnya
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });
      });
    })
  );
});

// Event 'activate': Membersihkan cache lama
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
