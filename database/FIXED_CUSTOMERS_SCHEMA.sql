-- UPDATED CUSTOMERS TABLE SCHEMA WITH NOTES COLUMN
-- Run this to ensure your customers table has all required columns

-- Drop and recreate customers table with all columns
DROP TABLE IF EXISTS public.customers CASCADE;

CREATE TABLE public.customers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  name text NOT NULL,
  email text NULL,
  phone text NULL,
  notes text NULL,  -- This was missing!
  last_visit date NULL,
  preferred_barber text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT customers_pkey PRIMARY KEY (id),
  CONSTRAINT customers_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers USING btree (email) TABLESPACE pg_default;

-- Create updated_at trigger
CREATE TRIGGER update_customers_updated_at 
    BEFORE UPDATE ON customers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Verify table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'customers' 
AND table_schema = 'public'
ORDER BY ordinal_position;
