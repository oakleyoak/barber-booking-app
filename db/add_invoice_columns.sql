-- Migration: add invoice-related columns to bookings table
-- Adds: invoice_number, invoice_sent_at, stripe_payment_id, invoice_url, payment_status, payment_amount

ALTER TABLE IF EXISTS public.bookings
ADD COLUMN IF NOT EXISTS invoice_number text NULL,
ADD COLUMN IF NOT EXISTS invoice_sent_at timestamp with time zone NULL,
ADD COLUMN IF NOT EXISTS stripe_payment_id text NULL,
ADD COLUMN IF NOT EXISTS invoice_url text NULL,
ADD COLUMN IF NOT EXISTS payment_status text NULL,
ADD COLUMN IF NOT EXISTS payment_amount numeric(10,2) NULL;

-- Optional: set default payment_status for existing rows to 'pending'
UPDATE public.bookings SET payment_status = 'pending' WHERE payment_status IS NULL;
