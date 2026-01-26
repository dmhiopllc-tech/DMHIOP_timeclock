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
