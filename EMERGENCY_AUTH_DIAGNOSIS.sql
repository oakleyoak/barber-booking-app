-- Emergency Authentication Diagnosis and Fix
-- Run this in your Supabase SQL Editor to diagnose the current auth situation

-- 1. Check what auth users exist
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- 2. Check what profile users exist
SELECT 
    id,
    name,
    email,
    role,
    created_at
FROM public.users
ORDER BY created_at DESC;

-- 3. Check for mismatches between auth and profile
SELECT 
    au.id as auth_id,
    au.email as auth_email,
    au.email_confirmed_at,
    u.id as profile_id,
    u.name,
    u.email as profile_email,
    u.role,
    CASE 
        WHEN au.id IS NULL THEN 'PROFILE WITHOUT AUTH'
        WHEN u.id IS NULL THEN 'AUTH WITHOUT PROFILE'
        WHEN au.email != u.email THEN 'EMAIL MISMATCH'
        ELSE 'OK'
    END as status
FROM auth.users au
FULL OUTER JOIN public.users u ON au.id = u.id
ORDER BY au.created_at DESC NULLS LAST, u.created_at DESC NULLS LAST;

SELECT 'Authentication diagnosis complete - check results above' as message;
