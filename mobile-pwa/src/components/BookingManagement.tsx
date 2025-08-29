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
  X, 
  AlertTriangle,
  History,
  ChevronDown,
  ChevronUp,
  Calendar as CalendarIcon,
  TrendingUp,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { EarningsService } from '../services/earningsService';
import { CustomerService } from '../services/supabaseCustomerService';
import { userService, customerService } from '../services/completeDatabase';

interface Booking {
  id: string;
  customer_name: string;
  service: string;
  price: number;
  date: string;
  time: string;
  user_id: string;
  customer_id: string;
  status: string;
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
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'upcoming' | 'history' | 'all'>('all');
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'completed' | 'cancelled'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'year' | 'custom'>('all');
  const [customDateRange, setCustomDateRange] = useState({
    start: '',
    end: ''
  });
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

  // Owner booking creation state
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

  // Load all staff and customers for owner booking creation
  useEffect(() => {
    if (currentUser.role === 'Owner' || currentUser.role === 'owner') {
      userService.getUsers().then((users: any[]) => setAllStaff(users.map(u => ({id: u.id, name: u.name}))));
      customerService.getCustomers().then((customers: any[]) => setAllCustomers(customers.map(c => ({id: c.id, name: c.name}))));
    }
  }, [currentUser.role]);

  // Owner create booking handler
  const handleCreateBooking = async () => {
    setCreating(true);
    try {
      // Find customer name if only id is selected
      let customerName = createForm.customer_name;
      if (!customerName && createForm.customer_id) {
        const cust = allCustomers.find(c => c.id === createForm.customer_id);
        customerName = cust ? cust.name : '';
      }
      // Add your booking creation logic here (e.g., supabase insert)
      // After successful creation:
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
      loadBookings();
    } catch (error) {
      // Handle error
    } finally {
      setCreating(false);
    }
  };

  const services = [
    'Haircut', 'Beard trim', 'Blowdry', 'Face mask', 'Colour', 
    'Wax', 'Massage', 'Shave', 'Styling', 'Hair wash'
  ];

  // Load bookings with enhanced filtering
  const loadBookings = async () => {
    setLoading(true);
    try {
      console.log('BookingManagement - Starting load with:');
      console.log('- Current view:', currentView);
      console.log('- User role:', currentUser.role);
      console.log('- User ID:', currentUser.id);
      console.log('- User object:', currentUser);

      let query = supabase
        .from('bookings')
        .select(`*`);

      // Check role more flexibly - show all bookings for owners
      const userRole = currentUser.role?.toLowerCase() || '';
      const isOwner = userRole === 'owner' || userRole === 'admin' || userRole.includes('owner');
      
      console.log('BookingManagement - Role check:', { userRole, isOwner });

      // If not owner/admin, only show own bookings
      if (!isOwner && currentUser.id) {
        console.log('BookingManagement - Filtering by user_id:', currentUser.id);
        query = query.eq('user_id', currentUser.id);
      } else {
        console.log('BookingManagement - Owner/Admin: showing all bookings');
      }

      // Apply date range based on current view
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      console.log('BookingManagement - Today:', today);
      
      if (currentView === 'upcoming') {
        query = query.gte('date', today);
        query = query.order('date', { ascending: true });
        console.log('BookingManagement - Filtering upcoming bookings >= ', today);
      } else if (currentView === 'history') {
        query = query.lt('date', today);
        query = query.order('date', { ascending: false });
        console.log('BookingManagement - Filtering history bookings < ', today);
      } else {
        query = query.order('date', { ascending: false });
        console.log('BookingManagement - Showing all bookings');
      }

      const { data, error } = await query;

      if (error) {
        console.error('BookingManagement - Query error:', error);
        throw error;
      }
      
      console.log('BookingManagement - Query successful:');
      console.log('- Raw data:', data);
      console.log('- Bookings count:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('- First booking details:', data[0]);
        console.log('- Booking date comparison:', {
          bookingDate: data[0].date,
          today: today,
          isUpcoming: data[0].date >= today,
          isHistory: data[0].date < today
        });
      }
      
      setBookings(data || []);
    } catch (error) {
      console.error('BookingManagement - Error loading bookings:', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [currentUser.id, currentView]);

  // Delete booking
  const deleteBooking = (booking: Booking) => {
    setBookingToDelete(booking);
    setShowDeleteModal(true);
  };

  const confirmDeleteBooking = async () => {
    if (!bookingToDelete) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingToDelete.id);

      if (error) throw error;

      loadBookings();
      setShowDeleteModal(false);
      setBookingToDelete(null);
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Failed to delete booking');
    }
  };

