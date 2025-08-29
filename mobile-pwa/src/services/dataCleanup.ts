import { CustomerService } from './customerService';
import { EarningsService } from './earningsService';

export class DataCleanupService {
  // Clear all dummy/sample data from the application
  static clearAllDummyData(shopName: string): void {
    try {
      // Clear all customer data
      CustomerService.clearAllCustomers(shopName);
      
      // Clear all earnings data
      EarningsService.clearAllEarnings(shopName);
      
      // Clear any other localStorage items related to the shop
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes(shopName.toLowerCase()) || 
          key.includes('sample') || 
          key.includes('demo') ||
          key.includes('dummy')
        )) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
    } catch (error) {
      console.error('Error clearing dummy data:', error);
    }
  }

  // Check if the app has any dummy data
  static async hasDummyData(shopName: string): Promise<boolean> {
    const customers = await CustomerService.getCustomers(shopName);
    const dummyCustomerNames = [
      'Ahmed Yılmaz', 'Mehmet Özkan', 'Ali Kaya', 'Hasan Demir', 'Emre Şahin',
      'Customer 0-0', 'Customer 1-1', 'Customer', 'Junior', 'joeseph', 'Muhammed'
    ];
    
    return customers.some(customer => 
      dummyCustomerNames.some(dummyName => 
        customer.name.toLowerCase().includes(dummyName.toLowerCase())
      )
    );
  }

  // Fresh start for production
  static initializeProductionApp(shopName: string): void {
    // Clear everything first
    this.clearAllDummyData(shopName);
    
    // Don't create any sample data - completely clean start
  }
}
