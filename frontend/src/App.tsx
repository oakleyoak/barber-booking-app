import React, { useState, useEffect } from 'react';
import BookingCalendar from './components/BookingCalendar';
import BookingModal from './components/BookingModal';
import EarningsDashboard from './components/EarningsDashboard';
import { Booking, BookingCreate, BookingUpdate, EarningsSummary, WeeklyEarnings } from './types';
import { bookingService, earningsService } from './services/api';
import { useBookings } from './hooks/useBookings';
import { Calendar, Plus, BarChart3 } from 'lucide-react';
import './App.css';

function App() {
  const { bookings, loading, refreshBookings } = useBookings();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDashboard, setShowDashboard] = useState(true);
  
  // Earnings state
  const [dailyEarnings, setDailyEarnings] = useState<EarningsSummary | undefined>();
  const [weeklyEarnings, setWeeklyEarnings] = useState<WeeklyEarnings | undefined>();
  const [earningsLoading, setEarningsLoading] = useState(false);

  // Load earnings data
  useEffect(() => {
    const loadEarnings = async () => {
      setEarningsLoading(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        const [daily, weekly] = await Promise.all([
          earningsService.getDailyEarnings(today),
          earningsService.getCurrentWeekEarnings()
        ]);
        setDailyEarnings(daily);
        setWeeklyEarnings(weekly);
      } catch (error) {
        console.error('Failed to load earnings:', error);
      } finally {
        setEarningsLoading(false);
      }
    };

    loadEarnings();
  }, [bookings]); // Reload when bookings change

  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedBooking(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleCreateBooking = () => {
    setSelectedDate(new Date());
    setSelectedBooking(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (data: BookingCreate | BookingUpdate) => {
    try {
      if (modalMode === 'create') {
        await bookingService.createBooking(data as BookingCreate);
      } else if (selectedBooking) {
        await bookingService.updateBooking(selectedBooking.id, data as BookingUpdate);
      }
      refreshBookings();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to save booking:', error);
      throw error; // Re-throw to show error in modal
    }
  };

  const handleEventDrop = async (booking: Booking, newStart: Date, newEnd: Date) => {
    const updateData: BookingUpdate = {
      start_time: newStart.toISOString(),
      end_time: newEnd.toISOString()
    };
    await bookingService.updateBooking(booking.id, updateData);
  };

  const handleDeleteBooking = async (bookingId: number) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        await bookingService.deleteBooking(bookingId);
        refreshBookings();
        setIsModalOpen(false);
      } catch (error) {
        console.error('Failed to delete booking:', error);
      }
    }
  };

  const getModalInitialData = (): BookingCreate | BookingUpdate | null => {
    if (modalMode === 'edit' && selectedBooking) {
      return {
        client_name: selectedBooking.client_name,
        start_time: selectedBooking.start_time.slice(0, 16), // Remove timezone for datetime-local input
        end_time: selectedBooking.end_time.slice(0, 16),
        price: selectedBooking.price,
        notes: selectedBooking.notes || '',
        location: selectedBooking.location || '',
        status: selectedBooking.status
      };
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">
                Booking Management
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowDashboard(!showDashboard)}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  showDashboard
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Dashboard
              </button>
              
              <button
                onClick={handleCreateBooking}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Booking
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <BookingCalendar
              bookings={bookings}
              onBookingClick={handleBookingClick}
              onDateClick={handleDateClick}
              onEventDrop={handleEventDrop}
              refreshBookings={refreshBookings}
            />
          </div>

          {/* Dashboard */}
          {showDashboard && (
            <div className="lg:col-span-1">
              <EarningsDashboard
                dailyEarnings={dailyEarnings}
                weeklyEarnings={weeklyEarnings}
                loading={earningsLoading}
              />
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
            <div className="bg-white rounded-lg p-6">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                Loading bookings...
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={getModalInitialData()}
        mode={modalMode}
        selectedDate={selectedDate}
      />
    </div>
  );
}

export default App;
