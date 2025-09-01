-- Fix user ID mismatch between Supabase Auth and users table
-- This will update the existing user record to match the auth user ID

-- Update the existing user to use the correct auth user ID
-- Note: Please double-check the exact UUID from your Supabase Auth dashboard
UPDATE users 
SET id = 'afaba3ee-21f7-4d2e-b4bf-791b48acefd4'::uuid 
WHERE email = 'omustafa2@googlemail.com';

-- Verify the update
SELECT id, name, email, role, shop_name 
FROM users 
WHERE email = 'omustafa2@googlemail.com';
