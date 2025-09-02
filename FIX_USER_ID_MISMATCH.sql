-- Fix user ID mismatch between Supabase Auth and users table
-- This will update the existing user record to match the auth user ID

-- Update the existing user to use the correct auth user ID
-- Note: The correct auth user ID from the error is: afaba36e-21f7-4d2e-b4bf-791e4b8acefd
UPDATE users 
SET id = 'afaba36e-21f7-4d2e-b4bf-791e4b8acefd'::uuid 
WHERE email = 'omustafa2@googlemail.com';

-- Verify the update
SELECT id, name, email, role, shop_name 
FROM users 
WHERE email = 'omustafa2@googlemail.com';
