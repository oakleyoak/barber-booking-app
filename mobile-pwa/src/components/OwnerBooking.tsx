import React from 'react';
import { UserPlus } from 'lucide-react';

interface OwnerBookingProps {
  currentUser: {
    id?: string;
    name: string;
    email: string;
    role: string;
    shop_name: string;
  };
  onBookingCreated: () => void;
}

const OwnerBooking: React.FC<OwnerBookingProps> = ({ currentUser, onBookingCreated }) => {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Book Staff</h2>
        <p className="text-gray-600">Create bookings for your staff members</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="text-center py-8">
          <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Staff Booking System</h3>
          <p className="text-gray-500 mb-4">Create appointments for your barbers and staff</p>
          <button 
            onClick={onBookingCreated}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Staff Booking
          </button>
        </div>
      </div>
    </div>
  );
};

export default OwnerBooking;
