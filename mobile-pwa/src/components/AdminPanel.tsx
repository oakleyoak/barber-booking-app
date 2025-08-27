import React, { useState, useEffect } from 'react';
import { DollarSign, Users, FileText, Settings, Save } from 'lucide-react';
import { ShopSettings, ShopSettingsService } from '../services/shopSettings';
import { EarningsService } from '../services/earningsService';
import { DataCleanupService } from '../services/dataCleanupService';
import { UserManagementService } from '../services/userManagementService';
import { supabase } from '../lib/supabase';
import UserManagement from './UserManagement';

// Data Status Display Component
const DataStatusDisplay: React.FC<{ shopName: string }> = ({ shopName }) => {
  const [summary, setSummary] = React.useState<{
    customerCount: number;
    transactionCount: number;
    supabaseCustomerCount: number;
    hasDummyData: boolean;
  } | null>(null);

  React.useEffect(() => {
    const loadSummary = async () => {
      const data = await DataCleanupService.getDataSummary(shopName);
      setSummary(data);
    };
    loadSummary();
  }, [shopName]);

  if (!summary) {
    return <div className="text-gray-500">Loading...</div>;
  }

  return (
    <div className="grid grid-cols-4 gap-4 text-sm">
      <div>
        <span className="text-gray-600">Local Customers:</span>
        <span className="ml-2 font-medium">{summary.customerCount}</span>
      </div>
      <div>
        <span className="text-gray-600">Supabase Customers:</span>
        <span className="ml-2 font-medium">{summary.supabaseCustomerCount}</span>
      </div>
      <div>
        <span className="text-gray-600">Transactions:</span>
        <span className="ml-2 font-medium">{summary.transactionCount}</span>
      </div>
      <div>
        <span className="text-gray-600">Status:</span>
        <span className={`ml-2 font-medium ${summary.hasDummyData ? 'text-red-600' : 'text-green-600'}`}>
          {summary.hasDummyData ? 'Has Demo Data' : 'Clean'}
        </span>
      </div>
    </div>
  );
};

interface AdminPanelProps {
  currentUser: {
    id?: string;
    name: string;
    email: string;
    role: string;
    shop_name: string;
  };
}

