import { createClient } from '@supabase/supabase-js';

// Service client with elevated permissions for operations
const supabaseUrl = 'https://libpiqpetkiojiqzzlpa.supabase.co';
const supabaseServiceKey = 'YOUR_SERVICE_ROLE_KEY_HERE'; // You need to get this from Supabase Dashboard

export const supabaseService = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  }
});
