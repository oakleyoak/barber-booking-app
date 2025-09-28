import React, { useState, useEffect, useRef } from 'react';
import { ShopSettingsService } from '../services/shopSettings';
import { generateTimeSlots } from '../utils/timeSlots';
import { useModal } from './ui/ModalProvider';
import { Calendar, Clock, User, Plus, Edit2, Trash2, Check, X, ChevronLeft, ChevronRight, List, Grid3X3, RefreshCw, Mail, Receipt, CheckSquare, XCircle, Copy } from 'lucide-react';
import { bookingService, customerService } from '../services/completeDatabase';
import { NotificationsService } from '../services/notifications';
import { InvoiceService } from '../services/invoiceService';
import { supabase } from '../lib/supabase';
import { getTodayLocal, getLocalDateString } from '../utils/dateUtils';
import { useLanguage } from '../i18n/LanguageContext';
import type { Booking, Customer, User as UserType } from '../lib/supabase';

interface BookingCalendarProps {
  currentUser: UserType;
  onModalStateChange?: (isOpen: boolean) => void;
}

const BookingCalendar: React.FC<BookingCalendarProps> = ({ currentUser, onModalStateChange }) => {
  // Remove bottom sheet modal logic for top-aligned modals
  // Always ensure shop settings exist in Supabase and use them for slot generation
  useEffect(() => {
    const ensureSettingsAndSlots = async () => {
      const shopName = currentUser.shop_name || 'Edge & Co';
      let settings = await ShopSettingsService.getSettings(shopName);
      if (!settings || !settings.opening_time || !settings.closing_time) {
        // Create default settings in Supabase if missing
        await ShopSettingsService.saveSettings(shopName, {
          shop_name: shopName,
          opening_time: '09:00',
          closing_time: '20:00'
        });
        settings = await ShopSettingsService.getSettings(shopName);
      }
      setShopSettings(settings);
      const open = settings.opening_time ? settings.opening_time.slice(0,5) : '09:00';
      const close = settings.closing_time ? settings.closing_time.slice(0,5) : '20:00';
      const slots = generateTimeSlots(open, close);
      setTimeSlots(slots);
    };
    ensureSettingsAndSlots();
  }, [currentUser.shop_name]);
  const [shopSettings, setShopSettings] = useState<any>(null);
  const modal = useModal();
  const { language } = useLanguage();
  const [selectedDate, setSelectedDate] = useState(() => getTodayLocal());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [view, setView] = useState<'calendar' | 'day' | 'list'>('day');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [monthlyBookings, setMonthlyBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [showNotificationOptions, setShowNotificationOptions] = useState(false);
  const [selectedBookingForNotification, setSelectedBookingForNotification] = useState<Booking | null>(null);
  type FormData = {
    customer_name: string;
    customer_id?: string;
    service: string;
    price: string;
    date: string;
    time: string;
    status: 'scheduled' | 'completed' | 'cancelled';
    notes: string;
  };

  const [formData, setFormData] = useState<FormData>({
    customer_name: '',
    customer_id: undefined,
    service: '',
    price: '',
    date: selectedDate,
    time: '',
    status: 'scheduled',
    notes: ''
  });

  const services = [
    { name: 'Haircut', duration: 45, price: 700 },
    { name: 'Beard trim', duration: 15, price: 300 },
    { name: 'Blowdry', duration: 30, price: 500 },
    { name: 'Face mask', duration: 30, price: 200 },
    { name: 'Colour', duration: 60, price: 1000 },
    { name: 'Wax', duration: 60, price: 500 },
    { name: 'Massage', duration: 45, price: 700 },
    { name: 'Shave', duration: 30, price: 500 }
  ];

  // Always start with today's date when component mounts
  useEffect(() => {
    const today = getTodayLocal();
    setSelectedDate(today);
    setCurrentMonth(new Date());
  }, []);

  useEffect(() => {
    loadData();
    loadMonthlyBookings();
  }, [selectedDate, currentMonth]);

  useEffect(() => {
    if (view === 'day' || view === 'list') {
      loadData();
    }
  }, [view, selectedDate]);

  // Modal state management for body scroll prevention and navigation integration
  useEffect(() => {
    const hasModalOpen = showModal || showNotificationOptions;
    if (hasModalOpen) {
      document.body.style.overflow = 'hidden';
      onModalStateChange?.(true);
    } else {
      document.body.style.overflow = 'unset';
      onModalStateChange?.(false);
    }

    return () => {
      document.body.style.overflow = 'unset';
      onModalStateChange?.(false);
    };
  }, [showModal, showNotificationOptions, onModalStateChange]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const userFilter = currentUser.id;
      const dayBookings = await bookingService.getBookingsByDate(selectedDate, userFilter);
      const allCustomers = await customerService.getCustomers(); // Remove userFilter to get all customers
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
      const userFilter = currentUser.id;
      const monthBookings = await bookingService.getBookingsByDateRange(
        getLocalDateString(startDate),
        getLocalDateString(endDate),
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
      const formattedTime = formData.time.length === 5 ? `${formData.time}:00` : formData.time;
      const bookingData = {
        customer_name: formData.customer_name,
  customer_id: formData.customer_id || undefined,
        service: formData.service,
        price: Number(formData.price),
        date: formData.date || selectedDate,
        time: formattedTime,
        status: formData.status,
  notes: formData.notes,
        user_id: currentUser.id
      };

      if (editingBooking) {
        const updated = await bookingService.updateBooking(editingBooking.id, bookingData);
        if (updated) {
          setBookings(prev => prev.map(b => b.id === editingBooking.id ? updated : b));
          setMonthlyBookings(prev => prev.map(b => b.id === editingBooking.id ? updated : b));
        }
      } else {
        const newBooking = await bookingService.createBooking(bookingData);
        if (newBooking) {
          setBookings(prev => [...prev, newBooking]);
          setMonthlyBookings(prev => [...prev, newBooking]);
          const customer = customers.find(c => c.name === formData.customer_name);
          if (customer) {
            await customerService.updateCustomer(customer.id, { last_visit: selectedDate });
          } else {
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

  setFormData({ customer_name: '', customer_id: undefined, service: '', price: '', date: selectedDate, time: '', status: 'scheduled', notes: '' });
      setEditingBooking(null);
      setShowModal(false);
      await loadData();
      await loadMonthlyBookings();
    } catch (error) {
      console.error('Error saving booking:', error);
      modal.notify('Failed to save booking. Please try again.', 'error');
    }
  };

  const handleEdit = (booking: Booking) => {
    const normalizedTime = booking.time.length > 5 ? booking.time.substring(0, 5) : booking.time;
    setEditingBooking(booking);
    setFormData({
          customer_name: booking.customer_name,
  customer_id: booking.customer_id || undefined,
      service: booking.service,
      price: booking.price.toString(),
      date: booking.date,
      time: normalizedTime,
      status: booking.status
  ,notes: booking.notes || ''
    });
    // update selected date so calendar highlights the booking's date while editing
    setSelectedDate(booking.date);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    const ok = await modal.confirm('Are you sure you want to delete this booking?');
    if (!ok) return;
    try {
          await bookingService.deleteBooking(id);
      setBookings(prev => prev.filter(b => b.id !== id));
      setMonthlyBookings(prev => prev.filter(b => b.id !== id));
    } catch (error) {
      console.error('Error deleting booking:', error);
      modal.notify('Failed to delete booking. Please try again.', 'error');
    }
  };

  const handleStatusUpdate = async (id: string, status: 'completed' | 'cancelled') => {
    try {
      const updated = await bookingService.updateBooking(id, { status });
      if (updated) {
        setBookings(prev => prev.map(b => b.id === id ? updated : b));
        setMonthlyBookings(prev => prev.map(b => b.id === id ? updated : b));
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      modal.notify('Failed to update booking status. Please try again.', 'error');
    }
  };

  const markAsPaid = async (bookingId: string) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({ payment_status: 'paid', payment_method: 'cash', payment_received_at: new Date().toISOString() })
        .eq('id', bookingId)
        .select('*')
        .single();

      if (error) throw error;

      if (data) {
        const updatedBooking = data as Booking;
        setBookings(prev => prev.map(b => (b.id === bookingId ? updatedBooking : b)));
        setMonthlyBookings(prev => prev.map(b => (b.id === bookingId ? updatedBooking : b)));
      }
      modal.notify('Booking marked as paid!', 'success');
    } catch (err) {
      console.error('Error marking as paid:', err);
      modal.notify('Failed to mark booking as paid', 'error');
    }
  };

  const markAsUnpaid = async (bookingId: string) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({ payment_status: 'pending', payment_method: null, payment_received_at: null })
        .eq('id', bookingId)
        .select('*')
        .single();

      if (error) throw error;

      if (data) {
        const updatedBooking = data as Booking;
        setBookings(prev => prev.map(b => (b.id === bookingId ? updatedBooking : b)));
        setMonthlyBookings(prev => prev.map(b => (b.id === bookingId ? updatedBooking : b)));
      }
      modal.notify('Payment status reverted to pending', 'success');
    } catch (err) {
      console.error('Error marking as unpaid:', err);
      modal.notify('Failed to revert payment status', 'error');
    }
  };

  const sendCustomerNotification = async (booking: Booking) => {
    try {
      // Always resolve customer's email from customers.email when possible
      let customerEmail = '';
      if (booking.customer_id) {
        try {
          const cust = await customerService.getCustomerById(booking.customer_id);
          customerEmail = cust?.email || '';
        } catch (e) {
          console.error('Error fetching customer email:', e);
        }
      }

      const toAddress = customerEmail || booking.customer_phone || '';
      if (!toAddress) {
        modal.notify('Customer email not available. Please update customer information first.', 'error');
        return;
      }

      const result = await NotificationsService.sendNotification({
        type: 'customer_notification',
        booking_id: booking.id,
        booking_data: booking,
        email_content: {
          to: toAddress,
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

  const sendInvoice = async (booking: Booking) => {
    try {
      // Resolve customer email from customers table
      let customerEmail = '';
      if (booking.customer_id) {
        try {
          const customer = await customerService.getCustomerById(booking.customer_id);
          customerEmail = customer?.email || '';
        } catch (error) {
          console.error('Error fetching customer email:', error);
        }
      }

      if (!customerEmail) {
        modal.notify('Customer email not available. Please update customer information first.', 'error');
        return;
      }

      // Pass booking through; InvoiceService now resolves email itself when creating invoice
      const bookingWithResolved = { ...booking, resolved_customer_email: customerEmail };
      const result = await InvoiceService.sendInvoice(bookingWithResolved, language);

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

  const copyInvoiceToClipboard = async (booking: Booking) => {
    try {
      const result = await InvoiceService.copyInvoiceToClipboard(booking);
      if (result.ok) {
        modal.notify('Invoice copied to clipboard! 📋', 'success');
      } else {
        modal.notify('Failed to copy invoice: ' + result.error, 'error');
      }
    } catch (err) {
      console.error('Error copying invoice to clipboard:', err);
      modal.notify('Failed to copy invoice', 'error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

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
    const pad = (n: number) => n.toString().padStart(2, '0');
    const localDateStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    return monthlyBookings.filter(booking => {
      if (booking.date !== localDateStr) return false;
      if (currentUser.role === 'Owner' || currentUser.role === 'Manager') return true;
      return booking.user_id === currentUser.id;
    });
  };

  const formatCurrency = (amount: number) => `₺${amount.toLocaleString('tr-TR')}`;
  const normalizeTime = (time: string) => time.length > 5 ? time.substring(0, 5) : time;

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

  // Copy booking confirmation to clipboard for WhatsApp (i18n, with review link, no invoice/payment info)
  const copyBookingConfirmationToClipboard = async (booking: Booking) => {
    try {
      // Get translation for selected language
      const lang = language || 'en';
      let t: any;
      try {
        t = (await import(`../i18n/translations/${lang}.ts`)).default;
      } catch {
        t = (await import(`../i18n/translations/en.ts`)).default;
      }
      const formattedDate = formatDate(booking.date);
      const formattedTime = formatTime(booking.time);
      let whatsappText = t.notification?.whatsappMessage
        ? t.notification.whatsappMessage
        : `Booking Confirmed!\nDate: {{date}}\nTime: {{time}}\nService: {{service}}\nBarber: {{barber}}\nPrice: {{price}} ₺\nThank you for choosing Edge & Co!\nReview: https://g.page/r/CQv1Qw1Qw1QwEAI/review`;
      whatsappText = whatsappText
        .replace(/{{customerName}}/g, booking.customer_name)
        .replace(/{{date}}/g, formattedDate)
        .replace(/{{time}}/g, formattedTime)
        .replace(/{{service}}/g, booking.service)
        .replace(/{{barber}}/g, booking.users?.name || 'Edge & Co Team')
        .replace(/{{price}}/g, booking.price);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(whatsappText);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = whatsappText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      modal.notify('Booking confirmation copied to clipboard! Share via WhatsApp.', 'success');
    } catch (error) {
      console.error('Error copying booking confirmation to clipboard:', error);
      modal.notify('Failed to copy booking confirmation', 'error');
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + (direction === 'prev' ? -1 : 1));
    setCurrentMonth(newMonth);
  };

  const selectDate = (date: Date) => {
    // Fix timezone issue - use local date formatting instead of ISO string
    setSelectedDate(getLocalDateString(date));
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
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Calendar</h2>
            <p className="text-sm text-gray-600 mt-1">
              {view === 'calendar' ? 'Monthly view' : 'Daily appointments'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button onClick={() => setView('calendar')} className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition ${view === 'calendar' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
                <Grid3X3 className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Calendar</span>
              </button>
              <button onClick={() => setView('day')} className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition ${view === 'day' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
                <List className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Day</span>
              </button>
            </div>
            <button onClick={() => setShowModal(true)} className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm" title="Create new booking">
              <Plus className="h-4 w-4" />
            </button>
            <button onClick={async () => { await loadData(); await loadMonthlyBookings(); }} className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm" title="Refresh data from Supabase">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {view === 'calendar' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
          <button onClick={() => navigateMonth('prev')} className="p-2 hover:bg-gray-100 rounded-lg transition" title="Previous month"><ChevronLeft className="h-5 w-5" /></button>
              <h3 className="text-lg font-semibold text-gray-900">{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
                <button onClick={() => navigateMonth('next')} className="p-2 hover:bg-gray-100 rounded-lg transition" title="Next month"><ChevronRight className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => <div key={i} className="p-2 text-center text-xs sm:text-sm font-medium text-gray-500">{day}</div>)}
              {getDaysInMonth(currentMonth).map((date, index) => {
                const dayBookings = getBookingsForDate(date);
                const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                return (
                  <button
                    key={index}
                    onClick={() => selectDate(date)}
                    className={`relative min-h-[80px] p-2 border rounded-lg text-left transition flex flex-col ${
                      isCurrentMonth
                        ? 'bg-white border-gray-200 hover:bg-gray-50'
                        : 'bg-gray-50 border-gray-100 text-gray-400'
                    }`}
                  >
                    <div className={`text-sm font-medium ${new Date().toDateString() === date.toDateString() ? 'bg-blue-600 text-white rounded-full h-6 w-6 flex items-center justify-center' : ''}`}>{date.getDate()}</div>
                    {dayBookings.length > 0 && (
                      <div className="absolute bottom-2 right-2 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full h-5 w-5 flex items-center justify-center">
                        {dayBookings.length}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {view === 'day' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
              <button onClick={() => { 
                const d = new Date(selectedDate); 
                d.setDate(d.getDate() - 1); 
                setSelectedDate(getLocalDateString(d));
              }} className="p-2 hover:bg-gray-200 rounded-lg transition" title="Previous day"><ChevronLeft className="h-5 w-5" /></button>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900">{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                <p className="text-sm text-gray-600">{bookings.length} appointment{bookings.length !== 1 ? 's' : ''}</p>
              </div>
              <button onClick={() => { 
                const d = new Date(selectedDate); 
                d.setDate(d.getDate() + 1); 
                setSelectedDate(getLocalDateString(d));
              }} className="p-2 hover:bg-gray-200 rounded-lg transition" title="Next day"><ChevronRight className="h-5 w-5" /></button>
            </div>
            <div className="space-y-2">
              {timeSlots.map(time => {
                const slotBookings = bookings.filter(b => normalizeTime(b.time) === time);
                return (
                  <div key={time} className="flex items-center p-3 border rounded-lg bg-gray-50">
                    <div className="w-16 text-sm font-medium text-gray-600">{time}</div>
                    <div className="flex-1 ml-4">
                      {slotBookings.length > 0 ? (
                        <div className="space-y-2">
                          {slotBookings.map(booking => (
                            <div
                              key={booking.id}
                              className="bg-white p-3 rounded-lg border shadow-sm cursor-pointer hover:bg-blue-50 transition-colors"
                              onClick={() => { setEditingBooking(booking); setShowModal(true); }}
                              title="Tap to view and manage booking"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900">{booking.customer_name}</h4>
                                  <p className="text-sm text-gray-600">{booking.service}</p>
                                  <p className="text-sm font-medium text-gray-900">{formatCurrency(booking.price)}</p>
                                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                      {booking.status}
                                    </span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                                      booking.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                                      booking.payment_status === 'failed' || booking.payment_status === 'refunded' ? 'bg-red-100 text-red-800' :
                                      'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {booking.payment_status?.replace('_', ' ') || 'Pending Payment'}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 ml-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedBookingForNotification(booking);
                                      setShowNotificationOptions(true);
                                    }}
                                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                    title="Send notification"
                                  >
                                    <Mail className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400 italic cursor-pointer hover:text-blue-600 hover:bg-blue-50 p-2 rounded transition-colors" onClick={() => { setFormData({ customer_name: '', customer_id: undefined, service: '', price: '', date: selectedDate, time: time, status: 'scheduled', notes: '' }); setShowModal(true); }}>
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
                            <button onClick={() => handleEdit(booking)} className="p-2 text-blue-600 hover:bg-blue-100 rounded" title="Edit booking">
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(booking.id)} className="p-2 text-red-600 hover:bg-red-100 rounded" title="Delete booking">
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

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex z-[1200] modal-top p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowModal(false)} />
            <div 
              className="bg-white rounded-2xl shadow-lg w-full max-w-md max-h-[85vh] overflow-hidden transform transition-transform duration-300 ease-out"
            >
              <div className="px-6 pb-6 pt-6 overflow-y-auto max-h-[calc(85vh-3rem)]">
                <h3 className="text-lg font-medium text-gray-900 mb-4">{editingBooking ? 'Edit Booking' : 'New Booking'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Existing Customer</label>
                    <select 
                      value={customers.find(c => c.name === formData.customer_name)?.id || ''}
                      onChange={(e) => {
                        const selectedCustomer = customers.find(c => c.id === e.target.value);
                        if (selectedCustomer) {
                          setFormData(prev => ({...prev, customer_name: selectedCustomer.name, customer_id: selectedCustomer.id, notes: (selectedCustomer as any).notes || ''}));
                        } else {
                          setFormData(prev => ({...prev, customer_id: undefined}));
                        }
                      }}
                      aria-label="Select existing customer"
                      title="Select existing customer"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select existing customer...</option>
                      {customers.map(customer => (
                        <option key={customer.id} value={customer.id}>{customer.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                    <input type="text" value={formData.customer_name} onChange={(e) => setFormData(prev => ({...prev, customer_name: e.target.value}))} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Or enter new customer name" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                    <select value={formData.service} onChange={(e) => { const s = services.find(s => s.name === e.target.value); setFormData(prev => ({ ...prev, service: e.target.value, price: s ? s.price.toString() : '' })); }} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required title="Select service">
                      <option value="">Select a service</option>
                      {services.map(s => <option key={s.name} value={s.name}>{s.name} - ₺{s.price}</option>)}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Price will auto-fill but can be customized below</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Custom Price (₺) *</label>
                    <input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData(prev => ({...prev, price: e.target.value}))} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required placeholder="Enter custom amount" />
                    <p className="text-xs text-gray-500 mt-1">Modify this amount as needed</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                      <input type="date" value={formData.date} onChange={(e) => setFormData(prev => ({...prev, date: e.target.value}))} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required title="Select booking date" placeholder="Select date" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                      <select value={formData.time} onChange={(e) => setFormData(prev => ({...prev, time: e.target.value}))} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required title="Select time slot">
                        <option value="">Select time</option>
                        {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select value={formData.status} onChange={(e) => setFormData(prev => ({...prev, status: e.target.value as any}))} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" title="Select booking status">
                      <option value="scheduled">Scheduled</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={() => { setShowModal(false); setEditingBooking(null); setFormData({ customer_name: '', customer_id: undefined, service: '', price: '', date: selectedDate, time: '', status: 'scheduled', notes: '' }); }} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">{editingBooking ? 'Update' : 'Create'}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Notification Options Modal */}
        {showNotificationOptions && selectedBookingForNotification && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex z-[1200] px-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full animate-fade-in-top mt-4 md:mt-8">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white bg-opacity-20 p-2 rounded-full">
                      <Mail className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Send Notification</h3>
                      <p className="text-blue-100 text-sm">Choose how to notify {selectedBookingForNotification.customer_name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowNotificationOptions(false)}
                    className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-colors"
                    aria-label="Close notification options"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Options */}
              <div className="p-6 space-y-4">
                <div className="space-y-3">
                  <button
                    onClick={async () => {
                      await sendCustomerNotification(selectedBookingForNotification);
                      setShowNotificationOptions(false);
                      setSelectedBookingForNotification(null);
                    }}
                    className="w-full flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                  >
                    <div className="bg-blue-600 p-2 rounded-full">
                      <Mail className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">Send via Email</div>
                    </div>
                  </button>

                  <button
                    onClick={async () => {
                      await copyBookingConfirmationToClipboard(selectedBookingForNotification);
                      setShowNotificationOptions(false);
                      setSelectedBookingForNotification(null);
                    }}
                    className="w-full flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors"
                  >
                    <div className="bg-green-600 p-2 rounded-full">
                      <Copy className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">Copy for WhatsApp</div>
                    </div>
                  </button>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowNotificationOptions(false);
                      setSelectedBookingForNotification(null);
                    }}
                    className="w-full py-2 px-4 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
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