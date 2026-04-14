// 📍 ENHANCED Geofence Monitoring Service with Admin Alert Creation
// Tracks employee location, logs all events, and creates admin alerts automatically

class GeofenceMonitorEnhanced {
    constructor(supabaseClient, userId) {
        this.supabase = supabaseClient;
        this.userId = userId;
        this.monitoringInterval = null;
        this.lastState = 'unknown'; // unknown, outside, inside
        this.lastPosition = null;
        this.workLocations = [];
        this.isClocked = false;
        this.currentLocationId = null;
        this.lastEntryEventId = null; // Track entry event for alert creation
        this.alertCheckTimeout = null; // Timer for checking if user clocked in
        
        // Check interval: 2 minutes (120000ms)
        this.CHECK_INTERVAL = 120000;
        
        // Grace period before creating alert: 5 minutes (300000ms)
        this.ALERT_GRACE_PERIOD = 300000;
        
        // Initialize
        this.init();
    }

    async init() {
        console.log('🔍 Initializing ENHANCED Geofence Monitor...');
        
        // Request notification permission
        await this.requestNotificationPermission();
        
        // Load work locations
        await this.loadWorkLocations();
        
        // Check current clock status
        await this.checkClockStatus();
        
        // Start monitoring
        this.startMonitoring();
        
        console.log('✅ Enhanced Geofence Monitor started with admin alert creation!');
    }

    async requestNotificationPermission() {
        if ('Notification' in window) {
            if (Notification.permission === 'default') {
                const permission = await Notification.requestPermission();
                console.log('📢 Notification permission:', permission);
            }
        }
    }

    async loadWorkLocations() {
        try {
            const { data, error } = await this.supabase
                .from('work_locations')
                .select('*')
                .eq('is_active', true);

            if (error) throw error;

            this.workLocations = data;
            console.log('📍 Loaded work locations:', this.workLocations.length);
        } catch (error) {
            console.error('Error loading work locations:', error);
        }
    }

