// PWA Service Worker - DMH Time Clock
// Caches pages for offline use and handles push notifications

const CACHE_NAME = 'dmh-timeclock-v1';
const urlsToCache = [
  '/DMHIOP_timeclock/',
  '/DMHIOP_timeclock/employee-dashboard-enhanced.html',
  '/DMHIOP_timeclock/admin-dashboard-standalone.html',
  '/DMHIOP_timeclock/css/style.css',
  '/DMHIOP_timeclock/js/pwa-install.js',
  '/DMHIOP_timeclock/timeclock-config.js',
  '/DMHIOP_timeclock/timeclock-auth-v2.js',
  '/DMHIOP_timeclock/geofence-monitor.js'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  console.log('✅ Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('✅ Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('❌ Service Worker: Cache failed', error);
      })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all pages immediately
  return self.clients.claim();
});

// Fetch Strategy: Network First, fallback to Cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip Supabase API requests (always use network)
  if (event.request.url.includes('supabase.co')) {
    return fetch(event.request);
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response
        const responseClone = response.clone();
        
        // Cache the fetched response
        if (response.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log('📦 Service Worker: Serving from cache:', event.request.url);
            return cachedResponse;
          }
          
          // Return offline page if available
          return caches.match('/DMHIOP_timeclock/offline.html');
        });
      })
  );
});

// Background Sync (for offline clock-in/clock-out)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-time-entries') {
    console.log('🔄 Service Worker: Syncing time entries...');
    event.waitUntil(syncTimeEntries());
  }
});

// Push Notifications
self.addEventListener('push', (event) => {
  console.log('🔔 Service Worker: Push notification received');
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'DMH Time Clock';
  const options = {
    body: data.body || 'New notification',
    icon: '/DMHIOP_timeclock/icons/icon-192x192.png',
    badge: '/DMHIOP_timeclock/icons/icon-96x96.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/DMHIOP_timeclock/employee-dashboard-enhanced.html'
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Service Worker: Notification clicked');
  event.notification.close();

  const urlToOpen = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if a window is already open
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
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

// Sync Time Entries Function (for offline queue)
async function syncTimeEntries() {
  try {
    // Get pending time entries from IndexedDB
    const pendingEntries = await getPendingTimeEntries();
    
    if (pendingEntries.length === 0) {
      console.log('✅ Service Worker: No pending time entries to sync');
      return;
    }

    console.log(`🔄 Service Worker: Syncing ${pendingEntries.length} time entries...`);

    // Sync each entry
    for (const entry of pendingEntries) {
      try {
        const response = await fetch('/api/time-entries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(entry)
        });

        if (response.ok) {
          console.log('✅ Service Worker: Time entry synced:', entry.id);
          await removePendingTimeEntry(entry.id);
        } else {
          console.error('❌ Service Worker: Failed to sync entry:', entry.id);
        }
      } catch (error) {
        console.error('❌ Service Worker: Sync error:', error);
      }
    }

    console.log('✅ Service Worker: Sync complete');
  } catch (error) {
    console.error('❌ Service Worker: Sync failed:', error);
  }
}

// IndexedDB Helpers (for offline queue)
async function getPendingTimeEntries() {
  // TODO: Implement IndexedDB retrieval
  return [];
}

async function removePendingTimeEntry(id) {
  // TODO: Implement IndexedDB removal
  return true;
}

console.log('✅ Service Worker: Script loaded');
