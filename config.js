// Supabase Configuration
const SUPABASE_URL = 'https://dgfzrkbgrzenukjelnjl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnZnpya2JncnplbnVramVsbmpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc5MjgwNjcsImV4cCI6MjA1MzUwNDA2N30.4-ws3yx7g7Y_DtonI3GCzaEWH0bXsE9r5kp-NdLiMzs';

// Create Supabase client only if it doesn't exist
if (typeof window.timeclockSupabase === 'undefined') {
    window.timeclockSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
