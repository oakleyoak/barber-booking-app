// ===================================================================
// COMPLETE DATABASE SERVICE - REPLACES ALL LOCALSTORAGE
// This is your comprehensive Supabase service layer
// ===================================================================

import { supabase } from '../lib/supabase';



// ===================================================================
// TYPES DEFINITIONS
// ===================================================================

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'Owner' | 'Manager' | 'Barber' | 'Apprentice';
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
  owner_id?: string;
  owner_share_percentage?: number;
  owner_share_amount?: number;
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
  .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase
  .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return null;
    return data;
  },

  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
  .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) return null;
    return data;
  },

  async getUserByAuthId(authUserId: string): Promise<User | null> {
    const { data, error } = await supabase
  .from('users')
      .select('*')
      .eq('auth_user_id', authUserId)
      .single();
    
    if (error) return null;
    return data;
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
  .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteUser(id: string): Promise<void> {
    // First, delete from the users table
    const { error: dbError } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    if (dbError) throw dbError;

    // Then delete from Supabase Auth
    // Note: This requires admin privileges. For now, we'll call a database function
    // that can delete the auth user server-side
    const { error: authError } = await supabase.rpc('delete_auth_user', {
      user_id: id
    });

    if (authError) {
      console.warn('Warning: User deleted from database but auth deletion failed:', authError);
      // Don't throw error - user is still functionally deleted from app perspective
    }
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
    let query = supabase.from('bookings').select('*, users(name)');
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query.order('date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getBookingsByDate(date: string, userId?: string): Promise<Booking[]> {
    let query = supabase.from('bookings').select('*, users(name)').eq('date', date);
    
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
  },

  async getBookingsByDateRange(startDate: string, endDate: string, userId?: string): Promise<Booking[]> {
    let query = supabase.from('bookings')
      .select('*, users(name)')
      .gte('date', startDate)
      .lte('date', endDate);
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query.order('date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getDailyEarnings(date: string, userId?: string): Promise<{ totalAmount: number; bookingCount: number }> {
    let query = supabase.from('bookings')
      .select('price')
      .eq('date', date);
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    const bookings = data || [];
    return {
      totalAmount: bookings.reduce((sum, booking) => sum + (booking.price || 0), 0),
      bookingCount: bookings.length
    };
  },

  async getWeeklyEarnings(userId?: string): Promise<{ totalAmount: number; bookingCount: number }> {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    
    let query = supabase.from('bookings')
      .select('price')
      .gte('date', weekStart.toISOString().split('T')[0])
      .lte('date', today.toISOString().split('T')[0]);
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    const bookings = data || [];
    return {
      totalAmount: bookings.reduce((sum, booking) => sum + (booking.price || 0), 0),
      bookingCount: bookings.length
    };
  },

  async getMonthlyEarnings(userId?: string): Promise<{ totalAmount: number; bookingCount: number }> {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    let query = supabase.from('bookings')
      .select('price')
      .gte('date', monthStart.toISOString().split('T')[0])
      .lte('date', today.toISOString().split('T')[0]);
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    const bookings = data || [];
    return {
      totalAmount: bookings.reduce((sum, booking) => sum + (booking.price || 0), 0),
      bookingCount: bookings.length
    };
  }
};

// ===================================================================
// TRANSACTION SERVICE
// ===================================================================

export const transactionService = {
  async getTransactions(userId?: string, currentUserRole?: string): Promise<Transaction[]> {
    let query = supabase.from('transactions').select('*');
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query.order('date', { ascending: false });
    
    if (error) throw error;
    const rows: Transaction[] = (data || []);
    if (currentUserRole && currentUserRole !== 'Owner') {
      // strip owner fields
      return rows.map(r => {
        const { owner_id, owner_share_percentage, owner_share_amount, ...rest } = r as any;
        return rest as Transaction;
      });
    }
    return rows;
  },

  async getTransactionsByDateRange(startDate: string, endDate: string, userId?: string, currentUserRole?: string): Promise<Transaction[]> {
    let query = supabase.from('transactions')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate);
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query.order('date', { ascending: false });
    
    const rows: Transaction[] = (data || []);
    if (currentUserRole && currentUserRole !== 'Owner') {
      return rows.map(r => {
        const { owner_id, owner_share_percentage, owner_share_amount, ...rest } = r as any;
        return rest as Transaction;
      });
    }
    return rows;
  },

  async createTransaction(transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>): Promise<Transaction> {
    // Compute owner-share based on staff role
    const OWNER_SHARE_PCT_BY_ROLE: Record<string, number> = {
      Apprentice: 60,
      Barber: 40,
      Manager: 30,
      Owner: 100
    };

    // Fetch performing user's role
    const { data: userData } = await supabase.from('users').select('id, role').eq('id', transaction.user_id).single();
    const staffRole = (userData && userData.role) ? userData.role : null;
    const ownerPct = staffRole ? (OWNER_SHARE_PCT_BY_ROLE[staffRole] ?? 0) : 0;

    // Choose owner_id: first Owner user (single-shop assumption)
    const { data: ownerRow } = await supabase.from('users').select('id').eq('role', 'Owner').limit(1).single();
    const ownerId = ownerRow ? ownerRow.id : null;

    const ownerShareAmount = Math.round((Number(transaction.amount) * ownerPct / 100) * 100) / 100;

    const toInsert = {
      ...transaction,
      owner_id: ownerId,
      owner_share_percentage: ownerPct,
      owner_share_amount: ownerShareAmount
    };

    const { data, error } = await supabase
      .from('transactions')
      .insert([toInsert])
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
  },

  async getDailyExpenses(date: string, userId?: string): Promise<number> {
    let query = supabase.from('expenses')
      .select('amount')
      .eq('date', date);
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return (data || []).reduce((sum, expense) => sum + (expense.amount || 0), 0);
  },

  async getWeeklyExpenses(userId?: string): Promise<number> {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    
    let query = supabase.from('expenses')
      .select('amount')
      .gte('date', weekStart.toISOString().split('T')[0])
      .lte('date', today.toISOString().split('T')[0]);
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return (data || []).reduce((sum, expense) => sum + (expense.amount || 0), 0);
  },

  async getMonthlyExpenses(userId?: string): Promise<number> {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    let query = supabase.from('expenses')
      .select('amount')
      .gte('date', monthStart.toISOString().split('T')[0])
      .lte('date', today.toISOString().split('T')[0]);
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return (data || []).reduce((sum, expense) => sum + (expense.amount || 0), 0);
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
      .order('item_name', { ascending: true });
    if (error) throw error;
    return (data || []).filter(item => item.current_stock <= item.minimum_stock);
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
  // Login using Supabase Auth (primary method)
  async loginUser(email: string, password: string): Promise<User> {
    try {
      // Use Supabase Auth to sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        console.error('Auth sign-in error:', signInError);
        throw new Error(signInError.message || 'Authentication failed');
      }

      const supaUser = signInData.user;
      if (!supaUser || !supaUser.email) throw new Error('Authentication failed');

      // Fetch profile from users table using auth user ID
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', supaUser.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        throw profileError;
      }

      return profile;
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error('Invalid login credentials');
    }
  },

  // Register new user in existing users table
  async registerUser(email: string, password: string, userData: Partial<User>): Promise<User> {
    try {
      // Sign up via Supabase Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password
      });

      if (signUpError) {
        console.error('Auth sign-up error:', signUpError);
        throw new Error(signUpError.message || 'Registration failed');
      }

      if (!signUpData.user) {
        throw new Error('No user data returned from auth signup');
      }

      // Create profile in users table using the auth user ID
      const newProfile = {
        auth_user_id: signUpData.user.id, // Link to auth user
        email,
        name: userData.name || '',
        role: userData.role || 'Barber',
        shop_name: userData.shop_name || '',
        commission_rate: userData.commission_rate ?? 60,
        target_weekly: userData.target_weekly ?? 800,
        target_monthly: userData.target_monthly ?? 3200
      };

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .insert([newProfile])
        .select()
        .single();

      if (profileError) throw profileError;

      return profile;
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'Registration failed');
    }
  },

  // Get current user from Supabase Auth session
  async getCurrentUser(): Promise<User | null> {
    try {
      // Get current user from Supabase auth session
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        return null;
      }

      // Get the user profile from users table using the auth user ID
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', userData.user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        return null;
      }

      return profile;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  // Logout user
  async logoutUser(): Promise<void> {
    try {
      await supabase.auth.signOut();
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
  },

  async getCurrentUser(): Promise<User | null> {
    return await authService.getCurrentUser();
  },

  async clearSession(): Promise<void> {
    await authService.logoutUser();
  }
};

