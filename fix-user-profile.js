// Fix User Profile Script
// This script checks if the authenticated user has a profile in the users table
// and creates one if missing

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://libpiqpetkiojiqzzlpa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpYnBpcXBldGtpb2ppcXp6bHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI1ODI5NDYsImV4cCI6MjA0ODE1ODk0Nn0.TnMiIrJGFMjlLGrY-Q8xyZm22xY6-B7M0R7qG5FKGso';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fixUserProfile() {
  console.log('🔍 Checking user profile...');
  
  try {
    // First, try to get the current auth user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Auth error:', authError.message);
      console.log('\n💡 Please sign in first by running the app and logging in.');
      return;
    }
    
    if (!user) {
      console.log('❌ No authenticated user found.');
      console.log('\n💡 Please sign in first by running the app and logging in.');
      return;
    }
    
    console.log(`✅ Auth user found: ${user.id} (${user.email})`);
    
    // Check if user profile exists in users table
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('❌ Database error:', profileError.message);
      return;
    }
    
    if (profile) {
      console.log('✅ User profile exists in database:');
      console.log(`   - Name: ${profile.name}`);
      console.log(`   - Role: ${profile.role}`);
      console.log(`   - Shop: ${profile.shop_name}`);
      console.log('\n🎉 Everything looks good! The user profile issue should be resolved.');
      return;
    }
    
    // Profile doesn't exist, let's create it
    console.log('⚠️  User profile not found in database. Creating profile...');
    
    // Create a default profile
    const newProfile = {
      auth_user_id: user.id,
      name: user.email?.split('@')[0] || 'User',
      email: user.email,
      role: 'Owner', // Default to Owner
      shop_name: 'Edge & Co Barbershop',
      commission_rate: 60,
      target_weekly: 2000,
      target_monthly: 8000
    };
    
    const { data: createdProfile, error: createError } = await supabase
      .from('users')
      .insert([newProfile])
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Error creating profile:', createError.message);
      return;
    }
    
    console.log('✅ User profile created successfully:');
    console.log(`   - ID: ${createdProfile.id}`);
    console.log(`   - Name: ${createdProfile.name}`);
    console.log(`   - Role: ${createdProfile.role}`);
    console.log(`   - Shop: ${createdProfile.shop_name}`);
    console.log('\n🎉 Profile created! The application should now work correctly.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the fix
fixUserProfile();
