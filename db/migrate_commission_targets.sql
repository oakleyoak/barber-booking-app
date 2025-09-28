-- Migration to move commission and target fields from shop_settings to users table
-- Run this in your Supabase SQL Editor

-- Add commission and target fields to users table
DO $$
BEGIN
    -- Add commission_rate column to users table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'commission_rate'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users ADD COLUMN commission_rate NUMERIC(5, 2) DEFAULT 60;
        RAISE NOTICE 'Added commission_rate column to users table';
    ELSE
        RAISE NOTICE 'commission_rate column already exists in users table';
    END IF;

    -- Add target_daily column to users table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'target_daily'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users ADD COLUMN target_daily NUMERIC(10, 2) DEFAULT 400;
        RAISE NOTICE 'Added target_daily column to users table';
    ELSE
        RAISE NOTICE 'target_daily column already exists in users table';
    END IF;

    -- Add target_weekly column to users table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'target_weekly'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users ADD COLUMN target_weekly NUMERIC(10, 2) DEFAULT 2000;
        RAISE NOTICE 'Added target_weekly column to users table';
    ELSE
        RAISE NOTICE 'target_weekly column already exists in users table';
    END IF;

    -- Add target_monthly column to users table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'target_monthly'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users ADD COLUMN target_monthly NUMERIC(10, 2) DEFAULT 8000;
        RAISE NOTICE 'Added target_monthly column to users table';
    ELSE
        RAISE NOTICE 'target_monthly column already exists in users table';
    END IF;
END $$;

-- Remove commission and target fields from shop_settings table (if they exist)
DO $$
BEGIN
    -- Remove barber_commission column from shop_settings if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'shop_settings'
        AND column_name = 'barber_commission'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.shop_settings DROP COLUMN barber_commission;
        RAISE NOTICE 'Removed barber_commission column from shop_settings table';
    END IF;

    -- Remove apprentice_commission column from shop_settings if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'shop_settings'
        AND column_name = 'apprentice_commission'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.shop_settings DROP COLUMN apprentice_commission;
        RAISE NOTICE 'Removed apprentice_commission column from shop_settings table';
    END IF;

    -- Remove manager_commission column from shop_settings if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'shop_settings'
        AND column_name = 'manager_commission'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.shop_settings DROP COLUMN manager_commission;
        RAISE NOTICE 'Removed manager_commission column from shop_settings table';
    END IF;

    -- Remove daily_target column from shop_settings if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'shop_settings'
        AND column_name = 'daily_target'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.shop_settings DROP COLUMN daily_target;
        RAISE NOTICE 'Removed daily_target column from shop_settings table';
    END IF;

    -- Remove weekly_target column from shop_settings if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'shop_settings'
        AND column_name = 'weekly_target'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.shop_settings DROP COLUMN weekly_target;
        RAISE NOTICE 'Removed weekly_target column from shop_settings table';
    END IF;

    -- Remove monthly_target column from shop_settings if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'shop_settings'
        AND column_name = 'monthly_target'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.shop_settings DROP COLUMN monthly_target;
        RAISE NOTICE 'Removed monthly_target column from shop_settings table';
    END IF;
END $$;

-- Update existing users with default values based on their role
UPDATE public.users
SET
    commission_rate = CASE
        WHEN role = 'Owner' THEN 70
        WHEN role = 'Manager' THEN 65
        WHEN role = 'Barber' THEN 60
        WHEN role = 'Apprentice' THEN 40
        ELSE 60
    END,
    target_daily = CASE
        WHEN role = 'Owner' THEN 500
        WHEN role = 'Manager' THEN 450
        WHEN role = 'Barber' THEN 400
        WHEN role = 'Apprentice' THEN 300
        ELSE 400
    END,
    target_weekly = CASE
        WHEN role = 'Owner' THEN 3000
        WHEN role = 'Manager' THEN 2500
        WHEN role = 'Barber' THEN 2000
        WHEN role = 'Apprentice' THEN 1500
        ELSE 2000
    END,
    target_monthly = CASE
        WHEN role = 'Owner' THEN 12000
        WHEN role = 'Manager' THEN 10000
        WHEN role = 'Barber' THEN 8000
        WHEN role = 'Apprentice' THEN 6000
        ELSE 8000
    END
WHERE commission_rate IS NULL OR target_daily IS NULL OR target_weekly IS NULL OR target_monthly IS NULL;