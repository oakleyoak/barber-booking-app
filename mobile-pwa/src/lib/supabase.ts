import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://libpiqpetkiojiqzzlpa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpYnBpcXBldGtpb2ppcXp6bHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMTkwMTMsImV4cCI6MjA3MTc5NTAxM30.7NCI5kRr0BHI-X1vW5Lb1YfOolVH0x-XvYVVjSCobhI';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  shop_name: string;
  target_weekly?: number;
  target_monthly?: number;
  commission_rate?: number;
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
  service: string;
  price: number;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at?: string;
  updated_at?: string;
}

export interface Expense {
  id: string;
  user_id?: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  receipt_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ShopSettings {
  id?: string;
  shop_name: string;
  opening_time: string;
  closing_time: string;
  sunday_opening_time: string;
  sunday_closing_time: string;
  closed_days: string[];
  services: ServicePricing[];
  daily_target?: number;
  weekly_target?: number;
  monthly_target?: number;
  default_commission_rate?: number;
  barber_commission?: number;
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

export interface StaffTarget {
  id?: string;
  user_id?: string;
  target_name: string;
  target_value: number;
  achieved_value?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Payroll {
  id: string;
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
