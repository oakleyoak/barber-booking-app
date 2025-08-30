import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
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
import { supabase } from '../lib/supabase';
import { EarningsService } from '../services/earningsService';
import { CustomerService } from '../services/supabaseCustomerService';
import { userService, customerService } from '../services/completeDatabase';
import { bookingService } from '../services/supabaseServices';
import { ServicePricingService } from '../services/servicePricing';

interface Booking {
  id: string;
  user_id?: string;
  customer_id?: string;
  customer_name: string;
  service: string;
  price: number;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  created_at?: string;
  updated_at?: string;
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
      setShowDeleteModal(false);
      setBookingToDelete(null);
      if (currentView === 'upcoming') {
        await loadUpcomingBookings();
      }
    } catch (err) {
      alert('Failed to delete booking');
    }
  };
  const services = ServicePricingService.getAllServices().map(s => s.name);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'upcoming' | 'history' | 'all'>('all');
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'completed' | 'cancelled'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'year' | 'custom'>('all');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  // For upcoming panel day view
  const [upcomingDate, setUpcomingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isUpcomingLoading, setIsUpcomingLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'customer' | 'service' | 'price' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [editForm, setEditForm] = useState({
    customer_name: '',
    service: '',
    price: 0,
    date: '',
    time: '',
    status: 'scheduled'
  });
  const [showCreateBooking, setShowCreateBooking] = useState(false);
  const [createForm, setCreateForm] = useState({
    customer_id: '',
    customer_name: '',
    service: '',
    price: 0,
    date: '',
    time: '',
    user_id: '',
    status: 'scheduled',
  });
  const [allStaff, setAllStaff] = useState<{id: string, name: string}[]>([]);
  const [allCustomers, setAllCustomers] = useState<{id: string, name: string}[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (currentUser.role === 'Owner' || currentUser.role === 'Manager') {
  userService.getUsers().then((users: any[]) => setAllStaff(users.map(u => ({id: u.id, name: u.name}))));
  customerService.getCustomers().then((customers: any[]) => setAllCustomers(customers.map(c => ({id: c.id, name: c.name}))));
    }
  }, [currentUser.role]);

  const handleCreateBooking = async () => {
    setCreating(true);
    try {
      // Debug logging
      console.log('Creating booking with currentUser:', currentUser);
      console.log('Create form data:', createForm);

      // If owner creating from 'all' view, ensure a staff member is selected
      const assignedUserId = currentView === 'all' ? createForm.user_id : currentUser.id;
      if ((currentUser.role === 'Owner' || currentUser.role === 'Manager') && currentView === 'all' && !assignedUserId) {
        alert('Please select a staff member for this booking.');
        setCreating(false);
        return;
      }

      // Ensure we have a valid user_id
      const finalUserId = assignedUserId || currentUser.id;
      if (!finalUserId) {
        console.error('No valid user ID found. Current user:', currentUser);
        alert('Unable to create booking: No valid user ID found.');
        setCreating(false);
        return;
      }

      const bookingData = {
        customer_id: createForm.customer_id || undefined, // Convert empty string to undefined
        customer_name: createForm.customer_name,
        service: createForm.service,
        price: createForm.price,
        date: createForm.date,
        time: createForm.time,
        user_id: finalUserId,
        status: createForm.status as 'scheduled' | 'completed' | 'cancelled'
      };

      console.log('Final booking data:', bookingData);

      // Validate required fields
      if (!bookingData.customer_name || !bookingData.service || !bookingData.date || !bookingData.time) {
        alert('Please fill in all required fields.');
        setCreating(false);
        return;
      }

      // createBooking throws on error (completeDatabase service), so await directly
      const created = await bookingService.createBooking(bookingData);

      if (!created) {
        throw new Error('Create booking failed - no data returned');
      }

      setShowCreateBooking(false);
      setCreateForm({
        customer_id: '',
        customer_name: '',
        service: '',
        price: 0,
        date: '',
        time: '',
        user_id: '',
        status: 'scheduled',
      });
      if (currentView === 'upcoming') {
        await loadUpcomingBookings();
      }
    } catch (err) {
      console.error('BookingManagement: Error creating booking:', err);
      alert('Failed to create booking: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setCreating(false);
    }
  };  // Loads bookings from the backend
  // For upcoming panel: fetch bookings for selected date only, using the same logic as calendar tab
  const loadUpcomingBookings = async () => {
    setIsUpcomingLoading(true);
    try {
      let userId = undefined;
      if (!(currentUser.role === 'Owner' || currentUser.role === 'Manager')) {
        userId = currentUser.id;
      }
      const dayBookings = await bookingService.getBookingsByDate(upcomingDate, userId);
      setBookings(dayBookings || []);
    } catch (err) {
      console.error('BookingManagement: Error loading upcoming bookings:', err);
      setBookings([]);
    } finally {
      setIsUpcomingLoading(false);
    }
  };

  // On mount, load bookings
  // Only load all bookings for non-upcoming views
  useEffect(() => {
    if (currentView !== 'upcoming') {
      // ...existing code...
      (async () => {
        setLoading(true);
        try {
          let bookingsData: Booking[] = [];
          if (currentUser.role === 'Owner' || currentUser.role === 'Manager') {
            bookingsData = await bookingService.getAllBookings();
          } else {
            bookingsData = await bookingService.getAllBookings(currentUser.id);
          }
          setBookings(bookingsData || []);
        } catch (err) {
          console.error('BookingManagement: Error loading bookings:', err);
          alert('Failed to load bookings');
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [currentUser, currentView]);

  // Load bookings for selected date in upcoming panel
  useEffect(() => {
    if (currentView === 'upcoming') {
      loadUpcomingBookings();
    }
  }, [currentView, upcomingDate, currentUser]);

  const startEdit = (booking: Booking) => {
    setEditingBooking(booking);
    setEditForm({
      customer_name: booking.customer_name,
      service: booking.service,
      price: booking.price,
      date: booking.date.split('T')[0],
      time: booking.time || booking.date.split('T')[1]?.slice(0, 5) || '09:00',
      status: booking.status as 'scheduled' | 'completed' | 'cancelled',
    });
  };

  const saveEdit = async () => {
    if (!editingBooking) return;
    try {
      const { error } = await supabase.from('bookings').update({
        customer_name: editForm.customer_name,
        service: editForm.service,
        price: editForm.price,
        date: editForm.date,
        time: editForm.time,
        status: editForm.status as 'scheduled' | 'completed' | 'cancelled',
        updated_at: new Date().toISOString()
      }).eq('id', editingBooking.id);
      if (error) throw error;
      setEditingBooking(null);
      if (currentView === 'upcoming') {
        await loadUpcomingBookings();
      }
    } catch (error) {
      alert('Failed to update booking');
    }
  };

  const cancelEdit = () => {
    setEditingBooking(null);
    setEditForm({
      customer_name: '',
      service: '',
      price: 0,
      date: '',
      time: '',
      status: 'scheduled',
    });
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const { data: booking, error: fetchError } = await supabase.from('bookings').select('customer_id, user_id').eq('id', bookingId).single();
      if (fetchError) throw fetchError;
      const { error } = await supabase.from('bookings').update({ status: status as 'scheduled' | 'completed' | 'cancelled', updated_at: new Date().toISOString() }).eq('id', bookingId);
      if (error) throw error;
      if (status === 'completed' && booking) {
        await CustomerService.refreshCustomerStats(currentUser.shop_name, booking.customer_id);
      }
      if (currentView === 'upcoming') {
        await loadUpcomingBookings();
      }
    } catch (error) {
      alert('Failed to update booking status');
    }
  };

  const getFilteredAndSortedBookings = () => {
    let filtered = bookings.filter((booking: Booking) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = booking.customer_name.toLowerCase().includes(query) || booking.service.toLowerCase().includes(query) || booking.users?.name?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Updated: Upcoming view shows all bookings from today onwards
      if (currentView === 'upcoming') {
        const today = new Date().toISOString().split('T')[0];
        if (booking.date < today) return false;
      }

      if (filter !== 'all') {
        const today = new Date().toISOString().split('T')[0];
        switch (filter) {
          case 'today':
            if (booking.date !== today) return false;
            break;
          case 'upcoming':
            if (booking.date < today) return false;
            break;
          case 'completed':
            if (booking.status !== 'completed') return false;
            break;
          case 'cancelled':
            if (booking.status !== 'cancelled') return false;
            break;
        }
      }
      if (dateFilter !== 'all') {
        const bookingDate = new Date(booking.date);
        const now = new Date();
        switch (dateFilter) {
          case 'today':
            const today = new Date().toISOString().split('T')[0];
            if (booking.date !== today) return false;
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (bookingDate < weekAgo) return false;
            break;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            if (bookingDate < monthAgo) return false;
            break;
          case 'year':
            const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            if (bookingDate < yearAgo) return false;
            break;
          case 'custom':
            if (customDateRange.start && booking.date < customDateRange.start) return false;
            if (customDateRange.end && booking.date > customDateRange.end) return false;
            break;
        }
      }
      // For upcoming panel day view: filter by selected date if in upcoming view
      if (currentView === 'upcoming' && upcomingDate) {
        if (booking.date !== upcomingDate) return false;
      }
      return true;
    });
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'customer':
          comparison = a.customer_name.localeCompare(b.customer_name);
          break;
        case 'service':
          comparison = a.service.localeCompare(b.service);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    return filtered;
  };

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

  const formatCurrency = (amount: number) => `₺${amount.toLocaleString('tr-TR')}`;
  const formatDate = (date: string) => new Date(date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // Time slots for the day (09:00 to 18:00 every 30 min)
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'
  ];
  const openCreateBookingForSlot = (date: string, time: string) => {
  setShowCreateBooking(true);
  setCreateForm(prev => ({ ...prev, date, time }));
  };

  const filteredBookings = getFilteredAndSortedBookings();

  const exportBookings = () => {
    const filtered = getFilteredAndSortedBookings();
    const csvContent = [
      ['Date', 'Time', 'Customer', 'Service', 'Price', 'Status', 'Barber', 'Created', 'Updated'],
      ...filtered.map(booking => [
        formatDate(booking.date),
        booking.time,
        booking.customer_name,
        booking.service,
        booking.price.toString(),
        booking.status,
        booking.users?.name || 'Unknown',
        booking.created_at ? new Date(booking.created_at).toLocaleString('tr-TR') : '',
        booking.updated_at ? new Date(booking.updated_at).toLocaleString('tr-TR') : ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-${currentView}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  return (

    <div className="max-w-3xl mx-auto p-4">
      {/* Filters/Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
        <div className="flex gap-2">
          <button onClick={() => setCurrentView('all')} className={`px-3 py-1 rounded ${currentView === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>All</button>
          <button onClick={() => setCurrentView('upcoming')} className={`px-3 py-1 rounded ${currentView === 'upcoming' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Upcoming</button>
          <button onClick={() => setCurrentView('history')} className={`px-3 py-1 rounded ${currentView === 'history' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>History</button>
        </div>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Search bookings..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={exportBookings} className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"><Download className="h-4 w-4 mr-1" />Export</button>
          <button
            onClick={async () => {
              if (currentView === 'upcoming') {
                await loadUpcomingBookings();
              }
            }}
            className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center"
            title="Refresh data from Supabase"
          >
            <RefreshCw className="h-4 w-4 mr-1" />Refresh
          </button>
          {(currentUser.role === 'Owner' || currentUser.role === 'Manager') && (
            <button onClick={() => setShowCreateBooking(true)} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"><CalendarIcon className="h-4 w-4 mr-1" />New Booking</button>
          )}
        </div>
      </div>

      {/* Booking/Slot List: Only show slot list in 'upcoming' (calendar) view */}
      {currentView === 'upcoming' ? (
        <div className="space-y-2">
          {/* Date picker for day view */}
          <div className="mb-4 flex items-center gap-2">
            <label className="font-medium">Select Date:</label>
            <input
              type="date"
              value={upcomingDate}
              onChange={e => setUpcomingDate(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          {isUpcomingLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            timeSlots.map(time => {
              // Use same slot logic as calendar tab
              const slotBookings = bookings.filter(b => {
                const bookingTime = b.time.length > 5 ? b.time.substring(0, 5) : b.time;
                return bookingTime === time;
              });
              return (
                <div key={time} className="flex items-center p-3 border rounded-lg bg-gray-50">
                  <div className="w-16 text-sm font-medium text-gray-600">{time}</div>
                  <div className="flex-1 ml-4">
                    {slotBookings.length > 0 ? (
                      <div className="space-y-2">
                        {slotBookings.map(booking => (
                          <div key={booking.id} className="bg-white p-3 rounded-lg border shadow-sm">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{booking.customer_name}</h4>
                                <p className="text-sm text-gray-600">{booking.service}</p>
                                <p className="text-sm font-medium text-gray-900">₺{booking.price.toLocaleString('tr-TR')}</p>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>{booking.status}</span>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => startEdit(booking)}
                                    className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                    title="Edit booking"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => deleteBooking(booking)}
                                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                                    title="Delete booking"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div
                        className="text-sm text-gray-400 italic cursor-pointer hover:text-blue-600 hover:bg-blue-50 p-2 rounded transition-colors"
                        onClick={() => openCreateBookingForSlot(upcomingDate, time)}
                      >
                        Click to book this slot
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        // Show regular booking list for 'all' and 'history' tabs
        <div className="space-y-2">
          {filteredBookings.length === 0 ? (
            <div className="text-gray-500 text-center py-8">No bookings found.</div>
          ) : (
            filteredBookings.map(booking => (
              <div key={booking.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{booking.customer_name}</div>
                  <div className="text-sm text-gray-500">{booking.service}</div>
                  <div className="text-xs text-gray-400">{formatDate(booking.date)} {booking.time}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>{booking.status}</span>
                  <span className="text-sm text-gray-500">{booking.time}</span>
                  <button onClick={() => startEdit(booking)} className="ml-2 px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"><Edit2 className="h-4 w-4" /></button>
                  <button onClick={() => deleteBooking(booking)} className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"><X className="h-4 w-4" /></button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Booking Modal */}
      {showCreateBooking && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Create Booking</h3>
            <div className="space-y-4">
              {/* Staff dropdown only in 'all' tab (Owner can pick staff) */}
              {currentView === 'all' && (currentUser.role === 'Owner' || currentUser.role === 'Manager') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Staff</label>
                  <select
                    value={createForm.user_id}
                    onChange={e => setCreateForm(prev => ({ ...prev, user_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select staff</option>
                    {allStaff.map(staff => (
                      <option key={staff.id} value={staff.id}>{staff.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                <input
                  type="text"
                  value={createForm.customer_name}
                  onChange={e => setCreateForm(prev => ({ ...prev, customer_name: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                <select
                  value={createForm.service}
                  onChange={e => setCreateForm(prev => ({ ...prev, service: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {services.map(service => (
                    <option key={service} value={service}>{service}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₺)</label>
                <input
                  type="number"
                  value={createForm.price}
                  onChange={e => setCreateForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={createForm.date}
                    onChange={e => setCreateForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <select
                    value={createForm.time}
                    onChange={e => setCreateForm(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select time</option>
                    {timeSlots.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={createForm.status}
                  onChange={e => setCreateForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCreateBooking}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create Booking'}
              </button>
              <button
                onClick={() => setShowCreateBooking(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Booking Modal */}
      {editingBooking && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Edit Booking</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                <input
                  type="text"
                  value={editForm.customer_name}
                  onChange={e => setEditForm(prev => ({ ...prev, customer_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                <select
                  value={editForm.service}
                  onChange={e => setEditForm(prev => ({ ...prev, service: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {services.map(service => (
                    <option key={service} value={service}>{service}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₺)</label>
                <input
                  type="number"
                  value={editForm.price}
                  onChange={e => setEditForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={e => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <select
                    value={editForm.time}
                    onChange={e => setEditForm(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select time</option>
                    {timeSlots.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={saveEdit}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
              >
                Save Changes
              </button>
              <button
                onClick={cancelEdit}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && bookingToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
              <h3 className="text-lg font-semibold">Confirm Delete</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the booking for {bookingToDelete.customer_name}? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setBookingToDelete(null);
                }}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteBooking}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
              >
                Delete Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingManagement;
