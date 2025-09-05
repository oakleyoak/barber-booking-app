import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://libpiqpetkiojiqzzlpa.supabase.co';
export const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpYnBpcXBldGtpb2ppcXp6bHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMTkwMTMsImV4cCI6MjA3MTc5NTAxM30.7NCI5kRr0BHI-X1vW5Lb1YfOolVH0x-XvYVVjSCobhI';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

// Interface matching your exact Supabase schema
export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Optional for frontend use (never sent to client)
  role: 'Owner' | 'Manager' | 'Barber' | 'Apprentice';
  shop_name: string;
  commission_rate: number;
  target_weekly: number;
  target_monthly: number;
  shop_settings?: string;
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
  user_id?: string;
  customer_id?: string;
  customer_name: string;
  customer_email?: string; // optional runtime field, not persisted to bookings table
  customer_phone?: string; // Added from component
  service: string;
  price: number;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string; // Added from component
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method?: 'stripe' | 'cash' | 'card' | 'other';
  stripe_payment_id?: string;
  invoice_number?: string;
  invoice_sent_at?: string;
  payment_received_at?: string;
  payment_amount?: number;
  created_at?: string;
  updated_at?: string;
  users?: { // From booking management component
    name: string;
  };
  customers?: { // From booking management component
    name: string;
    email: string;
    phone: string;
  };
}

export interface Expense {
  id: string;
  user_id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  created_at?: string;
  updated_at?: string;
}

export interface Payroll {
  id: string;
  user_id: string;
  staff_name: string;
  period_start: string;
  period_end: string;
  base_salary: number;
  commission_earned: number;
  total_earnings: number;
  deductions: number;
  net_pay: number;
  status: 'pending' | 'processed' | 'paid';
  created_at?: string;
  updated_at?: string;
}

export interface StaffTarget {
  id: string;
  user_id: string;
  staff_name: string;
  target_type: 'daily' | 'weekly' | 'monthly';
  target_amount: number;
  period_start: string;
  period_end: string;
  created_at?: string;
  updated_at?: string;
}

export interface Transaction {
  id: string;
  booking_id?: string;
  user_id: string;
  customer_name: string;
  service: string;
  amount: number;
  commission: number;
  commission_amount: number;
  date: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

// Additional interfaces for ShopSettings (existing table)
export interface ShopSettings {
  id?: string;
  user_id?: string;
  shop_name: string;
  opening_time?: string;
  closing_time?: string;
  closed_days?: string[];
  daily_target: number;
  weekly_target: number;
  monthly_target: number;
  barber_commission?: number;
  manager_commission?: number;
  apprentice_commission?: number;
  social_insurance_rate?: number;
  income_tax_rate?: number;
  income_tax_threshold?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ServicePricing {
  name: string;
  price: number;
  duration: number;
}
export interface PayrollEntry {
  id?: string;
  user_id?: string;
  period_start: string;
  period_end: string;
  base_salary?: number;
  commission_earned: number;
  bonus?: number;
  deductions?: number;
  total_pay: number;
  created_at?: string;
  updated_at?: string;
}
