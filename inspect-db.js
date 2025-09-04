// Database User Inspection Script
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://libpiqpetkiojiqzzlpa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpYnBpcXBldGtpb2ppcXp6bHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMTkwMTMsImV4cCI6MjA3MTc5NTAxM30.7NCI5kRr0BHI-X1vW5Lb1YfOolVH0x-XvYVVjSCobhI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspectDatabase() {
  console.log('🔍 Inspecting database for user records...');
  
  try {
    // Check all users in the users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError.message);
      return;
    }
    
    console.log(`\n📊 Found ${users?.length || 0} users in database:`);
    
    if (users && users.length > 0) {
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. User Record:`);
        console.log(`   - ID: ${user.id}`);
        console.log(`   - Auth User ID: ${user.auth_user_id || 'NOT SET'}`);
        console.log(`   - Name: ${user.name}`);
        console.log(`   - Email: ${user.email}`);
        console.log(`   - Role: ${user.role}`);
        console.log(`   - Shop: ${user.shop_name}`);
        console.log(`   - Created: ${user.created_at}`);
      });
    } else {
      console.log('   No users found in the database.');
    }
    
    // If we find users without auth_user_id, let's note that
    const usersWithoutAuthId = users?.filter(u => !u.auth_user_id) || [];
    if (usersWithoutAuthId.length > 0) {
      console.log(`\n⚠️  Found ${usersWithoutAuthId.length} users without auth_user_id. This might be the issue.`);
      console.log('   These users were probably created before the auth_user_id linking was implemented.');
    }
    
    // Now let's see what the error user ID from the console is
    const problematicUserId = 'a4917c82-5d33-4bd9-aab0-05ea74199539';
    console.log(`\n🔍 Checking for the specific problematic user ID: ${problematicUserId}`);
    
    const userWithProblematicId = users?.find(u => u.id === problematicUserId || u.auth_user_id === problematicUserId);
    
    if (userWithProblematicId) {
      console.log('✅ Found the user record:');
      console.log(`   - This user exists with ID/auth_user_id: ${userWithProblematicId.id}/${userWithProblematicId.auth_user_id}`);
    } else {
      console.log('❌ The problematic user ID is not found in the database.');
      console.log('   This confirms that there\'s a mismatch between Supabase auth and the users table.');
    }
    
    console.log('\n💡 Solutions:');
    console.log('1. If users exist without auth_user_id, we need to link them to auth users');
    console.log('2. If no users exist, we need to create a user profile for the authenticated user');
    console.log('3. The getCurrentBarberId function has been fixed to use auth_user_id instead of id');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the inspection
inspectDatabase();
