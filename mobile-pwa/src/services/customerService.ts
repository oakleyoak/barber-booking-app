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
  private static getStorageKey(shopName: string): string {
    return `customers_${shopName}`;
  }

  static getCustomers(shopName: string): Customer[] {
    try {
      const saved = localStorage.getItem(this.getStorageKey(shopName));
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    }
    return [];
  }

  static saveCustomers(shopName: string, customers: Customer[]): void {
    try {
      localStorage.setItem(this.getStorageKey(shopName), JSON.stringify(customers));
    } catch (error) {
      console.error('Error saving customers:', error);
      throw new Error('Failed to save customers');
    }
  }

  static addCustomer(shopName: string, customerData: CustomerCreate): Customer {
    const customers = this.getCustomers(shopName);
    const newCustomer: Customer = {
      id: Date.now().toString(),
      ...customerData,
      totalVisits: 0,
      totalSpent: 0,
      shopName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    customers.push(newCustomer);
    this.saveCustomers(shopName, customers);
    return newCustomer;
  }

  static updateCustomer(shopName: string, customerId: string, updates: Partial<Customer>): Customer | null {
    const customers = this.getCustomers(shopName);
    const customerIndex = customers.findIndex(c => c.id === customerId);
    
    if (customerIndex === -1) {
      return null;
    }

    customers[customerIndex] = {
      ...customers[customerIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.saveCustomers(shopName, customers);
    return customers[customerIndex];
  }

  static deleteCustomer(shopName: string, customerId: string): boolean {
    const customers = this.getCustomers(shopName);
    const filteredCustomers = customers.filter(c => c.id !== customerId);
    
    if (filteredCustomers.length === customers.length) {
      return false; // Customer not found
    }

    this.saveCustomers(shopName, filteredCustomers);
    return true;
  }

  static recordVisit(shopName: string, customerId: string, amount: number, barberName?: string): boolean {
    const customer = this.getCustomers(shopName).find(c => c.id === customerId);
    if (!customer) {
      return false;
    }

    const updates = {
      lastVisit: new Date().toISOString(),
      totalVisits: customer.totalVisits + 1,
      totalSpent: customer.totalSpent + amount,
      ...(barberName && { preferredBarber: barberName })
    };

    return this.updateCustomer(shopName, customerId, updates) !== null;
  }

  static searchCustomers(shopName: string, query: string): Customer[] {
    const customers = this.getCustomers(shopName);
    const lowercaseQuery = query.toLowerCase();
    
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(lowercaseQuery) ||
      customer.phone.includes(query) ||
      (customer.email && customer.email.toLowerCase().includes(lowercaseQuery))
    );
  }

  static getCustomersByBarber(shopName: string, barberName: string): Customer[] {
    const customers = this.getCustomers(shopName);
    return customers.filter(customer => customer.preferredBarber === barberName);
  }

  // Clear all customer data for fresh start (DANGEROUS - removes real customers)
  static clearAllCustomers(shopName: string): void {
    localStorage.removeItem(this.getStorageKey(shopName));
  }

  // Clear only dummy/test customers (safe - keeps real customers)
  static clearDummyCustomers(shopName: string): void {
    const customers = this.getCustomers(shopName);
    
    // List of dummy/test customer indicators
    const dummyIndicators = [
      'test', 'demo', 'sample', 'example', 'dummy', 'fake',
      'john doe', 'jane doe', 'test customer', 'demo customer',
      'ahmet test', 'mehmet demo', 'ali sample'
    ];
    
    // Keep only real customers (filter out dummy ones)
    const realCustomers = customers.filter(customer => {
      const nameCheck = customer.name.toLowerCase();
      const emailCheck = customer.email?.toLowerCase() || '';
      const phoneCheck = customer.phone || '';
      
      // Remove if name, email, or phone contains dummy indicators
      const isDummy = dummyIndicators.some(indicator => 
        nameCheck.includes(indicator) || 
        emailCheck.includes(indicator) ||
        phoneCheck.includes('555-0') // Common test phone pattern
      );
      
      return !isDummy; // Keep if NOT dummy
    });
    
    // Save the filtered list (keeping real customers)
    this.saveCustomers(shopName, realCustomers);
  }
}