  // Edit booking function
  const startEdit = (booking: Booking) => {
    setEditingBooking(booking);
    setEditForm({
      customer_name: booking.customer_name,
      service: booking.service,
      price: booking.price,
      date: booking.date.split('T')[0],
      time: booking.time || booking.date.split('T')[1]?.slice(0, 5) || '09:00',
      status: booking.status || 'scheduled'
    });
  };

  const saveEdit = async () => {
    if (!editingBooking) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          customer_name: editForm.customer_name,
          service: editForm.service,
          price: editForm.price,
          date: editForm.date,
          time: editForm.time,
          status: editForm.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingBooking.id);

      if (error) throw error;

      setEditingBooking(null);
      loadBookings();
    } catch (error) {
      console.error('Error updating booking:', error);
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
      status: 'scheduled'
    });
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      // First get the booking details to know which customer to refresh
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('customer_id, user_id')
        .eq('id', bookingId)
        .single();

      if (fetchError) {
        console.error('Error fetching booking details:', fetchError);
        throw fetchError;
      }

      // Update the booking status
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;

      // If the booking was completed, refresh the customer's stats
      if (status === 'completed' && booking) {
        await CustomerService.refreshCustomerStats(currentUser.shop_name, booking.customer_id);
      }

      loadBookings();
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert('Failed to update booking status');
    }
  };

  // Enhanced filtering and sorting
  const getFilteredAndSortedBookings = () => {
    let filtered = bookings.filter(booking => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          booking.customer_name.toLowerCase().includes(query) ||
          booking.service.toLowerCase().includes(query) ||
          booking.users?.name?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Status filter
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

      // Date range filter
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

      return true;
    });

    // Sort bookings
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

  const formatCurrency = (amount: number) => {
    return `₺${amount.toLocaleString('tr-TR')}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getBookingStats = () => {
    const filtered = getFilteredAndSortedBookings();
    const total = filtered.length;
    const completed = filtered.filter(b => b.status === 'completed').length;
    const cancelled = filtered.filter(b => b.status === 'cancelled').length;
    const totalRevenue = filtered
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + b.price, 0);
    
    return { total, completed, cancelled, totalRevenue };
  };

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

  const filteredBookings = getFilteredAndSortedBookings();
  const stats = getBookingStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 md:p-6 lg:p-8">
      <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">All Bookings</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage and view all booking history
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => loadBookings()}
              className="flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition text-sm"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </button>
            <button
              onClick={exportBookings}
              className="flex items-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </button>
            {(currentUser.role === 'Owner' || currentUser.role === 'owner') && currentView === 'all' && (
              <button
                onClick={() => setShowCreateBooking(true)}
                className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm"
              >
                <CheckSquare className="h-4 w-4 mr-1" />
                Create Booking
              </button>
            )}
          </div>
        {/* Owner Create Booking Modal */}
        {showCreateBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg">
              <h3 className="text-lg font-semibold mb-4">Create Booking</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Barber/Staff</label>
                  <select
                    value={createForm.user_id}
                    onChange={e => setCreateForm(f => ({ ...f, user_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select staff...</option>
                    {allStaff.map(staff => (
                      <option key={staff.id} value={staff.id}>{staff.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={createForm.customer_name}
                    onChange={e => setCreateForm(f => ({ ...f, customer_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                  <input
                    type="text"
                    value={createForm.service}
                    onChange={e => setCreateForm(f => ({ ...f, service: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₺)</label>
                  <input
                    type="number"
                    value={createForm.price}
                    onChange={e => setCreateForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={createForm.date}
                      onChange={e => setCreateForm(f => ({ ...f, date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                    <input
                      type="time"
                      value={createForm.time}
                      onChange={e => setCreateForm(f => ({ ...f, time: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={createForm.status}
                    onChange={e => setCreateForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreateBooking}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                  disabled={creating}
                >
                  {creating ? 'Creating...' : 'Create Booking'}
                </button>
                <button
                  onClick={() => setShowCreateBooking(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg"
                  disabled={creating}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        </div>

        {/* View Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
          <button
            onClick={() => setCurrentView('upcoming')}
            className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition ${
              currentView === 'upcoming'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Upcoming
          </button>
          <button
            onClick={() => setCurrentView('history')}
            className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition ${
              currentView === 'history'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <History className="h-4 w-4 mr-2" />
            History
          </button>
          <button
            onClick={() => setCurrentView('all')}
            className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition ${
              currentView === 'all'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Eye className="h-4 w-4 mr-2" />
            All Time
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span className="ml-2 text-sm font-medium text-blue-800">Total</span>
            </div>
            <p className="text-xl font-bold text-blue-900 mt-1">{stats.total}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="ml-2 text-sm font-medium text-green-800">Completed</span>
            </div>
            <p className="text-xl font-bold text-green-900 mt-1">{stats.completed}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center">
              <XCircle className="h-5 w-5 text-red-600" />
              <span className="ml-2 text-sm font-medium text-red-800">Cancelled</span>
            </div>
            <p className="text-xl font-bold text-red-900 mt-1">{stats.cancelled}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-yellow-600" />
              <span className="ml-2 text-sm font-medium text-yellow-800">Revenue</span>
            </div>
            <p className="text-xl font-bold text-yellow-900 mt-1">{formatCurrency(stats.totalRevenue)}</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by customer, service, or barber..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {showFilters ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
            </button>
          </div>

          {/* Extended Filters */}
          {showFilters && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="today">Today Only</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                    <option value="year">Last Year</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="date">Date</option>
                    <option value="customer">Customer</option>
                    <option value="service">Service</option>
                    <option value="price">Price</option>
                    <option value="status">Status</option>
                  </select>
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                  </select>
                </div>
              </div>

              {/* Custom Date Range */}
              {dateFilter === 'custom' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={customDateRange.start}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={customDateRange.end}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bookings List */}
        <div className="space-y-4">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No bookings found for the selected filters.</p>
            </div>
          ) : (
            filteredBookings.map((booking) => (
              <div key={booking.id} className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 hover:shadow-md transition-shadow">
                {/* Mobile Layout */}
                <div className="block md:hidden">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">{booking.customer_name}</h3>
                      <p className="text-sm text-gray-600">{booking.service} - {formatCurrency(booking.price)}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-blue-500" />
                      {formatDate(booking.date)} at {booking.time || 'TBD'}
                    </div>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-green-500" />
                      {booking.users?.name || 'Unknown'}
                    </div>
                    {booking.updated_at && (
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                        Updated: {new Date(booking.updated_at).toLocaleDateString('tr-TR')}
                      </div>
                    )}
                  </div>

                  {/* Quick Actions for Mobile */}
                  <div className="flex flex-wrap gap-2">
                    {(currentUser.role === 'Owner' || currentUser.role === 'owner' || booking.user_id === currentUser.id) && (
                      <>
                        {booking.status === 'scheduled' && currentView !== 'history' && (
                          <button
                            onClick={() => updateBookingStatus(booking.id, 'completed')}
                            className="flex items-center px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                          >
                            <CheckSquare className="h-3 w-3 mr-1" />
                            Complete
                          </button>
                        )}
                        <button
                          onClick={() => startEdit(booking)}
                          className="flex items-center px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          <Edit2 className="h-3 w-3 mr-1" />
                          Edit
                        </button>
                        {(currentUser.role === 'Owner' || currentUser.role === 'owner') && (
                          <button
                            onClick={() => deleteBooking(booking)}
                            className="flex items-center px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Delete
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden md:block">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 grid grid-cols-5 gap-4">
                      <div>
                        <div className="font-medium text-gray-900">{booking.customer_name}</div>
                        <div className="text-sm text-gray-500">{booking.service}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">{formatDate(booking.date)}</div>
                        <div className="text-sm text-gray-500">{booking.time || 'TBD'}</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{formatCurrency(booking.price)}</div>
                        <div className="text-sm text-gray-500">{booking.users?.name || 'Unknown'}</div>
                      </div>
                      <div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                        {booking.updated_at && (
                          <div className="text-xs text-gray-400 mt-1">
                            Updated: {new Date(booking.updated_at).toLocaleDateString('tr-TR')}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {(currentUser.role === 'Owner' || currentUser.role === 'owner' || booking.user_id === currentUser.id) && (
                          <>
                            {booking.status === 'scheduled' && currentView !== 'history' && (
                              <button
                                onClick={() => updateBookingStatus(booking.id, 'completed')}
                                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center"
                              >
                                <CheckSquare className="h-3 w-3 mr-1" />
                                Complete
                              </button>
                            )}
                            <button
                              onClick={() => startEdit(booking)}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center"
                            >
                              <Edit2 className="h-3 w-3 mr-1" />
                              Edit
                            </button>
                            {(currentUser.role === 'Owner' || currentUser.role === 'owner') && (
                              <button
                                onClick={() => deleteBooking(booking)}
                                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center"
                              >
                                <X className="h-3 w-3 mr-1" />
                                Delete
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Edit Modal */}
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
                    onChange={(e) => setEditForm(prev => ({ ...prev, customer_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                  <select
                    value={editForm.service}
                    onChange={(e) => setEditForm(prev => ({ ...prev, service: e.target.value }))}
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
                    onChange={(e) => setEditForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={editForm.date}
                      onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                    <input
                      type="time"
                      value={editForm.time}
                      onChange={(e) => setEditForm(prev => ({ ...prev, time: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
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
    </div>
  );
};

export default BookingManagement;
