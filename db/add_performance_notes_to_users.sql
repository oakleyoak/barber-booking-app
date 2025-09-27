-- Add performance_notes column to users table for owner/staff review notes
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS performance_notes text null;