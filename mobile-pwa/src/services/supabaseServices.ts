import { supabase } from '../lib/supabase';
import type { Booking, Customer, User, Expense, ShopSettings, PayrollEntry } from '../lib/supabase';

class BookingService {
  async getAllBookings(userId?: string): Promise<Booking[]> {
    try {
      let query = supabase
        .from('bookings')
        .select('*')
        .order('date', { ascending: false })
        .order('time', { ascending: true })
        .limit(10); // Limit to recent bookings for debugging

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching all bookings:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching all bookings:', error);
      return [];
    }
  }

  async getBookingsByDate(date: string, userId?: string): Promise<Booking[]> {
    try {
      // Ensure date is in YYYY-MM-DD format
      const formattedDate = date.split('T')[0];

      // Try multiple date formats to see which one works
      const dateFormats = [
        formattedDate, // YYYY-MM-DD
        new Date(formattedDate).toISOString().split('T')[0], // Ensure proper ISO format
      ];

      let data: any[] | null = null;
      let error: any = null;

      // Try the primary format first
      try {
        let query = supabase
          .from('bookings')
          .select('*')
          .eq('date', dateFormats[0])
          .order('time', { ascending: true });

        if (userId) {
          query = query.eq('user_id', userId);
        }

        const result = await query;
        data = result.data;
        error = result.error;

        if (error) {
          // Try alternative format
          let altQuery = supabase
            .from('bookings')
            .select('*')
            .eq('date', dateFormats[1])
            .order('time', { ascending: true });

          if (userId) {
            altQuery = altQuery.eq('user_id', userId);
          }

          const altResult = await altQuery;
          data = altResult.data;
          error = altResult.error;
        }
      } catch (err) {
        error = err;
      }

      if (error) {
        console.error('Error fetching bookings by date:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching bookings by date:', error);
      return [];
    }
  }  async createBooking(booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>): Promise<Booking | null> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert([booking])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating booking:', error);
      return null;
    }
  }

  async updateBooking(id: string, updates: Partial<Booking>): Promise<Booking | null> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating booking:', error);
      return null;
    }
  }

  async deleteBooking(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting booking:', error);
      return false;
    }
  }

  async getBookingStats(userId?: string, startDate?: string, endDate?: string) {
    try {
      let query = supabase
        .from('bookings')
        .select('*');

      if (userId) {
        query = query.eq('user_id', userId);
      }
      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      const bookings = data || [];
      const totalBookings = bookings.length;
      const completedBookings = bookings.filter(b => b.status === 'completed').length;
      const totalRevenue = bookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + b.price, 0);

      return {
        totalBookings,
        completedBookings,
        totalRevenue,
        averagePrice: completedBookings > 0 ? totalRevenue / completedBookings : 0
      };
    } catch (error) {
      console.error('Error getting booking stats:', error);
      return {
        totalBookings: 0,
        completedBookings: 0,
        totalRevenue: 0,
        averagePrice: 0
      };
    }
  }

  async getDailyEarnings(date: string, userId?: string) {
    try {
      let query = supabase
        .from('bookings')
        .select('*')
        .eq('date', date)
        .eq('status', 'completed');

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const bookings = data || [];
      return {
        totalAmount: bookings.reduce((sum, b) => sum + b.price, 0),
        bookingCount: bookings.length
      };
    } catch (error) {
      console.error('Error getting daily earnings:', error);
      return { totalAmount: 0, bookingCount: 0 };
    }
  }

  async getWeeklyEarnings(userId?: string) {
    try {
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      
      let query = supabase
        .from('bookings')
        .select('*')
        .gte('date', weekStart.toISOString().split('T')[0])
        .eq('status', 'completed');

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const bookings = data || [];
      return {
        totalAmount: bookings.reduce((sum, b) => sum + b.price, 0),
        bookingCount: bookings.length
      };
    } catch (error) {
      console.error('Error getting weekly earnings:', error);
      return { totalAmount: 0, bookingCount: 0 };
    }
  }

  async getMonthlyEarnings(userId?: string) {
    try {
      const today = new Date();
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      
      let query = supabase
        .from('bookings')
        .select('*')
        .gte('date', monthStart.toISOString().split('T')[0])
        .eq('status', 'completed');

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const bookings = data || [];
      return {
        totalAmount: bookings.reduce((sum, b) => sum + b.price, 0),
        bookingCount: bookings.length
      };
    } catch (error) {
      console.error('Error getting monthly earnings:', error);
      return { totalAmount: 0, bookingCount: 0 };
    }
  }

  async getBookingsByDateRange(startDate: string, endDate: string, userId?: string): Promise<Booking[]> {
    try {
      let query = supabase
        .from('bookings')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting bookings by date range:', error);
      return [];
    }
  }
}

