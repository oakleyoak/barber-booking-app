import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://libpiqpetkiojiqzzlpa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpYnBpcXBldGtpb2ppcXp6bHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMTkwMTMsImV4cCI6MjA3MTc5NTAxM30.7NCI5kRr0BHI-X1vW5Lb1YfOolVH0x-XvYVVjSCobhI';

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  shop_name: string;
  created_at?: string;
  updated_at?: string;
}

export interface Customer {
  id: string;
  user_id?: string;
  name: string;
  email?: string;
  phone?: string;
  last_visit?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Booking {
  id: string;
  customer_name: string;
  customer_email: string;
  service: string;
  date: string;
  start_time: string;
  end_time: string;
  price: number;
  notes?: string;
  user_id: string;
  customer_id?: string;
  created_at?: string;
  updated_at?: string;
}
