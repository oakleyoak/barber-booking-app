import React, { useState } from 'react';
import { DollarSign, Users, FileText, Settings, Save } from 'lucide-react';
import { ShopSettings, ShopSettingsService } from '../services/shopSettings';
import { EarningsService } from '../services/earningsService';
import { DataCleanupService } from '../services/dataCleanupService';

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

  // Sample staff data with realistic calculations based on actual earnings
  const staffMembers = React.useMemo(() => {
    // Get actual earnings for each staff member
    const staffData = [
      { name: 'Ismail Hassan Azimkar', role: 'Barber' },
      { name: 'Mehmet Yılmaz', role: 'Barber' },
      { name: 'Ali Demir', role: 'Apprentice' }
    ];

    return staffData.map(staff => {
      const memberEarnings = EarningsService.getWeeklyEarnings(currentUser.shop_name, staff.name);
      const commissionRate = staff.role === 'Apprentice' ? shopSettings.apprenticeCommission : shopSettings.barberCommission;
      
      // Calculate based on actual data only - no fallback dummy values
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
  }, [shopSettings, currentUser.shop_name]);

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
                Staff Bookings ({EarningsService.getWeeklyEarnings(currentUser.shop_name).bookingCount})
              </h3>
            </div>
            
            <div className="p-6">
              {EarningsService.getRecentTransactions(currentUser.shop_name, undefined, 10).length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No bookings found. Add your first booking to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {EarningsService.getRecentTransactions(currentUser.shop_name, undefined, 10).map((transaction, index) => (
                    <div key={transaction.id || index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium text-gray-900">{transaction.customer}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                              transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {transaction.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{transaction.service}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>Staff: {transaction.barber}</span>
                            <span>Date & Time: {new Date(transaction.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">₺{transaction.amount}</p>
                          <button className="text-gray-400 hover:text-gray-600 mt-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>
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
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">User Management</h3>
          <p className="text-gray-600">User management features coming soon...</p>
        </div>
      )}

      {currentTab === 'reports' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">POS Reports</h3>
          <p className="text-gray-600">POS reporting features coming soon...</p>
        </div>
      )}

      {currentTab === 'expenses' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Expenses</h3>
          <p className="text-gray-600">Expense management features coming soon...</p>
        </div>
      )}

      {currentTab === 'analytics' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Analytics</h3>
          <p className="text-gray-600">Analytics dashboard coming soon...</p>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
