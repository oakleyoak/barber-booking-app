-- Setup Email Verification for Production
-- This configures Supabase Auth to use your production domain for email verification links

-- You need to run this in your Supabase SQL Editor AND update your Auth settings

-- 1. First, go to your Supabase Dashboard > Authentication > Settings
-- 2. Update the "Site URL" to: https://edgeandco.netlify.app
-- 3. Add "https://edgeandco.netlify.app/**" to "Redirect URLs"
-- 4. Make sure "Confirm email" is enabled in Auth settings

-- Additional Auth settings you should verify:
-- - Confirm email: Enabled
-- - Email confirmation redirect URL: https://edgeandco.netlify.app
-- - Secure email change: Enabled

-- This will ensure that all email verification links point to your production site
-- instead of localhost:5173

SELECT 'Email verification setup instructions displayed above' as message;
