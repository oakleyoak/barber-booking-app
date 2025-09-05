-- Add customer_email to bookings and backfill from customers table
-- Run this in Supabase SQL Editor

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'bookings'
        AND column_name = 'customer_email'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.bookings ADD COLUMN customer_email TEXT;
        RAISE NOTICE 'Added customer_email column to bookings table';
    ELSE
        RAISE NOTICE 'customer_email column already exists in bookings table';
    END IF;
END $$;

-- Backfill existing bookings where customer_email is null using customers.email
DO $$
BEGIN
    UPDATE public.bookings b
    SET customer_email = c.email
    FROM public.customers c
    WHERE b.customer_id IS NOT NULL
      AND b.customer_email IS NULL
      AND c.id = b.customer_id;
    RAISE NOTICE 'Backfilled bookings.customer_email from customers.email where applicable';
END $$;
