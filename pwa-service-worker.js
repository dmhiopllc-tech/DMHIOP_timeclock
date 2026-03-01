// PWA Service Worker - DMH Time Clock
// Version 2.2 - STOP CACHING ADMIN DASHBOARD
const CACHE_VERSION = 'dmh-timeclock-v2.2-no-admin-cache';
const CACHE_NAME = `${CACHE_VERSION}-${Date.now()}`;

// Files to cache for offline use (REMOVED ADMIN DASHBOARD)
const urlsToCache = [
  '/employee-dashboard-clean-fix.html',
  '/login-standalone.html',
  '/manifest.json',
  '/logo.png'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing version:', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating version:', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName.startsWith('dmh-timeclock-');
          })
          .map((cacheName) => {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
    .then(() => self.clients.claim())
  );
});

// Fetch Handler - Network First Strategy
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  
  // Skip Supabase API requests
  if (url.hostname.includes('supabase.co')) {
    return;
  }

  // Skip CDN resources
  if (url.hostname.includes('cdn.') || url.hostname.includes('cdnjs.')) {
    return;
  }

  // NEVER CACHE ADMIN DASHBOARD FILES
  if (url.pathname.includes('admin-dashboard')) {
    console.log('[Service Worker] Skipping cache for admin dashboard:', url.pathname);
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return caches.match('/offline.html');
        });
      })
  );
});

// Handle messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CHECK_UPDATE') {
    self.registration.update();
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/logo.png',
    badge: '/logo.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
      url: '/employee-dashboard-clean-fix.html'
    }
  };

  event.waitUntil(
    self.registration.showNotification('DMH Time Clock', options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/employee-dashboard-clean-fix.html')
  );
});

console.log('[Service Worker] Loaded version:', CACHE_VERSION);
