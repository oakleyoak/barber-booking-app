import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  User, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Edit2, 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  Receipt, 
  CheckSquare, 
  AlertTriangle, 
  History, 
  ChevronDown, 
  ChevronUp, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  Eye, 
  Download, 
  RefreshCw,
  X
} from 'lucide-react';
import { useModal } from './ui/ModalProvider';
import { supabase, type Booking } from '../lib/supabase';
import { EarningsService } from '../services/earningsService';
import { userService, customerService, bookingService } from '../services/completeDatabase';
import { NotificationsService } from '../services/notifications';
import { InvoiceService } from '../services/invoiceService';
import { ServicePricingService } from '../services/servicePricing';
import { getTodayLocal } from '../utils/dateUtils';

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
  const modal = useModal();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [currentView, setCurrentView] = useState<'upcoming' | 'history' | 'all'>(
    currentUser.role === 'Barber' ? 'all' : 'upcoming'
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);

  const markAsPaid = async (bookingId: string) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({ payment_status: 'paid', payment_method: 'cash', payment_received_at: new Date().toISOString() })
        .eq('id', bookingId)
        .select(`*, users(name)`)
        .single();

      if (error) throw error;

      setBookings(prevBookings =>
        prevBookings.map(b => (b.id === bookingId ? data as Booking : b))
      );
      modal.notify('Booking marked as paid!', 'success');
    } catch (err) {
      console.error('Error marking as paid:', err);
      modal.notify('Failed to mark booking as paid', 'error');
    }
  };

  // Handler to send customer notification
  const sendCustomerNotification = async (booking: Booking) => {
    try {
      const result = await NotificationsService.sendNotification({
        type: 'customer_notification',
        booking_id: booking.id,
        booking_data: booking,
        email_content: {
          to: booking.customer_email || booking.customer_phone,
          subject: `✂️ Booking Confirmation - Edge & Co Barbershop`,
          html: `Your booking has been confirmed for ${booking.date} at ${booking.time}.`
        }
      });

      if (result.ok) {
        modal.notify('Customer notification sent successfully!', 'success');
      } else {
        modal.notify('Failed to send customer notification: ' + result.error, 'error');
      }
    } catch (err) {
      console.error('Error sending customer notification:', err);
      modal.notify('Failed to send customer notification', 'error');
    }
  };

  // Handler to send invoice
  const sendInvoice = async (booking: Booking) => {
    try {
      // First, get customer email from customer_id if available
      let customerEmail = booking.customer_email;
      
      if (!customerEmail && booking.customer_id) {
        try {
          const customer = await customerService.getCustomerById(booking.customer_id);
          customerEmail = customer?.email;
        } catch (error) {
          console.error('Error fetching customer email:', error);
        }
      }

      if (!customerEmail) {
        modal.notify('Customer email not available. Please update customer information first.', 'error');
        return;
      }

      // Add customer email to booking for invoice generation
      const bookingWithEmail = {
        ...booking,
        customer_email: customerEmail
      };

      // Send invoice
      const result = await InvoiceService.sendInvoice(bookingWithEmail);

      if (result.ok) {
        modal.notify('Invoice sent successfully!', 'success');
      } else {
        modal.notify('Failed to send invoice: ' + result.error, 'error');
      }
    } catch (err) {
      console.error('Error sending invoice:', err);
      modal.notify('Failed to send invoice', 'error');
    }
  };

  // Handler to open delete modal for a booking
  const deleteBooking = (booking: Booking) => {
    setBookingToDelete(booking);
    setShowDeleteModal(true);
  };

  // Handler to confirm deletion
  const confirmDeleteBooking = async () => {
    if (!bookingToDelete) return;
    try {
      const { error } = await supabase.from('bookings').delete().eq('id', bookingToDelete.id);
      if (error) throw error;
      
      modal.notify('Booking deleted successfully!', 'success');
      setShowDeleteModal(false);
      setBookingToDelete(null);
      
      if (currentView === 'upcoming') {
        await loadUpcomingBookings();
      } else {
        await loadBookingHistory();
      }
    } catch (err) {
      console.error('Error deleting booking:', err);
      modal.notify('Failed to delete booking', 'error');
    }
  };

  // Load upcoming bookings
  const loadUpcomingBookings = async () => {
    try {
      const today = getTodayLocal();
      let query = supabase
        .from('bookings')
        .select(`
          *,
          users(name)
        `)
        .gte('date', today)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      // Filter by user for barbers, show all for owners/managers
      if (currentUser.role === 'Barber' && currentUser.id) {
        query = query.eq('user_id', currentUser.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setBookings(data || []);
    } catch (err) {
      console.error('Error loading upcoming bookings:', err);
      modal.notify('Failed to load upcoming bookings', 'error');
    }
  };

  // Load booking history
  const loadBookingHistory = async () => {
    try {
      const today = getTodayLocal();
      let query = supabase
        .from('bookings')
        .select(`
          *,
          users(name)
        `)
        .lt('date', today)
        .order('date', { ascending: false })
        .order('time', { ascending: false });

      // Filter by user for barbers, show all for owners/managers
      if (currentUser.role === 'Barber' && currentUser.id) {
        query = query.eq('user_id', currentUser.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setBookings(data || []);
    } catch (err) {
      console.error('Error loading booking history:', err);
      modal.notify('Failed to load booking history', 'error');
    }
  };

  // Load all bookings for barber (their own only)
  const loadAllBookings = async () => {
    try {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          users(name)
        `)
        .order('date', { ascending: false })
        .order('time', { ascending: false });

      // Filter by user for barbers, show all for owners/managers
      if (currentUser.role === 'Barber' && currentUser.id) {
        query = query.eq('user_id', currentUser.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setBookings(data || []);
    } catch (err) {
      console.error('Error loading all bookings:', err);
      modal.notify('Failed to load all bookings', 'error');
    }
  };

  // Load bookings based on current view
  useEffect(() => {
    if (currentView === 'upcoming') {
      loadUpcomingBookings();
    } else if (currentView === 'history') {
      loadBookingHistory();
    } else if (currentView === 'all') {
      loadAllBookings();
    }
  }, [currentView]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Booking Management</h2>
        
        {/* View Toggle */}
        <div className="flex space-x-4 mb-6">
          {currentUser.role === 'Barber' && (
            <button
              onClick={() => setCurrentView('all')}
              className={`px-4 py-2 rounded-lg font-medium ${
                currentView === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Eye className="inline-block w-4 h-4 mr-2" />
              All My Bookings
            </button>
          )}
          <button
            onClick={() => setCurrentView('upcoming')}
            className={`px-4 py-2 rounded-lg font-medium ${
              currentView === 'upcoming'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <CalendarIcon className="inline-block w-4 h-4 mr-2" />
            Upcoming Bookings
          </button>
          <button
            onClick={() => setCurrentView('history')}
            className={`px-4 py-2 rounded-lg font-medium ${
              currentView === 'history'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <History className="inline-block w-4 h-4 mr-2" />
            Booking History
          </button>
        </div>

        {/* Bookings List */}
        <div className="space-y-4">
          {bookings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {currentView === 'upcoming' ? 'No upcoming bookings' : 
                 currentView === 'history' ? 'No booking history' : 
                 'No bookings found'}
              </p>
            </div>
          ) : (
            bookings.map((booking) => (
              <div key={booking.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{booking.customer_name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span>{formatDate(booking.date)} at {booking.time}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-gray-500" />
                        <span>₺{booking.price}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 mb-2">
                      <span className="text-sm text-gray-600">{booking.service}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                        booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {booking.status}
                      </span>
                      {/* --- PAYMENT STATUS BADGE --- */}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                        booking.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                        booking.payment_status === 'failed' || booking.payment_status === 'refunded' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {booking.payment_status?.replace('_', ' ') || 'Pending Payment'}
                      </span>
                    </div>

                    {booking.notes && (
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Notes:</strong> {booking.notes}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    {/* --- MARK AS PAID BUTTON --- */}
                    {booking.payment_status !== 'paid' && (
                      <button
                        onClick={() => markAsPaid(booking.id)}
                        className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                        title="Mark as Paid"
                      >
                        <CheckSquare className="w-4 h-4" />
                      </button>
                    )}
                    {/* Send Notification Button */}
                    <button
                      onClick={() => sendCustomerNotification(booking)}
                      className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                      title="Send Customer Notification"
                    >
                      <Mail className="w-4 h-4" />
                    </button>

                    {/* Send Invoice Button */}
                    <button
                      onClick={() => sendInvoice(booking)}
                      className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
                      title="Send Invoice"
                    >
                      <Receipt className="w-4 h-4" />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => deleteBooking(booking)}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      title="Delete Booking"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && bookingToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the booking for {bookingToDelete.customer_name} on {formatDate(bookingToDelete.date)}?
            </p>
            <div className="flex space-x-4">
              <button
                onClick={confirmDeleteBooking}
                className="flex-1 bg-red-600 text-white rounded-lg py-2 hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setBookingToDelete(null);
                }}
                className="flex-1 bg-gray-300 text-gray-700 rounded-lg py-2 hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default BookingManagement;