// ===================================================================
// DAILY CLEANING LOG SERVICE
// ===================================================================

export const dailyCleaningLogService = {
  async getLogsByDate(date: string, barberId?: string) {
    try {
      let query = supabase.from('daily_cleaning_logs').select('*').eq('date', date);
      if (barberId) query = query.eq('barber_id', barberId);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching daily cleaning logs by date:', error);
      return [];
    }
  },

  async getLogsByDateRange(startDate: string, endDate: string, barberId?: string) {
    try {
      let query = supabase.from('daily_cleaning_logs').select('*').gte('date', startDate).lte('date', endDate);
      if (barberId) query = query.eq('barber_id', barberId);
      const { data, error } = await query.order('date', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching daily cleaning logs by range:', error);
      return [];
    }
  },

  async createLog(record: any) {
    try {
      const { data, error } = await supabase.from('daily_cleaning_logs').insert([record]).select().single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating daily cleaning log:', error);
      return null;
    }
  },

  async updateLog(id: string, updates: any) {
    try {
      const { data, error } = await supabase.from('daily_cleaning_logs').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating daily cleaning log:', error);
      return null;
    }
  },

  async deleteLog(id: string) {
    try {
      const { error } = await supabase.from('daily_cleaning_logs').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting daily cleaning log:', error);
      return false;
    }
  }
};

// ===================================================================
// DAILY SAFETY CHECKS SERVICE
// ===================================================================

export const dailySafetyChecksService = {
  async getChecksByDate(date: string, barberId?: string) {
    try {
      let query = supabase.from('daily_safety_checks').select('*').eq('date', date);
      if (barberId) query = query.eq('barber_id', barberId);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching daily safety checks by date:', error);
      return [];
    }
  },

  async getChecksByDateRange(startDate: string, endDate: string, barberId?: string) {
    try {
      let query = supabase.from('daily_safety_checks').select('*').gte('date', startDate).lte('date', endDate);
      if (barberId) query = query.eq('barber_id', barberId);
      const { data, error } = await query.order('date', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching daily safety checks by range:', error);
      return [];
    }
  },

  async createCheck(record: any) {
    try {
      const { data, error } = await supabase.from('daily_safety_checks').insert([record]).select().single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating daily safety check:', error);
      return null;
    }
  },

  async updateCheck(id: string, updates: any) {
    try {
      const { data, error } = await supabase.from('daily_safety_checks').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating daily safety check:', error);
      return null;
    }
  },

  async deleteCheck(id: string) {
    try {
      const { error } = await supabase.from('daily_safety_checks').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting daily safety check:', error);
      return false;
    }
  }
};

// ===================================================================
// EQUIPMENT MAINTENANCE LOG SERVICE
// ===================================================================

export const equipmentMaintenanceService = {
  async getLogsByDate(date: string) {
    try {
      const { data, error } = await supabase.from('equipment_maintenance_log').select('*').eq('date', date).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching equipment maintenance logs by date:', error);
      return [];
    }
  },

  async getLogsByDateRange(startDate: string, endDate: string) {
    try {
      const { data, error } = await supabase.from('equipment_maintenance_log').select('*').gte('date', startDate).lte('date', endDate).order('date', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching equipment maintenance logs by range:', error);
      return [];
    }
  },

  async createLog(record: any) {
    try {
      const { data, error } = await supabase.from('equipment_maintenance_log').insert([record]).select().single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating equipment maintenance log:', error);
      return null;
    }
  },

  async updateLog(id: string, updates: any) {
    try {
      const { data, error } = await supabase.from('equipment_maintenance_log').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating equipment maintenance log:', error);
      return null;
    }
  },

  async deleteLog(id: string) {
    try {
      const { error } = await supabase.from('equipment_maintenance_log').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting equipment maintenance log:', error);
      return false;
    }
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
  sessionService,
  dailyCleaningLogService,
  dailySafetyChecksService,
  equipmentMaintenanceService
};
