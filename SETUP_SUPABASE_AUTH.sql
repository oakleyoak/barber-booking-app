-- Add auth_user_id column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);

-- Optional: Remove password column since we'll use Supabase Auth
-- ALTER TABLE users DROP COLUMN IF EXISTS password;

-- Create a function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- This function will be called when a new user signs up via Supabase Auth
  -- You can customize this to create a profile in your users table
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new auth users (optional - for automatic profile creation)
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Show current users (for reference)
SELECT id, name, email, auth_user_id FROM users ORDER BY created_at DESC;
