import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Plus, Edit2, Trash2, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { bookingService, customerService } from '../services/supabaseServices';
import type { Booking, Customer, User as UserType } from '../lib/supabase';

interface BookingCalendarProps {
  currentUser: UserType;
}

const BookingCalendar: React.FC<BookingCalendarProps> = ({ currentUser }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [view, setView] = useState<'calendar' | 'day'>('calendar');
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

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load bookings for selected date
      const dayBookings = await bookingService.getBookingsByDate(
        selectedDate, 
        currentUser.role === 'Barber' ? currentUser.id : undefined
      );
      
      // Load customers
      const allCustomers = await customerService.getAllCustomers(
        currentUser.role === 'Barber' ? currentUser.id : undefined
      );
      
      setBookings(dayBookings);
      setCustomers(allCustomers);
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMonthlyBookings = async () => {
    try {
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      const monthBookings = await bookingService.getBookingsByDateRange(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
        currentUser.role === 'Barber' ? currentUser.id : undefined
      );
      
      setMonthlyBookings(monthBookings);
    } catch (error) {
      console.error('Error loading monthly bookings:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const bookingData = {
        customer_name: formData.customer_name,
        service: formData.service,
        price: Number(formData.price),
        date: selectedDate,
        time: formData.time,
        status: formData.status,
        user_id: currentUser.id
      };

      if (editingBooking) {
        // Update existing booking
        const updated = await bookingService.updateBooking(editingBooking.id, bookingData);
        if (updated) {
          setBookings(prev => prev.map(b => b.id === editingBooking.id ? updated : b));
        }
      } else {
        // Create new booking
        const newBooking = await bookingService.createBooking(bookingData);
        if (newBooking) {
          setBookings(prev => [...prev, newBooking]);
          
          // Update customer's last visit
          const customer = customers.find(c => c.name === formData.customer_name);
          if (customer) {
            await customerService.updateCustomer(customer.id, { last_visit: selectedDate });
          } else {
            // Create new customer if they don't exist
            await customerService.createCustomer({
              name: formData.customer_name,
              last_visit: selectedDate,
              user_id: currentUser.id
            });
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
      
      // Reload data to get updated customers list
      await loadData();
    } catch (error) {
      console.error('Error saving booking:', error);
    }
  };

  const handleEdit = (booking: Booking) => {
    setEditingBooking(booking);
    setFormData({
      customer_name: booking.customer_name,
      service: booking.service,
      price: booking.price.toString(),
      time: booking.time,
      status: booking.status
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      const success = await bookingService.deleteBooking(id);
      if (success) {
        setBookings(prev => prev.filter(b => b.id !== id));
      }
    }
  };

  const handleStatusUpdate = async (id: string, status: 'completed' | 'cancelled') => {
    const updated = await bookingService.updateBooking(id, { status });
    if (updated) {
      setBookings(prev => prev.map(b => b.id === id ? updated : b));
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

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 md:p-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Appointments</h2>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md font-medium text-gray-800">All Appointments</h3>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            + New Booking
          </button>
        </div>
        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {bookings.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No appointments available</p>
            </div>
          ) : (
            bookings.map((booking) => (
              <div key={booking.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-md font-semibold">{booking.customer_name}</h4>
                    <p className="text-sm text-gray-600">{booking.service} - {booking.time}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(booking)}
                      className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(booking.id)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

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
                      Price (
                      ₺)
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
  );
};

export default BookingCalendar;
