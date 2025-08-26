import React from 'react';
import { DollarSign, TrendingUp, Calendar, Users } from 'lucide-react';
import { EarningsSummary, WeeklyEarnings } from '../types';

interface EarningsDashboardProps {
  dailyEarnings?: EarningsSummary;
  weeklyEarnings?: WeeklyEarnings;
  loading: boolean;
}

const EarningsDashboard: React.FC<EarningsDashboardProps> = ({
  dailyEarnings,
  weeklyEarnings,
  loading
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Earnings Dashboard</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <DollarSign className="w-5 h-5" />
        Earnings Dashboard
      </h2>

      {/* Today's Earnings */}
      {dailyEarnings && (
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-700 mb-2">Today's Earnings</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600">Total Earnings</p>
                  <p className="text-2xl font-bold text-green-700">
                    ${dailyEarnings.total_earnings.toFixed(2)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600">Bookings</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {dailyEarnings.booking_count}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          {dailyEarnings.confirmed_count !== dailyEarnings.booking_count && (
            <div className="mt-2 text-sm text-gray-600">
              {dailyEarnings.confirmed_count} of {dailyEarnings.booking_count} bookings confirmed
              (${dailyEarnings.confirmed_earnings.toFixed(2)} confirmed earnings)
            </div>
          )}
        </div>
      )}

      {/* Weekly Summary */}
      {weeklyEarnings && (
        <div>
          <h3 className="text-md font-medium text-gray-700 mb-2">This Week's Summary</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600">Weekly Total</p>
                  <p className="text-2xl font-bold text-purple-700">
                    ${weeklyEarnings.total_earnings.toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600">Daily Average</p>
                  <p className="text-2xl font-bold text-orange-700">
                    ${weeklyEarnings.average_daily.toFixed(2)}
                  </p>
                </div>
                <Users className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Daily Breakdown */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Daily Breakdown</h4>
            <div className="grid grid-cols-7 gap-1">
              {weeklyEarnings.daily_breakdown.map((day, index) => {
                const dayDate = new Date(day.date);
                const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'short' });
                
                return (
                  <div
                    key={day.date}
                    className="text-center p-2 bg-gray-50 rounded text-xs"
                  >
                    <div className="font-medium text-gray-700">{dayName}</div>
                    <div className="text-green-600 font-semibold">
                      ${day.total_earnings.toFixed(0)}
                    </div>
                    <div className="text-gray-500">
                      {day.booking_count} booking{day.booking_count !== 1 ? 's' : ''}
                    </div>
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

export default EarningsDashboard;
