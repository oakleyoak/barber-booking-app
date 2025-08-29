// ===================================================================
// COMPLETE DATABASE SERVICE - REPLACES ALL LOCALSTORAGE
// This is your comprehensive Supabase service layer
// ===================================================================

import { createClient } from '@supabase/supabase-js';

// Supabase Configuration
const supabaseUrl = 'https://libpiqpetkiojiqzzlpa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpYnBpcXBldGtpb2ppcXp6bHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMTkwMTMsImV4cCI6MjA3MTc5NTAxM30.7NCI5kRr0BHI-X1vW5Lb1YfOolVH0x-XvYVVjSCobhI';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// ===================================================================
// TYPES DEFINITIONS
// ===================================================================

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'Owner' | 'Barber' | 'Apprentice';
  shop_name: string;
  commission_rate: number;
  target_weekly: number;
  target_monthly: number;
  created_at?: string;
  updated_at?: string;
  shop_settings?: string;
}

export interface Customer {
  id: string;
  user_id?: string;
  name: string;
  email?: string;
  phone?: string;
  last_visit?: string;
  preferred_barber?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Booking {
  id: string;
  user_id?: string;
  customer_id?: string;
  customer_name: string;
  service: string;
  price: number;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Transaction {
  id: string;
  booking_id?: string;
  user_id: string;
  customer_name: string;
  service: string;
  amount: number;
  commission: number;
  commission_amount: number;
  date: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface Expense {
  id: string;
  user_id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  receipt_url?: string;
  is_recurring: boolean;
  recurring_frequency?: 'weekly' | 'monthly' | 'yearly';
  created_at?: string;
  updated_at?: string;
}

export interface Payroll {
  id: string;
  user_id: string;
  staff_name: string;
  period_start: string;
  period_end: string;
  base_salary: number;
  commission_earned: number;
  total_earnings: number;
  deductions: number;
  net_pay: number;
  tax_deducted: number;
  social_insurance: number;
  status: 'pending' | 'processed' | 'paid';
  payment_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DailyOperation {
  id: string;
  date: string;
  barber_id?: string;
  shop_id?: string;
  shift_start?: string;
  shift_end?: string;
  total_customers_served: number;
  total_revenue: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EquipmentInventory {
  id: string;
  equipment_name: string;
  category: string;
  serial_number?: string;
  purchase_date?: string;
  warranty_expiry?: string;
  location?: string;
  condition_rating?: number;
  current_value?: number;
  is_active: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SuppliesInventory {
  id: string;
  item_name: string;
  category: string;
  current_stock: number;
  minimum_stock: number;
  unit: string;
  supplier?: string;
  last_restocked?: string;
  expiry_date?: string;
  unit_cost?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface IncidentReport {
  id: string;
  date: string;
  time: string;
  reported_by?: string;
  incident_type: string;
  severity: string;
  location?: string;
  description: string;
  immediate_action_taken?: string;
  witnesses?: string;
  follow_up_required: boolean;
  follow_up_notes?: string;
  resolved: boolean;
  resolved_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StaffAccountability {
  id: string;
  date: string;
  barber_id?: string;
  check_in_time?: string;
  check_out_time?: string;
  breaks_taken?: any;
  uniform_compliant: boolean;
  hygiene_compliant: boolean;
  behavior_rating?: number;
  performance_notes?: string;
  issues_reported?: string;
  created_at?: string;
  updated_at?: string;
}

// ===================================================================
// USER PROFILE MANAGEMENT SERVICE
// ===================================================================

export const userService = {
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return null;
    return data;
  },

  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) return null;
    return data;
  },

  async getUserByAuthId(authUserId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('auth_user_id', authUserId)
      .single();
    
    if (error) return null;
    return data;
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteUser(id: string): Promise<void> {
    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// ===================================================================
// CUSTOMER SERVICE
// ===================================================================

export const customerService = {
  async getCustomers(userId?: string): Promise<Customer[]> {
    let query = supabase.from('customers').select('*');
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getCustomerById(id: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async createCustomer(customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .insert([customer])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteCustomer(id: string): Promise<void> {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// ===================================================================
// BOOKING SERVICE
// ===================================================================

export const bookingService = {
  async getBookings(userId?: string): Promise<Booking[]> {
    let query = supabase.from('bookings').select('*');
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query.order('date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getBookingsByDate(date: string, userId?: string): Promise<Booking[]> {
    let query = supabase.from('bookings').select('*').eq('date', date);
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query.order('time', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async createBooking(booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .insert([booking])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateBooking(id: string, updates: Partial<Booking>): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteBooking(id: string): Promise<void> {
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// ===================================================================
// TRANSACTION SERVICE
// ===================================================================

export const transactionService = {
  async getTransactions(userId?: string): Promise<Transaction[]> {
    let query = supabase.from('transactions').select('*');
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query.order('date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getTransactionsByDateRange(startDate: string, endDate: string, userId?: string): Promise<Transaction[]> {
    let query = supabase.from('transactions')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate);
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query.order('date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async createTransaction(transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .insert([transaction])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteTransaction(id: string): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// ===================================================================
// EXPENSE SERVICE
// ===================================================================

export const expenseService = {
  async getExpenses(userId?: string): Promise<Expense[]> {
    let query = supabase.from('expenses').select('*');
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query.order('date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async createExpense(expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>): Promise<Expense> {
    const { data, error } = await supabase
      .from('expenses')
      .insert([expense])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateExpense(id: string, updates: Partial<Expense>): Promise<Expense> {
    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteExpense(id: string): Promise<void> {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// ===================================================================
// PAYROLL SERVICE
// ===================================================================

export const payrollService = {
  async getPayroll(userId?: string): Promise<Payroll[]> {
    let query = supabase.from('payroll').select('*');
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query.order('period_start', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async createPayroll(payroll: Omit<Payroll, 'id' | 'created_at' | 'updated_at'>): Promise<Payroll> {
    const { data, error } = await supabase
      .from('payroll')
      .insert([payroll])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updatePayroll(id: string, updates: Partial<Payroll>): Promise<Payroll> {
    const { data, error } = await supabase
      .from('payroll')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// ===================================================================
// DAILY OPERATIONS SERVICE
// ===================================================================

export const dailyOperationsService = {
  async getDailyOperations(barberId?: string): Promise<DailyOperation[]> {
    let query = supabase.from('daily_operations').select('*');
    
    if (barberId) {
      query = query.eq('barber_id', barberId);
    }
    
    const { data, error } = await query.order('date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getOperationByDate(date: string, barberId?: string): Promise<DailyOperation | null> {
    let query = supabase.from('daily_operations').select('*').eq('date', date);
    
    if (barberId) {
      query = query.eq('barber_id', barberId);
    }
    
    const { data, error } = await query.single();
    
    if (error) return null;
    return data;
  },

  async createDailyOperation(operation: Omit<DailyOperation, 'id' | 'created_at' | 'updated_at'>): Promise<DailyOperation> {
    const { data, error } = await supabase
      .from('daily_operations')
      .insert([operation])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateDailyOperation(id: string, updates: Partial<DailyOperation>): Promise<DailyOperation> {
    const { data, error } = await supabase
      .from('daily_operations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// ===================================================================
// EQUIPMENT INVENTORY SERVICE
// ===================================================================

export const equipmentService = {
  async getEquipment(): Promise<EquipmentInventory[]> {
    const { data, error } = await supabase
      .from('equipment_inventory')
      .select('*')
      .eq('is_active', true)
      .order('equipment_name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async createEquipment(equipment: Omit<EquipmentInventory, 'id' | 'created_at' | 'updated_at'>): Promise<EquipmentInventory> {
    const { data, error } = await supabase
      .from('equipment_inventory')
      .insert([equipment])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateEquipment(id: string, updates: Partial<EquipmentInventory>): Promise<EquipmentInventory> {
    const { data, error } = await supabase
      .from('equipment_inventory')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteEquipment(id: string): Promise<void> {
    const { error } = await supabase
      .from('equipment_inventory')
      .update({ is_active: false })
      .eq('id', id);
    
    if (error) throw error;
  }
};

// ===================================================================
// SUPPLIES INVENTORY SERVICE
// ===================================================================

export const suppliesService = {
  async getSupplies(): Promise<SuppliesInventory[]> {
    const { data, error } = await supabase
      .from('supplies_inventory')
      .select('*')
      .eq('is_active', true)
      .order('item_name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async getLowStockSupplies(): Promise<SuppliesInventory[]> {
    const { data, error } = await supabase
      .from('supplies_inventory')
      .select('*')
      .eq('is_active', true)
      .filter('current_stock', 'lte', 'minimum_stock')
      .order('item_name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async createSupply(supply: Omit<SuppliesInventory, 'id' | 'created_at' | 'updated_at'>): Promise<SuppliesInventory> {
    const { data, error } = await supabase
      .from('supplies_inventory')
      .insert([supply])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateSupply(id: string, updates: Partial<SuppliesInventory>): Promise<SuppliesInventory> {
    const { data, error } = await supabase
      .from('supplies_inventory')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateStock(id: string, newStock: number): Promise<SuppliesInventory> {
    const { data, error } = await supabase
      .from('supplies_inventory')
      .update({ 
        current_stock: newStock,
        last_restocked: new Date().toISOString().split('T')[0]
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// ===================================================================
// INCIDENT REPORTS SERVICE
// ===================================================================

export const incidentService = {
  async getIncidents(): Promise<IncidentReport[]> {
    const { data, error } = await supabase
      .from('incident_reports')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async createIncident(incident: Omit<IncidentReport, 'id' | 'created_at' | 'updated_at'>): Promise<IncidentReport> {
    const { data, error } = await supabase
      .from('incident_reports')
      .insert([incident])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateIncident(id: string, updates: Partial<IncidentReport>): Promise<IncidentReport> {
    const { data, error } = await supabase
      .from('incident_reports')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async resolveIncident(id: string, resolutionNotes: string): Promise<IncidentReport> {
    const { data, error } = await supabase
      .from('incident_reports')
      .update({ 
        resolved: true,
        resolved_at: new Date().toISOString(),
        follow_up_notes: resolutionNotes
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// ===================================================================
// STAFF ACCOUNTABILITY SERVICE
// ===================================================================

export const staffAccountabilityService = {
  async getAccountabilityRecords(barberId?: string): Promise<StaffAccountability[]> {
    let query = supabase.from('staff_accountability').select('*');
    
    if (barberId) {
      query = query.eq('barber_id', barberId);
    }
    
    const { data, error } = await query.order('date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getRecordByDate(date: string, barberId: string): Promise<StaffAccountability | null> {
    const { data, error } = await supabase
      .from('staff_accountability')
      .select('*')
      .eq('date', date)
      .eq('barber_id', barberId)
      .single();
    
    if (error) return null;
    return data;
  },

  async createAccountabilityRecord(record: Omit<StaffAccountability, 'id' | 'created_at' | 'updated_at'>): Promise<StaffAccountability> {
    const { data, error } = await supabase
      .from('staff_accountability')
      .insert([record])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateAccountabilityRecord(id: string, updates: Partial<StaffAccountability>): Promise<StaffAccountability> {
    const { data, error } = await supabase
      .from('staff_accountability')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async checkIn(barberId: string, time: string): Promise<StaffAccountability> {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if record exists for today
    const existing = await this.getRecordByDate(today, barberId);
    
    if (existing) {
      return await this.updateAccountabilityRecord(existing.id, { check_in_time: time });
    } else {
      return await this.createAccountabilityRecord({
        date: today,
        barber_id: barberId,
        check_in_time: time,
        uniform_compliant: true,
        hygiene_compliant: true
      });
    }
  },

  async checkOut(barberId: string, time: string): Promise<StaffAccountability> {
    const today = new Date().toISOString().split('T')[0];
    const existing = await this.getRecordByDate(today, barberId);
    
    if (!existing) {
      throw new Error('No check-in record found for today');
    }
    
    return await this.updateAccountabilityRecord(existing.id, { check_out_time: time });
  }
};

// ===================================================================
// AUTHENTICATION SERVICE (USING SUPABASE AUTH)
// ===================================================================

export const authService = {
  // Login with existing users table
  async loginUser(email: string, password: string): Promise<User> {
    try {
      console.log('Attempting login with:', email, password);
      
      // First, let's check if user exists by email
      const { data: userCheck, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email);

      console.log('User check result:', userCheck, checkError);

      if (checkError) {
        console.error('Database error:', checkError);
        throw new Error('Database connection failed');
      }

      if (!userCheck || userCheck.length === 0) {
        throw new Error('User not found');
      }

      // Check password match
      const user = userCheck.find(u => u.password === password);
      if (!user) {
        throw new Error('Invalid password');
      }

      console.log('Login successful for user:', user);

      // Store in localStorage for session management
      localStorage.setItem('currentUser', JSON.stringify(user));
      return user;
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login failed');
    }
  },

  // Register new user in existing users table
  async registerUser(email: string, password: string, userData: Partial<User>): Promise<User> {
    try {
      // Check if email already exists
      const { data: existing } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .single();

      if (existing) {
        throw new Error('Email already exists');
      }

      // Create new user record
      const newUser = {
        email,
        password,
        name: userData.name || '',
        role: userData.role || 'Barber',
        shop_name: userData.shop_name || '',
        commission_rate: userData.commission_rate || 0.40,
        target_weekly: userData.target_weekly || 800,
        target_monthly: userData.target_monthly || 3200,
      };

      const { data, error } = await supabase
        .from('users')
        .insert([newUser])
        .select()
        .single();

      if (error) throw error;

      // Store in localStorage for session management
      localStorage.setItem('currentUser', JSON.stringify(data));
      return data;
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'Registration failed');
    }
  },

  // Get current user from localStorage
  async getCurrentUser(): Promise<User | null> {
    try {
      const stored = localStorage.getItem('currentUser');
      if (!stored) return null;
      return JSON.parse(stored);
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  // Logout user
  async logoutUser(): Promise<void> {
    try {
      localStorage.removeItem('currentUser');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
};

// ===================================================================
// SESSION SERVICE (BACKWARD COMPATIBILITY)
// ===================================================================

export const sessionService = {
  async setCurrentUser(user: User): Promise<void> {
    // This is now handled by Supabase Auth automatically
    console.log('Session managed by Supabase Auth');
  },

  async getCurrentUser(): Promise<User | null> {
    return await authService.getCurrentUser();
  },

  async clearSession(): Promise<void> {
    await authService.logoutUser();
  }
};

export default {
  authService,
  userService,
  customerService,
  bookingService,
  transactionService,
  expenseService,
  payrollService,
  dailyOperationsService,
  equipmentService,
  suppliesService,
  incidentService,
  staffAccountabilityService,
  sessionService
};
