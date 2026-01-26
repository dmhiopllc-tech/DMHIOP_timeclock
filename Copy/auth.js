// Authentication helper for Time Clock App
window.timeclockAuth = {
    // Get current user
    getCurrentUser: async function() {
        const supabase = window.timeclockSupabase;
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return null;

        // Get user profile with role
        const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        return profile;
    },

    // Require authentication (redirect to login if not authenticated)
    requireAuth: async function(allowedRoles = []) {
        const user = await this.getCurrentUser();
        
        if (!user) {
            window.location.href = 'login.html';
            return null;
        }

        // Check role if specified
        if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
            alert('You do not have permission to access this page.');
            this.redirectToDashboard(user.role);
            return null;
        }

        return user;
    },

    // Redirect based on role
    redirectToDashboard: function(role) {
        switch(role) {
            case 'admin':
                window.location.href = 'admin-dashboard.html';
                break;
            case 'manager':
                window.location.href = 'manager-dashboard.html';
                break;
            default:
                window.location.href = 'dashboard.html';
        }
    },

    // Logout
    logout: async function() {
        const supabase = window.timeclockSupabase;
        await supabase.auth.signOut();
        window.location.href = 'login.html';
    }
};
Copy
File 3: geofencing.js
Copy// Geofencing utility for Time Clock App
window.timeclockGeo = {
    // Get current location
    getCurrentLocation: function() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by your browser'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });
                },
                (error) => {
                    let errorMessage = 'Unable to get your location';
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = 'Location information unavailable. Please check your GPS settings.';
                            break;
                        case error.TIMEOUT:
                            errorMessage = 'Location request timed out. Please try again.';
                            break;
                    }
                    reject(new Error(errorMessage));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        });
    },

    // Calculate distance between two coordinates (Haversine formula)
    calculateDistance: function(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Earth radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in meters
    },

    // Validate if user is within geofence of any work location
    validateGeofence: async function(userLat, userLon) {
        const supabase = window.timeclockSupabase;
        
        // Get all active work locations
        const { data: locations, error } = await supabase
            .from('work_locations')
            .select('*')
            .eq('is_active', true);

        if (error) {
            throw new Error('Failed to load work locations');
        }

        if (!locations || locations.length === 0) {
            return {
                valid: false,
                error: 'No work locations configured. Please contact your administrator.'
            };
        }

        // Check if user is within radius of any location
        for (const location of locations) {
            const distance = this.calculateDistance(
                userLat,
                userLon,
                location.latitude,
                location.longitude
            );

            if (distance <= location.radius_meters) {
                return {
                    valid: true,
                    location: location,
                    distance: Math.round(distance)
                };
            }
        }

        // Not within any location
        const nearestLocation = locations.reduce((nearest, loc) => {
            const dist = this.calculateDistance(userLat, userLon, loc.latitude, loc.longitude);
            if (!nearest || dist < nearest.distance) {
                return { location: loc, distance: dist };
            }
            return nearest;
        }, null);

        return {
            valid: false,
            error: `You are not at a work location. You are ${Math.round(nearestLocation.distance)}m away from ${nearestLocation.location.name}. Please move closer to clock in.`,
            nearestLocation: nearestLocation.location,
            distance: Math.round(nearestLocation.distance)
        };
    }
};
