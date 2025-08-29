import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, DollarSign, Users, Target, Download } from 'lucide-react';
import { bookingService, expenseService } from '../services/supabaseServices';
import { ShopSettingsService } from '../services/shopSettings';
import type { User as UserType } from '../lib/supabase';

interface RealEarningsTrackerProps {
  currentUser: UserType;
}

const RealEarningsTracker: React.FC<RealEarningsTrackerProps> = ({ currentUser }) => {
  const [todayEarnings, setTodayEarnings] = useState({ totalAmount: 0, bookingCount: 0 });
  const [weeklyEarnings, setWeeklyEarnings] = useState({ totalAmount: 0, bookingCount: 0 });
  const [monthlyEarnings, setMonthlyEarnings] = useState({ totalAmount: 0, bookingCount: 0 });
  const [expenses, setExpenses] = useState({ today: 0, week: 0, month: 0 });
  const [commissionRate, setCommissionRate] = useState(60);
  const [loading, setLoading] = useState(true);

  const formatCurrency = (amount: number) => {
    return `₺${amount.toLocaleString('tr-TR')}`;
  };

  useEffect(() => {
    loadEarnings();
  }, [currentUser.id]);

  const loadEarnings = async () => {
    try {
      setLoading(true);
      const userId = currentUser.role === 'Barber' ? currentUser.id : undefined;
      
      // Get commission rate for the current user
      if (currentUser.role !== 'Owner') {
        const rate = await ShopSettingsService.getCommissionRate(currentUser.role, currentUser.shop_name || '');
        setCommissionRate(rate);
      }
      
      // Get earnings data
      const [today, weekly, monthly] = await Promise.all([
        bookingService.getDailyEarnings(new Date().toISOString().split('T')[0], userId),
        bookingService.getWeeklyEarnings(userId),
        bookingService.getMonthlyEarnings(userId)
      ]);

      setTodayEarnings(today);
      setWeeklyEarnings(weekly);
      setMonthlyEarnings(monthly);

      // Get expenses data
      const [todayExpenses, weekExpenses, monthExpenses] = await Promise.all([
        expenseService.getDailyExpenses(new Date().toISOString().split('T')[0], userId),
        expenseService.getWeeklyExpenses(userId),
        expenseService.getMonthlyExpenses(userId)
      ]);

      setExpenses({
        today: todayExpenses,
        week: weekExpenses,
        month: monthExpenses
      });
    } catch (error) {
      console.error('Error loading earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportEarningsReport = async () => {
    try {
      // Generate CSV report
      const monthStart = new Date();
      monthStart.setDate(1);
      const bookings = await bookingService.getBookingsByDateRange(
        monthStart.toISOString().split('T')[0],
        new Date().toISOString().split('T')[0],
        currentUser.role === 'Barber' ? currentUser.id : undefined
      );

      const csvContent = [
        ['Date', 'Customer', 'Service', 'Price', 'Status'].join(','),
        ...bookings.map((booking: any) => [
          booking.date,
          booking.customer_name,
          booking.service,
          booking.price,
          booking.status
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `earnings-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading earnings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            Earnings Tracker
          </h2>
          <p className="text-gray-600 text-sm">Track your revenue and profit</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportEarningsReport}
            className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            onClick={loadEarnings}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Earnings Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Today</p>
              <p className="text-2xl font-bold">{formatCurrency(todayEarnings.totalAmount)}</p>
              <p className="text-green-100 text-xs">{todayEarnings.bookingCount} bookings</p>
              <p className="text-green-100 text-xs">Net: {formatCurrency(todayEarnings.totalAmount - expenses.today)}</p>
            </div>
            <Calendar className="h-6 w-6 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">This Week</p>
              <p className="text-2xl font-bold">{formatCurrency(weeklyEarnings.totalAmount)}</p>
              <p className="text-blue-100 text-xs">{weeklyEarnings.bookingCount} bookings</p>
              <p className="text-blue-100 text-xs">Net: {formatCurrency(weeklyEarnings.totalAmount - expenses.week)}</p>
            </div>
            <TrendingUp className="h-6 w-6 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">This Month</p>
              <p className="text-2xl font-bold">{formatCurrency(monthlyEarnings.totalAmount)}</p>
              <p className="text-purple-100 text-xs">{monthlyEarnings.bookingCount} bookings</p>
              <p className="text-purple-100 text-xs">Net: {formatCurrency(monthlyEarnings.totalAmount - expenses.month)}</p>
            </div>
            <DollarSign className="h-6 w-6 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Performance Stats */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              ₺{monthlyEarnings.bookingCount > 0 ? (monthlyEarnings.totalAmount / monthlyEarnings.bookingCount).toFixed(0) : '0'}
            </div>
            <div className="text-sm text-gray-600">Avg per booking</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {weeklyEarnings.bookingCount > 0 ? Math.round(weeklyEarnings.bookingCount / 7) : 0}
            </div>
            <div className="text-sm text-gray-600">Daily average</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              ₺{expenses.month.toFixed(0)}
            </div>
            <div className="text-sm text-gray-600">Monthly expenses</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {monthlyEarnings.totalAmount > 0 ? ((monthlyEarnings.totalAmount - expenses.month) / monthlyEarnings.totalAmount * 100).toFixed(1) : '0'}%
            </div>
            <div className="text-sm text-gray-600">Profit margin</div>
          </div>
        </div>
      </div>

      {/* Commission Info */}
      {(currentUser.role === 'Barber' || currentUser.role === 'Manager' || currentUser.role === 'Apprentice') && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Commission Summary ({commissionRate}%)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Today's Commission</p>
                  <p className="text-xl font-bold text-green-600">
                    ₺{(todayEarnings.totalAmount * (commissionRate / 100)).toFixed(2)}
                  </p>
                </div>
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Monthly Commission</p>
                  <p className="text-xl font-bold text-blue-600">
                    ₺{(monthlyEarnings.totalAmount * (commissionRate / 100)).toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Owner Earnings from Staff */}
      {currentUser.role === 'Owner' && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Owner Earnings from Staff
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Today's Share</p>
                  <p className="text-xl font-bold text-green-600">
                    ₺{(todayEarnings.totalAmount * 0.4).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">40% of total revenue</p>
                </div>
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Monthly Share</p>
                  <p className="text-xl font-bold text-blue-600">
                    ₺{(monthlyEarnings.totalAmount * 0.4).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">40% of total revenue</p>
                </div>
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-xl font-bold text-purple-600">
                    ₺{monthlyEarnings.totalAmount.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">100% of all bookings</p>
                </div>
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealEarningsTracker;
