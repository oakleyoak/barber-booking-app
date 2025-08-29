import { supabase } from '../lib/supabase';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'manager' | 'barber' | 'apprentice';
  shop_name: string;
  phone?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface UserCreate {
  name: string;
  email: string;
  role: 'manager' | 'barber' | 'apprentice';
  phone?: string;
}

export interface UserUpdate {
  name?: string;
  email?: string;
  role?: 'manager' | 'barber' | 'apprentice';
  phone?: string;
  is_active?: boolean;
}

export class UserManagementService {
  /**
   * Get all staff members for a shop (excluding owners)
   */
  static async getStaffMembers(shopName: string): Promise<User[]> {
    try {
      // Query for staff members, making is_active optional since it might not exist
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('shop_name', shopName)
        .neq('role', 'owner')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      // Filter out inactive users if is_active field exists, otherwise include all
      const activeStaff = (data || []).filter(user => 
        user.is_active === undefined || user.is_active === true
      );
      
      return activeStaff;
    } catch (error) {
      console.error('Error fetching staff members:', error);
      return [];
    }
  }

  /**
   * Migrate staff from "Default Shop" to current shop (one-time sync)
   */
  static async syncStaffToCurrentShop(currentShopName: string): Promise<void> {
    try {
      // First check what's in Default Shop
      const { data: defaultStaff, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('shop_name', 'Default Shop')
        .neq('role', 'owner');
        
      if (checkError) {
        console.error('Error checking Default Shop staff:', checkError);
        return;
      }
      
      if (defaultStaff && defaultStaff.length > 0) {
        // Update any staff members in "Default Shop" to current shop
        const { data, error } = await supabase
          .from('users')
          .update({ shop_name: currentShopName })
          .eq('shop_name', 'Default Shop')
          .neq('role', 'owner')
          .select();
          
        if (error) {
          console.error('Error updating staff shop names:', error);
        }
      }
    } catch (error) {
      console.error('Error syncing staff to current shop:', error);
    }
  }

  /**
   * Add a new staff member
   */
  static async addStaffMember(shopName: string, userData: UserCreate): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          ...userData,
          shop_name: shopName,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding staff member:', error);
      return null;
    }
  }

  /**
   * Update staff member details
   */
  static async updateStaffMember(shopName: string, userId: string, updates: UserUpdate): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .eq('shop_name', shopName)
        .neq('role', 'owner'); // Prevent updating owners

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating staff member:', error);
      return false;
    }
  }

  /**
   * Promote/demote staff member (apprentice <-> barber <-> manager)
   */
  static async promoteStaffMember(shopName: string, userId: string, newRole: 'manager' | 'barber' | 'apprentice'): Promise<boolean> {
    return this.updateStaffMember(shopName, userId, { role: newRole });
  }

  /**
   * Deactivate staff member (soft delete)
   */
  static async deactivateStaffMember(shopName: string, userId: string): Promise<boolean> {
    return this.updateStaffMember(shopName, userId, { is_active: false });
  }

  /**
   * Permanently delete staff member (hard delete - use with caution)
   */
  static async deleteStaffMember(shopName: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)
        .eq('shop_name', shopName)
        .neq('role', 'owner'); // Prevent deleting owners

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting staff member:', error);
      return false;
    }
  }

  /**
   * Get staff member by ID
   */
  static async getStaffMember(shopName: string, userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .eq('shop_name', shopName)
        .neq('role', 'owner')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching staff member:', error);
      return null;
    }
  }

  /**
   * Check if email is already in use
   */
  static async isEmailInUse(email: string, shopName: string, excludeUserId?: string): Promise<boolean> {
    try {
      let query = supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .eq('shop_name', shopName);

      if (excludeUserId) {
        query = query.neq('id', excludeUserId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).length > 0;
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  }
}
