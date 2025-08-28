import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Users, 
  FileText, 
  Target, 
  Download, 
  Clock, 
  Calendar,
  Save,
  DollarSign,
  TrendingUp,
  Trash2,
  Edit2,
  Plus,
  UserCheck,
  UserX,
  BarChart3,
  Receipt,
  Printer
} from 'lucide-react';
import { bookingService, customerService, expenseService } from '../services/supabaseServices';
import { shopSettingsService, payrollService, userManagementService } from '../services/managementServices';
import type { User as UserType, ShopSettings } from '../lib/supabase';

interface AdminPanelProps {
  currentUser: UserType;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser }) => {
  const [currentTab, setCurrentTab] = useState('overview');
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);
  const [users, setUsers] = useState<UserType[]>([]);
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalCustomers: 0,
    monthlyRevenue: 0,
    weeklyRevenue: 0,
    dailyRevenue: 0
  });
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'Barber',
    commission_rate: 50,
    target_weekly: 2000,
    target_monthly: 8000
  });

  const formatCurrency = (amount: number) => {
    return `₺${amount.toLocaleString('tr-TR')}`;
  };

  useEffect(() => {
    loadAdminData();
  }, [currentUser.id]);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      // Load shop settings
      const settings = await shopSettingsService.getSettings();
      setShopSettings(settings);

      // Load users
      const allUsers = await userManagementService.getAllUsers();
      setUsers(allUsers);

      // Load statistics
      const [customers, monthlyEarnings, weeklyEarnings, dailyEarnings] = await Promise.all([
        customerService.getAllCustomers(),
        bookingService.getMonthlyEarnings(),
        bookingService.getWeeklyEarnings(),
        bookingService.getDailyEarnings(new Date().toISOString().split('T')[0])
      ]);

      const totalBookings = await bookingService.getAllBookings();

      setStats({
        totalBookings: totalBookings.length,
        totalCustomers: customers.length,
        monthlyRevenue: monthlyEarnings.totalAmount,
        weeklyRevenue: weeklyEarnings.totalAmount,
        dailyRevenue: dailyEarnings.totalAmount
      });
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!shopSettings) return;
    
    try {
      await shopSettingsService.updateSettings(shopSettings);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    }
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const updated = await userManagementService.updateUser(editingUser.id, {
          name: newUser.name,
          email: newUser.email,
          role: newUser.role as 'Owner' | 'Barber',
          commission_rate: newUser.commission_rate,
          target_weekly: newUser.target_weekly,
          target_monthly: newUser.target_monthly
        });
        if (updated) {
          setUsers(prev => prev.map(u => u.id === editingUser.id ? updated : u));
        }
      } else {
        const created = await userManagementService.createUser({
          ...newUser,
          password: 'changeme123',
          shop_name: currentUser.shop_name
        });
        if (created) {
          setUsers(prev => [...prev, created]);
        }
      }
      
      setShowUserModal(false);
      setEditingUser(null);
      setNewUser({
        name: '',
        email: '',
        role: 'Barber',
        commission_rate: 50,
        target_weekly: 2000,
        target_monthly: 8000
      });
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Failed to save user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser.id) {
      alert('Cannot delete yourself!');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this user?')) {
      const success = await userManagementService.deleteUser(userId);
      if (success) {
        setUsers(prev => prev.filter(u => u.id !== userId));
      }
    }
  };

  const exportXReport = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const bookings = await bookingService.getBookingsByDate(today);
      
      const report = {
        date: today,
        reportType: 'X Report (Daily Summary)',
        generatedAt: new Date().toISOString(),
        summary: {
          totalTransactions: bookings.length,
          totalRevenue: bookings.reduce((sum, b) => sum + b.price, 0),
          completedBookings: bookings.filter(b => b.status === 'completed').length,
          cancelledBookings: bookings.filter(b => b.status === 'cancelled').length
        },
        transactions: bookings.map(b => ({
          time: b.time,
          service: b.service,
          customer: b.customer_name,
          amount: b.price,
          status: b.status,
          barber: b.user_id
        }))
      };

      const csvContent = [
        'X REPORT - DAILY SUMMARY',
        `Date: ${report.date}`,
        `Generated: ${report.generatedAt}`,
        '',
        'SUMMARY',
        `Total Transactions,${report.summary.totalTransactions}`,
        `Total Revenue,${formatCurrency(report.summary.totalRevenue)}`,
        `Completed Bookings,${report.summary.completedBookings}`,
        `Cancelled Bookings,${report.summary.cancelledBookings}`,
        '',
        'TRANSACTIONS',
        'Time,Service,Customer,Amount,Status,Barber',
        ...report.transactions.map(t => 
          `${t.time},${t.service},${t.customer},${formatCurrency(t.amount)},${t.status},${t.barber}`
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `x-report-${today}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating X report:', error);
    }
  };

  const exportZReport = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const bookings = await bookingService.getBookingsByDate(today);
      const expenses = await expenseService.getDailyExpenses(today);
      
      const report = {
        date: today,
        reportType: 'Z Report (End of Day)',
        generatedAt: new Date().toISOString(),
        summary: {
          totalTransactions: bookings.length,
          grossRevenue: bookings.reduce((sum, b) => sum + b.price, 0),
          totalExpenses: expenses,
          netRevenue: bookings.reduce((sum, b) => sum + b.price, 0) - expenses,
          completedBookings: bookings.filter(b => b.status === 'completed').length,
          cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
          vatRate: 18, // TRNC VAT rate
          vatAmount: (bookings.reduce((sum, b) => sum + b.price, 0) * 0.18) / 1.18
        },
        serviceBreakdown: {} as Record<string, { count: number; revenue: number }>,
        barberBreakdown: {} as Record<string, { count: number; revenue: number }>
      };

      // Calculate service breakdown
      bookings.forEach(booking => {
        if (!report.serviceBreakdown[booking.service]) {
          report.serviceBreakdown[booking.service] = { count: 0, revenue: 0 };
        }
        report.serviceBreakdown[booking.service].count++;
        report.serviceBreakdown[booking.service].revenue += booking.price;
      });

      const csvContent = [
        'Z REPORT - END OF DAY',
        `Date: ${report.date}`,
        `Generated: ${report.generatedAt}`,
        '',
        'FINANCIAL SUMMARY',
        `Gross Revenue,${formatCurrency(report.summary.grossRevenue)}`,
        `Total Expenses,${formatCurrency(report.summary.totalExpenses)}`,
        `Net Revenue,${formatCurrency(report.summary.netRevenue)}`,
        `VAT Amount (18%),${formatCurrency(report.summary.vatAmount)}`,
        '',
        'TRANSACTION SUMMARY',
        `Total Transactions,${report.summary.totalTransactions}`,
        `Completed Bookings,${report.summary.completedBookings}`,
        `Cancelled Bookings,${report.summary.cancelledBookings}`,
        '',
        'SERVICE BREAKDOWN',
        'Service,Count,Revenue',
        ...Object.entries(report.serviceBreakdown).map(([service, data]: [string, any]) => 
          `${service},${data.count},${formatCurrency(data.revenue)}`
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `z-report-${today}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating Z report:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 md:p-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Panel</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Overview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-md font-medium text-gray-800 mb-2">Overview</h3>
            {/* Overview Component */}
          </div>

          {/* User Management */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-md font-medium text-gray-800 mb-2">User Management</h3>
            {/* User Management Component */}
          </div>

          {/* Settings */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-md font-medium text-gray-800 mb-2">Settings</h3>
            {/* Settings Component */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
