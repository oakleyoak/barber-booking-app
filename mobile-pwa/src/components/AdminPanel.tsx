import React, { useState, useEffect } from 'react';
import { useModal } from './ui/ModalProvider';
import { FaChartBar, FaUsers, FaCogs, FaFileAlt, FaPlus, FaEdit, FaTrash, FaSave, FaDownload, FaTimes } from 'react-icons/fa';
import { userManagementService, shopSettingsService } from '../services/managementServices';
import { ShopSettingsService } from '../services/shopSettings';
import { bookingService, customerService, expenseService } from '../services/completeDatabase';

const AdminPanel = ({ currentUser }: { currentUser: { id: string; shop_name?: string; role?: string } }) => {
  const modal = useModal();
  const [currentTab, setCurrentTab] = useState<'overview' | 'users' | 'settings' | 'reports'>('overview');
  const [shopSettings, setShopSettings] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalCustomers: 0,
    monthlyRevenue: 0,
    weeklyRevenue: 0,
    dailyRevenue: 0
  });
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newUser, setNewUser] = useState<{
    name: string;
    email: string;
    role: 'Owner' | 'Manager' | 'Barber' | 'Apprentice';
    commission_rate: number;
    target_weekly: number;
    target_monthly: number;
  }>({
    name: '',
    email: '',
    role: 'Barber',
    commission_rate: 60, // Default to barber commission
    target_weekly: 2000,
    target_monthly: 8000
  });

  useEffect(() => {
    loadAdminData();
  }, [currentUser.id]);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      // Shop name is always 'Edge & Co'
      const shopName = 'Edge & Co';
      // Try to load shop settings with better error handling
      try {
        const settings = await ShopSettingsService.getSettings(shopName);
        setShopSettings(settings);
      } catch (settingsError) {
        console.error('AdminPanel - Shop settings error:', settingsError);
        // Use a default settings object if shop_settings table doesn't exist
        setShopSettings({
          opening_time: '09:00',
          closing_time: '20:00',
          daily_target: 1500,
          weekly_target: 9000,
          monthly_target: 45000,
          social_insurance_rate: 20,
          income_tax_rate: 15,
          income_tax_threshold: 3000
        });
      }

      // Try to load users
      try {
        const allUsers = await userManagementService.getAllUsers();
        setUsers(allUsers);
      } catch (usersError) {
        console.error('AdminPanel - Users loading error:', usersError);
        setUsers([]);
      }

      // Load stats with better error handling
      try {
        const [customers, monthlyEarnings, weeklyEarnings, dailyEarnings] = await Promise.all([
          customerService.getCustomers(),
          bookingService.getMonthlyEarnings(),
          bookingService.getWeeklyEarnings(),
          bookingService.getDailyEarnings(new Date().toISOString().split('T')[0])
        ]);

        const totalBookings = await bookingService.getBookings();

        setStats({
          totalBookings: totalBookings.length,
          totalCustomers: customers.length,
          monthlyRevenue: monthlyEarnings.totalAmount,
          weeklyRevenue: weeklyEarnings.totalAmount,
          dailyRevenue: dailyEarnings.totalAmount
        });
      } catch (statsError) {
        console.error('AdminPanel - Stats loading error:', statsError);
        setStats({
          totalBookings: 0,
          totalCustomers: 0,
          monthlyRevenue: 0,
          weeklyRevenue: 0,
          dailyRevenue: 0
        });
      }
    } catch (error) {
      console.error('AdminPanel - General error loading admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!shopSettings) return;
    try {
      await ShopSettingsService.saveSettings('Edge & Co', shopSettings);
      modal.notify('Settings saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      modal.notify('Failed to save settings', 'error');
    }
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const updated = await userManagementService.updateUser(editingUser.id, newUser);
        if (updated) {
          setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? updated : u)));
        }
      } else {
        const created = await userManagementService.createUser({ ...newUser, shop_name: 'Edge & Co', password: 'changeme123' });
        if (created) {
          setUsers((prev) => [...prev, created]);
        }
      }
      setShowUserModal(false);
      setEditingUser(null);
      setNewUser({ name: '', email: '', role: 'Barber', commission_rate: 50, target_weekly: 2000, target_monthly: 8000 });
    } catch (error) {
      console.error('Error saving user:', error);
      modal.notify('Failed to save user', 'error');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser.id) {
      modal.notify('Cannot delete yourself!', 'info');
      return;
    }
    const ok = await modal.confirm('Are you sure you want to delete this user?');
    if (!ok) return;
    const success = await userManagementService.deleteUser(userId);
    if (success) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    }
  };

  const exportReport = async (type: 'X' | 'Z') => {

    try {
      const today = new Date().toISOString().split('T')[0];
      const bookings = await bookingService.getBookingsByDate(today);
      const report = {
        date: today,
        type,
        bookings
      };
      // TODO: Implement actual export logic here (e.g., download as CSV or PDF)
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

          // TODO: Implement actual export logic here (e.g., download as CSV or PDF)
  // Restrict admin panel to Owner only
  if (currentUser.role !== 'Owner') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">Access denied. Admin panel is only available to the Owner.</div>
      </div>
    );
  }
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
        <p className="text-gray-600 text-sm sm:text-base">Manage your barbershop operations</p>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-4 sm:mb-6">
        <nav className="flex border-b border-gray-200 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: FaChartBar },
            { id: 'users', label: 'Users', icon: FaUsers },
            { id: 'settings', label: 'Settings', icon: FaCogs },
            { id: 'reports', label: 'Reports', icon: FaFileAlt }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setCurrentTab(id as any)}
              className={`flex items-center px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap ${
                currentTab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="mr-1 sm:mr-2 text-sm sm:text-base" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6">
        {/* Overview Tab */}
        {currentTab === 'overview' && (
          <div>
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Dashboard Overview</h2>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
              <div className="bg-blue-50 p-3 sm:p-6 rounded-lg">
                <h3 className="text-xs sm:text-sm font-medium text-blue-600 mb-1 sm:mb-2">Total Bookings</h3>
                <p className="text-xl sm:text-3xl font-bold text-blue-900">{stats.totalBookings}</p>
              </div>
              <div className="bg-green-50 p-3 sm:p-6 rounded-lg">
                <h3 className="text-xs sm:text-sm font-medium text-green-600 mb-1 sm:mb-2">Total Customers</h3>
                <p className="text-xl sm:text-3xl font-bold text-green-900">{stats.totalCustomers}</p>
              </div>
              <div className="bg-purple-50 p-3 sm:p-6 rounded-lg">
                <h3 className="text-xs sm:text-sm font-medium text-purple-600 mb-1 sm:mb-2">Daily Revenue</h3>
                <p className="text-xl sm:text-3xl font-bold text-purple-900">₺{stats.dailyRevenue}</p>
              </div>
              <div className="bg-orange-50 p-3 sm:p-6 rounded-lg">
                <h3 className="text-xs sm:text-sm font-medium text-orange-600 mb-1 sm:mb-2">Monthly Revenue</h3>
                <p className="text-xl sm:text-3xl font-bold text-orange-900">₺{stats.monthlyRevenue}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-50 p-3 sm:p-6 rounded-lg">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Quick Actions</h3>
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4">
                <button
                  onClick={() => setCurrentTab('users')}
                  className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center text-sm sm:text-base"
                >
                  <FaUsers className="mr-1 sm:mr-2" />
                  Manage Users
                </button>
                <button
                  onClick={() => setCurrentTab('settings')}
                  className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center text-sm sm:text-base"
                >
                  <FaCogs className="mr-1 sm:mr-2" />
                  Shop Settings
                </button>
                <button
                  onClick={() => exportReport('X')}
                  className="bg-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center justify-center text-sm sm:text-base"
                >
                  <FaDownload className="mr-1 sm:mr-2" />
                  Export Report
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {currentTab === 'users' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3">
              <h2 className="text-xl sm:text-2xl font-bold">User Management</h2>
              <button
                onClick={() => {
                  setShowUserModal(true);
                  setEditingUser(null);
                  setNewUser({ name: '', email: '', role: 'Barber', commission_rate: 60, target_weekly: 2000, target_monthly: 8000 });
                }}
                className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center text-sm sm:text-base"
              >
                <FaPlus className="mr-1 sm:mr-2" />
                Add User
              </button>
            </div>

            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <div className="min-w-full inline-block align-middle">
                <table className="min-w-full bg-white">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Email</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Shop</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-xs text-gray-500 sm:hidden">{user.email}</div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">{user.email}</td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role}</td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">{user.shop_name}</td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              title="Edit user"
                              onClick={() => {
                                setEditingUser(user);
                                setNewUser(user);
                                setShowUserModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900 p-1"
                            >
                              <FaEdit />
                            </button>
                            <button
                              title="Delete user"
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-900 p-1"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {currentTab === 'settings' && shopSettings && (
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3">
              <h2 className="text-xl sm:text-2xl font-bold">Shop Settings</h2>
              <button
                title="Save settings"
                onClick={handleSaveSettings}
                className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center text-sm sm:text-base"
              >
                <FaSave className="mr-1 sm:mr-2" />
                Save Settings
              </button>
            </div>

            <div className="space-y-6">


              {/* Operating Hours */}
              <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Operating Hours</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Opening Time</label>
                    <input placeholder="Enter opening time" title="Opening Time"
                      type="time"
                      value={shopSettings.opening_time}
                      onChange={(e) => setShopSettings({ ...shopSettings, opening_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Closing Time</label>
                    <input placeholder="Enter closing time" title="Closing Time"
                      type="time"
                      value={shopSettings.closing_time}
                      onChange={(e) => setShopSettings({ ...shopSettings, closing_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                    />
                  </div>
                </div>
              </div>

              {/* Revenue Targets */}
              <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Revenue Targets</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Daily Target (₺)</label>
                    <input placeholder="Enter daily target" title="Daily Target"
                      type="number"
                      value={shopSettings.daily_target}
                      onChange={(e) => setShopSettings({ ...shopSettings, daily_target: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Weekly Target (₺)</label>
                    <input placeholder="Enter weekly target" title="Weekly Target"
                      type="number"
                      value={shopSettings.weekly_target}
                      onChange={(e) => setShopSettings({ ...shopSettings, weekly_target: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Target (₺)</label>
                    <input placeholder="Enter monthly target" title="Monthly Target"
                      type="number"
                      value={shopSettings.monthly_target}
                      onChange={(e) => setShopSettings({ ...shopSettings, monthly_target: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Commission Rates (%)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Barber Commission (%)</label>
                    <input placeholder="Enter barber commission" title="Barber Commission"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={shopSettings.barber_commission}
                      onChange={(e) => setShopSettings({ ...shopSettings, barber_commission: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Manager Commission (%)</label>
                    <input placeholder="Enter manager commission" title="Manager Commission"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={shopSettings.manager_commission || 70}
                      onChange={(e) => setShopSettings({ ...shopSettings, manager_commission: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Apprentice Commission (%)</label>
                    <input placeholder="Enter apprentice commission" title="Apprentice Commission"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={shopSettings.apprentice_commission}
                      onChange={(e) => setShopSettings({ ...shopSettings, apprentice_commission: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                    />
                  </div>
                </div>
              </div>

              {/* Tax Settings */}
              <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Tax Settings</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Social Insurance Rate (%)</label>
                    <input placeholder="Enter social insurance rate" title="Social Insurance Rate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={shopSettings.social_insurance_rate}
                      onChange={(e) => setShopSettings({ ...shopSettings, social_insurance_rate: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Income Tax Rate (%)</label>
                    <input placeholder="Enter income tax rate" title="Income Tax Rate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={shopSettings.income_tax_rate}
                      onChange={(e) => setShopSettings({ ...shopSettings, income_tax_rate: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Income Tax Threshold (₺)</label>
                    <input placeholder="Enter income tax threshold" title="Income Tax Threshold"
                      type="number"
                      step="0.01"
                      min="0"
                      value={shopSettings.income_tax_threshold}
                      onChange={(e) => setShopSettings({ ...shopSettings, income_tax_threshold: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {currentTab === 'reports' && (
          <div>
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Reports & Analytics</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Daily Reports</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => exportReport('X')}
                    className="w-full bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center text-sm sm:text-base"
                  >
                    <FaDownload className="mr-1 sm:mr-2" />
                    Export X Report
                  </button>
                  <button
                    onClick={() => exportReport('Z')}
                    className="w-full bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center text-sm sm:text-base"
                  >
                    <FaDownload className="mr-1 sm:mr-2" />
                    Export Z Report
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Revenue Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm sm:text-base">
                    <span>Today:</span>
                    <span className="font-semibold">₺{stats.dailyRevenue}</span>
                  </div>
                  <div className="flex justify-between text-sm sm:text-base">
                    <span>This Week:</span>
                    <span className="font-semibold">₺{stats.weeklyRevenue}</span>
                  </div>
                  <div className="flex justify-between text-sm sm:text-base">
                    <span>This Month:</span>
                    <span className="font-semibold">₺{stats.monthlyRevenue}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-sm sm:max-w-md mx-2 sm:mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base sm:text-lg font-semibold">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h3>
              <button
                title="Close modal"
                onClick={() => setShowUserModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleUserSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input placeholder="Enter name" title="Name"
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input placeholder="Enter email" title="Email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select title="Role"
                  value={newUser.role}
                  onChange={(e) => {
                    const selectedRole = e.target.value as 'Owner' | 'Manager' | 'Barber' | 'Apprentice';
                    let defaultCommission = 60; // Default barber commission
                    
                    if (selectedRole === 'Owner') {
                      defaultCommission = 100;
                    } else if (selectedRole === 'Manager') {
                      defaultCommission = 70;
                    } else if (selectedRole === 'Apprentice') {
                      defaultCommission = 40;
                    }
                    
                    setNewUser({ ...newUser, role: selectedRole, commission_rate: defaultCommission });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                >
                  <option value="Owner">Owner</option>
                  <option value="Manager">Manager</option>
                  <option value="Barber">Barber</option>
                  <option value="Apprentice">Apprentice</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate (%)</label>
                <input title="Commission Rate"
                  type="number"
                  value={newUser.commission_rate}
                  onChange={(e) => setNewUser({ ...newUser, commission_rate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>



              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm sm:text-base"
                >
                  {editingUser ? 'Update' : 'Create'}
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