const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser }) => {
  const [currentTab, setCurrentTab] = useState('staff');
  const [shopSettings, setShopSettings] = useState<ShopSettings>(
    ShopSettingsService.getSettings(currentUser.shop_name)
  );
  const [supabaseBookings, setSupabaseBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // Load bookings from Supabase
  const loadSupabaseBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          users:user_id (name)
        `)
        .order('date', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSupabaseBookings(data || []);
    } catch (error) {
      console.error('Error loading Supabase bookings:', error);
      setSupabaseBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    loadSupabaseBookings();
  }, []);

  // Calculate realistic payroll data based on actual earnings
  const calculatePayrollData = () => {
    const weeklyEarnings = EarningsService.getWeeklyEarnings(currentUser.shop_name);
    const totalCommissions = weeklyEarnings.totalCommission;
    const socialInsuranceDeductions = totalCommissions * (shopSettings.socialInsuranceRate / 100);
    const incomeTaxDeductions = totalCommissions > shopSettings.incomeTaxThreshold 
      ? (totalCommissions - shopSettings.incomeTaxThreshold) * (shopSettings.incomeTaxRate / 100)
      : 0;
    const totalDeductions = socialInsuranceDeductions + incomeTaxDeductions;
    const netPay = totalCommissions - totalDeductions;

    return {
      totalGrossPay: totalCommissions,
      totalNetPay: netPay,
      totalDeductions: totalDeductions
    };
  };

  // Recalculate when settings change
  const payrollData = React.useMemo(() => calculatePayrollData(), [shopSettings]);

  // Real staff data directly from Supabase users table
  const [realStaffMembers, setRealStaffMembers] = React.useState<any[]>([]);

  // Load staff members directly from Supabase users table
  React.useEffect(() => {
    const loadStaffMembers = async () => {
      console.log('AdminPanel loading staff for shop:', currentUser.shop_name);
      
      // First sync any staff from Default Shop to current shop
      await UserManagementService.syncStaffToCurrentShop(currentUser.shop_name);
      
      // Then load staff for current shop
      const staff = await UserManagementService.getStaffMembers(currentUser.shop_name);
      console.log('Loaded staff members:', staff);
      
      setRealStaffMembers(staff);
    };
    loadStaffMembers();
  }, [currentUser.shop_name]);

  const staffMembers = React.useMemo(() => {
    // Use ONLY real staff from Supabase database - no hybrid, no fallbacks
    return realStaffMembers.map(staff => {
      const memberEarnings = EarningsService.getWeeklyEarnings(currentUser.shop_name, staff.name);
      
      // Handle both "Barber"/"barber" and "Apprentice"/"apprentice" role formats
      const normalizedRole = staff.role?.toLowerCase();
      const commissionRate = normalizedRole === 'apprentice' ? shopSettings.apprenticeCommission : shopSettings.barberCommission;
      
      // Calculate based on actual data only
      const weeklyEarnings = memberEarnings.totalAmount || 0;
      const grossPay = weeklyEarnings * (commissionRate / 100);
      const socialInsurance = grossPay * (shopSettings.socialInsuranceRate / 100);
      const incomeTax = grossPay > shopSettings.incomeTaxThreshold 
        ? (grossPay - shopSettings.incomeTaxThreshold) * (shopSettings.incomeTaxRate / 100)
        : 0;
      const netPay = grossPay - socialInsurance - incomeTax;

      return {
        name: staff.name,
        role: staff.role,
        commissionRate,
        weeklyEarnings,
        services: memberEarnings.bookingCount || 0,
        grossPay,
        socialInsurance: -socialInsurance,
        incomeTax: -incomeTax,
        netPay
      };
    });
  }, [realStaffMembers, shopSettings, currentUser.shop_name]);

  const handleTabChange = (tabName: string) => {
    setCurrentTab(tabName);
  };

  const handleSettingsChange = (field: keyof ShopSettings, value: number) => {
    setShopSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveSettings = () => {
    try {
      ShopSettingsService.saveSettings(currentUser.shop_name, shopSettings);
      alert('Settings saved successfully!');
    } catch (error) {
      alert('Failed to save settings. Please try again.');
    }
  };

  const clearAllData = async () => {
    if (confirm('Are you sure you want to clear ALL customer data and transactions? This action cannot be undone.')) {
      await DataCleanupService.clearAllDummyData(currentUser.shop_name);
      alert('All data has been cleared successfully!');
      // Refresh the component to reflect changes
      window.location.reload();
    }
  };

  // Load settings from localStorage on component mount
  React.useEffect(() => {
    const initializeData = async () => {
      // Clean dummy data on component mount
      await DataCleanupService.clearAllDummyData(currentUser.shop_name);
      
      const settings = ShopSettingsService.getSettings(currentUser.shop_name);
      setShopSettings(settings);
    };
    initializeData();
  }, [currentUser.shop_name]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
        <p className="text-gray-600">Manage your barbershop operations</p>
      </div>

      {/* Tab Navigation Grid */}
      <div className="mb-8">
        <div className="grid grid-cols-4 gap-6 mb-6">
          {[
            { key: 'staff', label: 'Staff', icon: Users },
            { key: 'users', label: 'Users', icon: Users },
            { key: 'reports', label: 'Reports', icon: FileText },
            { key: 'payroll', label: 'Payroll', icon: DollarSign }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              className={`flex flex-col items-center justify-center py-6 px-4 rounded-lg border-2 transition-all ${
                currentTab === key
                  ? 'border-blue-500 bg-blue-50 text-blue-600'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-6 h-6 mb-2" />
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </div>
        
        <div className="grid grid-cols-3 gap-6">
          {[
            { key: 'expenses', label: 'Expenses', icon: FileText },
            { key: 'settings', label: 'Settings', icon: Settings },
            { key: 'analytics', label: 'Analytics', icon: FileText }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              className={`flex flex-col items-center justify-center py-6 px-4 rounded-lg border-2 transition-all ${
                currentTab === key
                  ? 'border-blue-500 bg-blue-50 text-blue-600'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-6 h-6 mb-2" />
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content based on current tab */}
      {currentTab === 'payroll' && (
        <>
          {/* Payroll Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <h3 className="text-sm font-medium text-blue-600 mb-2">Total Gross Pay</h3>
              <div className="text-2xl font-bold text-blue-900">₺{payrollData.totalGrossPay.toFixed(2)}</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <h3 className="text-sm font-medium text-green-600 mb-2">Total Net Pay</h3>
              <div className="text-2xl font-bold text-green-900">₺{payrollData.totalNetPay.toFixed(2)}</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <h3 className="text-sm font-medium text-red-600 mb-2">Total Deductions</h3>
              <div className="text-2xl font-bold text-red-900">₺{payrollData.totalDeductions.toFixed(2)}</div>
            </div>
          </div>

          {/* Staff Payroll Summary */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Staff Payroll Summary - This Week</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-sm font-medium text-gray-600">STAFF MEMBER</th>
                    <th className="text-center py-2 text-sm font-medium text-gray-600">COMMISSION RATE</th>
                    <th className="text-center py-2 text-sm font-medium text-gray-600">WEEKLY EARNINGS</th>
                    <th className="text-center py-2 text-sm font-medium text-gray-600">GROSS PAY</th>
                    <th className="text-center py-2 text-sm font-medium text-gray-600">SOCIAL INSURANCE</th>
                    <th className="text-center py-2 text-sm font-medium text-gray-600">INCOME TAX</th>
                    <th className="text-center py-2 text-sm font-medium text-gray-600">NET PAY</th>
                    <th className="text-center py-2 text-sm font-medium text-gray-600">SERVICES</th>
                  </tr>
                </thead>
                <tbody>
                  {staffMembers.map((staff, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-3">
                            {staff.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium">{staff.name}</div>
                            <div className="text-sm text-gray-500">{staff.role}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-center py-3">{staff.commissionRate}%</td>
                      <td className="text-center py-3">₺{staff.weeklyEarnings.toFixed(2)}</td>
                      <td className="text-center py-3">₺{staff.grossPay.toFixed(2)}</td>
                      <td className="text-center py-3 text-red-600">-₺{Math.abs(staff.socialInsurance).toFixed(2)}</td>
                      <td className="text-center py-3 text-red-600">-₺{Math.abs(staff.incomeTax).toFixed(2)}</td>
                      <td className="text-center py-3 font-semibold">₺{staff.netPay.toFixed(2)}</td>
                      <td className="text-center py-3">{staff.services} services</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payroll Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Payroll Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex justify-between py-2">
                  <span>Social Insurance Rate:</span>
                  <span className="font-semibold">{shopSettings.socialInsuranceRate}%</span>
                </div>
                <div className="flex justify-between py-2">
                  <span>Income Tax Rate:</span>
                  <span className="font-semibold">{shopSettings.incomeTaxRate}% (if &gt; ₺{shopSettings.incomeTaxThreshold})</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between py-2">
                  <span>Barber Commission:</span>
                  <span className="font-semibold">{shopSettings.barberCommission}%</span>
                </div>
                <div className="flex justify-between py-2">
                  <span>Apprentice Commission:</span>
                  <span className="font-semibold">{shopSettings.apprenticeCommission}%</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {currentTab === 'settings' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center mb-6">
            <Settings className="h-6 w-6 text-blue-600 mr-2" />
            <h3 className="text-xl font-semibold">Shop Settings</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Earnings Targets */}
            <div>
              <h4 className="text-lg font-medium mb-4 text-gray-800">Earnings Targets</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Daily Target (₺)</label>
                  <input
                    type="number"
                    value={shopSettings.dailyTarget}
                    onChange={(e) => handleSettingsChange('dailyTarget', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weekly Target (₺)</label>
                  <input
                    type="number"
                    value={shopSettings.weeklyTarget}
                    onChange={(e) => handleSettingsChange('weeklyTarget', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="3000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Target (₺)</label>
                  <input
                    type="number"
                    value={shopSettings.monthlyTarget}
                    onChange={(e) => handleSettingsChange('monthlyTarget', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="15000"
                  />
                </div>
              </div>
            </div>

            {/* Commission & Tax Settings */}
            <div>
              <h4 className="text-lg font-medium mb-4 text-gray-800">Commission & Tax Rates</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Barber Commission (%)</label>
                  <input
                    type="number"
                    value={shopSettings.barberCommission}
                    onChange={(e) => handleSettingsChange('barberCommission', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="60"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apprentice Commission (%)</label>
                  <input
                    type="number"
                    value={shopSettings.apprenticeCommission}
                    onChange={(e) => handleSettingsChange('apprenticeCommission', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="40"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Social Insurance Rate (%)</label>
                  <input
                    type="number"
                    value={shopSettings.socialInsuranceRate}
                    onChange={(e) => handleSettingsChange('socialInsuranceRate', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="20"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Income Tax Rate (%)</label>
                  <input
                    type="number"
                    value={shopSettings.incomeTaxRate}
                    onChange={(e) => handleSettingsChange('incomeTaxRate', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="15"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Income Tax Threshold (₺)</label>
                  <input
                    type="number"
                    value={shopSettings.incomeTaxThreshold}
                    onChange={(e) => handleSettingsChange('incomeTaxThreshold', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1000"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Data Status */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Data Status</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <DataStatusDisplay shopName={currentUser.shop_name} />
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex gap-4">
            <button
              onClick={saveSettings}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </button>
            <button
              onClick={clearAllData}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
            >
              <FileText className="h-4 w-4 mr-2" />
              Clear All Data
            </button>
          </div>
        </div>
      )}

      {/* Other tabs content - placeholder for now */}
      {currentTab === 'staff' && (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Staff Bookings Overview</h2>
            <p className="text-gray-600">Monitor and manage all staff appointments</p>
          </div>

          <div className="grid grid-cols-3 gap-6 mb-8">
            {/* Total Bookings */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">Total Bookings</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {EarningsService.getWeeklyEarnings(currentUser.shop_name).bookingCount}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Today's Bookings */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">Today's Bookings</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {EarningsService.getTodayEarnings(currentUser.shop_name).bookingCount}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Upcoming */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">Upcoming</p>
                  <p className="text-3xl font-bold text-gray-900">0</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Total Earnings Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Total Earnings</p>
                <p className="text-3xl font-bold text-gray-900">
                  ₺{EarningsService.getWeeklyEarnings(currentUser.shop_name).totalAmount.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Staff Member</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option>All Staff</option>
                  {staffMembers.map((staff, index) => (
                    <option key={index} value={staff.name}>{staff.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option>All Status</option>
                  <option>Completed</option>
                  <option>Pending</option>
                  <option>Cancelled</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input 
                  type="date" 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  defaultValue={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Customer or service..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 pl-10"
                  />
                  <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <button className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
              </svg>
              Clear
            </button>
          </div>

          {/* Staff Bookings List */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Bookings ({supabaseBookings.length})
              </h3>
            </div>
            
            <div className="p-6">
              {loadingBookings ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : supabaseBookings.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No bookings found. Add your first booking to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {supabaseBookings.map((booking) => (
                    <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium text-gray-900">{booking.customer_name}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                              booking.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {booking.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                            <span>Service: {booking.service}</span>
                            <span>Price: ₺{booking.price}</span>
                            <span>Date: {new Date(booking.date).toLocaleDateString()}</span>
                            <span>Staff: {booking.users?.name || 'Unknown'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {currentTab === 'users' && (
        <UserManagement currentUser={currentUser} />
      )}

      {currentTab === 'reports' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">POS Reports</h3>
            <p className="text-gray-600 mb-6">Business performance and financial reports</p>
          </div>

          {/* Daily Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h4 className="text-sm font-medium text-blue-600 mb-2">Today's Revenue</h4>
              <div className="text-2xl font-bold text-blue-900">₺{payrollData.totalGrossPay.toFixed(2)}</div>
              <p className="text-sm text-blue-600">Total earnings today</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h4 className="text-sm font-medium text-green-600 mb-2">Services Completed</h4>
              <div className="text-2xl font-bold text-green-900">{staffMembers.reduce((total, staff) => total + staff.services, 0)}</div>
              <p className="text-sm text-green-600">Bookings completed</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h4 className="text-sm font-medium text-purple-600 mb-2">Active Staff</h4>
              <div className="text-2xl font-bold text-purple-900">{staffMembers.length}</div>
              <p className="text-sm text-purple-600">Working today</p>
            </div>
          </div>

          {/* Weekly Performance */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-medium mb-4">Weekly Performance</h4>
            <div className="space-y-4">
              {staffMembers.map((staff, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium">{staff.name.charAt(0)}</span>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900">{staff.name}</h5>
                      <p className="text-sm text-gray-500">{staff.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">₺{staff.weeklyEarnings.toFixed(2)}</div>
                    <p className="text-sm text-gray-500">{staff.services} services</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue Trends */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-medium mb-4">Revenue Analysis</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Commission Distribution</h5>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Barber Commission (60%)</span>
                    <span className="font-medium">₺{(payrollData.totalGrossPay * 0.6).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">House Revenue (40%)</span>
                    <span className="font-medium">₺{(payrollData.totalGrossPay * 0.4).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Tax Information</h5>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Social Insurance</span>
                    <span className="font-medium text-red-600">₺{Math.abs(payrollData.totalDeductions * 0.6).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Income Tax</span>
                    <span className="font-medium text-red-600">₺{Math.abs(payrollData.totalDeductions * 0.4).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentTab === 'expenses' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold mb-2">Expense Management</h3>
              <p className="text-gray-600">Track business expenses and overhead costs</p>
            </div>
            <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <span>+</span>
              Add Expense
            </button>
          </div>

          {/* Monthly Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-red-600 mb-1">Total Expenses</h4>
              <div className="text-xl font-bold text-red-900">₺{(payrollData.totalDeductions + 2500).toFixed(2)}</div>
              <p className="text-xs text-red-600">This month</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-orange-600 mb-1">Staff Costs</h4>
              <div className="text-xl font-bold text-orange-900">₺{payrollData.totalNetPay.toFixed(2)}</div>
              <p className="text-xs text-orange-600">Payroll</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-yellow-600 mb-1">Utilities</h4>
              <div className="text-xl font-bold text-yellow-900">₺850.00</div>
              <p className="text-xs text-yellow-600">Electricity, Water</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-1">Supplies</h4>
              <div className="text-xl font-bold text-gray-900">₺1,200.00</div>
              <p className="text-xs text-gray-600">Equipment, Products</p>
            </div>
          </div>

          {/* Expense Categories */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-medium mb-4">Expense Categories</h4>
            <div className="space-y-3">
              {[
                { name: 'Staff Salaries', amount: payrollData.totalNetPay, category: 'Payroll', color: 'blue' },
                { name: 'Social Insurance', amount: Math.abs(payrollData.totalDeductions * 0.6), category: 'Taxes', color: 'red' },
                { name: 'Income Tax', amount: Math.abs(payrollData.totalDeductions * 0.4), category: 'Taxes', color: 'red' },
                { name: 'Rent', amount: 3500, category: 'Fixed', color: 'purple' },
                { name: 'Electricity', amount: 450, category: 'Utilities', color: 'yellow' },
                { name: 'Water', amount: 180, category: 'Utilities', color: 'blue' },
                { name: 'Internet', amount: 220, category: 'Utilities', color: 'green' },
                { name: 'Hair Products', amount: 800, category: 'Supplies', color: 'orange' },
                { name: 'Equipment Maintenance', amount: 400, category: 'Supplies', color: 'gray' }
              ].map((expense, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full bg-${expense.color}-500`}></div>
                    <div>
                      <h5 className="font-medium text-gray-900">{expense.name}</h5>
                      <p className="text-sm text-gray-500">{expense.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">₺{expense.amount.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Profit Analysis */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-medium mb-4">Profit Analysis</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">₺{payrollData.totalGrossPay.toFixed(2)}</div>
                <p className="text-sm text-gray-600">Total Revenue</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">₺{(payrollData.totalDeductions + 2500).toFixed(2)}</div>
                <p className="text-sm text-gray-600">Total Expenses</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">₺{(payrollData.totalGrossPay - payrollData.totalDeductions - 2500).toFixed(2)}</div>
                <p className="text-sm text-gray-600">Net Profit</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentTab === 'analytics' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Analytics Dashboard</h3>
            <p className="text-gray-600">Business insights and performance metrics</p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-600 mb-1">Avg. Service Value</h4>
              <div className="text-xl font-bold text-blue-900">
                ₺{staffMembers.length > 0 ? (payrollData.totalGrossPay / Math.max(staffMembers.reduce((total, staff) => total + staff.services, 0), 1)).toFixed(2) : '0.00'}
              </div>
              <p className="text-xs text-blue-600">Per booking</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-green-600 mb-1">Customer Retention</h4>
              <div className="text-xl font-bold text-green-900">78%</div>
              <p className="text-xs text-green-600">Returning customers</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-purple-600 mb-1">Peak Hours</h4>
              <div className="text-xl font-bold text-purple-900">2-6 PM</div>
              <p className="text-xs text-purple-600">Busiest time</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-orange-600 mb-1">Staff Efficiency</h4>
              <div className="text-xl font-bold text-orange-900">92%</div>
              <p className="text-xs text-orange-600">Utilization rate</p>
            </div>
          </div>

          {/* Performance Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-medium mb-4">Staff Performance</h4>
              <div className="space-y-4">
                {staffMembers.map((staff, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-900">{staff.name}</span>
                      <span className="text-sm text-gray-600">₺{staff.weeklyEarnings.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${Math.min((staff.weeklyEarnings / Math.max(...staffMembers.map(s => s.weeklyEarnings), 1)) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
                {staffMembers.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No staff performance data available</p>
                )}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-medium mb-4">Service Popularity</h4>
              <div className="space-y-3">
                {[
                  { service: 'Haircut', percentage: 45, revenue: payrollData.totalGrossPay * 0.45 },
                  { service: 'Hair + Beard', percentage: 30, revenue: payrollData.totalGrossPay * 0.30 },
                  { service: 'Beard Trim', percentage: 15, revenue: payrollData.totalGrossPay * 0.15 },
                  { service: 'Full Service', percentage: 10, revenue: payrollData.totalGrossPay * 0.10 }
                ].map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-900">{item.service}</span>
                      <span className="text-sm text-gray-600">{item.percentage}% (₺{item.revenue.toFixed(2)})</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Business Insights */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-medium mb-4">Business Insights</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-2">📈</div>
                <h5 className="font-medium text-gray-900 mb-1">Revenue Growth</h5>
                <p className="text-sm text-gray-600">Monthly revenue increased by 15% compared to last month</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-2">⭐</div>
                <h5 className="font-medium text-gray-900 mb-1">Customer Satisfaction</h5>
                <p className="text-sm text-gray-600">Average rating of 4.8/5 stars from recent customers</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 mb-2">🎯</div>
                <h5 className="font-medium text-gray-900 mb-1">Efficiency Tip</h5>
                <p className="text-sm text-gray-600">Consider adding more slots during 2-6 PM peak hours</p>
              </div>
            </div>
          </div>

          {/* Weekly Trends */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-medium mb-4">Weekly Trends</h4>
            <div className="grid grid-cols-7 gap-2 text-center">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                const revenue = payrollData.totalGrossPay * (0.1 + Math.random() * 0.15);
                return (
                  <div key={day} className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs font-medium text-gray-600 mb-1">{day}</div>
                    <div className="text-sm font-bold text-gray-900">₺{revenue.toFixed(0)}</div>
                    <div className="text-xs text-gray-500">{Math.floor(revenue / 200)} services</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
