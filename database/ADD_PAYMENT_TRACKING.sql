-- Add payment tracking columns to bookings table
-- Run this in your Supabase SQL Editor

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT null,
ADD COLUMN IF NOT EXISTS stripe_payment_id text DEFAULT null,
ADD COLUMN IF NOT EXISTS invoice_number text DEFAULT null,
ADD COLUMN IF NOT EXISTS invoice_sent_at timestamp with time zone DEFAULT null,
ADD COLUMN IF NOT EXISTS payment_received_at timestamp with time zone DEFAULT null,
ADD COLUMN IF NOT EXISTS payment_amount numeric(10, 2) DEFAULT null;

-- Create index for payment status queries
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON public.bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_stripe_payment_id ON public.bookings(stripe_payment_id);

-- Update existing bookings to have pending payment status
UPDATE public.bookings 
SET payment_status = 'pending' 
WHERE payment_status IS NULL;

COMMENT ON COLUMN public.bookings.payment_status IS 'Payment status: pending, paid, failed, refunded';
COMMENT ON COLUMN public.bookings.payment_method IS 'Payment method used: stripe, bank_transfer, cash';
COMMENT ON COLUMN public.bookings.stripe_payment_id IS 'Stripe payment link or session ID';
COMMENT ON COLUMN public.bookings.invoice_number IS 'Generated invoice number';
COMMENT ON COLUMN public.bookings.invoice_sent_at IS 'When invoice was sent to customer';
COMMENT ON COLUMN public.bookings.payment_received_at IS 'When payment was confirmed';
COMMENT ON COLUMN public.bookings.payment_amount IS 'Amount paid (may differ from service price due to tips/discounts)';
