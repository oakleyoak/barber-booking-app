-- IMMEDIATE FIX: Disable email confirmation requirement in Supabase Auth
-- This will allow all users to log in regardless of email verification status

-- Option 1: Disable email confirmation entirely
UPDATE auth.config 
SET 
  enable_signup = true,
  enable_confirmations = false
WHERE id = 1;

-- Option 2: If the above doesn't work, mark all existing users as confirmed
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW());

-- Option 3: Check if there are any auth policies blocking login
SELECT * FROM auth.config;

-- Option 4: Ensure RLS policies aren't blocking auth
ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE auth.sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE auth.refresh_tokens DISABLE ROW LEVEL SECURITY;

SELECT 'Auth configuration updated - email verification disabled' as result;
