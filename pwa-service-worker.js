// PWA Service Worker - DMH Time Clock
// Version 2.2 - BYPASS MODE (Temporary debugging)
const CACHE_VERSION = 'dmh-timeclock-v2.2-bypass';

// Install - do nothing, just skip waiting
self.addEventListener('install', (event) => {
  console.log('[Service Worker] BYPASS MODE - Installing version:', CACHE_VERSION);
  event.waitUntil(self.skipWaiting());
});

// Activate - delete ALL caches and claim clients
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] BYPASS MODE - Deleting all caches');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('[Service Worker] Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    })
    .then(() => {
      console.log('[Service Worker] All caches deleted, claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch - BYPASS CACHE COMPLETELY, always fetch from network
self.addEventListener('fetch', (event) => {
  console.log('[Service Worker] BYPASS MODE - Fetching from network:', event.request.url);
  // Don't use cache at all, always go to network
  event.respondWith(fetch(event.request));
});

console.log('[Service Worker] BYPASS MODE ACTIVE - No caching, version:', CACHE_VERSION);
