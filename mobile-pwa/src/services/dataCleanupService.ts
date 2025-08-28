import { CustomerService } from './customerService';
import { EarningsService } from './earningsService';
import { supabase } from '../lib/supabase';

export class DataCleanupService {
  /**
   * Clear only dummy/mock data from Supabase (NOT real customers)
   */
  static async clearAllDummyData(shopName: string): Promise<void> {
    try {
      // Clear only dummy customers from Supabase, not localStorage
      await this.clearDummySupabaseCustomers();
      
      // Clear earnings from localStorage (this can stay local)
      EarningsService.clearAllEarnings(shopName);
      
      console.log(`Only dummy data cleared for shop: ${shopName}`);
    } catch (error) {
      console.error('Error clearing dummy data:', error);
    }
  }

  /**
   * Clear only dummy customers from Supabase (keeps real customers like Muhammed)
   */
  static async clearDummySupabaseCustomers(): Promise<void> {
    try {
      // List of dummy/test customer indicators
      const dummyIndicators = [
        'test', 'demo', 'sample', 'example', 'dummy', 'fake',
        'john doe', 'jane doe', 'test customer', 'demo customer',
        'ahmet test', 'mehmet demo', 'ali sample'
      ];
      
      // Delete customers whose names contain dummy indicators
      for (const indicator of dummyIndicators) {
        const { error } = await supabase
          .from('customers')
          .delete()
          .ilike('name', `%${indicator}%`);
        
        if (error) {
          console.error(`Error clearing dummy customers with "${indicator}":`, error);
        }
      }
      
      // Also delete customers with test emails
      const { error: emailError } = await supabase
        .from('customers')
        .delete()
        .or('email.ilike.%test%,email.ilike.%demo%,email.ilike.%example%');
      
      if (emailError) {
        console.error('Error clearing dummy customers by email:', emailError);
      }
      
      console.log('Dummy customers cleared from Supabase (real customers preserved)');
    } catch (error) {
      console.error('Error clearing dummy Supabase customers:', error);
    }
  }

  /**
   * Check if there's any dummy data in the system
   */
  static async hasDummyData(shopName: string): Promise<boolean> {
    const customers = await CustomerService.getCustomers(shopName);
    const earnings = await EarningsService.getEarnings(shopName);
    
    // Check for common dummy/test names
    const dummyNames = [
      'john doe', 'jane doe', 'test customer', 'sample customer',
      'demo customer', 'example customer', 'dummy customer',
      'ahmet yılmaz', 'mehmet demir', 'ali kaya', 'test user'
    ];
    
    const hasDummyCustomers = customers.some(customer => 
      dummyNames.some(dummyName => 
        customer.name.toLowerCase().includes(dummyName) ||
        customer.phone?.includes('555') ||
        customer.email?.includes('test') ||
        customer.email?.includes('example')
      )
    );
    
    // Count all transactions across all daily earnings
    const totalTransactions = earnings.transactions.length;
    
    return hasDummyCustomers || totalTransactions > 0;
  }

  /**
   * Initialize the app in production mode (no dummy data)
   */
  static initializeProductionApp(shopName: string): void {
    // Clear any existing dummy data
    this.clearAllDummyData(shopName);
    
    // Initialize with empty state
    console.log(`Production app initialized for shop: ${shopName}`);
  }

  /**
   * Get summary of current data state including Supabase
   */
  static async getDataSummary(shopName: string): Promise<{
    customerCount: number;
    transactionCount: number;
    supabaseCustomerCount: number;
    hasDummyData: boolean;
  }> {
    const customers = await CustomerService.getCustomers(shopName);
    const earnings = await EarningsService.getEarnings(shopName);
    
    // Count all transactions across all daily earnings
    const totalTransactions = earnings.transactions.length;
    
    // Get Supabase customer count
    let supabaseCount = 0;
    try {
      const { count } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });
      supabaseCount = count || 0;
    } catch (error) {
      console.error('Error getting Supabase customer count:', error);
    }
    
    return {
      customerCount: customers.length,
      transactionCount: totalTransactions,
      supabaseCustomerCount: supabaseCount,
      hasDummyData: (await this.hasDummyData(shopName)) || supabaseCount > 0
    };
  }
}
