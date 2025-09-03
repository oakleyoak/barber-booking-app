const { createClient } = require('@supabase/supabase-js');

// Import from your existing config
const supabaseUrl = 'https://libpiqpetkiojiqzzlpa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpYnBpcXBldGtpb2ppcXp6bHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMTkwMTMsImV4cCI6MjA3MTc5NTAxM30.7NCI5kRr0BHI-X1vW5Lb1YfOolVH0x-XvYVVjSCobhI';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

async function debugAuth() {
  console.log('🔍 Debugging Authentication Issue...\n');

  // Test login attempt with your credentials
  const testEmail = 'omustafa2@googlemail.com';
  const testPassword = '22562310';

  console.log(`� Testing login for: ${testEmail}`);
  
  try {
    // Try to sign in with Supabase Auth
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signInError) {
      console.error('❌ Auth sign-in error:', signInError.message);
      console.log('Error details:', signInError);
      return;
    }

    if (!signInData.user) {
      console.error('❌ No user data returned from auth');
      return;
    }

    console.log('✅ Auth successful! User ID:', signInData.user.id);
    console.log('✅ Email confirmed:', signInData.user.email_confirmed_at ? 'Yes' : 'No');

    // Now check if user profile exists in database
    console.log('\n📋 Checking user profile in database...');
    
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', signInData.user.id)
      .single();

    if (profileError) {
      console.error('❌ Profile fetch error:', profileError.message);
      
      // Check if user exists with email instead of auth_user_id
      console.log('\n🔍 Checking if user exists by email...');
      const { data: emailProfile, error: emailError } = await supabase
        .from('users')
        .select('*')
        .eq('email', testEmail)
        .single();

      if (emailError) {
        console.error('❌ No user profile found by email either:', emailError.message);
        console.log('\n❗ The user needs to be created in the users table!');
      } else {
        console.log('✅ User found by email but auth_user_id is missing/wrong');
        console.log('Current auth_user_id in DB:', emailProfile.auth_user_id);
        console.log('Actual auth user ID:', signInData.user.id);
        
        // Fix the auth_user_id link
        console.log('\n🔧 Fixing auth_user_id link...');
        const { error: updateError } = await supabase
          .from('users')
          .update({ auth_user_id: signInData.user.id })
          .eq('email', testEmail);
        
        if (updateError) {
          console.error('❌ Failed to update auth_user_id:', updateError.message);
        } else {
          console.log('✅ Auth link fixed! Try logging in again.');
        }
      }
      return;
    }

    console.log('✅ User profile found:', profile.name);
    console.log('✅ Role:', profile.role);
    console.log('✅ Shop:', profile.shop_name);
    console.log('\n🎉 Everything looks good! Login should work.');

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

debugAuth().catch(console.error);
