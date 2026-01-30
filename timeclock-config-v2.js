// ⏰ Time Clock App - Configuration
// Supabase project credentials

const SUPABASE_URL = 'https://dgfzrkbgrzenukjelnjl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnZnpya2JncnplbnVramVsbmpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NjgwNjcsImV4cCI6MjA4NTA0NDA2N30.09RieWZ-iB23e94iA5BWaYR4KHFFC9FOSV1O8ZeUIz4';

// Initialize Supabase client only if not already created
if (typeof window.timeclockSupabase === 'undefined') {
    window.timeclockSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
