import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, DollarSign, CheckCircle, XCircle, Edit2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { EarningsService } from '../services/earningsService';

interface Booking {
  id: string;
  customer_name: string;
  service: string;
  price: number;
  date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  payment_status: 'unpaid' | 'paid' | 'refunded';
  user_id: string;
  created_by: string;
  users?: {
    name: string;
  };
}

interface BookingManagementProps {
  currentUser: {
    id?: string;
    name: string;
    email: string;
    role: string;
    shop_name: string;
  };
}

const BookingManagement: React.FC<BookingManagementProps> = ({ currentUser }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'today'>('all');

  // Load bookings
  const loadBookings = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          users:user_id (name)
        `)
        .order('date', { ascending: true });

      // If not owner, only show own bookings
      if (currentUser.role !== 'owner') {
        query = query.eq('user_id', currentUser.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [currentUser.id]);

  // Update booking status
  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;

      // If marking as completed and paid, add to earnings
      const booking = bookings.find(b => b.id === bookingId);
      if (booking && status === 'completed' && booking.payment_status === 'paid') {
        EarningsService.addTransaction(currentUser.shop_name, {
          service: `${booking.service} - ${booking.customer_name}`,
          customer: booking.customer_name,
          date: booking.date,
          amount: booking.price,
          barber: booking.users?.name || 'Unknown',
          commission: 60,
          status: 'completed'
        });
      }

      loadBookings();
      alert('Booking status updated successfully!');
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert('Failed to update booking status');
    }
  };

  // Update payment status
  const updatePaymentStatus = async (bookingId: string, paymentStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ payment_status: paymentStatus })
        .eq('id', bookingId);

      if (error) throw error;

      // If marking as paid and completed, add to earnings
      const booking = bookings.find(b => b.id === bookingId);
      if (booking && paymentStatus === 'paid' && booking.status === 'completed') {
        EarningsService.addTransaction(currentUser.shop_name, {
          service: `${booking.service} - ${booking.customer_name}`,
          customer: booking.customer_name,
          date: booking.date,
          amount: booking.price,
          barber: booking.users?.name || 'Unknown',
          commission: 60,
          status: 'completed'
        });
      }

      loadBookings();
      alert('Payment status updated successfully!');
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Failed to update payment status');
    }
  };

  // Filter bookings
  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    if (filter === 'pending') return booking.status === 'pending';
    if (filter === 'completed') return booking.status === 'completed';
    if (filter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      return booking.date.split('T')[0] === today;
    }
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'unpaid': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Booking Management</h2>
        <p className="text-gray-600">Manage appointment status and payments</p>
      </div>

      {/* Filter buttons */}
      <div className="mb-6 flex space-x-2">
        {['all', 'pending', 'completed', 'today'].map((filterOption) => (
          <button
            key={filterOption}
            onClick={() => setFilter(filterOption as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === filterOption
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
          </button>
        ))}
      </div>

      {/* Bookings list */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No bookings found for the selected filter.</p>
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <div key={booking.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {booking.customer_name}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentColor(booking.payment_status)}`}>
                      {booking.payment_status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Service: {booking.service}
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Price: ₺{booking.price}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Date: {new Date(booking.date).toLocaleString()}
                    </div>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Barber: {booking.users?.name || 'Unknown'}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2">
                  {/* Status controls */}
                  <div className="flex space-x-2">
                    <select
                      value={booking.status}
                      onChange={(e) => updateBookingStatus(booking.id, e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  
                  {/* Payment controls */}
                  <div className="flex space-x-2">
                    <select
                      value={booking.payment_status}
                      onChange={(e) => updatePaymentStatus(booking.id, e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="unpaid">Unpaid</option>
                      <option value="paid">Paid</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BookingManagement;
