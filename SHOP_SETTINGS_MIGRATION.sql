-- Migration to add manager_commission column to shop_settings table
-- Run this in your Supabase SQL Editor if you have existing data

-- Add manager_commission column if it doesn't exist
ALTER TABLE public.shop_settings
ADD COLUMN IF NOT EXISTS manager_commission numeric(5, 2) DEFAULT 70;

-- Update existing records to have the default manager commission
UPDATE public.shop_settings
SET manager_commission = 70
WHERE manager_commission IS NULL;

-- Update the default shop settings with all commission rates
UPDATE public.shop_settings
SET
  barber_commission = 60,
  manager_commission = 70,
  apprentice_commission = 40,
  social_insurance_rate = 20,
  income_tax_rate = 15,
  income_tax_threshold = 3000,
  opening_time = '09:00:00'::time,
  closing_time = '20:00:00'::time,
  closed_days = ARRAY['Thursday', 'Sunday']
WHERE shop_name = 'Edge & Co Barber Shop';
