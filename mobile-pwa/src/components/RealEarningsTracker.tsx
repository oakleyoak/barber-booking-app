import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign } from 'lucide-react';
import { ShopSettingsService } from '../services/shopSettings';
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
  const [targets, setTargets] = useState({ daily: 500, weekly: 3000, monthly: 15000 });
  const [commissionRate, setCommissionRate] = useState(60);
  const [earnings, setEarnings] = useState({
    today: { amount: 0, bookings: 0, target: 500 },
    week: { amount: 0, bookings: 0, target: 3000 },
    month: { amount: 0, bookings: 0, target: 15000 }
  });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  // Load shop settings and earnings when component mounts
  useEffect(() => {
    const shopTargets = ShopSettingsService.getTargets(currentUser.shop_name);
    const userCommission = ShopSettingsService.getCommissionRate(currentUser.role, currentUser.shop_name);
    
    setTargets(shopTargets);
    setCommissionRate(userCommission);

    // Load actual earnings
    const todayEarnings = EarningsService.getTodayEarnings(currentUser.shop_name, currentUser.name);
    const weeklyEarnings = EarningsService.getWeeklyEarnings(currentUser.shop_name, currentUser.name);
    const monthlyEarnings = EarningsService.getMonthlyEarnings(currentUser.shop_name, currentUser.name);
    const transactions = EarningsService.getRecentTransactions(currentUser.shop_name, currentUser.name, 4);

    setEarnings({
      today: { 
        amount: todayEarnings.totalCommission, 
        bookings: todayEarnings.bookingCount, 
        target: shopTargets.daily 
      },
      week: { 
        amount: weeklyEarnings.totalCommission, 
        bookings: weeklyEarnings.bookingCount, 
        target: shopTargets.weekly 
      },
      month: { 
        amount: monthlyEarnings.totalCommission, 
        bookings: monthlyEarnings.bookingCount, 
        target: shopTargets.monthly 
      }
    });

    setRecentTransactions(transactions.map(t => ({
      service: `${t.service} - ${t.customer}`,
      date: t.date,
      amount: Math.round(t.amount * t.commission / 100),
      commission: t.commission
    })));
  }, [currentUser.shop_name, currentUser.name, currentUser.role]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Earnings Tracker</h2>
        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
          Your Commission: {commissionRate}%
        </div>
      </div>

      {/* Earnings Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-2">Today</h3>
          <div className="text-3xl font-bold text-green-900 mb-2">₺{earnings.today.amount.toFixed(2)}</div>
          <div className="text-sm text-green-600 mb-2">{earnings.today.bookings} bookings</div>
          <div className="text-sm text-green-600">
            Gross: ₺{earnings.today.bookings > 0 ? Math.round(earnings.today.amount / (commissionRate / 100)).toFixed(0) : '0'} • {commissionRate}%
          </div>
          <div className="text-sm text-green-600 mt-2">
            {earnings.today.target > 0 ? Math.round((earnings.today.amount / earnings.today.target) * 100) : 0}% of ₺{earnings.today.target} target
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">This Week</h3>
          <div className="text-3xl font-bold text-blue-900 mb-2">₺{earnings.week.amount.toFixed(2)}</div>
          <div className="text-sm text-blue-600 mb-2">{earnings.week.bookings} bookings</div>
          <div className="text-sm text-blue-600">
            Gross: ₺{earnings.week.bookings > 0 ? Math.round(earnings.week.amount / (commissionRate / 100)).toFixed(0) : '0'} • {commissionRate}%
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ 
              width: `${Math.min(Math.round((earnings.week.amount / earnings.week.target) * 100), 100)}%` 
            }}></div>
          </div>
          <div className="text-sm text-blue-600 mt-1">
            {Math.round((earnings.week.amount / earnings.week.target) * 100)}% of ₺{earnings.week.target} target
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-purple-800 mb-2">This Month</h3>
          <div className="text-3xl font-bold text-purple-900 mb-2">₺{earnings.month.amount.toFixed(2)}</div>
          <div className="text-sm text-purple-600 mb-2">{earnings.month.bookings} bookings</div>
          <div className="text-sm text-purple-600">
            Gross: ₺{earnings.month.bookings > 0 ? Math.round(earnings.month.amount / (commissionRate / 100)).toFixed(0) : '0'} • {commissionRate}%
          </div>
          <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
            <div className="bg-purple-600 h-2 rounded-full" style={{ 
              width: `${Math.min(Math.round((earnings.month.amount / earnings.month.target) * 100), 100)}%` 
            }}></div>
          </div>
          <div className="text-sm text-purple-600 mt-1">
            {Math.round((earnings.month.amount / earnings.month.target) * 100)}% of ₺{earnings.month.target} target
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
        <div className="space-y-4">
          {recentTransactions.map((transaction, index) => (
            <div key={index} className="flex justify-between items-center py-3 border-b border-gray-100">
              <div>
                <div className="font-medium">{transaction.service}</div>
                <div className="text-sm text-gray-500">{transaction.date}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-green-600">₺{transaction.amount.toFixed(2)}</div>
                <div className="text-sm text-gray-500">₺{transaction.amount.toFixed(2)} • {transaction.commission}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Average per booking:</span>
              <span className="font-semibold">
                ₺{earnings.week.bookings > 0 ? Math.round(earnings.week.amount / earnings.week.bookings) : 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total customers served:</span>
              <span className="font-semibold">{earnings.week.bookings}</span>
            </div>
            <div className="flex justify-between">
              <span>Weekly average:</span>
              <span className="font-semibold">₺{Math.round(earnings.week.amount / 7)}/day</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Goal Tracking</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span>Daily Goal: ₺{targets.daily}</span>
                <span>{earnings.today.target > 0 ? Math.round((earnings.today.amount / earnings.today.target) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ 
                  width: `${Math.min(earnings.today.target > 0 ? Math.round((earnings.today.amount / earnings.today.target) * 100) : 0, 100)}%` 
                }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span>Monthly Goal: ₺{targets.monthly.toLocaleString()}</span>
                <span>{Math.round((earnings.month.amount / earnings.month.target) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ 
                  width: `${Math.min(Math.round((earnings.month.amount / earnings.month.target) * 100), 100)}%` 
                }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealEarningsTracker;
