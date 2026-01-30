// ⏰ Time Clock App - Authentication Helper

// Export authentication functions
window.timeclockAuth = {
    // Get current user session
    getCurrentSession: async function() {
        const supabase = window.timeclockSupabase;
        const { data: { session } } = await supabase.auth.getSession();
        return session;
    },

    // Get current user with role
    getCurrentUser: async function() {
        const supabase = window.timeclockSupabase;
        const session = await this.getCurrentSession();
        if (!session) return null;

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (error) {
            console.error('Error fetching user:', error);
            return null;
        }

        return user;
    },

    // Check if user has required role
    requireAuth: async function(allowedRoles = []) {
        const user = await this.getCurrentUser();
        
        if (!user) {
            window.location.href = 'login-standalone.html';
            return null;
        }

        if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
            alert('Access denied. Insufficient permissions.');
            this.redirectToDashboard(user.role);
            return null;
        }

        return user;
    },

    // Redirect based on role
    redirectToDashboard: function(role) {
        switch(role) {
            case 'admin':
                            window.location.href = 'admin-dashboard-standalone.html';
                window.location.href = 'manager-dashboard.html';
                break;
            case 'employee':
            default:
                    window.location.href = 'employee-dashboard-v2.html';
        }
    },

    // Logout
    logout: async function() {
        const supabase = window.timeclockSupabase;
        await supabase.auth.signOut();
        window.location.href = 'login.html';
    }
};
