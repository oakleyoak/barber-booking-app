-- ===================================================================
-- SHOP NAME FIX MIGRATION
-- Run this in your Supabase SQL Editor to fix the shop name issue
-- ===================================================================

-- Add manager_commission column if it doesn't exist
ALTER TABLE public.shop_settings
ADD COLUMN IF NOT EXISTS manager_commission numeric(5, 2) not null default 70;

-- Fix any existing users with incorrect shop name
UPDATE public.users
SET shop_name = 'Edge & Co Barber Shop'
WHERE shop_name IN ('edge and co', 'edge & co', 'Edge and Co');

-- Fix any existing shop_settings with incorrect shop name
UPDATE public.shop_settings
SET shop_name = 'Edge & Co Barber Shop'
WHERE shop_name IN ('edge and co', 'edge & co', 'Edge and Co');

-- Verify the fix
SELECT 'Users with correct shop name:' as info, COUNT(*) as count
FROM public.users
WHERE shop_name = 'Edge & Co Barber Shop';

SELECT 'Shop settings with correct shop name:' as info, COUNT(*) as count
FROM public.shop_settings
WHERE shop_name = 'Edge & Co Barber Shop';
