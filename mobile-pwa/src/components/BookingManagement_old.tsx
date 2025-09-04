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
  X,
  Plus,
  Save,
  UserPlus
} from 'lucide-react';
import { useModal } from './ui/ModalProvider';
import { supabase, type Booking } from '../lib/supabase';
import { EarningsService } from '../services/earningsService';
import { userService, customerService, bookingService } from '../services/completeDatabase';
import { NotificationsService } from '../services/notifications';
import { InvoiceService } from '../services/invoiceService';
import { ServicePricingService, SERVICES } from '../services/servicePricing';
import { UserManagementService } from '../services/userManagementService';
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
  
  // New booking form state
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [bookingFormData, setBookingFormData] = useState({
    customer_name: '',
    customer_id: '',
    service_type: 'Haircut',
    staff_member: '',
    booking_date: new Date().toISOString().split('T')[0],
    booking_time: '09:00',
    price: ServicePricingService.getServicePrice('Haircut'),
    notes: ''
  });

  // Time slots for booking
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'
  ];

  // Load staff and customers when component mounts
  useEffect(() => {
    if (currentUser.role === 'Owner' || currentUser.role === 'Manager') {
      loadStaffAndCustomers();
    }
  }, [currentUser]);

  const loadStaffAndCustomers = async () => {
    try {
      // Load staff members
      await UserManagementService.syncStaffToCurrentShop(currentUser.shop_name);
      const staff = await UserManagementService.getStaffMembers(currentUser.shop_name);
      setStaffMembers(staff);
      
      // Load customers
      const customerList = await customerService.getCustomers();
      setCustomers(customerList);
      
      // Set default staff member
      if (staff.length > 0) {
        setBookingFormData(prev => ({ ...prev, staff_member: staff[0].id }));
      }
    } catch (error) {
      console.error('Error loading staff and customers:', error);
    }
  };

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

  // Handler to create new booking
  const createBooking = async () => {
    if (!bookingFormData.customer_name || !bookingFormData.staff_member) {
      modal.notify('Please fill in all required fields', 'error');
      return;
    }

    try {
      // Find the selected staff member
      const selectedStaff = staffMembers.find(s => s.id === bookingFormData.staff_member);
      if (!selectedStaff) {
        modal.notify('Selected staff member not found', 'error');
        return;
      }

      // Create the booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          customer_name: bookingFormData.customer_name,
          customer_id: bookingFormData.customer_id || null,
          service: bookingFormData.service_type,
          price: bookingFormData.price,
          date: bookingFormData.booking_date,
          time: bookingFormData.booking_time,
          notes: bookingFormData.notes,
          user_id: selectedStaff.id,
          staff_name: selectedStaff.name,
          payment_status: 'pending',
          status: 'scheduled'
        })
        .select('*')
        .single();

      if (bookingError) throw bookingError;

      // Reset form
      setBookingFormData({
        customer_name: '',
        customer_id: '',
        service_type: 'Haircut',
        staff_member: staffMembers[0]?.id || '',
        booking_date: new Date().toISOString().split('T')[0],
        booking_time: '09:00',
        price: ServicePricingService.getServicePrice('Haircut'),
        notes: ''
      });

      setShowBookingForm(false);
      modal.notify('Booking created successfully!', 'success');
      
      // Reload bookings
      if (currentView === 'upcoming') {
        await loadUpcomingBookings();
      } else if (currentView === 'history') {
        await loadBookingHistory();
      } else {
        await loadAllBookings();
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      modal.notify('Failed to create booking. Please try again.', 'error');
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
          
          {/* Create Booking Button for Owner/Manager */}
          {(currentUser.role === 'Owner' || currentUser.role === 'Manager') && (
            <button
              onClick={() => setShowBookingForm(true)}
              className="px-4 py-2 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700"
            >
              <Plus className="inline-block w-4 h-4 mr-2" />
              Create Booking
            </button>
          )}
        </div>

        {/* Create Booking Form */}
        {showBookingForm && (currentUser.role === 'Owner' || currentUser.role === 'Manager') && (
          <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Create New Booking</h3>
              <button onClick={() => setShowBookingForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); createBooking(); }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  value={bookingFormData.customer_name}
                  onChange={(e) => setBookingFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Existing Customer (Optional)</label>
                <select
                  value={bookingFormData.customer_id}
                  onChange={(e) => {
                    const selectedCustomer = customers.find(c => c.id === e.target.value);
                    setBookingFormData(prev => ({ 
                      ...prev, 
                      customer_id: e.target.value,
                      customer_name: selectedCustomer ? selectedCustomer.name : prev.customer_name
                    }));
                  }}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="">Select existing customer...</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>{customer.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service *</label>
                <select
                  value={bookingFormData.service_type}
                  onChange={(e) => setBookingFormData(prev => ({ 
                    ...prev, 
                    service_type: e.target.value,
                    price: ServicePricingService.getServicePrice(e.target.value)
                  }))}
                  className="w-full p-2 border rounded-lg"
                  required
                >
                  {SERVICES.map(service => (
                    <option key={service.name} value={service.name}>{service.name} - ₺{service.price}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Price will auto-fill but can be customized below</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Custom Price (₺) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={bookingFormData.price}
                  onChange={(e) => setBookingFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  required
                  placeholder="Enter custom amount"
                />
                <p className="text-xs text-gray-500 mt-1">Modify this amount as needed for custom pricing</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Staff Member *</label>
                <select
                  value={bookingFormData.staff_member}
                  onChange={(e) => setBookingFormData(prev => ({ ...prev, staff_member: e.target.value }))}
                  className="w-full p-2 border rounded-lg"
                  required
                >
                  {staffMembers.map(staff => (
                    <option key={staff.id} value={staff.id}>{staff.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={bookingFormData.booking_date}
                  onChange={(e) => setBookingFormData(prev => ({ ...prev, booking_date: e.target.value }))}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                <select
                  value={bookingFormData.booking_time}
                  onChange={(e) => setBookingFormData(prev => ({ ...prev, booking_time: e.target.value }))}
                  className="w-full p-2 border rounded-lg"
                  required
                >
                  {timeSlots.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={bookingFormData.notes}
                  onChange={(e) => setBookingFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full p-2 border rounded-lg"
                  rows={3}
                />
              </div>
              
              <div className="md:col-span-2 flex space-x-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  <Save className="inline-block w-4 h-4 mr-2" />
                  Create Booking
                </button>
                <button
                  type="button"
                  onClick={() => setShowBookingForm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

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
