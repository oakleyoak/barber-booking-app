import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, DollarSign, Users } from 'lucide-react';
import { EarningsService } from '../services/earningsService';

interface RealEarningsTrackerProps {
  currentUser: {
    id?: string;
    name: string;
    email: string;
    role: string;
    shop_name: string;
  };
}

const RealEarningsTracker: React.FC<RealEarningsTrackerProps> = ({ currentUser }) => {
  const [todayEarnings, setTodayEarnings] = useState({ totalAmount: 0, bookingCount: 0 });
  const [weeklyEarnings, setWeeklyEarnings] = useState({ totalAmount: 0, bookingCount: 0 });
  const [monthlyEarnings, setMonthlyEarnings] = useState({ totalAmount: 0, bookingCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEarnings();
  }, [currentUser.id]);

  const loadEarnings = async () => {
    if (!currentUser.id) return;

    try {
      setLoading(true);
      const [today, weekly, monthly] = await Promise.all([
        EarningsService.getTodayEarnings(currentUser.id),
        EarningsService.getWeeklyEarnings(currentUser.id),
        EarningsService.getMonthlyEarnings(currentUser.id)
      ]);

      setTodayEarnings({ totalAmount: today.totalAmount, bookingCount: today.bookingCount });
      setWeeklyEarnings({ totalAmount: weekly.totalAmount, bookingCount: weekly.bookingCount });
      setMonthlyEarnings({ totalAmount: monthly.totalAmount, bookingCount: monthly.bookingCount });
    } catch (error) {
      console.error('Error loading earnings:', error);
    } finally {
      setLoading(false);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Earnings Tracker</h2>
        <button
          onClick={loadEarnings}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {/* Earnings Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Today</p>
              <p className="text-3xl font-bold">₺{todayEarnings.totalAmount.toFixed(2)}</p>
              <p className="text-green-100">{todayEarnings.bookingCount} bookings</p>
            </div>
            <Calendar className="h-8 w-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">This Week</p>
              <p className="text-3xl font-bold">₺{weeklyEarnings.totalAmount.toFixed(2)}</p>
              <p className="text-blue-100">{weeklyEarnings.bookingCount} bookings</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">This Month</p>
              <p className="text-3xl font-bold">₺{monthlyEarnings.totalAmount.toFixed(2)}</p>
              <p className="text-purple-100">{monthlyEarnings.bookingCount} bookings</p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Commission Info */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Commission Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Commission</p>
                <p className="text-2xl font-bold text-green-600">
                  ₺{(todayEarnings.totalAmount * 0.1).toFixed(2)}
                </p>
              </div>
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monthly Commission</p>
                <p className="text-2xl font-bold text-blue-600">
                  ₺{(monthlyEarnings.totalAmount * 0.1).toFixed(2)}
                </p>
              </div>
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealEarningsTracker;
