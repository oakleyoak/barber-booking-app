-- ===================================================================
-- QUICK SETUP SCRIPT FOR NEW SUPABASE INSTANCE
-- Copy and paste this into your Supabase SQL Editor and run it
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
-- CORE TABLES (Only the essential ones to get app running)
-- ===================================================================

-- Add missing columns to existing users table
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS shop_name text,
  ADD COLUMN IF NOT EXISTS commission_rate numeric(5, 2) default 0.40,
  ADD COLUMN IF NOT EXISTS target_weekly numeric(10, 2) default 800,
  ADD COLUMN IF NOT EXISTS target_monthly numeric(10, 2) default 3200,
  ADD COLUMN IF NOT EXISTS shop_settings text;

-- Add role constraint if it doesn't exist (including Manager role)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'users_role_check'
  ) THEN
    ALTER TABLE public.users ADD CONSTRAINT users_role_check 
    CHECK (role = ANY (ARRAY['Owner'::text, 'Barber'::text, 'Apprentice'::text, 'Manager'::text]));
  ELSE
    -- Update existing constraint to include Manager role
    ALTER TABLE public.users DROP CONSTRAINT users_role_check;
    ALTER TABLE public.users ADD CONSTRAINT users_role_check 
    CHECK (role = ANY (ARRAY['Owner'::text, 'Barber'::text, 'Apprentice'::text, 'Manager'::text]));
  END IF;
END $$;

-- Create index on email for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users USING btree (email);

-- Create trigger for updated_at if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_users_updated_at'
  ) THEN
    CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Customers table
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
);

-- Bookings table
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
);

-- Transactions table
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
);

-- Expenses table
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
);

-- Supplies inventory table
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
);

-- Equipment inventory table
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
);

-- Incident reports table
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
);

-- Operations-related tables for the Operations Manual
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
);

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
);

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
);

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
);

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
);

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
);

-- ===================================================================
-- INDEXES FOR PERFORMANCE
-- ===================================================================

create index IF not exists idx_bookings_user_id on public.bookings using btree (user_id);
create index IF not exists idx_bookings_date on public.bookings using btree (date);
create index IF not exists idx_customers_user_id on public.customers using btree (user_id);
create index IF not exists idx_users_email on public.users using btree (email);
create index IF not exists idx_transactions_user_id on public.transactions using btree (user_id);
create index IF not exists idx_expenses_user_id on public.expenses using btree (user_id);

-- ===================================================================
-- INSERT YOUR EXISTING USERS DATA
-- ===================================================================

-- Insert your existing users (update emails/passwords as needed)
-- First, let's update existing users if they exist
UPDATE public.users 
SET 
  shop_name = COALESCE(shop_name, 'edge and co'),
  commission_rate = COALESCE(commission_rate, 0.40),
  target_weekly = CASE 
    WHEN email = 'omustafa2@googlemail.com' THEN 1969.31 
    ELSE COALESCE(target_weekly, 800) 
  END,
  target_monthly = CASE 
    WHEN email = 'omustafa2@googlemail.com' THEN 118 
    ELSE COALESCE(target_monthly, 3200) 
  END,
  shop_settings = CASE 
    WHEN email = 'omustafa2@googlemail.com' THEN '{"dailyTarget":1969.31,"weeklyTarget":118}'
    ELSE shop_settings
  END
WHERE email IN ('omustafa2@googlemail.com', 'ismailhmahmut@googlemail.com');

-- Insert new users if they don't exist
INSERT INTO public.users (id, name, email, password, role, shop_name, commission_rate, target_weekly, target_monthly, shop_settings) 
SELECT * FROM (VALUES
  ('b399ed95-dee8-4939-b044-b9347d2be54e'::uuid, 'Okan', 'omustafa2@googlemail.com', '22562310', 'Owner', 'edge and co', 0.40, 1969.31, 118, '{"dailyTarget":1969.31,"weeklyTarget":118}'),
  ('ccc4901b-7e0a-4439-bd17-b4dc62acd802'::uuid, 'İsmail Hassan Azimkar', 'ismailhmahmut@googlemail.com', 'ishy2256', 'Barber', 'edge and co', 0.40, 800, 3200, NULL)
) AS new_users(id, name, email, password, role, shop_name, commission_rate, target_weekly, target_monthly, shop_settings)
WHERE NOT EXISTS (
  SELECT 1 FROM public.users WHERE users.email = new_users.email
);

-- ===================================================================
-- SUCCESS MESSAGE
-- ===================================================================

SELECT 'Database setup completed successfully! All required tables have been created.' as status;
