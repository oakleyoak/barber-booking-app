-- Create a function to delete users from Supabase Auth
-- This needs to be run in your Supabase SQL Editor with admin privileges

-- First, create the function that can delete auth users
CREATE OR REPLACE FUNCTION delete_auth_user(user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete the user from auth.users table
  -- This requires superuser privileges which functions can have with SECURITY DEFINER
  DELETE FROM auth.users WHERE id = user_id;
  
  -- Also delete any related auth sessions
  DELETE FROM auth.sessions WHERE user_id = user_id;
  
  -- Delete any related auth refresh tokens
  DELETE FROM auth.refresh_tokens WHERE user_id = user_id;
  
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the entire operation
    RAISE WARNING 'Failed to delete auth user %: %', user_id, SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users (this allows the app to call it)
GRANT EXECUTE ON FUNCTION delete_auth_user(UUID) TO authenticated;

-- Test the function (optional - remove this line when running in production)
-- SELECT delete_auth_user('00000000-0000-0000-0000-000000000000');

SELECT 'delete_auth_user function created successfully' as message;