class CustomerService {
  async getAllCustomers(userId?: string): Promise<Customer[]> {
    try {
      let query = supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching customers:', error);
      return [];
    }
  }

  async createCustomer(customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<Customer | null> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([customer])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating customer:', error);
      return null;
    }
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | null> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating customer:', error);
      return null;
    }
  }

  async deleteCustomer(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting customer:', error);
      return false;
    }
  }

  async getCustomerStats(userId?: string) {
    try {
      let customerQuery = supabase
        .from('customers')
        .select('*');

      let bookingQuery = supabase
        .from('bookings')
        .select('*');

      if (userId) {
        customerQuery = customerQuery.eq('user_id', userId);
        bookingQuery = bookingQuery.eq('user_id', userId);
      }

      const [customerResult, bookingResult] = await Promise.all([
        customerQuery,
        bookingQuery
      ]);

      if (customerResult.error) throw customerResult.error;
      if (bookingResult.error) throw bookingResult.error;

      const customers = customerResult.data || [];
      const bookings = bookingResult.data || [];

      const totalCustomers = customers.length;
      const newCustomersThisMonth = customers.filter(c => {
        const createdAt = new Date(c.created_at || '');
        const now = new Date();
        return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
      }).length;

      const customerBookings = customers.map(customer => {
        const customerBookingCount = bookings.filter(b => b.customer_id === customer.id).length;
        return { ...customer, bookingCount: customerBookingCount };
      });

      const returningCustomers = customerBookings.filter(c => c.bookingCount > 1).length;

      return {
        totalCustomers,
        newCustomersThisMonth,
        returningCustomers,
        retentionRate: totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0,
        topCustomers: customerBookings
          .sort((a, b) => b.bookingCount - a.bookingCount)
          .slice(0, 5)
      };
    } catch (error) {
      console.error('Error getting customer stats:', error);
      return {
        totalCustomers: 0,
        newCustomersThisMonth: 0,
        returningCustomers: 0,
        retentionRate: 0,
        topCustomers: []
      };
    }
  }
}

class ExpenseService {
  async getAllExpenses(userId?: string): Promise<Expense[]> {
    try {
      let query = supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching expenses:', error);
      return [];
    }
  }

  async createExpense(expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>): Promise<Expense | null> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert([expense])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating expense:', error);
      return null;
    }
  }

  async updateExpense(id: string, updates: Partial<Expense>): Promise<Expense | null> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating expense:', error);
      return null;
    }
  }

  async deleteExpense(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting expense:', error);
      return false;
    }
  }

  async getExpenseStats(userId?: string, startDate?: string, endDate?: string) {
    try {
      let query = supabase
        .from('expenses')
        .select('*');

      if (userId) {
        query = query.eq('user_id', userId);
      }
      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      const expenses = data || [];
      const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
      
      const expensesByCategory = expenses.reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + Number(exp.amount);
        return acc;
      }, {} as Record<string, number>);

      return {
        totalExpenses,
        expenseCount: expenses.length,
        expensesByCategory,
        averageExpense: expenses.length > 0 ? totalExpenses / expenses.length : 0
      };
    } catch (error) {
      console.error('Error getting expense stats:', error);
      return {
        totalExpenses: 0,
        expenseCount: 0,
        expensesByCategory: {},
        averageExpense: 0
      };
    }
  }

  async getDailyExpenses(date: string, userId?: string): Promise<number> {
    try {
      let query = supabase
        .from('expenses')
        .select('amount')
        .eq('date', date);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const expenses = data || [];
      return expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    } catch (error) {
      console.error('Error getting daily expenses:', error);
      return 0;
    }
  }

  async getWeeklyExpenses(userId?: string): Promise<number> {
    try {
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      
      let query = supabase
        .from('expenses')
        .select('amount')
        .gte('date', weekStart.toISOString().split('T')[0]);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const expenses = data || [];
      return expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    } catch (error) {
      console.error('Error getting weekly expenses:', error);
      return 0;
    }
  }

  async getMonthlyExpenses(userId?: string): Promise<number> {
    try {
      const today = new Date();
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      
      let query = supabase
        .from('expenses')
        .select('amount')
        .gte('date', monthStart.toISOString().split('T')[0]);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const expenses = data || [];
      return expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    } catch (error) {
      console.error('Error getting monthly expenses:', error);
      return 0;
    }
  }
}

export const bookingService = new BookingService();
export const customerService = new CustomerService();
export const expenseService = new ExpenseService();
