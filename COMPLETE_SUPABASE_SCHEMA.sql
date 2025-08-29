-- ===================================================================
-- COMPLETE BARBER SHOP SUPABASE SCHEMA WITH ALL MISSING TABLES
-- This includes your existing tables + all missing operations tables
-- Copy and paste this entire script into your Supabase SQL Editor
-- ===================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ===================================================================
-- EXISTING CORE TABLES (Enhanced)
-- ===================================================================

-- Users table (existing)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid not null default gen_random_uuid (),
  name text not null,
  email text not null,
  password text not null,
  role text not null,
  shop_name text not null,
  commission_rate numeric(5, 2) default 0.40,
  target_weekly numeric(10, 2) default 800,
  target_monthly numeric(10, 2) default 3200,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  shop_settings text null,
  constraint users_pkey primary key (id),
  constraint users_email_key unique (email),
  constraint users_role_check check (
    (
      role = any (
        array['Owner'::text, 'Barber'::text, 'Apprentice'::text, 'Manager'::text]
      )
    )
  )
) TABLESPACE pg_default;

-- Create index on email for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users USING btree (email) TABLESPACE pg_default;

-- Create trigger for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Customers table (existing)
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  name text not null,
  email text null,
  phone text null,
  last_visit date null,
  preferred_barber text null,
  notes text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint customers_pkey primary key (id),
  constraint customers_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

