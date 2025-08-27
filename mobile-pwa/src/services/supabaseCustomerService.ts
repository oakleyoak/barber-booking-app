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
      return (data || []).map(customer => ({
        id: customer.id,
        name: customer.name,
        phone: customer.phone || '',
        email: customer.email,
        notes: customer.notes,
        lastVisit: customer.last_visit,
        totalVisits: customer.total_visits || 0,
        totalSpent: customer.total_spent || 0,
        preferredBarber: customer.preferred_barber || '',
        shopName: shopName,
        createdAt: customer.created_at,
        updatedAt: customer.updated_at || customer.created_at
      }));
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
          total_visits: 0,
          total_spent: 0,
          user_id: shopName
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding customer:', error);
        throw new Error('Failed to add customer');
      }

      return {
        id: data.id,
        name: data.name,
        phone: data.phone || '',
        email: data.email,
        notes: data.notes,
        lastVisit: data.last_visit,
        totalVisits: data.total_visits || 0,
        totalSpent: data.total_spent || 0,
        preferredBarber: data.preferred_barber || '',
        shopName: shopName,
        createdAt: data.created_at,
        updatedAt: data.updated_at || data.created_at
      };
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
        notes: data.notes,
        lastVisit: data.last_visit,
        totalVisits: data.total_visits || 0,
        totalSpent: data.total_spent || 0,
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
        notes: customer.notes,
        lastVisit: customer.last_visit,
        totalVisits: customer.total_visits || 0,
        totalSpent: customer.total_spent || 0,
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
   * Get customers by preferred barber
   */
  static async getCustomersByBarber(shopName: string, barberName: string): Promise<Customer[]> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('preferred_barber', barberName)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting customers by barber:', error);
        return [];
      }

      return (data || []).map(customer => ({
        id: customer.id,
        name: customer.name,
        phone: customer.phone || '',
        email: customer.email,
        notes: customer.notes,
        lastVisit: customer.last_visit,
        totalVisits: customer.total_visits || 0,
        totalSpent: customer.total_spent || 0,
        preferredBarber: customer.preferred_barber || '',
        shopName: shopName,
        createdAt: customer.created_at,
        updatedAt: customer.updated_at || customer.created_at
      }));
    } catch (error) {
      console.error('Error getting customers by barber:', error);
      return [];
    }
  }

  /**
   * Update customer visit and spending data
   */
  static async recordVisit(shopName: string, customerId: string, amount: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('customers')
        .update({
          total_visits: supabase.rpc('increment_visits', { customer_id: customerId }),
          total_spent: supabase.rpc('add_spending', { customer_id: customerId, amount: amount }),
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
}
