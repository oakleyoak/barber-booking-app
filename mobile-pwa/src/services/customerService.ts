import { dbService } from './database';
import { Customer } from '../lib/supabase';

export interface CustomerCreate {
  name: string;
  phone: string;
  email?: string;
}

export class CustomerService {
  static async getCustomers(userId?: string): Promise<Customer[]> {
    try {
      return await dbService.getCustomers(userId);
    } catch (error) {
      console.error('Error fetching customers:', error);
      return [];
    }
  }

  static async addCustomer(userId: string, customerData: CustomerCreate): Promise<Customer | null> {
    try {
      const customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'> = {
        user_id: userId,
        name: customerData.name,
        phone: customerData.phone,
        email: customerData.email || undefined,
        last_visit: undefined
      };

      return await dbService.createCustomer(customer);
    } catch (error) {
      console.error('Error adding customer:', error);
      return null;
    }
  }

  static async updateCustomer(customerId: string, updates: Partial<Customer>): Promise<Customer | null> {
    try {
      return await dbService.updateCustomer(customerId, updates);
    } catch (error) {
      console.error('Error updating customer:', error);
      return null;
    }
  }

  static async deleteCustomer(customerId: string): Promise<boolean> {
    try {
      return await dbService.deleteCustomer(customerId);
    } catch (error) {
      console.error('Error deleting customer:', error);
      return false;
    }
  }

  static async recordVisit(customerId: string, visitDate: string): Promise<boolean> {
    try {
      const updates: Partial<Customer> = {
        last_visit: visitDate
      };
      const updatedCustomer = await dbService.updateCustomer(customerId, updates);
      return updatedCustomer !== null;
    } catch (error) {
      console.error('Error recording visit:', error);
      return false;
    }
  }

  static async searchCustomers(query: string, userId?: string): Promise<Customer[]> {
    try {
      const customers = await this.getCustomers(userId);
      const lowerQuery = query.toLowerCase();
      return customers.filter(customer =>
        customer.name.toLowerCase().includes(lowerQuery) ||
        customer.email?.toLowerCase().includes(lowerQuery) ||
        customer.phone?.includes(query)
      );
    } catch (error) {
      console.error('Error searching customers:', error);
      return [];
    }
  }
}
