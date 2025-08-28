import { supabase } from '../lib/supabase';
import type { ShopSettings, PayrollEntry, User } from '../lib/supabase';

class ShopSettingsService {
  async getSettings(): Promise<ShopSettings | null> {
    try {
      const { data, error } = await supabase
        .from('shop_settings')
        .select('*')
        .limit(1);

      if (error) {
        console.error('Error fetching shop settings:', error);
        return this.getDefaultSettings();
      }

      // If no settings exist, return default settings
      if (!data || data.length === 0) {
        console.log('No shop settings found, using defaults');
        return this.getDefaultSettings();
      }

      const settings = data[0];
      
      // Map database fields to expected ShopSettings interface with defaults for missing fields
      return {
        ...settings,
        opening_time: settings.opening_time || '09:00',
        closing_time: settings.closing_time || '18:00',
        sunday_opening_time: settings.sunday_opening_time || '12:00',
        sunday_closing_time: settings.sunday_closing_time || '18:00',
        closed_days: settings.closed_days || [],
        services: [
          { name: 'Haircut', price: 700, duration: 45 },
          { name: 'Beard trim', price: 300, duration: 15 },
          { name: 'Blowdry', price: 500, duration: 30 },
          { name: 'Face mask', price: 200, duration: 30 },
          { name: 'Colour', price: 1000, duration: 60 },
          { name: 'Wax', price: 500, duration: 60 },
          { name: 'Massage', price: 900, duration: 45 },
          { name: 'Shave', price: 500, duration: 30 }
        ],
        default_commission_rate: settings.barber_commission || 50
      };
    } catch (error) {
      console.error('Error fetching shop settings:', error);
      return this.getDefaultSettings();
    }
  }

  private getDefaultSettings(): ShopSettings {
    return {
      shop_name: 'Edge & Co Barber Shop',
      opening_time: '09:00',
      closing_time: '20:00',
      sunday_opening_time: '12:00',
      sunday_closing_time: '18:00',
      closed_days: ['Thursday'],
      services: [
        { name: 'Haircut', price: 700, duration: 45 },
        { name: 'Beard trim', price: 300, duration: 15 },
        { name: 'Blowdry', price: 500, duration: 30 },
        { name: 'Face mask', price: 200, duration: 30 },
        { name: 'Colour', price: 1000, duration: 60 },
        { name: 'Wax', price: 500, duration: 60 },
        { name: 'Massage', price: 900, duration: 45 },
        { name: 'Shave', price: 500, duration: 30 }
      ],
      daily_target: 2000,
      weekly_target: 10000,
      monthly_target: 40000,
      default_commission_rate: 50,
      barber_commission: 0.5,
      apprentice_commission: 0.3,
      social_insurance_rate: 0.12,
      income_tax_rate: 0.2,
      income_tax_threshold: 50000
    };
  }

  async updateSettings(settings: Partial<ShopSettings>): Promise<ShopSettings | null> {
    try {
      // First try to update existing settings
      const { data: existingData } = await supabase
        .from('shop_settings')
        .select('id')
        .single();

      let result;
      if (existingData) {
        // Update existing
        result = await supabase
          .from('shop_settings')
          .update(settings)
          .eq('id', existingData.id)
          .select()
          .single();
      } else {
        // Create new
        result = await supabase
          .from('shop_settings')
          .insert([settings])
          .select()
          .single();
      }

      if (result.error) throw result.error;
      return result.data;
    } catch (error) {
      console.error('Error updating shop settings:', error);
      return null;
    }
  }

  getDefaultSchedule() {
    return {
      monday: { open: '09:00', close: '20:00', closed: false },
      tuesday: { open: '09:00', close: '20:00', closed: false },
      wednesday: { open: '09:00', close: '20:00', closed: false },
      thursday: { open: '09:00', close: '20:00', closed: true },
      friday: { open: '09:00', close: '20:00', closed: false },
      saturday: { open: '09:00', close: '20:00', closed: false },
      sunday: { open: '12:00', close: '18:00', closed: false }
    };
  }

  isShopOpen(day: string, time: string): boolean {
    const schedule = this.getDefaultSchedule();
    const daySchedule = schedule[day.toLowerCase() as keyof typeof schedule];
    
    if (!daySchedule || daySchedule.closed) return false;
    
    return time >= daySchedule.open && time <= daySchedule.close;
  }
}

