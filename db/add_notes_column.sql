-- Add notes column to bookings table if it doesn't exist
-- Run this in your Supabase SQL Editor

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'bookings'
        AND column_name = 'notes'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.bookings ADD COLUMN notes TEXT;
    END IF;
END $$;
