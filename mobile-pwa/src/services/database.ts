import { supabase, User, Customer, Booking, Transaction, ShopSettings, Expense, Payroll, StaffTarget } from '../lib/supabase';

export const dbService = {
  // Authentication
  async register(userData: { name: string; email: string; password: string; role: string; shop_name: string }): Promise<User | null> {
    try {
      console.log('Registering user with Supabase:', userData);

      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            role: userData.role,
            shop_name: userData.shop_name
          }
        }
      });

      if (error) {
        console.error('Supabase registration error:', error);
        throw error;
      }

      if (data.user) {
        // Create user profile in users table
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .insert([{
            id: data.user.id,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            shop_name: userData.shop_name
          }])
          .select()
          .single();

        if (profileError) {
          console.error('Profile creation error:', profileError);
          throw profileError;
        }

        console.log('User registered successfully:', profile);
        return profile;
      }

      return null;
    } catch (error) {
      console.error('Registration error:', error);
      return null;
    }
  },

  async login(email: string, password: string): Promise<User | null> {
    try {
      console.log('Logging in user:', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Login error:', error);
        throw new Error('Invalid credentials');
      }

      if (data.user) {
        // Get user profile from users table
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          throw new Error('User profile not found');
        }

        console.log('User logged in successfully:', profile);
        return profile;
      }

      return null;
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  },

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Profile fetch error:', error);
          return null;
        }

        return profile;
      }

      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  // Bookings
  async getBookings(userId?: string): Promise<Booking[]> {
    try {
      let query = supabase.from('bookings').select('*').order('date', { ascending: true });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Get bookings error:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Get bookings error:', error);
      return [];
    }
  },

  async createBooking(booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>): Promise<Booking | null> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert([booking])
        .select()
        .single();

      if (error) {
        console.error('Create booking error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Create booking error:', error);
      return null;
    }
  },

  async updateBooking(id: string, updates: Partial<Booking>): Promise<Booking | null> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Update booking error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Update booking error:', error);
      return null;
    }
  },

  async deleteBooking(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Delete booking error:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Delete booking error:', error);
      return false;
    }
  },

  // Customers
  async getCustomers(userId?: string): Promise<Customer[]> {
    try {
      let query = supabase.from('customers').select('*').order('name', { ascending: true });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Get customers error:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Get customers error:', error);
      return [];
    }
  },

  async createCustomer(customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<Customer | null> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([customer])
        .select()
        .single();

      if (error) {
        console.error('Create customer error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Create customer error:', error);
      return null;
    }
  },

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | null> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Update customer error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Update customer error:', error);
      return null;
    }
  },

  async deleteCustomer(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Delete customer error:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Delete customer error:', error);
      return false;
    }
  },

  // Transactions/Earnings
  async getTransactions(userId?: string): Promise<Transaction[]> {
    try {
      let query = supabase.from('transactions').select('*').order('date', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Get transactions error:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Get transactions error:', error);
      return [];
    }
  },

  async createTransaction(transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>): Promise<Transaction | null> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([transaction])
        .select()
        .single();

      if (error) {
        console.error('Create transaction error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Create transaction error:', error);
      return null;
    }
  },

  // Shop Settings
  async getShopSettings(shopName: string): Promise<ShopSettings | null> {
    try {
      const { data, error } = await supabase
        .from('shop_settings')
        .select('*')
        .eq('shop_name', shopName)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Get shop settings error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Get shop settings error:', error);
      return null;
    }
  },

  async createOrUpdateShopSettings(settings: Omit<ShopSettings, 'id' | 'created_at' | 'updated_at'>): Promise<ShopSettings | null> {
    try {
      const { data, error } = await supabase
        .from('shop_settings')
        .upsert([settings])
        .select()
        .single();

      if (error) {
        console.error('Upsert shop settings error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Upsert shop settings error:', error);
      return null;
    }
  },

  // Expenses
  async getExpenses(userId?: string): Promise<Expense[]> {
    try {
      let query = supabase.from('expenses').select('*').order('date', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Get expenses error:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Get expenses error:', error);
      return [];
    }
  },

  async createExpense(expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>): Promise<Expense | null> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert([expense])
        .select()
        .single();

      if (error) {
        console.error('Create expense error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Create expense error:', error);
      return null;
    }
  },

  // Payroll
  async getPayrollRecords(userId?: string): Promise<Payroll[]> {
    try {
      let query = supabase.from('payroll').select('*').order('period_end', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Get payroll error:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Get payroll error:', error);
      return [];
    }
  },

  async createPayrollRecord(payroll: Omit<Payroll, 'id' | 'created_at' | 'updated_at'>): Promise<Payroll | null> {
    try {
      const { data, error } = await supabase
        .from('payroll')
        .insert([payroll])
        .select()
        .single();

      if (error) {
        console.error('Create payroll error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Create payroll error:', error);
      return null;
    }
  },

  // Staff Targets
  async getStaffTargets(userId?: string): Promise<StaffTarget[]> {
    try {
      let query = supabase.from('staff_targets').select('*').order('period_start', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Get staff targets error:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Get staff targets error:', error);
      return [];
    }
  },

  async createStaffTarget(target: Omit<StaffTarget, 'id' | 'created_at' | 'updated_at'>): Promise<StaffTarget | null> {
    try {
      const { data, error } = await supabase
        .from('staff_targets')
        .insert([target])
        .select()
        .single();

      if (error) {
        console.error('Create staff target error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Create staff target error:', error);
      return null;
    }
  }
};