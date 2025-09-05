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
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState<'upcoming' | 'history' | 'all'>(
    currentUser.role === 'Barber' ? 'all' : 'upcoming'
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  
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

  // Search and filter bookings
  useEffect(() => {
    const filtered = bookings.filter(booking =>
      booking.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (booking.notes && booking.notes.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredBookings(filtered);
  }, [bookings, searchTerm]);

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

  // Load bookings based on view
  useEffect(() => {
    if (currentView === 'upcoming') {
      loadUpcomingBookings();
    } else if (currentView === 'history') {
      loadBookingHistory();
    } else {
      loadAllBookings();
    }
  }, [currentView, currentUser]);

  const openBookingDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowBookingDetails(true);
  };

  const closeBookingDetails = () => {
    setShowBookingDetails(false);
    setSelectedBooking(null);
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Format time to display format
  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5); // Remove seconds if present
  };

  // Delete booking handler
  const deleteBooking = (booking: Booking) => {
    setBookingToDelete(booking);
    setShowDeleteModal(true);
  };

  // Mark as paid handler
  const markAsPaid = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ payment_status: 'paid' })
        .eq('id', bookingId);

      if (error) throw error;
      
      modal.notify('Payment status updated!', 'success');
      
      // Reload current view
      if (currentView === 'upcoming') {
        await loadUpcomingBookings();
      } else if (currentView === 'history') {
        await loadBookingHistory();
      } else {
        await loadAllBookings();
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      modal.notify('Failed to update payment status', 'error');
    }
  };

  const markAsUnpaid = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ payment_status: 'pending', payment_method: null, payment_received_at: null })
        .eq('id', bookingId);

      if (error) throw error;

      modal.notify('Payment status reverted to pending', 'success');

      if (currentView === 'upcoming') {
        await loadUpcomingBookings();
      } else if (currentView === 'history') {
        await loadBookingHistory();
      } else {
        await loadAllBookings();
      }
    } catch (error) {
      console.error('Error reverting payment status:', error);
      modal.notify('Failed to revert payment status', 'error');
    }
  };

  // Send customer notification
  const sendCustomerNotification = async (booking: Booking) => {
    try {
      await NotificationsService.sendNotification({
        to: booking.customer_email || '',
        name: booking.customer_name,
        service: booking.service,
        date: booking.date,
        time: booking.time,
        type: 'booking_reminder'
      });
      modal.notify('Notification sent successfully!', 'success');
    } catch (error) {
      console.error('Error sending notification:', error);
      modal.notify('Failed to send notification', 'error');
    }
  };

  // Send invoice
  const sendInvoice = async (booking: Booking) => {
    try {
      await InvoiceService.sendInvoice(booking);
      modal.notify('Invoice sent successfully!', 'success');
    } catch (error) {
      console.error('Error sending invoice:', error);
      modal.notify('Failed to send invoice', 'error');
    }
  };

  // Confirm delete booking
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
      } else if (currentView === 'history') {
        await loadBookingHistory();
      } else {
        await loadAllBookings();
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
      if (currentUser.role === 'Barber') {
        query = query.eq('user_id', currentUser.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setBookings(data || []);
    } catch (error) {
      console.error('Error loading upcoming bookings:', error);
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
      if (currentUser.role === 'Barber') {
        query = query.eq('user_id', currentUser.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setBookings(data || []);
    } catch (error) {
      console.error('Error loading booking history:', error);
      modal.notify('Failed to load booking history', 'error');
    }
  };

  // Load all bookings (for barbers to see their own bookings)
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
      if (currentUser.role === 'Barber') {
        query = query.eq('user_id', currentUser.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setBookings(data || []);
    } catch (error) {
      console.error('Error loading all bookings:', error);
      modal.notify('Failed to load bookings', 'error');
    }
  };

  // Get status color classes
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'failed':
      case 'refunded':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="w-full max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <CalendarIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Booking Management</h2>
            <p className="text-sm text-gray-600">{filteredBookings.length} {currentView} bookings</p>
          </div>
        </div>
        
        {/* Create Booking Button for Owner/Manager */}
        {(currentUser.role === 'Owner' || currentUser.role === 'Manager') && (
          <button
            onClick={() => setShowBookingForm(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition-colors shadow-sm w-full sm:w-auto justify-center"
          >
            <Plus className="h-4 w-4" />
            Create Booking
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search bookings by customer, service, or notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* View Tabs */}
      <div className="bg-white border border-gray-200 rounded-lg p-1 mb-6">
        <div className="overflow-x-auto">
          <div className="flex space-x-1 min-w-max">
            {currentUser.role === 'Barber' && (
              <button
                onClick={() => setCurrentView('all')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm min-w-[120px] justify-center ${
                  currentView === 'all'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Eye className="h-4 w-4" />
                All My Bookings
              </button>
            )}
            <button
              onClick={() => setCurrentView('upcoming')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm min-w-[120px] justify-center ${
                currentView === 'upcoming'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <CalendarIcon className="h-4 w-4" />
              Upcoming
            </button>
            <button
              onClick={() => setCurrentView('history')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm min-w-[120px] justify-center ${
                currentView === 'history'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <History className="h-4 w-4" />
              History
            </button>
          </div>
        </div>
      </div>

      {/* Booking Cards */}
      {filteredBookings.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No bookings found' : 'No bookings yet'}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm 
              ? 'Try adjusting your search terms.' 
              : currentView === 'upcoming' ? 'No upcoming bookings scheduled.' :
                currentView === 'history' ? 'No booking history available.' : 'No bookings found.'
            }
          </p>
          {!searchTerm && (currentUser.role === 'Owner' || currentUser.role === 'Manager') && (
            <button
              onClick={() => setShowBookingForm(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Create First Booking
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((booking) => (
            <div
              key={booking.id}
              onClick={() => openBookingDetails(booking)}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-blue-100 p-1.5 rounded-full">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 truncate">{booking.customer_name}</h3>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-3.5 w-3.5 text-gray-400" />
                      <span>{formatDate(booking.date)} at {formatTime(booking.time)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <DollarSign className="h-3.5 w-3.5 text-gray-400" />
                      <span>₺{booking.price} - {booking.service}</span>
                    </div>
                    
                    {/* Status Badges */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(booking.payment_status || 'pending')}`}>
                        {booking.payment_status?.replace('_', ' ') || 'Pending'}
                      </span>
                    </div>

                    {booking.notes && (
                      <div className="text-xs text-gray-500 bg-gray-50 rounded p-2 mt-2 line-clamp-2">
                        {booking.notes}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-1 ml-3">
                  {booking.payment_status !== 'paid' ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsPaid(booking.id);
                      }}
                      className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                    >
                      <CheckSquare className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsUnpaid(booking.id);
                      }}
                      className="bg-yellow-500 text-white p-2 rounded-lg hover:bg-yellow-600 transition-colors shadow-sm"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Details Modal */}
      {showBookingDetails && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white bg-opacity-20 p-2 rounded-full">
                    <CalendarIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{selectedBooking.customer_name}</h3>
                    <p className="text-blue-100 text-sm">Booking Details</p>
                  </div>
                </div>
                <button
                  onClick={closeBookingDetails}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Booking Content */}
            <div className="p-6 space-y-6">
              {/* Booking Information */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-600" />
                  Booking Information
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Date & Time</span>
                    </div>
                    <span className="font-medium">{formatDate(selectedBooking.date)} at {formatTime(selectedBooking.time)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Service & Price</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">₺{selectedBooking.price}</div>
                      <div className="text-sm text-gray-500">{selectedBooking.service}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Status</span>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedBooking.status)}`}>
                        {selectedBooking.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(selectedBooking.payment_status || 'pending')}`}>
                        {selectedBooking.payment_status?.replace('_', ' ') || 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              {selectedBooking.notes && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Notes</h4>
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedBooking.notes}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-4">
                {selectedBooking.payment_status !== 'paid' && (
                  <button
                    onClick={() => {
                      markAsPaid(selectedBooking.id);
                      closeBookingDetails();
                    }}
                    className="flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    <CheckSquare className="h-4 w-4" />
                    Mark Paid
                  </button>
                )}
                <button
                  onClick={() => {
                    sendCustomerNotification(selectedBooking);
                    closeBookingDetails();
                  }}
                  className="flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Mail className="h-4 w-4" />
                  Send Notification
                </button>
                <button
                  onClick={() => {
                    sendInvoice(selectedBooking);
                    closeBookingDetails();
                  }}
                  className="flex items-center justify-center gap-2 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  <Receipt className="h-4 w-4" />
                  Send Invoice
                </button>
              </div>
              
              <button
                onClick={() => {
                  deleteBooking(selectedBooking);
                  closeBookingDetails();
                }}
                className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 py-3 rounded-lg hover:bg-red-100 transition-colors font-medium border border-red-200"
              >
                <X className="h-4 w-4" />
                Delete Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Booking Form Modal */}
      {showBookingForm && (currentUser.role === 'Owner' || currentUser.role === 'Manager') && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Create New Booking</h3>
                <button onClick={() => setShowBookingForm(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={(e) => { e.preventDefault(); createBooking(); }} className="space-y-4">
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
                    {Object.entries(SERVICES).map(([key, service]) => (
                      <option key={key} value={key}>{service.name} - ₺{service.price}</option>
                    ))}
                  </select>
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
                
                <div className="grid grid-cols-2 gap-4">
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
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₺) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={bookingFormData.price}
                    onChange={(e) => setBookingFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className="w-full p-2 border rounded-lg"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={bookingFormData.notes}
                    onChange={(e) => setBookingFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full p-2 border rounded-lg"
                    rows={3}
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Create Booking
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBookingForm(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && bookingToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
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
  );
};

export default BookingManagement;
