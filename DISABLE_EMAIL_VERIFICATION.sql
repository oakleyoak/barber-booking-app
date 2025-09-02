-- DISABLE EMAIL VERIFICATION FOR BARBER SHOP APP
-- This allows users to be created without email verification

-- Update auth configuration to disable email verification
UPDATE auth.config 
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'),
  '{email_confirm}',
  'false'
)
WHERE id = 'auth';

-- If the above doesn't work (older Supabase versions), you need to:
-- 1. Go to Supabase Dashboard > Authentication > Settings
-- 2. Turn OFF "Enable email confirmations"
-- 3. Or run: UPDATE auth.config SET email_confirm = false;

SELECT 'Email verification disabled!' as status;