class PayrollService {
  async getAllPayrollEntries(): Promise<PayrollEntry[]> {
    try {
      const { data, error } = await supabase
        .from('payroll')
        .select('*')
        .order('period_start', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching payroll entries:', error);
      return [];
    }
  }

  async getPayrollByUser(userId: string): Promise<PayrollEntry[]> {
    try {
      const { data, error } = await supabase
        .from('payroll')
        .select('*')
        .eq('user_id', userId)
        .order('period_start', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user payroll:', error);
      return [];
    }
  }

  async createPayrollEntry(entry: Omit<PayrollEntry, 'id' | 'created_at' | 'updated_at'>): Promise<PayrollEntry | null> {
    try {
      const { data, error } = await supabase
        .from('payroll')
        .insert([entry])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating payroll entry:', error);
      return null;
    }
  }

  async updatePayrollEntry(id: string, updates: Partial<PayrollEntry>): Promise<PayrollEntry | null> {
    try {
      const { data, error } = await supabase
        .from('payroll')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating payroll entry:', error);
      return null;
    }
  }

  async calculatePayroll(userId: string, startDate: string, endDate: string): Promise<{
    commission: number;
    totalBookings: number;
    totalRevenue: number;
  }> {
    try {
      // Get user's commission rate
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('commission_rate')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // Get completed bookings for the period
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('date', startDate)
        .lte('date', endDate);

      if (bookingsError) throw bookingsError;

      const totalRevenue = (bookings || []).reduce((sum, booking) => sum + Number(booking.price), 0);
      const commissionRate = user?.commission_rate || 0.3; // Default 30%
      const commission = totalRevenue * commissionRate;

      return {
        commission,
        totalBookings: (bookings || []).length,
        totalRevenue
      };
    } catch (error) {
      console.error('Error calculating payroll:', error);
      return {
        commission: 0,
        totalBookings: 0,
        totalRevenue: 0
      };
    }
  }
}

class UserManagementService {
  async getAllUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  }

  async createUser(userData: {
    name: string;
    email: string;
    password: string;
    role: string;
    shop_name: string;
    commission_rate?: number;
    target_weekly?: number;
    target_monthly?: number;
  }): Promise<User | null> {
    try {
      const newUser: Omit<User, 'id'> = {
        name: userData.name,
        email: userData.email,
        role: userData.role as 'Owner' | 'Barber',
        shop_name: userData.shop_name,
        commission_rate: userData.commission_rate || 50,
        target_weekly: userData.target_weekly || 2000,
        target_monthly: userData.target_monthly || 8000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('users')
        .insert([newUser])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  async updateUserTargets(userId: string, weeklyTarget: number, monthlyTarget: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          target_weekly: weeklyTarget,
          target_monthly: monthlyTarget
        })
        .eq('id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating user targets:', error);
      return false;
    }
  }

  async updateCommissionRate(userId: string, commissionRate: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ commission_rate: commissionRate })
        .eq('id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating commission rate:', error);
      return false;
    }
  }

  async getUserPerformance(userId: string, startDate: string, endDate: string) {
    try {
      // Get user targets
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('target_weekly, target_monthly, commission_rate')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // Get bookings for the period
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('date', startDate)
        .lte('date', endDate);

      if (bookingsError) throw bookingsError;

      const totalRevenue = (bookings || []).reduce((sum, booking) => sum + Number(booking.price), 0);
      const totalBookings = (bookings || []).length;

      return {
        totalRevenue,
        totalBookings,
        weeklyTarget: user?.target_weekly || 0,
        monthlyTarget: user?.target_monthly || 0,
        commissionRate: user?.commission_rate || 0.3,
        weeklyProgress: user?.target_weekly ? (totalRevenue / user.target_weekly) * 100 : 0,
        monthlyProgress: user?.target_monthly ? (totalRevenue / user.target_monthly) * 100 : 0
      };
    } catch (error) {
      console.error('Error getting user performance:', error);
      return {
        totalRevenue: 0,
        totalBookings: 0,
        weeklyTarget: 0,
        monthlyTarget: 0,
        commissionRate: 0.3,
        weeklyProgress: 0,
        monthlyProgress: 0
      };
    }
  }
}

export const shopSettingsService = new ShopSettingsService();
export const payrollService = new PayrollService();
export const userManagementService = new UserManagementService();
