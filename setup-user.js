const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ycjqakibxklnxlcijxpx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljanFha2lieGtsbnhsY2lqeHB4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTU2ODU3NywiZXhwIjoyMDUxMTQ0NTc3fQ.O7tQYJUhI7x5i4OVrsO6rkmT3hxBr1k6vJ6I-wdBqKQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupUser() {
  try {
    console.log('🔧 Setting up your user account...');
    
    // Check if user already exists in auth
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error checking existing users:', listError);
      return;
    }
    
    const existingUser = existingUsers.users.find(u => u.email === 'omustafa2@googlemail.com');
    
    let authUserId;
    
    if (existingUser) {
      console.log('✅ User already exists in auth');
      authUserId = existingUser.id;
    } else {
      // Create auth user
      console.log('➕ Creating auth user...');
      const { data: newAuthUser, error: authError } = await supabase.auth.admin.createUser({
        email: 'omustafa2@googlemail.com',
        password: '22562310',
        email_confirm: true
      });
      
      if (authError) {
        console.error('❌ Error creating auth user:', authError);
        return;
      }
      
      authUserId = newAuthUser.user.id;
      console.log('✅ Auth user created');
    }
    
    // Check if user record exists
    const { data: existingUserRecord, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'omustafa2@googlemail.com')
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking user record:', checkError);
      return;
    }
    
    if (existingUserRecord) {
      console.log('✅ User record already exists:', existingUserRecord.name);
    } else {
      // Create user record
      console.log('➕ Creating user record...');
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .insert({
          id: authUserId,
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
      
      if (userError) {
        console.error('❌ Error creating user record:', userError);
        return;
      }
      
      console.log('✅ User record created:', userRecord);
    }
    
    console.log('🎉 User setup complete! You can now log in with:');
    console.log('   Email: omustafa2@googlemail.com');
    console.log('   Password: 22562310');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

setupUser();
