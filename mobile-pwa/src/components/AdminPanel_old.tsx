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
  TrendingUp
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
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalCustomers: 0,
    monthlyRevenue: 0,
    weeklyRevenue: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, [currentUser.id]);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      // Load shop settings
      const settings = await shopSettingsService.getSettings();
      setShopSettings(settings);

      // Load statistics
      const [customers, monthlyEarnings, weeklyEarnings] = await Promise.all([
        customerService.getAllCustomers(),
        bookingService.getMonthlyEarnings(),
        bookingService.getWeeklyEarnings()
      ]);

      const bookingStats = await bookingService.getBookingStats();

      setStats({
        totalBookings: bookingStats.totalBookings,
        totalCustomers: customers.length,
        monthlyRevenue: monthlyEarnings.totalAmount,
        weeklyRevenue: weeklyEarnings.totalAmount
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

  const exportBusinessReport = async () => {
    try {
      const monthStart = new Date();
      monthStart.setDate(1);
      
      const [bookings, customers, expenses] = await Promise.all([
        bookingService.getBookingsByDateRange(
          monthStart.toISOString().split('T')[0],
          new Date().toISOString().split('T')[0]
        ),
        customerService.getAllCustomers(),
        expenseService.getAllExpenses()
      ]);

      const csvContent = [
        // Summary
        ['BUSINESS REPORT - ' + new Date().toLocaleDateString()],
        [''],
        ['SUMMARY'],
        ['Total Customers', customers.length],
        ['Total Monthly Bookings', bookings.length],
        ['Monthly Revenue', '£' + bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + b.price, 0).toFixed(2)],
        [''],
        ['BOOKINGS'],
        ['Date', 'Customer', 'Service', 'Price', 'Status'],
        ...bookings.map(booking => [
          booking.date,
          booking.customer_name,
          booking.service,
          '£' + booking.price,
          booking.status
        ]),
        [''],
        ['EXPENSES'],
        ['Date', 'Description', 'Category', 'Amount'],
        ...expenses.map(expense => [
          expense.date,
          expense.description,
          expense.category,
          '£' + expense.amount
        ])
      ].map(row => Array.isArray(row) ? row.join(',') : row).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `business-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Failed to export report');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'reports', label: 'Reports', icon: FileText }
  ];

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            Admin Panel
          </h2>
          <p className="text-gray-600 text-sm">Manage shop settings and view analytics</p>
        </div>
        <button
          onClick={exportBusinessReport}
          className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center text-sm"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`flex items-center whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  currentTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {currentTab === 'overview' && (
        <div className="space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Customers</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalCustomers}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-green-600">{stats.totalBookings}</p>
                </div>
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Weekly Revenue</p>
                  <p className="text-2xl font-bold text-purple-600">£{stats.weeklyRevenue.toFixed(0)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-yellow-600">£{stats.monthlyRevenue.toFixed(0)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => setCurrentTab('settings')}
                className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Settings className="h-5 w-5 text-blue-600 mr-3" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">Shop Settings</p>
                  <p className="text-sm text-gray-600">Configure shop hours and policies</p>
                </div>
              </button>

              <button
                onClick={exportBusinessReport}
                className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
                <Download className="h-5 w-5 text-green-600 mr-3" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">Export Report</p>
                  <p className="text-sm text-gray-600">Download monthly business report</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {currentTab === 'settings' && shopSettings && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Shop Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shop Name
                </label>
                <input
                  type="text"
                  value={shopSettings.shop_name}
                  onChange={(e) => setShopSettings(prev => prev ? {...prev, shop_name: e.target.value} : null)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Opening Time
                  </label>
                  <input
                    type="time"
                    value={shopSettings.opening_time}
                    onChange={(e) => setShopSettings(prev => prev ? {...prev, opening_time: e.target.value} : null)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Closing Time
                  </label>
                  <input
                    type="time"
                    value={shopSettings.closing_time}
                    onChange={(e) => setShopSettings(prev => prev ? {...prev, closing_time: e.target.value} : null)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Closed Days
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                    <label key={day} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={shopSettings.closed_days.includes(day)}
                        onChange={(e) => {
                          const updatedDays = e.target.checked
                            ? [...shopSettings.closed_days, day]
                            : shopSettings.closed_days.filter(d => d !== day);
                          setShopSettings(prev => prev ? {...prev, closed_days: updatedDays} : null);
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{day}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Barber Commission Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={(shopSettings.barber_commission || 0.4) * 100}
                    onChange={(e) => setShopSettings(prev => prev ? {...prev, barber_commission: Number(e.target.value) / 100} : null)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Target (£)
                  </label>
                  <input
                    type="number"
                    value={shopSettings.monthly_target || 12000}
                    onChange={(e) => setShopSettings(prev => prev ? {...prev, monthly_target: Number(e.target.value)} : null)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleSaveSettings}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentTab === 'reports' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Reports</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Monthly Summary</h4>
                <p className="text-sm text-gray-600 mb-4">Download complete monthly business report including bookings, revenue, and customer data.</p>
                <button
                  onClick={exportBusinessReport}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Monthly Report
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Performance Metrics</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>This Month:</span>
                    <span className="font-medium">£{stats.monthlyRevenue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>This Week:</span>
                    <span className="font-medium">£{stats.weeklyRevenue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customers:</span>
                    <span className="font-medium">{stats.totalCustomers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bookings:</span>
                    <span className="font-medium">{stats.totalBookings}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
