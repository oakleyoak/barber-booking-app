import React from 'react';
import { TrendingUp, DollarSign } from 'lucide-react';

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
  const earnings = {
    today: { amount: 0, bookings: 0, target: 500 },
    week: { amount: 1680, bookings: 4, target: 3000 },
    month: { amount: 1680, bookings: 4, target: 10000 }
  };

  const recentTransactions = [
    { service: 'Haircut - Ali', date: '8/27/2025 at 09:00:00', amount: 420, commission: 60 },
    { service: 'Haircut - Junior', date: '8/27/2025 at 02:00:00', amount: 420, commission: 60 },
    { service: 'Styling - joeseph', date: '8/27/2025 at 12:00:00', amount: 420, commission: 60 },
    { service: 'Haircut - Muhammed', date: '8/27/2025 at 10:00:00', amount: 420, commission: 60 }
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Earnings Tracker</h2>
        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
          Your Commission: 60%
        </div>
      </div>

      {/* Earnings Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-2">Today</h3>
          <div className="text-3xl font-bold text-green-900 mb-2">${earnings.today.amount.toFixed(2)}</div>
          <div className="text-sm text-green-600 mb-2">{earnings.today.bookings} bookings</div>
          <div className="text-sm text-green-600">Gross: $0 • 60%</div>
          <div className="text-sm text-green-600 mt-2">
            0% of ${earnings.today.target} target
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">This Week</h3>
          <div className="text-3xl font-bold text-blue-900 mb-2">${earnings.week.amount.toFixed(2)}</div>
          <div className="text-sm text-blue-600 mb-2">{earnings.week.bookings} bookings</div>
          <div className="text-sm text-blue-600">Gross: $2800 • 60%</div>
          <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '53%' }}></div>
          </div>
          <div className="text-sm text-blue-600 mt-1">53% of ${earnings.week.target} target</div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-purple-800 mb-2">This Month</h3>
          <div className="text-3xl font-bold text-purple-900 mb-2">${earnings.month.amount.toFixed(2)}</div>
          <div className="text-sm text-purple-600 mb-2">{earnings.month.bookings} bookings</div>
          <div className="text-sm text-purple-600">Gross: $2800 • 60%</div>
          <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
            <div className="bg-purple-600 h-2 rounded-full" style={{ width: '23%' }}></div>
          </div>
          <div className="text-sm text-purple-600 mt-1">23% of ${earnings.month.target} target</div>
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
                <div className="font-bold text-green-600">${transaction.amount.toFixed(2)}</div>
                <div className="text-sm text-gray-500">${transaction.amount.toFixed(2)} • {transaction.commission}%</div>
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
              <span className="font-semibold">$0</span>
            </div>
            <div className="flex justify-between">
              <span>Total customers served:</span>
              <span className="font-semibold">4</span>
            </div>
            <div className="flex justify-between">
              <span>Weekly average:</span>
              <span className="font-semibold">$400/day</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Goal Tracking</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span>Daily Goal: $500</span>
                <span>0%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '0%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span>Monthly Goal: $15,000</span>
                <span>19%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '19%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealEarningsTracker;
