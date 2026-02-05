// PWA Service Worker - DMH Time Clock
// Version 2.0 - Automatic Updates with Network-First Strategy

const CACHE_VERSION = 'dmh-timeclock-v2.0';
const CACHE_NAME = `${CACHE_VERSION}-${Date.now()}`;

// Files to cache for offline use
const urlsToCache = [
  '/employee-dashboard-clean-fix.html',
  '/admin-dashboard-standalone.html',
  '/login-standalone.html',
  '/manifest.json',
  '/logo.png'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  console.log('✅ Service Worker: Installing version', CACHE_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('✅ Service Worker: Caching files');
        return cache.addAll(urlsToCache).catch((error) => {
          console.warn('⚠️ Service Worker: Some files failed to cache', error);
        });
      })
      .then(() => {
        // Force the waiting service worker to become active immediately
        return self.skipWaiting();
      })
  );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activating version', CACHE_VERSION);
  
  event.waitUntil(
    // Delete old caches
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName.startsWith('dmh-timeclock-') && cacheName !== CACHE_NAME) {
            console.log('🗑️ Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      // Take control of all pages immediately
      console.log('✅ Service Worker: Taking control of all pages');
      return self.clients.claim();
    })
  );
});

// Fetch Strategy: Network First with Cache Fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip Supabase API requests (always use network)
  if (url.hostname.includes('supabase.co')) {
    return;
  }

  // Skip CDN requests (Tailwind, Font Awesome)
  if (url.hostname.includes('cdn.') || url.hostname.includes('cdnjs.')) {
    return;
  }

  event.respondWith(
    // Try network first
    fetch(request)
      .then((response) => {
        // Only cache successful responses
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log('📦 Service Worker: Serving from cache:', request.url);
            return cachedResponse;
          }
          
          // Return a custom offline page if available
          if (request.destination === 'document') {
            return caches.match('/offline.html').catch(() => {
              return new Response(
                '<html><body><h1>Offline</h1><p>No internet connection. Please try again later.</p></body></html>',
                { headers: { 'Content-Type': 'text/html' } }
              );
            });
          }
        });
      })
  );
});

// Listen for messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('✅ Service Worker: Received SKIP_WAITING message');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CHECK_UPDATE') {
    console.log('🔍 Service Worker: Checking for updates...');
    event.ports[0].postMessage({
      type: 'UPDATE_STATUS',
      hasUpdate: false
    });
  }
});

// Push Notifications
self.addEventListener('push', (event) => {
  console.log('🔔 Service Worker: Push notification received');
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'DMH Time Clock';
  const options = {
    body: data.body || 'New notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/employee-dashboard-clean-fix.html'
    },
    requireInteraction: false,
    tag: 'dmh-notification'
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Service Worker: Notification clicked');
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/employee-dashboard-clean-fix.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if a window is already open
        for (const client of clientList) {
          if (client.url.includes('employee-dashboard') && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if not already open
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

console.log('✅ Service Worker: Script loaded -', CACHE_VERSION);
