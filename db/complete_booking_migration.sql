-- Complete database migration to add all missing columns
-- Run this in your Supabase SQL Editor

-- Add notes column to bookings table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'bookings'
        AND column_name = 'notes'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.bookings ADD COLUMN notes TEXT;
        RAISE NOTICE 'Added notes column to bookings table';
    ELSE
        RAISE NOTICE 'notes column already exists in bookings table';
    END IF;
END $$;

-- Add invoice and payment columns to bookings table if they don't exist
DO $$
BEGIN
    -- Add invoice_number column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'bookings'
        AND column_name = 'invoice_number'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.bookings ADD COLUMN invoice_number TEXT;
        RAISE NOTICE 'Added invoice_number column to bookings table';
    END IF;

    -- Add invoice_sent_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'bookings'
        AND column_name = 'invoice_sent_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.bookings ADD COLUMN invoice_sent_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added invoice_sent_at column to bookings table';
    END IF;

    -- Add stripe_payment_id column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'bookings'
        AND column_name = 'stripe_payment_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.bookings ADD COLUMN stripe_payment_id TEXT;
        RAISE NOTICE 'Added stripe_payment_id column to bookings table';
    END IF;

    -- Add invoice_url column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'bookings'
        AND column_name = 'invoice_url'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.bookings ADD COLUMN invoice_url TEXT;
        RAISE NOTICE 'Added invoice_url column to bookings table';
    END IF;

    -- Add payment_status column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'bookings'
        AND column_name = 'payment_status'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.bookings ADD COLUMN payment_status TEXT;
        RAISE NOTICE 'Added payment_status column to bookings table';
    END IF;

    -- Add payment_amount column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'bookings'
        AND column_name = 'payment_amount'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.bookings ADD COLUMN payment_amount NUMERIC(10,2);
        RAISE NOTICE 'Added payment_amount column to bookings table';
    END IF;

    -- Add card_processing_fee column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'bookings'
        AND column_name = 'card_processing_fee'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.bookings ADD COLUMN card_processing_fee NUMERIC(10,2);
        RAISE NOTICE 'Added card_processing_fee column to bookings table';
    END IF;

    -- Add staff_name column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'bookings'
        AND column_name = 'staff_name'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.bookings ADD COLUMN staff_name TEXT;
        RAISE NOTICE 'Added staff_name column to bookings table';
    END IF;
END $$;
