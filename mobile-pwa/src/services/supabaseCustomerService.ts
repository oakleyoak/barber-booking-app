import { supabase } from '../lib/supabase';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  lastVisit?: string;
  totalVisits: number;
  totalSpent: number;
  preferredBarber?: string;
  shopName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerCreate {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  preferredBarber?: string;
}

export class CustomerService {
  /**
   * Get all customers from Supabase (shared database)
   */
  static async getCustomers(shopName: string): Promise<Customer[]> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading customers:', error);
        return [];
      }

      // Convert Supabase data to our Customer format
      const customers = (data || []).map(customer => ({
        id: customer.id,
        name: customer.name,
        phone: customer.phone || '',
        email: customer.email,
        notes: customer.notes || '',
        lastVisit: customer.last_visit,
        totalVisits: 0, // Will be calculated from bookings
        totalSpent: 0, // Will be calculated from bookings
        preferredBarber: customer.preferred_barber || '',
        shopName: shopName,
        createdAt: customer.created_at,
        updatedAt: customer.updated_at || customer.created_at
      }));

      // Calculate actual stats from bookings
      return await this.calculateCustomerStats(customers);
    } catch (error) {
      console.error('Error loading customers:', error);
      return [];
    }
  }

  /**
   * Add customer to Supabase
   */
  static async addCustomer(shopName: string, customerData: CustomerCreate): Promise<Customer | null> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([{
          name: customerData.name,
          phone: customerData.phone,
          email: customerData.email,
          notes: customerData.notes,
          preferred_barber: customerData.preferredBarber,
          user_id: shopName
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding customer:', error);
        throw new Error('Failed to add customer');
      }

      const newCustomer = {
        id: data.id,
        name: data.name,
        phone: data.phone || '',
        email: data.email,
        notes: data.notes || '',
        lastVisit: data.last_visit,
        totalVisits: 0, // Will be calculated from bookings
        totalSpent: 0, // Will be calculated from bookings
        preferredBarber: data.preferred_barber || '',
        shopName: shopName,
        createdAt: data.created_at,
        updatedAt: data.updated_at || data.created_at
      };

      // Calculate stats for the new customer (will be 0 since no bookings yet)
      const customersWithStats = await this.calculateCustomerStats([newCustomer]);
      return customersWithStats[0];
    } catch (error) {
      console.error('Error adding customer:', error);
      return null;
    }
  }

  /**
   * Update customer in Supabase
   */
  static async updateCustomer(shopName: string, customerId: string, updates: Partial<CustomerCreate>): Promise<Customer | null> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .update({
          name: updates.name,
          phone: updates.phone,
          email: updates.email,
          notes: updates.notes,
          preferred_barber: updates.preferredBarber,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId)
        .select()
        .single();

      if (error) {
        console.error('Error updating customer:', error);
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        phone: data.phone || '',
        email: data.email,
        notes: data.notes || '',
        lastVisit: data.last_visit,
        totalVisits: 0, // Will be calculated from bookings
        totalSpent: 0, // Will be calculated from bookings
        preferredBarber: data.preferred_barber || '',
        shopName: shopName,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error updating customer:', error);
      return null;
    }
  }

  /**
   * Delete customer from Supabase
   */
  static async deleteCustomer(shopName: string, customerId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId);

      if (error) {
        console.error('Error deleting customer:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting customer:', error);
      return false;
    }
  }

  /**
   * Search customers in Supabase
   */
  static async searchCustomers(shopName: string, query: string): Promise<Customer[]> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .or(`name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error searching customers:', error);
        return [];
      }

      return (data || []).map(customer => ({
        id: customer.id,
        name: customer.name,
        phone: customer.phone || '',
        email: customer.email,
        notes: customer.notes || '',
        lastVisit: customer.last_visit,
        totalVisits: 0, // Will be calculated from bookings
        totalSpent: 0, // Will be calculated from bookings
        preferredBarber: customer.preferred_barber || '',
        shopName: shopName,
        createdAt: customer.created_at,
        updatedAt: customer.updated_at || customer.created_at
      }));
    } catch (error) {
      console.error('Error searching customers:', error);
      return [];
    }
  }

  /**
   * Calculate customer stats from bookings
   */
  static async calculateCustomerStats(customers: Customer[]): Promise<Customer[]> {
    try {
      // Get all customer IDs
      const customerIds = customers.map(c => c.id);

      if (customerIds.length === 0) {
        return customers;
      }

      // Query bookings for all customers at once
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('customer_id, price, status')
        .in('customer_id', customerIds)
        .eq('status', 'completed'); // Only count completed bookings

      if (error) {
        console.error('Error loading bookings for stats:', error);
        return customers; // Return customers with default stats if error
      }

      // Create a map of customer stats
      const statsMap = new Map<string, { visits: number; spent: number }>();

      // Initialize all customers with zero stats
      customers.forEach(customer => {
        statsMap.set(customer.id, { visits: 0, spent: 0 });
      });

      // Calculate stats from bookings
      (bookings || []).forEach(booking => {
        const currentStats = statsMap.get(booking.customer_id) || { visits: 0, spent: 0 };
        statsMap.set(booking.customer_id, {
          visits: currentStats.visits + 1,
          spent: currentStats.spent + (booking.price || 0)
        });
      });

      // Update customers with calculated stats
      return customers.map(customer => {
        const stats = statsMap.get(customer.id) || { visits: 0, spent: 0 };
        return {
          ...customer,
          totalVisits: stats.visits,
          totalSpent: stats.spent
        };
      });
    } catch (error) {
      console.error('Error calculating customer stats:', error);
      return customers; // Return customers with default stats if error
    }
  }

  /**
   * Update customer last visit date
   * Note: New schema doesn't have total_visits/total_spent fields, only last_visit
   */
  static async recordVisit(shopName: string, customerId: string, amount: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('customers')
        .update({
          last_visit: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId);

      if (error) {
        console.error('Error recording visit:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error recording visit:', error);
      return false;
    }
  }

  /**
   * Refresh customer stats after booking changes
   * This should be called when bookings are created, completed, or cancelled
   */
  static async refreshCustomerStats(shopName: string, customerId: string): Promise<Customer | null> {
    try {
      // Get the customer
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

      if (customerError) {
        console.error('Error loading customer for stats refresh:', customerError);
        return null;
      }

      // Calculate stats for this customer
      const customerObj: Customer = {
        id: customer.id,
        name: customer.name,
        phone: customer.phone || '',
        email: customer.email,
        notes: '',
        lastVisit: customer.last_visit,
        totalVisits: 0,
        totalSpent: 0,
        preferredBarber: '',
        shopName: shopName,
        createdAt: customer.created_at,
        updatedAt: customer.updated_at || customer.created_at
      };

      const customersWithStats = await this.calculateCustomerStats([customerObj]);
      const updatedCustomer = customersWithStats[0];

      // Update the customer's last_visit field in the database
      const { error: updateError } = await supabase
        .from('customers')
        .update({
          last_visit: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId);

      if (updateError) {
        console.error('Error updating customer last visit:', updateError);
      }

      return updatedCustomer;
    } catch (error) {
      console.error('Error refreshing customer stats:', error);
      return null;
    }
  }
}
