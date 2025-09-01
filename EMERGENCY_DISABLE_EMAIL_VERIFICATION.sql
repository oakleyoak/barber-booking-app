-- EMERGENCY: Temporarily disable email verification
-- This will allow users to log in without email verification while we fix the auth issues

-- Update Supabase Auth configuration to disable email confirmation requirement
UPDATE auth.config 
SET email_confirm = false 
WHERE id = 1;

-- Alternative: Update all existing auth users to be confirmed
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- Check current email confirmation settings
SELECT * FROM auth.config;

-- Verify all users are now confirmed
SELECT 
    id,
    email,
    email_confirmed_at,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN 'VERIFIED'
        ELSE 'NOT VERIFIED'
    END as verification_status
FROM auth.users
ORDER BY created_at DESC;

SELECT 'Emergency email verification bypass applied - users should now be able to log in' as message;
