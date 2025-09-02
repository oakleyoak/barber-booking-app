const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ycjqakibxklnxlcijxpx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljanFha2lieGtsbnhsY2lqeHB4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTU2ODU3NywiZXhwIjoyMDUxMTQ0NTc3fQ.O7tQYJUhI7x5i4OVrsO6rkmT3hxBr1k6vJ6I-wdBqKQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAuth() {
  try {
    console.log('🔍 Checking Supabase users...');
    
    // Get all users from the users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }
    
    console.log('📊 Users in database:');
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - Role: ${user.role}`);
    });
    
    // Check auth users
    console.log('\n🔐 Checking auth users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      return;
    }
    
    console.log('🔑 Auth users:');
    authUsers.users.forEach(user => {
      console.log(`  - ${user.email} - Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
    });
    
    // Try to create a user if none exist
    if (users.length === 0) {
      console.log('\n➕ Creating default user...');
      
      // First create the auth user
      const { data: authUser, error: authCreateError } = await supabase.auth.admin.createUser({
        email: 'omustafa2@googlemail.com',
        password: '22562310',
        email_confirm: true
      });
      
      if (authCreateError) {
        console.error('❌ Error creating auth user:', authCreateError);
        return;
      }
      
      console.log('✅ Auth user created:', authUser.user.email);
      
      // Then create the user record
      const { data: userRecord, error: userCreateError } = await supabase
        .from('users')
        .insert({
          id: authUser.user.id,
          name: 'Omar Mustafa',
          email: 'omustafa2@googlemail.com',
          role: 'Owner',
          shop_name: 'Edge & Co',
          commission_rate: 70,
          target_weekly: 3000,
          target_monthly: 12000
        })
        .select()
        .single();
      
      if (userCreateError) {
        console.error('❌ Error creating user record:', userCreateError);
        return;
      }
      
      console.log('✅ User record created:', userRecord);
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

checkAuth();
