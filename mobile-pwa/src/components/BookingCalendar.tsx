import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, User } from 'lucide-react';
import { CustomerService } from '../services/customerService';
import { EarningsService } from '../services/earningsService';
import { ShopSettingsService } from '../services/shopSettings';
import { SERVICES, ServicePricingService } from '../services/servicePricing';
import { dbService } from '../services/database';
import { supabase } from '../lib/supabase';

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
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [showAddBooking, setShowAddBooking] = useState(false);
  const [newBooking, setNewBooking] = useState({
    customer: '',
    service: 'Haircut',
    amount: 700,
    time: '9am'
  });

  // Load customer count
  useEffect(() => {
    const loadCustomerCount = async () => {
      try {
        const customers = await CustomerService.getCustomers(currentUser.id);
        setTotalCustomers(customers.length);
      } catch (error) {
        console.error('Error loading customers:', error);
        setTotalCustomers(0);
      }
    };

    if (currentUser.id) {
      loadCustomerCount();
    }
  }, [currentUser.id]);

  const timeSlots = [
    '8am', '9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm'
  ];

  const handleAddBooking = async () => {
    if (!newBooking.customer.trim()) {
      alert('Please enter customer name');
      return;
    }

    try {
      // First, check if customer exists in customers table
      let customerId = null;
      const { data: existingCustomers, error: customerError } = await supabase
        .from('customers')
        .select('id')
        .eq('name', newBooking.customer)
        .maybeSingle();

      if (existingCustomers && !customerError) {
        customerId = existingCustomers.id;
      } else {
        // Create new customer if not exists
        const { data: newCustomer, error: createError } = await supabase
          .from('customers')
          .insert({
            name: newBooking.customer,
            phone: '', // We don't have phone in this form
            email: ''  // We don't have email in this form
          })
          .select('id')
          .single();
        
        if (newCustomer && !createError) {
          customerId = newCustomer.id;
        }
      }

      // Generate a UUID for the booking ID
      const bookingId = crypto.randomUUID();

      // Convert time format (9am -> 09:00)
      const timeIn24Hour = newBooking.time.includes('am') 
        ? newBooking.time.replace('am', '').padStart(2, '0') + ':00'
        : newBooking.time.includes('pm') 
          ? (parseInt(newBooking.time.replace('pm', '')) === 12 ? '12' : (parseInt(newBooking.time.replace('pm', '')) + 12).toString()) + ':00'
          : newBooking.time;

      const bookingDate = selectedDate.toISOString().split('T')[0];

      // Save booking to Supabase bookings table
      const bookingData = {
        user_id: currentUser.id!,
        customer_id: customerId,
        customer_name: newBooking.customer,
        service: newBooking.service,
        price: newBooking.amount,
        date: bookingDate,
        time: timeIn24Hour,
        status: 'scheduled' as const
      };

      const booking = await dbService.createBooking(bookingData);

      if (!booking) {
        throw new Error('Failed to create booking');
      }

      // Create transaction for earnings tracking
      const commissionRate = await ShopSettingsService.getCommissionRate(currentUser.role, currentUser.shop_name);
      const commissionAmount = (newBooking.amount * commissionRate) / 100;

      const transactionData = {
        booking_id: booking.id,
        user_id: currentUser.id!,
        customer_name: newBooking.customer,
        service: newBooking.service,
        amount: newBooking.amount,
        commission: commissionRate,
        commission_amount: commissionAmount,
        date: bookingDate,
        status: 'completed' as const
      };

      await EarningsService.addTransaction(currentUser.id!, transactionData);

      // Reset form
      setNewBooking({
        customer: '',
        service: 'Haircut',
        amount: 700,
        time: '9am'
      });
      setShowAddBooking(false);

      // Show success message
      alert('Booking added successfully!');

    } catch (error) {
      console.error('Error adding booking:', error);
      alert('Failed to add booking. Please try again.');
    }
  };

  const serviceOptions = SERVICES;

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
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowAddBooking(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Booking
          </button>
          <span className="text-gray-500">({totalCustomers} total customers)</span>
        </div>
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

      {/* Add Booking Modal */}
      {showAddBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add New Booking</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                <input
                  type="text"
                  value={newBooking.customer}
                  onChange={(e) => setNewBooking({...newBooking, customer: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Enter customer name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                <select
                  value={newBooking.service}
                  onChange={(e) => {
                    const service = serviceOptions.find(s => s.name === e.target.value);
                    setNewBooking({
                      ...newBooking, 
                      service: e.target.value,
                      amount: service?.price || 700
                    });
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  {serviceOptions.map(service => (
                    <option key={service.name} value={service.name}>
                      {ServicePricingService.formatServiceDisplay(service)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <select
                  value={newBooking.time}
                  onChange={(e) => setNewBooking({...newBooking, time: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  {timeSlots.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  value={newBooking.amount}
                  onChange={(e) => setNewBooking({...newBooking, amount: Number(e.target.value)})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddBooking}
                disabled={!newBooking.customer.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg"
              >
                Add Booking
              </button>
              <button
                onClick={() => setShowAddBooking(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingCalendar;
