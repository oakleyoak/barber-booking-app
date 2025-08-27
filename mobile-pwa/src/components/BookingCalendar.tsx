import React, { useState } from 'react';
import { Calendar, Clock, Plus } from 'lucide-react';

interface BookingCalendarProps {
  currentUser: {
    id?: string;
    name: string;
    email: string;
    role: string;
    shop_name: string;
  };
}

const BookingCalendar: React.FC<BookingCalendarProps> = ({ currentUser }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');

  const timeSlots = [
    '8am', '9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm'
  ];

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Booking Calendar</h2>
          <p className="text-gray-600">Manage your appointments and bookings</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          New Booking
        </button>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() - 1)))}
            className="p-2 hover:bg-gray-100 rounded"
          >
            ←
          </button>
          <button
            onClick={() => setSelectedDate(new Date())}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            today
          </button>
          <button
            onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() + 1)))}
            className="p-2 hover:bg-gray-100 rounded"
          >
            →
          </button>
        </div>

        <h3 className="text-xl font-semibold">{formatDate(selectedDate)}</h3>

        <div className="flex bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1 rounded text-sm ${viewMode === 'month' ? 'bg-white text-gray-800' : 'text-white'}`}
          >
            month
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1 rounded text-sm ${viewMode === 'week' ? 'bg-white text-gray-800' : 'text-white'}`}
          >
            week
          </button>
          <button
            onClick={() => setViewMode('day')}
            className={`px-3 py-1 rounded text-sm ${viewMode === 'day' ? 'bg-white text-gray-800' : 'text-white'}`}
          >
            day
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <h4 className="font-semibold text-yellow-800">Wednesday</h4>
          <p className="text-yellow-700">all-day</p>
        </div>

        {timeSlots.map((time) => (
          <div key={time} className="flex items-center border-b border-gray-200 py-2">
            <div className="w-16 text-sm text-gray-500">{time}</div>
            <div className="flex-1 h-12 bg-yellow-50 rounded border border-yellow-200 hover:bg-yellow-100 cursor-pointer transition-colors">
              {/* Empty time slot */}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookingCalendar;
