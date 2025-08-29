import { supabase } from '../lib/supabase';
import type { User } from '../lib/supabase';

export class AdminService {
  /**
   * Creates an auth user for an existing database user
   * This should only be used by admins to fix sync issues
   */
  async createAuthUserForExistingDbUser(email: string, temporaryPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      // First, check if user exists in users table
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (userError) {
        return { success: false, message: `User not found in database: ${userError.message}` };
      }

      if (!existingUser) {
        return { success: false, message: 'User not found in database' };
      }

      // Try to create auth user
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: temporaryPassword,
        options: {
          data: {
            name: existingUser.name,
            role: existingUser.role,
            shop_name: existingUser.shop_name
          }
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          return { success: true, message: 'User already exists in auth system. They can login normally.' };
        }
        return { success: false, message: `Auth creation failed: ${error.message}` };
      }

      if (data.user) {
        // Update the users table with the new auth ID if needed
        const { error: updateError } = await supabase
          .from('users')
          .update({ id: data.user.id })
          .eq('email', email);

        if (updateError) {
          console.warn('Could not update user ID:', updateError);
        }

        return { 
          success: true, 
          message: `Auth user created successfully! User can now login with email: ${email} and password: ${temporaryPassword}. They should change their password after first login.` 
        };
      }

      return { success: false, message: 'Unknown error occurred during auth user creation' };

    } catch (error: any) {
      console.error('Admin service error:', error);
      return { success: false, message: `Unexpected error: ${error.message}` };
    }
  }

  /**
   * Lists users who exist in the database but might not have auth accounts
   */
  async findUsersWithoutAuth(): Promise<User[]> {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        return [];
      }

      return users || [];
    } catch (error) {
      console.error('Error in findUsersWithoutAuth:', error);
      return [];
    }
  }
}

export const adminService = new AdminService();
