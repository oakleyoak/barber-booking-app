-- Add missing notes column to customers table
-- Run this in your Supabase SQL Editor

ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS notes text null;

-- Update the updated_at trigger to fire when notes is modified
DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
CREATE TRIGGER update_customers_updated_at 
    BEFORE UPDATE ON public.customers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'customers' 
AND table_schema = 'public'
ORDER BY ordinal_position;
