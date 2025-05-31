// Service Worker for Molino Rental CRM
// Version: 1.0.0

const CACHE_NAME = 'molino-crm-v1';
const urlsToCache = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico'
];

// API útvonalak, amiket NEM akarunk cache-elni
const API_ROUTES = [
  '/api/',
  '/trpc/',
  '/_next/webpack-hmr',
  '/_next/image'
];

// Statikus asset-ek, amiket cache-elhetünk
const STATIC_CACHE_PATTERNS = [
  /\/_next\/static\//,
  /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
  /\.(?:js|css)$/i,
  /\.(?:woff|woff2|ttf|otf)$/i
];

// Install event - cache alapvető fájlok
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cache megnyitva');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[SW] Alapvető fájlok cache-elve');
        return self.skipWaiting();
      })
  );
});

// Activate event - régi cache törlése
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Régi cache törlése:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Service Worker aktiválva');
      return self.clients.claim();
    })
  );
});

// Fetch event - cache stratégia
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API hívásokat ne cache-eljük
  if (API_ROUTES.some(route => url.pathname.includes(route))) {
    return;
  }

  // POST, PUT, DELETE kéréseket ne cache-eljük
  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Ha van cache-elt válasz és offline vagyunk, használjuk azt
        if (cachedResponse && !navigator.onLine) {
          console.log('[SW] Offline - cache-ből szolgálva:', request.url);
          return cachedResponse;
        }

        // Network-first stratégia
        return fetch(request)
          .then((response) => {
            // Rossz válaszokat ne cache-eljük
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Statikus asset-eket cache-eljük
            const shouldCache = STATIC_CACHE_PATTERNS.some(pattern => 
              pattern.test(request.url)
            );

            if (shouldCache) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  console.log('[SW] Cache-elve:', request.url);
                  cache.put(request, responseToCache);
                });
            }

            return response;
          })
          .catch(() => {
            // Ha offline vagyunk és van cache
            if (cachedResponse) {
              console.log('[SW] Offline fallback - cache-ből:', request.url);
              return cachedResponse;
            }

            // Ha navigációs kérés és nincs cache, offline oldal
            if (request.mode === 'navigate') {
              return caches.match('/offline.html');
            }

            // Egyéb esetben hiba
            return new Response('Offline - nincs cache-elt verzió', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Push notification támogatás (későbbi fejlesztéshez)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Új értesítés érkezett',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('Molino CRM', options)
  );
});

// Notification click kezelés
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event.notification.tag);
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
  );
});

// Background sync támogatás (későbbi fejlesztéshez)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  console.log('[SW] Háttér szinkronizálás indítása...');
  // Itt lehet implementálni az offline módosítások szinkronizálását
  return Promise.resolve();
}