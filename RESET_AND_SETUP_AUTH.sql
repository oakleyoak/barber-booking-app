-- RESET AND SETUP SUPABASE AUTH
-- This will clear existing users and set up proper Supabase Auth

-- Step 1: Clear existing users (since we're starting fresh)
DELETE FROM users;

-- Step 2: Add auth_user_id column to link with Supabase Auth
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);

-- Step 3: Remove old password column (we'll use Supabase Auth instead)
ALTER TABLE users DROP COLUMN IF EXISTS password;

-- Step 4: Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);

-- Step 5: Make auth_user_id unique (one auth user = one profile)
ALTER TABLE users ADD CONSTRAINT unique_auth_user_id UNIQUE (auth_user_id);

-- Done! Now you can create users through Supabase Auth
SELECT 'Database reset complete. Ready for Supabase Auth!' as status;
