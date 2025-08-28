import { dbService } from './database';
import { Transaction } from '../lib/supabase';

export interface TransactionData {
  customer_name: string;
  service: string;
  amount: number;
  commission: number;
  booking_id?: string;
}

export interface EarningsData {
  totalAmount: number;
  bookingCount: number;
  transactions: Transaction[];
}

export class EarningsService {
  static async addTransaction(userId: string, transactionData: TransactionData): Promise<boolean> {
    try {
      const transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'> = {
        user_id: userId,
        customer_name: transactionData.customer_name,
        service: transactionData.service,
        amount: transactionData.amount,
        commission: transactionData.commission,
        commission_amount: transactionData.amount * (transactionData.commission / 100),
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        booking_id: transactionData.booking_id || undefined
      };

      const result = await dbService.createTransaction(transaction);
      return result !== null;
    } catch (error) {
      console.error('Error adding transaction:', error);
      return false;
    }
  }

  static async getTodayEarnings(userId: string): Promise<EarningsData> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const transactions = await dbService.getTransactions(userId);
      const todayTransactions = transactions.filter(t => t.date === today);

      const totalAmount = todayTransactions.reduce((sum: number, t) => sum + t.amount, 0);
      const bookingCount = todayTransactions.length;

      return {
        totalAmount,
        bookingCount,
        transactions: todayTransactions
      };
    } catch (error) {
      console.error('Error getting today earnings:', error);
      return {
        totalAmount: 0,
        bookingCount: 0,
        transactions: []
      };
    }
  }

  static async getWeeklyEarnings(userId: string, staffName?: string): Promise<EarningsData> {
    try {
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);

      const weekAgoStr = weekAgo.toISOString().split('T')[0];
      const todayStr = today.toISOString().split('T')[0];

      const transactions = await dbService.getTransactions(userId);
      const weekTransactions = transactions.filter(t => t.date >= weekAgoStr && t.date <= todayStr);

      const filteredTransactions = staffName
        ? weekTransactions.filter((t: Transaction) => t.customer_name.includes(staffName))
        : weekTransactions;

      const totalAmount = filteredTransactions.reduce((sum: number, t) => sum + t.amount, 0);
      const bookingCount = filteredTransactions.length;

      return {
        totalAmount,
        bookingCount,
        transactions: filteredTransactions
      };
    } catch (error) {
      console.error('Error getting weekly earnings:', error);
      return {
        totalAmount: 0,
        bookingCount: 0,
        transactions: []
      };
    }
  }

  static async getMonthlyEarnings(userId: string): Promise<EarningsData> {
    try {
      const today = new Date();
      const monthAgo = new Date(today);
      monthAgo.setMonth(today.getMonth() - 1);

      const monthAgoStr = monthAgo.toISOString().split('T')[0];
      const todayStr = today.toISOString().split('T')[0];

      const transactions = await dbService.getTransactions(userId);
      const monthTransactions = transactions.filter(t => t.date >= monthAgoStr && t.date <= todayStr);

      const totalAmount = monthTransactions.reduce((sum: number, t) => sum + t.amount, 0);
      const bookingCount = monthTransactions.length;

      return {
        totalAmount,
        bookingCount,
        transactions: monthTransactions
      };
    } catch (error) {
      console.error('Error getting monthly earnings:', error);
      return {
        totalAmount: 0,
        bookingCount: 0,
        transactions: []
      };
    }
  }

  static async getEarnings(userId: string): Promise<EarningsData> {
    try {
      const transactions = await dbService.getTransactions(userId);
      const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
      const bookingCount = transactions.length;

      return {
        totalAmount,
        bookingCount,
        transactions
      };
    } catch (error) {
      console.error('Error getting earnings:', error);
      return {
        totalAmount: 0,
        bookingCount: 0,
        transactions: []
      };
    }
  }
}
