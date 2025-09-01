-- Manual cleanup for orphaned auth users
-- Run this in your Supabase SQL Editor to clean up auth users that don't have corresponding profiles

-- First, let's see what orphaned auth users exist
SELECT 
    au.id as auth_user_id,
    au.email,
    au.email_confirmed_at,
    au.created_at as auth_created_at,
    u.id as profile_user_id,
    u.name as profile_name
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL
ORDER BY au.created_at DESC;

-- If you want to delete specific orphaned auth users, uncomment and modify this:
-- DELETE FROM auth.users WHERE id = 'PUT_SPECIFIC_AUTH_USER_ID_HERE';
-- DELETE FROM auth.sessions WHERE user_id = 'PUT_SPECIFIC_AUTH_USER_ID_HERE';
-- DELETE FROM auth.refresh_tokens WHERE user_id = 'PUT_SPECIFIC_AUTH_USER_ID_HERE';

-- Or to delete ALL orphaned auth users (BE CAREFUL with this):
-- DELETE FROM auth.sessions WHERE user_id IN (
--     SELECT au.id FROM auth.users au
--     LEFT JOIN public.users u ON au.id = u.id
--     WHERE u.id IS NULL
-- );

-- DELETE FROM auth.refresh_tokens WHERE user_id IN (
--     SELECT au.id FROM auth.users au
--     LEFT JOIN public.users u ON au.id = u.id
--     WHERE u.id IS NULL
-- );

-- DELETE FROM auth.users WHERE id IN (
--     SELECT au.id FROM auth.users au
--     LEFT JOIN public.users u ON au.id = u.id
--     WHERE u.id IS NULL
-- );

SELECT 'Orphaned auth user cleanup script ready - uncomment DELETE statements to execute' as message;