    async checkClockStatus() {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const { data, error } = await this.supabase
                .from('time_entries')
                .select('*')
                .eq('user_id', this.userId)
                .is('clock_out_time', null)
                .gte('clock_in_time', today.toISOString())
                .order('clock_in_time', { ascending: false })
                .limit(1);

            if (error) throw error;

            this.isClocked = data && data.length > 0;
            console.log('⏰ Current clock status:', this.isClocked ? 'CLOCKED IN' : 'NOT CLOCKED IN');
        } catch (error) {
            console.error('Error checking clock status:', error);
        }
    }

    startMonitoring() {
        // Initial check
        this.checkLocation();

        // Set up interval (every 2 minutes)
        this.monitoringInterval = setInterval(() => {
            this.checkLocation();
        }, this.CHECK_INTERVAL);

        console.log('🔄 Monitoring every 2 minutes...');
    }

    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        if (this.alertCheckTimeout) {
            clearTimeout(this.alertCheckTimeout);
            this.alertCheckTimeout = null;
        }
        console.log('⏹️ Geofence monitoring stopped');
    }

    async checkLocation() {
        console.log('📍 Checking location...');

        if (!navigator.geolocation) {
            console.error('Geolocation not supported');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => this.handlePosition(position),
            (error) => this.handleError(error),
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    }

    async handlePosition(position) {
        const currentLat = position.coords.latitude;
        const currentLon = position.coords.longitude;
        
        console.log('📍 Current position:', currentLat.toFixed(6), currentLon.toFixed(6));

        this.lastPosition = position;

        // Check if inside any work location
        let insideLocation = null;
        let minDistance = Infinity;

        for (const location of this.workLocations) {
            const distance = this.calculateDistance(
                currentLat,
                currentLon,
                location.latitude,
                location.longitude
            );

            console.log(`📏 Distance to ${location.name}: ${distance.toFixed(0)}m (radius: ${location.radius_meters}m)`);

            if (distance <= location.radius_meters && distance < minDistance) {
                insideLocation = location;
                minDistance = distance;
            }
        }

        // Determine new state
        const newState = insideLocation ? 'inside' : 'outside';
        
        console.log(`🎯 State: ${this.lastState} → ${newState}`);

        // State change detection
        if (this.lastState !== newState) {
            if (newState === 'inside' && this.lastState === 'outside') {
                // ENTERED work location
                await this.onEnterGeofence(insideLocation, minDistance);
            } else if (newState === 'outside' && this.lastState === 'inside') {
                // LEFT work location
                await this.onLeaveGeofence(minDistance);
            }

            this.lastState = newState;
        }

        // Update state in localStorage for service worker
        this.updateState({
            state: newState,
            location: insideLocation,
            isClocked: this.isClocked,
            timestamp: Date.now()
        });
    }

    handleError(error) {
        console.error('Geolocation error:', error.message);
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Earth radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    async onEnterGeofence(location, distance) {
        console.log('🚪 ENTERED:', location.name);

        this.currentLocationId = location.id;

        // 🔥 STEP 1: Log the geofence entry event to database
        const eventId = await this.logGeofenceEvent('entry', location.id, distance);
        this.lastEntryEventId = eventId;

        // Refresh clock status
        await this.checkClockStatus();

        // STEP 2: Show notification to employee
        if (!this.isClocked) {
            this.showNotification(
                '🏢 You\'re at Work!',
                `You've arrived at ${location.name}. Would you like to clock in?`,
                'clock-in',
                location.id
            );

            // Also show in-app alert
            this.showInAppAlert(
                'arrived',
                location.name,
                () => this.handleClockIn(location.id)
            );

            // 🔥 STEP 3: Schedule admin alert check (5 minutes grace period)
            console.log('⏰ Scheduling admin alert check in 5 minutes...');
            if (this.alertCheckTimeout) {
                clearTimeout(this.alertCheckTimeout);
            }
            
            this.alertCheckTimeout = setTimeout(async () => {
                await this.checkAndCreateAdminAlert(eventId, location);
            }, this.ALERT_GRACE_PERIOD);

        } else {
            console.log('✅ Already clocked in, no notification needed');
        }
    }

    async onLeaveGeofence(distance) {
        console.log('🚪 LEFT work location');

        // 🔥 Log the exit event
        if (this.currentLocationId) {
            await this.logGeofenceEvent('exit', this.currentLocationId, distance);
        }

        // Clear any pending alert checks
        if (this.alertCheckTimeout) {
            clearTimeout(this.alertCheckTimeout);
            this.alertCheckTimeout = null;
        }

        // Refresh clock status
        await this.checkClockStatus();

        // Only notify if currently clocked in
        if (this.isClocked) {
            this.showNotification(
                '👋 Leaving Work?',
                'Don\'t forget to clock out!',
                'clock-out'
            );

            // Also show in-app alert
            this.showInAppAlert(
                'leaving',
                'work',
                () => this.handleClockOut()
            );
        } else {
            console.log('✅ Not clocked in, no notification needed');
        }

        this.currentLocationId = null;
        this.lastEntryEventId = null;
    }

    // 🔥 NEW: Log geofence event to database
    async logGeofenceEvent(eventType, locationId, distance) {
        try {
            console.log(`📝 Logging geofence ${eventType} event to database...`);

            const { data, error } = await this.supabase
                .from('geofence_events')
                .insert([{
                    user_id: this.userId,
                    work_location_id: locationId,
                    event_type: eventType,
                    timestamp: new Date().toISOString(),
                    latitude: this.lastPosition.coords.latitude,
                    longitude: this.lastPosition.coords.longitude,
                    distance_from_site: Math.round(distance),
                    used_for_correction: false
                }])
                .select()
                .single();

            if (error) throw error;

            console.log('✅ Geofence event logged:', data.id);
            return data.id;

        } catch (error) {
            console.error('Error logging geofence event:', error);
            return null;
        }
    }

    // 🔥 NEW: Check if employee clocked in, if not create admin alert
    async checkAndCreateAdminAlert(eventId, location) {
        try {
            console.log('🔍 Checking if employee clocked in after 5-minute grace period...');

            // Refresh clock status
            await this.checkClockStatus();

            // If still not clocked in, create admin alert
            if (!this.isClocked) {
                console.log('⚠️ Employee did NOT clock in - creating admin alert...');

                // Get user info
                const { data: userData } = await this.supabase
                    .from('users')
                    .select('full_name, email')
                    .eq('id', this.userId)
                    .single();

                const userName = userData?.full_name || 'Employee';

                // Create admin alert
                const { data: alert, error: alertError } = await this.supabase
                    .from('admin_alerts')
                    .insert([{
                        user_id: this.userId,
                        alert_type: 'missed_clock_in',
                        message: `${userName} arrived at ${location.name} but forgot to clock in`,
                        severity: 'high',
                        geofence_event_id: eventId,
                        work_location_id: location.id,
                        resolved: false,
                        created_at: new Date().toISOString()
                    }])
                    .select()
                    .single();

                if (alertError) throw alertError;

                console.log('✅ Admin alert created:', alert.id);
                console.log('👔 Admins can now see this in the unified dashboard!');

            } else {
                console.log('✅ Employee clocked in - no alert needed');
            }

        } catch (error) {
            console.error('Error creating admin alert:', error);
        }
    }

    showNotification(title, body, action, data) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(title, {
                body: body,
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-72x72.png',
                tag: action,
                requireInteraction: true,
                data: { action: action, locationId: data }
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
                
                if (action === 'clock-in') {
                    this.handleClockIn(data);
                } else if (action === 'clock-out') {
                    this.handleClockOut();
                }
            };

            console.log('📢 Notification shown:', title);
        } else {
            console.log('📢 Notification permission not granted');
        }
    }

    showInAppAlert(type, locationName, actionCallback) {
        // Remove any existing alert
        const existing = document.getElementById('geofence-alert');
        if (existing) existing.remove();

        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.id = 'geofence-alert';
        overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        overlay.style.zIndex = '9999';

        let title, message, buttonText, icon;

        if (type === 'arrived') {
            title = '🏢 You\'re at Work!';
            message = `You've arrived at ${locationName}. Would you like to clock in?`;
            buttonText = 'Clock In Now';
            icon = '🏢';
        } else {
            title = '👋 Leaving Work?';
            message = 'Don\'t forget to clock out!';
            buttonText = 'Clock Out Now';
            icon = '👋';
        }

        overlay.innerHTML = `
            <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 transform scale-100 animate-bounce-in">
                <div class="text-center mb-6">
                    <div class="text-6xl mb-4">${icon}</div>
                    <h2 class="text-2xl font-bold text-gray-800 mb-2">${title}</h2>
                    <p class="text-gray-600">${message}</p>
                </div>
                <div class="flex space-x-3">
                    <button 
                        id="geofence-action-btn" 
                        class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition"
                    >
                        ${buttonText}
                    </button>
                    <button 
                        id="geofence-dismiss-btn" 
                        class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 rounded-lg transition"
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Action button
        document.getElementById('geofence-action-btn').addEventListener('click', () => {
            overlay.remove();
            actionCallback();
        });

        // Dismiss button
        document.getElementById('geofence-dismiss-btn').addEventListener('click', () => {
            overlay.remove();
        });

        // Auto-dismiss after 30 seconds
        setTimeout(() => {
            if (document.getElementById('geofence-alert')) {
                overlay.remove();
            }
        }, 30000);
    }

    async handleClockIn(locationId) {
        try {
            console.log('⏰ Auto Clock In triggered...');

            const position = this.lastPosition;
            if (!position) {
                alert('Unable to get your location. Please try again.');
                return;
            }

            const { data, error } = await this.supabase
                .from('time_entries')
                .insert([{
                    user_id: this.userId,
                    work_location_id: locationId,
                    clock_in_time: new Date().toISOString(),
                    clock_in_latitude: position.coords.latitude,
                    clock_in_longitude: position.coords.longitude,
                    status: 'clocked_in'
                }])
                .select();

            if (error) throw error;

            this.isClocked = true;
            
            // 🔥 Cancel the pending admin alert check
            if (this.alertCheckTimeout) {
                clearTimeout(this.alertCheckTimeout);
                this.alertCheckTimeout = null;
                console.log('✅ Cancelled admin alert - employee clocked in!');
            }

            // 🔥 Link the geofence event to the time entry
            if (this.lastEntryEventId) {
                await this.supabase
                    .from('geofence_events')
                    .update({
                        time_entry_id: data[0].id,
                        used_for_correction: false
                    })
                    .eq('id', this.lastEntryEventId);
            }
            
            // Show success message
            this.showSuccessMessage('✅ Clocked In Successfully!');
            
            // Trigger page refresh if on dashboard
            if (window.loadCurrentStatus) {
                window.loadCurrentStatus();
            }

            console.log('✅ Auto Clock In successful');
        } catch (error) {
            console.error('Error auto clocking in:', error);
            alert('Error clocking in: ' + error.message);
        }
    }

    async handleClockOut() {
        try {
            console.log('⏰ Auto Clock Out triggered...');

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const { data: activeEntry, error: fetchError } = await this.supabase
                .from('time_entries')
                .select('*')
                .eq('user_id', this.userId)
                .is('clock_out_time', null)
                .gte('clock_in_time', today.toISOString())
                .order('clock_in_time', { ascending: false })
                .limit(1);

            if (fetchError) throw fetchError;

            if (!activeEntry || activeEntry.length === 0) {
                alert('No active clock in found.');
                return;
            }

            const entry = activeEntry[0];
            const position = this.lastPosition;

            const clockOutTime = new Date();
            const clockInTime = new Date(entry.clock_in_time);
            const totalHours = ((clockOutTime - clockInTime) / (1000 * 60 * 60)).toFixed(2);

            const { error: updateError } = await this.supabase
                .from('time_entries')
                .update({
                    clock_out_time: clockOutTime.toISOString(),
                    clock_out_latitude: position ? position.coords.latitude : null,
                    clock_out_longitude: position ? position.coords.longitude : null,
                    total_hours: parseFloat(totalHours),
                    status: 'clocked_out'
                })
                .eq('id', entry.id);

            if (updateError) throw updateError;

            this.isClocked = false;
            
            // Show success message
            this.showSuccessMessage(`✅ Clocked Out! Total Hours: ${totalHours}`);
            
            // Trigger page refresh if on dashboard
            if (window.loadCurrentStatus) {
                window.loadCurrentStatus();
            }

            console.log('✅ Auto Clock Out successful');
        } catch (error) {
            console.error('Error auto clocking out:', error);
            alert('Error clocking out: ' + error.message);
        }
    }

    showSuccessMessage(message) {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 animate-slide-in';
        toast.style.zIndex = '10000';
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    updateState(state) {
        // Store state in localStorage for service worker access
        localStorage.setItem('geofence_state', JSON.stringify(state));
    }

    // Public method to update clock status (call from dashboard after manual clock in/out)
    updateClockStatus(isClocked) {
        this.isClocked = isClocked;
        console.log('🔄 Clock status updated:', isClocked ? 'CLOCKED IN' : 'NOT CLOCKED IN');
        
        // If manually clocked in, cancel any pending alert
        if (isClocked && this.alertCheckTimeout) {
            clearTimeout(this.alertCheckTimeout);
            this.alertCheckTimeout = null;
            console.log('✅ Cancelled pending admin alert - manual clock in detected');
        }
    }
}

// Export for use in dashboard
window.GeofenceMonitorEnhanced = GeofenceMonitorEnhanced;
