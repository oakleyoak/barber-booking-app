import { supabase } from '../lib/supabase';
import { CustomerService, Customer, CustomerCreate } from './customerService';

export class SharedCustomerService {
  /**
   * Get customers from both localStorage and Supabase combined
   */
  static async getSharedCustomers(shopName: string): Promise<Customer[]> {
    try {
      // Get local customers
      const localCustomers = CustomerService.getCustomers(shopName);
      
      // Get Supabase customers
      const { data: supabaseCustomers, error } = await supabase
        .from('customers')
        .select('*');
      
      if (error) {
        console.error('Error fetching Supabase customers:', error);
        return localCustomers; // Return local customers if Supabase fails
      }
      
      // Convert Supabase customers to our Customer format
      const convertedSupabaseCustomers: Customer[] = (supabaseCustomers || []).map(sc => ({
        id: sc.id,
        name: sc.name,
        phone: sc.phone || '',
        email: sc.email,
        notes: sc.notes,
        lastVisit: sc.last_visit,
        totalVisits: sc.total_visits || 0,
        totalSpent: sc.total_spent || 0,
        preferredBarber: '',
        shopName: shopName,
        createdAt: sc.created_at || new Date().toISOString(),
        updatedAt: sc.updated_at || new Date().toISOString()
      }));
      
      // Combine and deduplicate (prefer Supabase data over local)
      const combinedCustomers: Customer[] = [];
      const seenIds = new Set<string>();
      const seenNames = new Set<string>();
      
      // Add Supabase customers first (they take priority)
      convertedSupabaseCustomers.forEach(customer => {
        if (!seenIds.has(customer.id) && !seenNames.has(customer.name.toLowerCase())) {
          combinedCustomers.push(customer);
          seenIds.add(customer.id);
          seenNames.add(customer.name.toLowerCase());
        }
      });
      
      // Add local customers that aren't already present
      localCustomers.forEach(customer => {
        if (!seenIds.has(customer.id) && !seenNames.has(customer.name.toLowerCase())) {
          combinedCustomers.push(customer);
          seenIds.add(customer.id);
          seenNames.add(customer.name.toLowerCase());
        }
      });
      
      return combinedCustomers;
    } catch (error) {
      console.error('Error getting shared customers:', error);
      return CustomerService.getCustomers(shopName); // Fallback to local
    }
  }
  
  /**
   * Add customer to both localStorage and Supabase
   */
  static async addSharedCustomer(shopName: string, customerData: CustomerCreate): Promise<Customer | null> {
    try {
      // Add to localStorage first
      const localCustomer = CustomerService.addCustomer(shopName, customerData);
      
      // Add to Supabase
      const { data, error } = await supabase
        .from('customers')
        .insert([{
          name: customerData.name,
          email: customerData.email,
          phone: customerData.phone,
          notes: customerData.notes,
          total_visits: 0,
          total_spent: 0,
          user_id: shopName // Use shop name as user identifier
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Error adding customer to Supabase:', error);
        // Customer was added to localStorage, so return that
        return localCustomer;
      }
      
      return localCustomer;
    } catch (error) {
      console.error('Error adding shared customer:', error);
      // Fallback to local only
      return CustomerService.addCustomer(shopName, customerData);
    }
  }
  
  /**
   * Sync local customers to Supabase
   */
  static async syncLocalToSupabase(shopName: string): Promise<void> {
    try {
      const localCustomers = CustomerService.getCustomers(shopName);
      
      for (const customer of localCustomers) {
        // Check if customer already exists in Supabase
        const { data: existing } = await supabase
          .from('customers')
          .select('id')
          .eq('name', customer.name)
          .single();
        
        if (!existing) {
          // Add to Supabase if doesn't exist
          await supabase
            .from('customers')
            .insert([{
              name: customer.name,
              email: customer.email,
              phone: customer.phone,
              notes: customer.notes,
              total_visits: customer.totalVisits,
              total_spent: customer.totalSpent,
              last_visit: customer.lastVisit,
              user_id: shopName
            }]);
        }
      }
      
      console.log('Local customers synced to Supabase');
    } catch (error) {
      console.error('Error syncing customers to Supabase:', error);
    }
  }
}