-- Bookings table (existing)
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  customer_id uuid null,
  customer_name text not null,
  service text not null,
  price numeric(10, 2) not null,
  date date not null,
  time time without time zone not null,
  status text not null,
  notes text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint bookings_pkey primary key (id),
  constraint bookings_customer_id_fkey foreign KEY (customer_id) references customers (id) on delete CASCADE,
  constraint bookings_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint bookings_status_check check (
    (
      status = any (
        array[
          'scheduled'::text,
          'completed'::text,
          'cancelled'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

-- Transactions table (existing)
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid not null default gen_random_uuid (),
  booking_id uuid null,
  user_id uuid not null,
  customer_name text not null,
  service text not null,
  amount numeric(10, 2) not null,
  commission numeric(5, 2) not null,
  commission_amount numeric(10, 2) not null,
  date date not null,
  status text not null default 'completed'::text,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint transactions_pkey primary key (id),
  constraint transactions_booking_id_fkey foreign KEY (booking_id) references bookings (id) on delete set null,
  constraint transactions_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

-- ===================================================================
-- FINANCIAL MANAGEMENT TABLES
-- ===================================================================

-- Expenses table (enhanced)
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  category text not null,
  description text not null,
  amount numeric(10, 2) not null,
  date date not null,
  receipt_url text null,
  is_recurring boolean default false,
  recurring_frequency text null check (recurring_frequency in ('weekly', 'monthly', 'yearly')),
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint expenses_pkey primary key (id),
  constraint expenses_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

-- Payroll table (enhanced)
CREATE TABLE IF NOT EXISTS public.payroll (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  staff_name text not null,
  period_start date not null,
  period_end date not null,
  base_salary numeric(10, 2) not null default 0,
  commission_earned numeric(10, 2) not null default 0,
  total_earnings numeric(10, 2) not null default 0,
  deductions numeric(10, 2) not null default 0,
  net_pay numeric(10, 2) not null default 0,
  tax_deducted numeric(10, 2) not null default 0,
  social_insurance numeric(10, 2) not null default 0,
  status text not null default 'pending'::text,
  payment_date date null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint payroll_pkey primary key (id),
  constraint payroll_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint payroll_status_check check (
    (
      status = any (
        array['pending'::text, 'processed'::text, 'paid'::text]
      )
    )
  )
) TABLESPACE pg_default;

-- Staff targets table (enhanced)
CREATE TABLE IF NOT EXISTS public.staff_targets (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  staff_name text not null,
  target_type text not null,
  target_amount numeric(10, 2) not null,
  current_amount numeric(10, 2) not null default 0,
  period_start date not null,
  period_end date not null,
  is_achieved boolean default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint staff_targets_pkey primary key (id),
  constraint staff_targets_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint staff_targets_target_type_check check (
    (
      target_type = any (
        array['daily'::text, 'weekly'::text, 'monthly'::text]
      )
    )
  )
) TABLESPACE pg_default;

-- Shop settings table (enhanced)
CREATE TABLE IF NOT EXISTS public.shop_settings (
  id uuid not null default gen_random_uuid (),
  shop_name text not null,
  daily_target numeric(10, 2) not null default 1500,
  weekly_target numeric(10, 2) not null default 9000,
  monthly_target numeric(10, 2) not null default 45000,
  barber_commission numeric(5, 2) not null default 60,
  apprentice_commission numeric(5, 2) not null default 40,
  social_insurance_rate numeric(5, 2) not null default 20,
  income_tax_rate numeric(5, 2) not null default 15,
  income_tax_threshold numeric(10, 2) not null default 3000,
  opening_time time without time zone not null default '09:00:00'::time without time zone,
  closing_time time without time zone not null default '20:00:00'::time without time zone,
  closed_days text[] not null default array['Thursday'::text, 'Sunday'::text],
  currency text not null default 'TRY',
  address text null,
  phone text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint shop_settings_pkey primary key (id),
  constraint shop_settings_shop_name_key unique (shop_name)
) TABLESPACE pg_default;

-- ===================================================================
-- OPERATIONS MANAGEMENT TABLES
-- ===================================================================

-- Daily operations log
CREATE TABLE IF NOT EXISTS public.daily_operations (
  id uuid not null default gen_random_uuid (),
  date date not null default CURRENT_DATE,
  barber_id uuid null,
  shop_id uuid null,
  shift_start time without time zone null,
  shift_end time without time zone null,
  total_customers_served integer null default 0,
  total_revenue numeric(10, 2) null default 0,
  notes text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint daily_operations_pkey primary key (id),
  constraint daily_operations_date_barber_id_key unique (date, barber_id),
  constraint daily_operations_barber_id_fkey foreign KEY (barber_id) references users (id)
) TABLESPACE pg_default;

-- Cleaning tasks
CREATE TABLE IF NOT EXISTS public.cleaning_tasks (
  id uuid not null default gen_random_uuid (),
  task_name character varying(255) not null,
  description text null,
  category character varying(100) not null,
  frequency character varying(50) not null,
  estimated_time_minutes integer null default 15,
  priority character varying(20) null default 'medium',
  compliance_requirement boolean null default false,
  instructions text null,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint cleaning_tasks_pkey primary key (id)
) TABLESPACE pg_default;

-- Cleaning logs
CREATE TABLE IF NOT EXISTS public.cleaning_logs (
  id uuid not null default gen_random_uuid (),
  task_id uuid not null,
  barber_id uuid not null,
  completed_date date not null default CURRENT_DATE,
  completed_at timestamp with time zone null,
  notes text null,
  created_at timestamp with time zone null default now(),
  constraint cleaning_logs_pkey primary key (id),
  constraint cleaning_logs_task_id_barber_id_completed_date_key unique (task_id, barber_id, completed_date),
  constraint cleaning_logs_task_id_fkey foreign KEY (task_id) references cleaning_tasks (id),
  constraint cleaning_logs_barber_id_fkey foreign KEY (barber_id) references users (id)
) TABLESPACE pg_default;

-- Maintenance tasks
CREATE TABLE IF NOT EXISTS public.maintenance_tasks (
  id uuid not null default gen_random_uuid (),
  equipment_name character varying(255) not null,
  task_name character varying(255) not null,
  frequency character varying(50) not null,
  estimated_time_minutes integer null default 30,
  instructions text null,
  requires_specialist boolean null default false,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint maintenance_tasks_pkey primary key (id)
) TABLESPACE pg_default;

-- Maintenance logs
CREATE TABLE IF NOT EXISTS public.maintenance_logs (
  id uuid not null default gen_random_uuid (),
  task_id uuid not null,
  barber_id uuid not null,
  completed_date date not null default CURRENT_DATE,
  completed_at timestamp with time zone null,
  notes text null,
  created_at timestamp with time zone null default now(),
  constraint maintenance_logs_pkey primary key (id),
  constraint maintenance_logs_task_id_barber_id_completed_date_key unique (task_id, barber_id, completed_date),
  constraint maintenance_logs_task_id_fkey foreign KEY (task_id) references maintenance_tasks (id),
  constraint maintenance_logs_barber_id_fkey foreign KEY (barber_id) references users (id)
) TABLESPACE pg_default;

-- Safety check items
CREATE TABLE IF NOT EXISTS public.safety_check_items (
  id uuid not null default gen_random_uuid (),
  check_name character varying(255) not null,
  description text null,
  frequency character varying(50) not null,
  compliance_requirement boolean null default false,
  instructions text null,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint safety_check_items_pkey primary key (id)
) TABLESPACE pg_default;

-- Safety check logs
CREATE TABLE IF NOT EXISTS public.safety_check_logs (
  id uuid not null default gen_random_uuid (),
  item_id uuid not null,
  barber_id uuid not null,
  check_date date not null default CURRENT_DATE,
  status character varying(20) not null,
  notes text null,
  created_at timestamp with time zone null default now(),
  constraint safety_check_logs_pkey primary key (id),
  constraint safety_check_logs_item_id_barber_id_check_date_key unique (item_id, barber_id, check_date),
  constraint safety_check_logs_item_id_fkey foreign KEY (item_id) references safety_check_items (id),
  constraint safety_check_logs_barber_id_fkey foreign KEY (barber_id) references users (id)
) TABLESPACE pg_default;

-- Equipment inventory
CREATE TABLE IF NOT EXISTS public.equipment_inventory (
  id uuid not null default gen_random_uuid (),
  equipment_name character varying(255) not null,
  category character varying(100) not null,
  serial_number character varying(255) null,
  purchase_date date null,
  warranty_expiry date null,
  location character varying(255) null,
  condition_rating integer null,
  current_value numeric(10, 2) null,
  is_active boolean null default true,
  notes text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint equipment_inventory_pkey primary key (id),
  constraint equipment_inventory_condition_rating_check check (
    (
      (condition_rating >= 1)
      and (condition_rating <= 5)
    )
  )
) TABLESPACE pg_default;

-- Supplies inventory
CREATE TABLE IF NOT EXISTS public.supplies_inventory (
  id uuid not null default gen_random_uuid (),
  item_name character varying(255) not null,
  category character varying(100) not null,
  current_stock integer null default 0,
  minimum_stock integer null default 0,
  unit character varying(50) null default 'pieces'::character varying,
  supplier character varying(255) null,
  last_restocked date null,
  expiry_date date null,
  unit_cost numeric(10, 2) null,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint supplies_inventory_pkey primary key (id)
) TABLESPACE pg_default;

-- Staff accountability
CREATE TABLE IF NOT EXISTS public.staff_accountability (
  id uuid not null default gen_random_uuid (),
  date date not null default CURRENT_DATE,
  barber_id uuid null,
  check_in_time time without time zone null,
  check_out_time time without time zone null,
  breaks_taken jsonb null,
  uniform_compliant boolean null default true,
  hygiene_compliant boolean null default true,
  behavior_rating integer null,
  performance_notes text null,
  issues_reported text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint staff_accountability_pkey primary key (id),
  constraint staff_accountability_date_barber_id_key unique (date, barber_id),
  constraint staff_accountability_barber_id_fkey foreign KEY (barber_id) references users (id),
  constraint staff_accountability_behavior_rating_check check (
    (
      (behavior_rating >= 1)
      and (behavior_rating <= 5)
    )
  )
) TABLESPACE pg_default;

-- Incident reports
CREATE TABLE IF NOT EXISTS public.incident_reports (
  id uuid not null default gen_random_uuid (),
  date date not null default CURRENT_DATE,
  time time without time zone not null default CURRENT_TIME,
  reported_by uuid null,
  incident_type character varying(100) not null,
  severity character varying(20) not null,
  location character varying(255) null,
  description text not null,
  immediate_action_taken text null,
  witnesses text null,
  follow_up_required boolean null default false,
  follow_up_notes text null,
  resolved boolean null default false,
  resolved_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint incident_reports_pkey primary key (id),
  constraint incident_reports_reported_by_fkey foreign KEY (reported_by) references users (id)
) TABLESPACE pg_default;

-- ===================================================================
-- INDEXES FOR PERFORMANCE
-- ===================================================================

-- Existing indexes
create index IF not exists idx_bookings_user_id on public.bookings using btree (user_id) TABLESPACE pg_default;
create index IF not exists idx_bookings_date on public.bookings using btree (date) TABLESPACE pg_default;
create index IF not exists idx_bookings_status on public.bookings using btree (status) TABLESPACE pg_default;
create index IF not exists idx_customers_user_id on public.customers using btree (user_id) TABLESPACE pg_default;
create index IF not exists idx_users_email on public.users using btree (email) TABLESPACE pg_default;

-- New indexes
create index IF not exists idx_transactions_user_id on public.transactions using btree (user_id) TABLESPACE pg_default;
create index IF not exists idx_transactions_date on public.transactions using btree (date) TABLESPACE pg_default;
create index IF not exists idx_expenses_user_id on public.expenses using btree (user_id) TABLESPACE pg_default;
create index IF not exists idx_expenses_date on public.expenses using btree (date) TABLESPACE pg_default;
create index IF not exists idx_payroll_user_id on public.payroll using btree (user_id) TABLESPACE pg_default;
create index IF not exists idx_staff_targets_user_id on public.staff_targets using btree (user_id) TABLESPACE pg_default;
create index IF not exists idx_daily_operations_date on public.daily_operations using btree (date) TABLESPACE pg_default;
create index IF not exists idx_daily_operations_barber on public.daily_operations using btree (barber_id) TABLESPACE pg_default;
create index IF not exists idx_cleaning_logs_date on public.cleaning_logs using btree (completed_date) TABLESPACE pg_default;
create index IF not exists idx_maintenance_logs_date on public.maintenance_logs using btree (completed_date) TABLESPACE pg_default;
create index IF not exists idx_safety_check_logs_date on public.safety_check_logs using btree (check_date) TABLESPACE pg_default;
create index IF not exists idx_staff_accountability_date on public.staff_accountability using btree (date) TABLESPACE pg_default;
create index IF not exists idx_incident_reports_date on public.incident_reports using btree (date) TABLESPACE pg_default;

-- ===================================================================
-- TRIGGERS FOR UPDATED_AT
-- ===================================================================

create trigger update_users_updated_at BEFORE update on users for EACH row execute FUNCTION update_updated_at_column ();
create trigger update_customers_updated_at BEFORE update on customers for EACH row execute FUNCTION update_updated_at_column ();
create trigger update_bookings_updated_at BEFORE update on bookings for EACH row execute FUNCTION update_updated_at_column ();
create trigger update_transactions_updated_at BEFORE update on transactions for EACH row execute FUNCTION update_updated_at_column ();
create trigger update_expenses_updated_at BEFORE update on expenses for EACH row execute FUNCTION update_updated_at_column ();
create trigger update_payroll_updated_at BEFORE update on payroll for EACH row execute FUNCTION update_updated_at_column ();
create trigger update_staff_targets_updated_at BEFORE update on staff_targets for EACH row execute FUNCTION update_updated_at_column ();
create trigger update_shop_settings_updated_at BEFORE update on shop_settings for EACH row execute FUNCTION update_updated_at_column ();
create trigger update_daily_operations_updated_at BEFORE update on daily_operations for EACH row execute FUNCTION update_updated_at_column ();
create trigger update_cleaning_tasks_updated_at BEFORE update on cleaning_tasks for EACH row execute FUNCTION update_updated_at_column ();
create trigger update_maintenance_tasks_updated_at BEFORE update on maintenance_tasks for EACH row execute FUNCTION update_updated_at_column ();
create trigger update_safety_check_items_updated_at BEFORE update on safety_check_items for EACH row execute FUNCTION update_updated_at_column ();
create trigger update_equipment_inventory_updated_at BEFORE update on equipment_inventory for EACH row execute FUNCTION update_updated_at_column ();
create trigger update_supplies_inventory_updated_at BEFORE update on supplies_inventory for EACH row execute FUNCTION update_updated_at_column ();
create trigger update_staff_accountability_updated_at BEFORE update on staff_accountability for EACH row execute FUNCTION update_updated_at_column ();
create trigger update_incident_reports_updated_at BEFORE update on incident_reports for EACH row execute FUNCTION update_updated_at_column ();

-- ===================================================================
-- DEFAULT DATA
-- ===================================================================

-- Insert default shop settings
INSERT INTO public.shop_settings (shop_name, daily_target, weekly_target, monthly_target) 
VALUES ('Edge & Co Barber Shop', 1500, 9000, 45000)
ON CONFLICT (shop_name) DO NOTHING;

-- Insert default cleaning tasks
INSERT INTO public.cleaning_tasks (task_name, description, category, frequency, estimated_time_minutes, priority, compliance_requirement, instructions) VALUES
('Sweep and mop floors', 'Clean all floor surfaces', 'floors', 'daily', 15, 'high', true, 'Sweep all areas, mop with disinfectant solution'),
('Clean barber chairs', 'Sanitize customer seating', 'equipment', 'daily', 10, 'high', true, 'Wipe down chairs with disinfectant wipes'),
('Sanitize tools and clippers', 'Sterilize cutting tools', 'equipment', 'daily', 20, 'critical', true, 'Clean and sterilize all tools after each use'),
('Clean mirrors and counters', 'Polish reflective surfaces', 'common_areas', 'daily', 10, 'medium', false, 'Use glass cleaner and microfiber cloth'),
('Empty trash bins', 'Waste management', 'common_areas', 'daily', 5, 'low', false, 'Replace liners and take out trash'),
('Clean bathroom facilities', 'Sanitize restroom areas', 'bathrooms', 'daily', 15, 'high', true, 'Clean sink, toilet, and floors'),
('Dust shelves and displays', 'Remove surface dust', 'common_areas', 'weekly', 10, 'low', false, 'Remove dust from all surfaces'),
('Clean windows and doors', 'Maintain entrance appearance', 'common_areas', 'weekly', 20, 'medium', false, 'Use appropriate cleaning solution')
ON CONFLICT DO NOTHING;

-- Insert default maintenance tasks
INSERT INTO public.maintenance_tasks (equipment_name, task_name, frequency, estimated_time_minutes, instructions, requires_specialist) VALUES
('Barber Chairs', 'Check hydraulic systems', 'weekly', 15, 'Inspect for leaks and proper operation', false),
('Clippers', 'Clean and oil blades', 'daily', 5, 'Disassemble, clean, and lubricate', false),
('Sterilizer', 'Check water levels and function', 'daily', 5, 'Verify sterilization cycle completion', false),
('Hair Dryer', 'Check cord and filter', 'weekly', 10, 'Inspect for damage and clean filter', false),
('Cash Register', 'Test all functions', 'daily', 5, 'Verify drawer opens and printer works', false),
('Air Conditioning', 'Check filters and temperature', 'weekly', 10, 'Clean filters if needed', true)
ON CONFLICT DO NOTHING;

-- Insert default safety check items
INSERT INTO public.safety_check_items (check_name, description, frequency, compliance_requirement, instructions) VALUES
('Electrical outlets', 'Check for exposed wires or damage', 'daily', true, 'Visual inspection of all electrical outlets'),
('Fire extinguisher', 'Verify gauge is in green zone', 'daily', true, 'Check pressure gauge and accessibility'),
('First aid kit', 'Ensure supplies are stocked', 'weekly', true, 'Check expiry dates and restock as needed'),
('Emergency exits', 'Ensure paths are clear', 'daily', true, 'Verify exits are unobstructed'),
('Sterilization equipment', 'Check proper operation', 'daily', true, 'Test sterilizer cycle completion'),
('Water temperature', 'Verify safe temperature range', 'daily', true, 'Check hot water does not exceed 60°C')
ON CONFLICT DO NOTHING;

-- Insert default expense categories
INSERT INTO public.expenses (user_id, category, description, amount, date) 
SELECT u.id, 'Rent', 'Monthly shop rent', 2500.00, CURRENT_DATE
FROM public.users u WHERE u.role = 'Owner'
ON CONFLICT DO NOTHING;

-- ===================================================================
-- ROW LEVEL SECURITY (Optional - uncomment if needed)
-- ===================================================================

-- Enable RLS on all tables
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.staff_targets ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.daily_operations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.cleaning_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.safety_check_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.staff_accountability ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.incident_reports ENABLE ROW LEVEL SECURITY;

-- ===================================================================
-- SETUP COMPLETE
-- ===================================================================

-- Verify table creation
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN (
        'users', 'customers', 'bookings', 'transactions',
        'expenses', 'payroll', 'staff_targets', 'shop_settings',
        'daily_operations', 'cleaning_tasks', 'cleaning_logs',
        'maintenance_tasks', 'maintenance_logs', 'safety_check_items',
        'safety_check_logs', 'equipment_inventory', 'supplies_inventory',
        'staff_accountability', 'incident_reports'
    )
ORDER BY table_name;
