import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Plus, Edit2, Trash2, Check, X, ChevronLeft, ChevronRight, List, Grid3X3, RefreshCw } from 'lucide-react';
import { bookingService, customerService } from '../services/supabaseServices';
import { supabase } from '../lib/supabase';
import { CustomerService } from '../services/supabaseCustomerService';
import type { Booking, Customer, User as UserType } from '../lib/supabase';

interface BookingCalendarProps {
  currentUser: UserType;
}

const BookingCalendar: React.FC<BookingCalendarProps> = ({ currentUser }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [view, setView] = useState<'calendar' | 'day' | 'list'>('calendar');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [monthlyBookings, setMonthlyBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    customer_name: '',
    service: '',
    price: '',
    time: '',
    status: 'scheduled' as 'scheduled' | 'completed' | 'cancelled'
  });

  const services = [
    { name: 'Haircut', duration: 45, price: 700 },
    { name: 'Beard trim', duration: 15, price: 300 },
    { name: 'Blowdry', duration: 30, price: 500 },
    { name: 'Face mask', duration: 30, price: 200 },
    { name: 'Colour', duration: 60, price: 1000 },
    { name: 'Wax', duration: 60, price: 500 },
    { name: 'Massage', duration: 45, price: 900 },
    { name: 'Shave', duration: 30, price: 500 }
  ];

  useEffect(() => {
    loadData();
    loadMonthlyBookings();
  }, [selectedDate, currentMonth]);

  // Reload data when switching to day or list view
  useEffect(() => {
    if (view === 'day' || view === 'list') {
      loadData();
    }
  }, [view, selectedDate]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load bookings for selected date - owners see all, barbers see their own
      const userFilter = currentUser.role === 'Barber' || currentUser.role === 'Apprentice' ? currentUser.id : undefined;

      const dayBookings = await bookingService.getBookingsByDate(selectedDate, userFilter);

      // Load customers for the current user
      const allCustomers = await customerService.getAllCustomers(userFilter);

      setBookings(dayBookings);
      setCustomers(allCustomers);
    } catch (error) {
      console.error('Error loading calendar data:', error);
      setBookings([]);
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMonthlyBookings = async () => {
    try {
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      // Use same user filtering as loadData
      const userFilter = currentUser.role === 'Barber' || currentUser.role === 'Apprentice' ? currentUser.id : undefined;
      const monthBookings = await bookingService.getBookingsByDateRange(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
        userFilter
      );

      setMonthlyBookings(monthBookings);
    } catch (error) {
      console.error('Error loading monthly bookings:', error);
      setMonthlyBookings([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Ensure time is in HH:MM:SS format for database
      const formattedTime = formData.time.length === 5 ? `${formData.time}:00` : formData.time;

      const bookingData = {
        customer_name: formData.customer_name,
        service: formData.service,
        price: Number(formData.price),
        date: selectedDate,
        time: formattedTime,
        status: formData.status,
        user_id: currentUser.id
      };

      if (editingBooking) {
        // Update existing booking
        const updated = await bookingService.updateBooking(editingBooking.id, bookingData);
        if (updated) {
          setBookings(prev => prev.map(b => b.id === editingBooking.id ? updated : b));
          setMonthlyBookings(prev => prev.map(b => b.id === editingBooking.id ? updated : b));
        }
      } else {
        // Create new booking
        const newBooking = await bookingService.createBooking(bookingData);
        if (newBooking) {
          setBookings(prev => [...prev, newBooking]);
          setMonthlyBookings(prev => [...prev, newBooking]);

          // Update customer's last visit
          const customer = customers.find(c => c.name === formData.customer_name);
          if (customer) {
            await customerService.updateCustomer(customer.id, { last_visit: selectedDate });
          } else {
            // Create new customer if they don't exist
            const newCustomer = await customerService.createCustomer({
              name: formData.customer_name,
              last_visit: selectedDate,
              user_id: currentUser.id
            });
            if (newCustomer) {
              setCustomers(prev => [...prev, newCustomer]);
            }
          }
        }
      }

      // Reset form and close modal
      setFormData({
        customer_name: '',
        service: '',
        price: '',
        time: '',
        status: 'scheduled'
      });
      setEditingBooking(null);
      setShowModal(false);

      // Reload data to ensure consistency
      await loadData();
      await loadMonthlyBookings();
    } catch (error) {
      console.error('Error saving booking:', error);
      alert('Failed to save booking. Please try again.');
    }
  };

  const handleEdit = (booking: Booking) => {
    // Normalize time format for form (remove seconds if present)
    const normalizedTime = booking.time.length > 5 ? booking.time.substring(0, 5) : booking.time;

    setEditingBooking(booking);
    setFormData({
      customer_name: booking.customer_name,
      service: booking.service,
      price: booking.price.toString(),
      time: normalizedTime,
      status: booking.status
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        const success = await bookingService.deleteBooking(id);
        if (success) {
          setBookings(prev => prev.filter(b => b.id !== id));
          setMonthlyBookings(prev => prev.filter(b => b.id !== id));
        }
      } catch (error) {
        console.error('Error deleting booking:', error);
        alert('Failed to delete booking. Please try again.');
      }
    }
  };

  const handleStatusUpdate = async (id: string, status: 'completed' | 'cancelled') => {
    try {
      // Get booking details first to know the customer
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('customer_id')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching booking details:', fetchError);
        throw fetchError;
      }

      const updated = await bookingService.updateBooking(id, { status });
      if (updated) {
        setBookings(prev => prev.map(b => b.id === id ? updated : b));
        setMonthlyBookings(prev => prev.map(b => b.id === id ? updated : b));

        // If booking was completed, refresh customer stats
        if (status === 'completed' && booking?.customer_id) {
          await CustomerService.refreshCustomerStats(currentUser.shop_name, booking.customer_id);
        }
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert('Failed to update booking status. Please try again.');
    }
  };

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30'
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const currentDate = new Date(startDate);

    while (currentDate <= lastDay || currentDate.getDay() !== 0) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  };

  const getBookingsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return monthlyBookings.filter(booking => booking.date === dateStr);
  };

  const formatCurrency = (amount: number) => {
    return `₺${amount.toLocaleString('tr-TR')}`;
  };

  // Utility function to normalize time format
  const normalizeTime = (time: string) => {
    return time.length > 5 ? time.substring(0, 5) : time;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const selectDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    setSelectedDate(dateStr);
    setView('day');
  };

  if (isLoading) {
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
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Calendar</h2>
            <p className="text-sm text-gray-600 mt-1">
              {view === 'calendar' ? 'Monthly view' : view === 'day' ? 'Daily appointments' : 'All appointments'}
            </p>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setView('calendar')}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition ${
                  view === 'calendar'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid3X3 className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Calendar</span>
              </button>
              <button
                onClick={() => setView('day')}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition ${
                  view === 'day'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Day</span>
              </button>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">New Booking</span>
              <span className="sm:hidden">+</span>
            </button>

            <button
              onClick={async () => {
                await loadData();
                await loadMonthlyBookings();
              }}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm"
              title="Refresh data from Supabase"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Refresh</span>
              <span className="sm:hidden">↻</span>
            </button>
          </div>
        </div>

        {/* Calendar View */}
        {view === 'calendar' && (
          <div className="space-y-4">
            {/* Month Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h3 className="text-lg font-semibold text-gray-900">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {/* Day Headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}

              {/* Calendar Days */}
              {getDaysInMonth(currentMonth).map((date, index) => {
                const dayBookings = getBookingsForDate(date);
                const isToday = date.toDateString() === new Date().toDateString();
                const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                const isSelected = date.toISOString().split('T')[0] === selectedDate;

                return (
                  <button
                    key={index}
                    onClick={() => selectDate(date)}
                    className={`min-h-[60px] sm:min-h-[80px] p-1 sm:p-2 border rounded-lg text-left transition ${
                      isCurrentMonth
                        ? isSelected
                          ? 'bg-blue-100 border-blue-300'
                          : isToday
                            ? 'bg-yellow-50 border-yellow-200'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        : 'bg-gray-50 border-gray-100 text-gray-400'
                    }`}
                  >
                    <div className="text-xs sm:text-sm font-medium mb-1">
                      {date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayBookings.slice(0, 2).map((booking, idx) => (
                        <div
                          key={idx}
                          className={`text-xs p-1 rounded truncate ${
                            booking.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : booking.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {booking.customer_name}
                        </div>
                      ))}
                      {dayBookings.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{dayBookings.length - 2} more
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Day View */}
        {view === 'day' && (
          <div className="space-y-4">
            {/* Date Navigation */}
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
              <button
                onClick={() => {
                  const prevDate = new Date(selectedDate);
                  prevDate.setDate(prevDate.getDate() - 1);
                  setSelectedDate(prevDate.toISOString().split('T')[0]);
                }}
                className="p-2 hover:bg-gray-200 rounded-lg transition"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  {new Date(selectedDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </h3>
                <p className="text-sm text-gray-600">
                  {bookings.length} appointment{bookings.length !== 1 ? 's' : ''}
                </p>
              </div>

              <button
                onClick={() => {
                  const nextDate = new Date(selectedDate);
                  nextDate.setDate(nextDate.getDate() + 1);
                  setSelectedDate(nextDate.toISOString().split('T')[0]);
                }}
                className="p-2 hover:bg-gray-200 rounded-lg transition"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Time Slots */}
            <div className="space-y-2">
              {timeSlots.map(time => {
                const slotBookings = bookings.filter(b => {
                  const bookingTime = normalizeTime(b.time);
                  return bookingTime === time;
                });

                return (
                  <div key={time} className="flex items-center p-3 border rounded-lg bg-gray-50">
                    <div className="w-16 text-sm font-medium text-gray-600">
                      {time}
                    </div>

                    <div className="flex-1 ml-4">
                      {slotBookings.length > 0 ? (
                        <div className="space-y-2">
                          {slotBookings.map(booking => (
                            <div key={booking.id} className="bg-white p-3 rounded-lg border shadow-sm">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900">{booking.customer_name}</h4>
                                  <p className="text-sm text-gray-600">{booking.service}</p>
                                  <p className="text-sm font-medium text-gray-900">{formatCurrency(booking.price)}</p>
                                </div>

                                <div className="flex items-center gap-2 ml-4">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                    {booking.status}
                                  </span>

                                  <div className="flex gap-1">
                                    {booking.status === 'scheduled' && (
                                      <>
                                        <button
                                          onClick={() => handleStatusUpdate(booking.id, 'completed')}
                                          className="p-1 text-green-600 hover:bg-green-100 rounded"
                                          title="Mark as completed"
                                        >
                                          <Check className="h-4 w-4" />
                                        </button>
                                        <button
                                          onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                                          title="Mark as cancelled"
                                        >
                                          <X className="h-4 w-4" />
                                        </button>
                                      </>
                                    )}

                                    <button
                                      onClick={() => handleEdit(booking)}
                                      className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                      title="Edit booking"
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </button>

                                    <button
                                      onClick={() => handleDelete(booking.id)}
                                      className="p-1 text-red-600 hover:bg-red-100 rounded"
                                      title="Delete booking"
                                    >
                                      <Trash2 className="h-4 w-4" />
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
                          onClick={() => {
                            setFormData({
                              customer_name: '',
                              service: '',
                              price: '',
                              time: time,
                              status: 'scheduled'
                            });
                            setShowModal(true);
                          }}
                        >
                          Click to book this slot
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* List View */}
        {view === 'list' && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">All Appointments for {selectedDate}</h3>
              <p className="text-sm text-gray-600 mb-4">Found {bookings.length} booking(s)</p>

              {bookings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">No appointments for this date</p>
                  <p className="text-xs text-gray-400 mt-2">Date: {selectedDate}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookings.map(booking => (
                    <div key={booking.id} className="bg-white p-4 rounded-lg border">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{booking.customer_name}</h4>
                          <p className="text-sm text-gray-600">{booking.service} at {booking.time}</p>
                          <p className="text-sm font-medium text-gray-900">{formatCurrency(booking.price)}</p>
                          <p className="text-xs text-gray-500">Date: {booking.date} | ID: {booking.id}</p>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                            {booking.status}
                          </span>

                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEdit(booking)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(booking.id)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      {/* Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setShowModal(false)} />
            <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingBooking ? 'Edit Booking' : 'New Booking'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      value={formData.customer_name}
                      onChange={(e) => setFormData(prev => ({...prev, customer_name: e.target.value}))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Service
                    </label>
                    <select
                      value={formData.service}
                      onChange={(e) => {
                        const selectedService = services.find(s => s.name === e.target.value);
                        setFormData(prev => ({
                          ...prev, 
                          service: e.target.value,
                          price: selectedService ? selectedService.price.toString() : ''
                        }));
                      }}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select a service</option>
                      {services.map(service => (
                        <option key={service.name} value={service.name}>{service.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (₺)
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({...prev, price: e.target.value}))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time
                    </label>
                    <select
                      value={formData.time}
                      onChange={(e) => setFormData(prev => ({...prev, time: e.target.value}))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select time</option>
                      {timeSlots.map(time => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({...prev, status: e.target.value as any}))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setEditingBooking(null);
                        setFormData({
                          customer_name: '',
                          service: '',
                          price: '',
                          time: '',
                          status: 'scheduled'
                        });
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      {editingBooking ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default BookingCalendar;