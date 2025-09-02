-- FIX EMAIL VERIFICATION TO WORK WITH PRODUCTION DOMAIN
-- Note: auth.config table doesn't exist in this Supabase version
-- You need to update settings in Supabase Dashboard instead

-- Step 1: Mark all existing users as email confirmed so they can log in
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- Step 2: Check current auth users
SELECT 
    id,
    email, 
    email_confirmed_at,
    created_at
FROM auth.users 
ORDER BY created_at DESC;

-- IMPORTANT: You MUST update these settings in your Supabase Dashboard:
-- Go to: Authentication > Settings
-- 1. Site URL: https://edgeandco.netlify.app
-- 2. Redirect URLs: https://edgeandco.netlify.app/**
-- 3. Enable email confirmations: ON
-- 4. Email confirmation redirect URL: https://edgeandco.netlify.app

SELECT 'All existing users marked as verified. Update Supabase Dashboard settings manually.' as result;
