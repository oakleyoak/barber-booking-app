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

// Define types for bookings and reports
interface Booking {
  time: string;
  service: string;
  customer_name: string;
  price: number;
  status: string;
  user_id?: string; // Make user_id optional
}

interface Report {
  date: string;
  reportType: string;
  generatedAt: string;
  summary: {
    totalTransactions: number;
    totalRevenue: number;
    completedBookings: number;
    cancelledBookings: number;
    grossRevenue?: number;
    totalExpenses?: number;
    netRevenue?: number;
    vatRate?: number;
    vatAmount?: number;
  };
  transactions?: Array<{
    time: string;
    service: string;
    customer: string;
    amount: number;
    status: string;
    barber: string;
  }>;
  serviceBreakdown?: Record<string, { count: number; revenue: number }>;
  barberBreakdown?: Record<string, { count: number; revenue: number }>;
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
      const bookings: Booking[] = await bookingService.getBookingsByDate(today);

      const report: Report = {
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
          barber: b.user_id || 'N/A' // Default to 'N/A' if undefined
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
        ...report.transactions!.map(t => 
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
      const bookings: Booking[] = await bookingService.getBookingsByDate(today);
      const expenses: number = await expenseService.getDailyExpenses(today);

      const grossRevenue = bookings.reduce((sum, b) => sum + b.price, 0);
      const report: Report = {
        date: today,
        reportType: 'Z Report (End of Day)',
        generatedAt: new Date().toISOString(),
        summary: {
          totalTransactions: bookings.length,
          totalRevenue: grossRevenue, // Add totalRevenue
          grossRevenue,
          totalExpenses: expenses,
          netRevenue: grossRevenue - expenses,
          completedBookings: bookings.filter(b => b.status === 'completed').length,
          cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
          vatRate: 18, // TRNC VAT rate
          vatAmount: (grossRevenue * 0.18) / 1.18
        },
        serviceBreakdown: {},
        barberBreakdown: {}
      };

      // Calculate service breakdown
      bookings.forEach(booking => {
        if (!report.serviceBreakdown![booking.service]) {
          report.serviceBreakdown![booking.service] = { count: 0, revenue: 0 };
        }
        report.serviceBreakdown![booking.service].count++;
        report.serviceBreakdown![booking.service].revenue += booking.price;
      });

      const csvContent = [
        'Z REPORT - END OF DAY',
        `Date: ${report.date}`,
        `Generated: ${report.generatedAt}`,
        '',
        'SUMMARY',
        `Total Transactions,${report.summary.totalTransactions}`,
        `Gross Revenue,${formatCurrency(report.summary.grossRevenue ?? 0)}`,
        `Total Expenses,${formatCurrency(report.summary.totalExpenses ?? 0)}`,
        `Net Revenue,${formatCurrency(report.summary.netRevenue ?? 0)}`,
        `VAT Amount (18%),${formatCurrency(report.summary.vatAmount ?? 0)}`
      ].join('\n');

      console.log(csvContent);
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
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <Settings className="mr-2 h-5 w-5" />
          Admin Panel
        </h2>
        <p className="text-gray-600 text-sm">Manage users, settings, and reports</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'settings', label: 'Settings', icon: Settings },
          { id: 'reports', label: 'Reports', icon: FileText }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id)}
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="h-4 w-4 mr-1" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {currentTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-500 text-white p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Today's Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.dailyRevenue)}</p>
                </div>
                <Calendar className="h-6 w-6 text-blue-200" />
              </div>
            </div>
            <div className="bg-green-500 text-white p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Weekly Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.weeklyRevenue)}</p>
                </div>
                <TrendingUp className="h-6 w-6 text-green-200" />
              </div>
            </div>
            <div className="bg-purple-500 text-white p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Monthly Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue)}</p>
                </div>
                <DollarSign className="h-6 w-6 text-purple-200" />
              </div>
            </div>
            <div className="bg-indigo-500 text-white p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm">Total Customers</p>
                  <p className="text-2xl font-bold">{stats.totalCustomers}</p>
                </div>
                <Users className="h-6 w-6 text-indigo-200" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {currentTab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">User Management</h3>
            <button
              onClick={() => setShowUserModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </button>
          </div>
          
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Role</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Commission</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map(user => (
                  <tr key={user.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{user.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'Owner' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.commission_rate}%</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setEditingUser(user);
                            setNewUser({
                              name: user.name,
                              email: user.email,
                              role: user.role,
                              commission_rate: user.commission_rate || 50,
                              target_weekly: user.target_weekly || 2000,
                              target_monthly: user.target_monthly || 8000
                            });
                            setShowUserModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {user.id !== currentUser.id && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {currentTab === 'settings' && shopSettings && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Shop Settings</h3>
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name</label>
                <input
                  type="text"
                  value={shopSettings.shop_name}
                  onChange={(e) => setShopSettings({...shopSettings, shop_name: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Commission Rate (%)</label>
                <input
                  type="number"
                  value={shopSettings.default_commission_rate}
                  onChange={(e) => setShopSettings({...shopSettings, default_commission_rate: parseInt(e.target.value)})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opening Time</label>
                <input
                  type="time"
                  value={shopSettings.opening_time}
                  onChange={(e) => setShopSettings({...shopSettings, opening_time: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Closing Time</label>
                <input
                  type="time"
                  value={shopSettings.closing_time}
                  onChange={(e) => setShopSettings({...shopSettings, closing_time: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <button
              onClick={handleSaveSettings}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </button>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {currentTab === 'reports' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">POS Reports (TRNC Compliant)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center mb-4">
                <Receipt className="h-6 w-6 text-blue-600 mr-2" />
                <h4 className="text-lg font-medium">X Report</h4>
              </div>
              <p className="text-gray-600 mb-4">Daily summary report for monitoring purposes</p>
              <button
                onClick={exportXReport}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Generate X Report
              </button>
            </div>
            
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center mb-4">
                <Printer className="h-6 w-6 text-green-600 mr-2" />
                <h4 className="text-lg font-medium">Z Report</h4>
              </div>
              <p className="text-gray-600 mb-4">End of day report with VAT calculations</p>
              <button
                onClick={exportZReport}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Generate Z Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingUser ? 'Edit User' : 'Add New User'}
            </h3>
            <form onSubmit={handleUserSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Barber">Barber</option>
                  <option value="Owner">Owner</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newUser.commission_rate}
                  onChange={(e) => setNewUser({...newUser, commission_rate: parseInt(e.target.value)})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weekly Target (₺)</label>
                  <input
                    type="number"
                    value={newUser.target_weekly}
                    onChange={(e) => setNewUser({...newUser, target_weekly: parseInt(e.target.value)})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Target (₺)</label>
                  <input
                    type="number"
                    value={newUser.target_monthly}
                    onChange={(e) => setNewUser({...newUser, target_monthly: parseInt(e.target.value)})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  {editingUser ? 'Update' : 'Create'} User
                </button>
                <button
                  type="button"
                  onClick={() => {
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
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
