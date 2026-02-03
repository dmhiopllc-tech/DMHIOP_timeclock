// DMH Time Clock - Service Worker for PWA
// Provides offline support, caching, and background sync

const CACHE_NAME = 'dmh-timeclock-v3';
const urlsToCache = [
    '/',
    '/employee-dashboard-clean-fix.html',
    '/login-standalone.html',
    '/signup-timeclock.html',
    '/timeclock-config-v2.js',
    '/timeclock-auth-v2.js',
    '/timeclock-geofencing-v2.js',
    '/logo.png',
    '/manifest.json'
];

// Install Service Worker
self.addEventListener('install', (event) => {
    console.log('📦 Service Worker: Installing...');
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
    return self.clients.claim();
});

// Fetch Strategy
self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip Supabase API calls (always use network)
    if (event.request.url.includes('supabase.co')) {
        event.respondWith(
            fetch(event.request)
                .then(response => response)
                .catch(() => {
                    return new Response('Offline', { status: 503 });
                })
        );
        return;
    }

    // Network-first strategy with cache fallback
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Cache successful responses
                if (response.status === 200) {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                }
                return response;
            })
            .catch(() => {
                // If network fails, try cache
                return caches.match(event.request)
                    .then((response) => {
                        if (response) {
                            return response;
                        }
                        // If not in cache, return offline page
                        return caches.match('/offline.html');
                    });
            })
    );
});

// Background Sync for Time Entries
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-time-entries') {
        console.log('🔄 Background Sync: Syncing time entries...');
        event.waitUntil(syncTimeEntries());
    }
});

// Push Notifications
self.addEventListener('push', (event) => {
    console.log('📨 Push notification received');
    
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'Time Clock Reminder';
    const options = {
        body: data.body || 'Don\'t forget to clock in/out!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        vibrate: [200, 100, 200],
        data: {
            url: data.url || '/employee-dashboard-clean-fix.html'
        },
        requireInteraction: true
    };
    
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Notification Click
self.addEventListener('notificationclick', (event) => {
    console.log('🔔 Notification clicked');
    
    event.notification.close();
    
    const urlToOpen = event.notification.data?.url || '/employee-dashboard-clean-fix.html';
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Focus existing window if available
                for (const client of clientList) {
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Open new window if none found
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

// Helper Functions
async function syncTimeEntries() {
    try {
        const pendingEntries = await getPendingTimeEntries();
        
        if (pendingEntries.length > 0) {
            console.log(`📤 Syncing ${pendingEntries.length} pending entries`);
            
            for (const entry of pendingEntries) {
                await fetch('/api/time-entries', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(entry)
                });
                await removePendingTimeEntry(entry.id);
            }
            
            console.log('✅ All entries synced');
        }
    } catch (error) {
        console.error('❌ Sync failed:', error);
    }
}

// IndexedDB helpers (placeholder - implement as needed)
async function getPendingTimeEntries() {
    // TODO: Implement IndexedDB retrieval
    return [];
}

async function removePendingTimeEntry(id) {
    // TODO: Implement IndexedDB removal
    return true;
}

console.log('✅ Service Worker: Script loaded');
