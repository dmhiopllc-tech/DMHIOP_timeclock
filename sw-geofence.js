// 🔔 Enhanced Service Worker with Background Geofence Monitoring
// Enables background location tracking and notifications even when browser is minimized

const CACHE_NAME = 'timeclock-v1';
const GEOFENCE_CHECK_INTERVAL = 120000; // 2 minutes

// Install Service Worker
self.addEventListener('install', (event) => {
    console.log('📦 Service Worker installing...');
    self.skipWaiting();
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
    console.log('✅ Service Worker activated');
    event.waitUntil(clients.claim());
    
    // Start background geofence monitoring
    startBackgroundMonitoring();
});

// Background Sync for Geofence Monitoring
let monitoringInterval = null;

function startBackgroundMonitoring() {
    console.log('🔄 Starting background geofence monitoring...');
    
    // Initial check
    checkGeofenceStatus();
    
    // Set up interval
    if (monitoringInterval) {
        clearInterval(monitoringInterval);
    }
    
    monitoringInterval = setInterval(() => {
        checkGeofenceStatus();
    }, GEOFENCE_CHECK_INTERVAL);
}

async function checkGeofenceStatus() {
    console.log('📍 [Background] Checking geofence status...');
    
    try {
        // Get stored state from localStorage (via message passing)
        const clients = await self.clients.matchAll();
        
        if (clients.length > 0) {
            // Send message to client to check location
            clients[0].postMessage({
                type: 'CHECK_GEOFENCE',
                timestamp: Date.now()
            });
        }
    } catch (error) {
        console.error('Error in background geofence check:', error);
    }
}

// Listen for messages from client
self.addEventListener('message', (event) => {
    console.log('📨 Service Worker received message:', event.data.type);
    
    if (event.data.type === 'GEOFENCE_STATE_UPDATE') {
        handleGeofenceStateUpdate(event.data.state);
    } else if (event.data.type === 'START_MONITORING') {
        startBackgroundMonitoring();
    } else if (event.data.type === 'STOP_MONITORING') {
        if (monitoringInterval) {
            clearInterval(monitoringInterval);
            monitoringInterval = null;
            console.log('⏹️ Background monitoring stopped');
        }
    }
});

function handleGeofenceStateUpdate(state) {
    console.log('🎯 Geofence state update:', state);
    
    // Optionally show notification based on state
    // This is a backup in case the client-side notification fails
}

// Push Notification Handler (for future use)
self.addEventListener('push', (event) => {
    console.log('📨 Push notification received');
    
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'Time Clock';
    const options = {
        body: data.body || 'Notification from Time Clock',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        data: data,
        requireInteraction: true
    };
    
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
    console.log('🔔 Notification clicked');
    
    event.notification.close();
    
    const action = event.notification.data?.action;
    
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            // If a window is already open, focus it
            for (const client of clientList) {
                if (client.url.includes('dashboard') && 'focus' in client) {
                    return client.focus().then(() => {
                        // Send message to perform action
                        client.postMessage({
                            type: 'NOTIFICATION_ACTION',
                            action: action
                        });
                    });
                }
            }
            // If no window is open, open a new one
            if (clients.openWindow) {
                return clients.openWindow('/employee-dashboard-v2.html');
            }
        })
    );
});

// Background Fetch (for offline support)
self.addEventListener('fetch', (event) => {
    // Network-first strategy for API calls
    if (event.request.url.includes('supabase.co')) {
        event.respondWith(
            fetch(event.request)
                .then(response => response)
                .catch(() => {
                    return new Response('Offline', { status: 503 });
                })
        );
    }
});

// Periodic Background Sync (if supported)
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'geofence-check') {
        console.log('⏰ Periodic sync: Geofence check');
        event.waitUntil(checkGeofenceStatus());
    }
});

console.log('🎉 Service Worker loaded and ready for background monitoring!');
