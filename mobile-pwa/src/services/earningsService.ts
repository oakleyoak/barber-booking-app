import { SERVICES } from './servicePricing';

export interface Transaction {
  id: string;
  service: string;
  customer: string;
  date: string;
  amount: number;
  barber: string;
  commission: number;
  status: 'completed' | 'pending' | 'cancelled';
}

export interface DailyEarnings {
  date: string;
  transactions: Transaction[];
  totalAmount: number;
  totalCommission: number;
  bookingCount: number;
}

export class EarningsService {
  private static getStorageKey(shopName: string): string {
    return `earnings_${shopName.replace(/\s+/g, '_').toLowerCase()}`;
  }

  static getEarnings(shopName: string): DailyEarnings[] {
    const stored = localStorage.getItem(this.getStorageKey(shopName));
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Initialize with current date and empty earnings
    const today = new Date().toISOString().split('T')[0];
    return [{
      date: today,
      transactions: [],
      totalAmount: 0,
      totalCommission: 0,
      bookingCount: 0
    }];
  }

  static addTransaction(shopName: string, transaction: Omit<Transaction, 'id'>): void {
    const earnings = this.getEarnings(shopName);
    const today = new Date().toISOString().split('T')[0];
    
    // Find or create today's earnings
    let todayEarnings = earnings.find(e => e.date === today);
    if (!todayEarnings) {
      todayEarnings = {
        date: today,
        transactions: [],
        totalAmount: 0,
        totalCommission: 0,
        bookingCount: 0
      };
      earnings.push(todayEarnings);
    }

    // Add transaction with unique ID
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    };

    todayEarnings.transactions.push(newTransaction);
    todayEarnings.totalAmount += transaction.amount;
    todayEarnings.totalCommission += (transaction.amount * transaction.commission / 100);
    todayEarnings.bookingCount += 1;

    this.saveEarnings(shopName, earnings);
  }

  static getTodayEarnings(shopName: string, barberName?: string): DailyEarnings {
    const earnings = this.getEarnings(shopName);
    const today = new Date().toISOString().split('T')[0];
    
    let todayEarnings = earnings.find(e => e.date === today);
    if (!todayEarnings) {
      return {
        date: today,
        transactions: [],
        totalAmount: 0,
        totalCommission: 0,
        bookingCount: 0
      };
    }

    // Filter by barber if specified
    if (barberName) {
      const barberTransactions = todayEarnings.transactions.filter(t => t.barber === barberName);
      const totalAmount = barberTransactions.reduce((sum, t) => sum + t.amount, 0);
      const totalCommission = barberTransactions.reduce((sum, t) => sum + (t.amount * t.commission / 100), 0);
      
      return {
        date: today,
        transactions: barberTransactions,
        totalAmount,
        totalCommission,
        bookingCount: barberTransactions.length
      };
    }

    return todayEarnings;
  }

  static getWeeklyEarnings(shopName: string, barberName?: string): { 
    totalAmount: number; 
    totalCommission: number; 
    bookingCount: number;
    dailyAverage: number;
  } {
    const earnings = this.getEarnings(shopName);
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
    
    let totalAmount = 0;
    let totalCommission = 0;
    let bookingCount = 0;

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayEarnings = earnings.find(e => e.date === dateStr);
      if (dayEarnings) {
        const transactions = barberName 
          ? dayEarnings.transactions.filter(t => t.barber === barberName)
          : dayEarnings.transactions;
        
        totalAmount += transactions.reduce((sum, t) => sum + t.amount, 0);
        totalCommission += transactions.reduce((sum, t) => sum + (t.amount * t.commission / 100), 0);
        bookingCount += transactions.length;
      }
    }

    return {
      totalAmount,
      totalCommission,
      bookingCount,
      dailyAverage: totalAmount / 7
    };
  }

  static getMonthlyEarnings(shopName: string, barberName?: string): {
    totalAmount: number;
    totalCommission: number;
    bookingCount: number;
    dailyAverage: number;
  } {
    const earnings = this.getEarnings(shopName);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    let totalAmount = 0;
    let totalCommission = 0;
    let bookingCount = 0;

    for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayEarnings = earnings.find(e => e.date === dateStr);
      
      if (dayEarnings) {
        const transactions = barberName 
          ? dayEarnings.transactions.filter(t => t.barber === barberName)
          : dayEarnings.transactions;
        
        totalAmount += transactions.reduce((sum, t) => sum + t.amount, 0);
        totalCommission += transactions.reduce((sum, t) => sum + (t.amount * t.commission / 100), 0);
        bookingCount += transactions.length;
      }
    }

    const daysInMonth = monthEnd.getDate();
    return {
      totalAmount,
      totalCommission,
      bookingCount,
      dailyAverage: totalAmount / daysInMonth
    };
  }

  static getRecentTransactions(shopName: string, barberName?: string, limit: number = 10): Transaction[] {
    const earnings = this.getEarnings(shopName);
    const allTransactions: Transaction[] = [];
    
    // Get all transactions from all days, sorted by date (newest first)
    earnings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    for (const dayEarnings of earnings) {
      const transactions = barberName 
        ? dayEarnings.transactions.filter(t => t.barber === barberName)
        : dayEarnings.transactions;
      
      allTransactions.push(...transactions);
    }

    // Sort by date and limit results
    return allTransactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }

  private static saveEarnings(shopName: string, earnings: DailyEarnings[]): void {
    localStorage.setItem(this.getStorageKey(shopName), JSON.stringify(earnings));
  }

  // Initialize with empty data for production use
  static initializeSampleData(shopName: string, barberName: string): void {
    // Don't create any data - let users start fresh
    return;
  }

  // Clear all earnings data for fresh start
  static clearAllEarnings(shopName: string): void {
    localStorage.removeItem(this.getStorageKey(shopName));
  }
}
