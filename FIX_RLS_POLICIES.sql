-- ===================================================================
-- FIX RLS POLICIES FOR OPERATIONS TABLES
-- Run this in your Supabase SQL Editor to fix the task completion issues
-- ===================================================================

-- First, drop any existing policies that might conflict
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.maintenance_logs;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.cleaning_logs;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.safety_check_logs;

-- Disable RLS on operations tables to allow all staff to mark tasks complete
ALTER TABLE IF EXISTS public.maintenance_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cleaning_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.safety_check_logs DISABLE ROW LEVEL SECURITY;

-- Also disable RLS on the master task tables for consistency
ALTER TABLE IF EXISTS public.cleaning_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.maintenance_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.safety_check_items DISABLE ROW LEVEL SECURITY;

-- Verify the changes
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('cleaning_logs', 'maintenance_logs', 'safety_check_logs', 'cleaning_tasks', 'maintenance_tasks', 'safety_check_items')
ORDER BY tablename;
