import React, { useState, useEffect, useRef } from 'react';
import { ShopSettingsService } from '../services/shopSettings';
import { generateTimeSlots } from '../utils/timeSlots';
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
  UserPlus,
  Copy
} from 'lucide-react';
import { useModal } from './ui/ModalProvider';
import { supabase, type Booking } from '../lib/supabase';
import { EarningsService } from '../services/earningsService';
import { userService, customerService, bookingService } from '../services/completeDatabase';
import { NotificationsService, generateAppointmentReminder, generateBookingConfirmationEmail } from '../services/notifications';
import { InvoiceService } from '../services/invoiceService';
import { ServicePricingService, SERVICES } from '../services/servicePricing';
import { UserManagementService } from '../services/userManagementService';
import { getTodayLocal } from '../utils/dateUtils';
import { useLanguage } from '../i18n/LanguageContext';
import en from '../i18n/translations/en';
import tr from '../i18n/translations/tr';
import ar from '../i18n/translations/ar';
import fa from '../i18n/translations/fa';
import el from '../i18n/translations/el';
import ru from '../i18n/translations/ru';
// Simple translation hook for BookingManagement
const translationMap = { en, tr, ar, fa, el, ru };
function useT(language: string) {
  const translations = translationMap[language as keyof typeof translationMap] || en;
  return (key: string, fallback?: string) => {
    const keys = key.split('.');
    let value: any = translations;
    for (const k of keys) {
      value = value && value[k];
    }
    return value || fallback || key;
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
  onModalStateChange?: (isOpen: boolean) => void;
}

const BookingManagement: React.FC<BookingManagementProps> = ({ currentUser, onModalStateChange }) => {
  // For bottom sheet modal drag/swipe
  const bottomSheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const dragCurrentY = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [shopSettings, setShopSettings] = useState<any>(null);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const modal = useModal();
  // Only declare language if not already declared above
  // If 'language' is already declared, use a different variable name
  const langCtx = useLanguage();
  const t = useT(langCtx.language);
  const { language } = useLanguage();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState<'upcoming' | 'history' | 'all'>(
    currentUser.role === 'Barber' ? 'all' : 'upcoming'
  );
  const [showNotificationOptions, setShowNotificationOptions] = useState(false);
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
  useEffect(() => {
    const loadSettings = async () => {
      const settings = await ShopSettingsService.getSettings(currentUser.shop_name || 'Edge & Co');
      setShopSettings(settings);
      const open = (settings.opening_time || '09:00').slice(0,5);
      const close = (settings.closing_time || '20:00').slice(0,5);
      setTimeSlots(generateTimeSlots(open, close));
    };
    loadSettings();
  }, [currentUser.shop_name]);

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
      loadPersonalUpcomingBookings();
    } else if (currentView === 'history') {
      loadPersonalBookingHistory();
    } else {
      // Only Owner can see all bookings
      if (currentUser.role === 'Owner') {
        loadAllBookings();
      } else {
        // Fallback: show personal upcoming bookings
        loadPersonalUpcomingBookings();
      }
    }
  }, [currentView, currentUser]);

  // Load only the current user's upcoming bookings
  const loadPersonalUpcomingBookings = async () => {
    try {
      const today = getTodayLocal();
      const { data, error } = await supabase
        .from('bookings')
        .select(`*, users(name)`)
        .gte('date', today)
        .eq('user_id', currentUser.id)
        .order('date', { ascending: true })
        .order('time', { ascending: true });
      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error loading personal upcoming bookings:', error);
      modal.notify('Failed to load upcoming bookings', 'error');
    }
  };

  // Load only the current user's booking history
  const loadPersonalBookingHistory = async () => {
    try {
      const today = getTodayLocal();
      const { data, error } = await supabase
        .from('bookings')
        .select(`*, users(name)`)
        .lt('date', today)
        .eq('user_id', currentUser.id)
        .order('date', { ascending: false })
        .order('time', { ascending: false });
      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error loading personal booking history:', error);
      modal.notify('Failed to load booking history', 'error');
    }
  };

  const openBookingDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowBookingDetails(true);
  };

  const closeBookingDetails = () => {
    setShowBookingDetails(false);
    setSelectedBooking(null);
    setDragOffset(0);
  };
  // Prevent background scroll when modal is open
  useEffect(() => {
    if (showBookingDetails) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [showBookingDetails]);

  // Swipe-to-close gesture for mobile bottom sheet
  useEffect(() => {
    if (!showBookingDetails) return;
    const sheet = bottomSheetRef.current;
    if (!sheet) return;

    const handleTouchStart = (e: TouchEvent) => {
      dragStartY.current = e.touches[0].clientY;
      dragCurrentY.current = e.touches[0].clientY;
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (dragStartY.current !== null) {
        dragCurrentY.current = e.touches[0].clientY;
        const offset = Math.max(0, dragCurrentY.current - dragStartY.current); // Only allow downward drag
        setDragOffset(offset);
      }
    };
    const handleTouchEnd = () => {
      if (dragStartY.current !== null && dragCurrentY.current !== null) {
        if (dragCurrentY.current - dragStartY.current > 80) { // Downward swipe to close
          closeBookingDetails();
        } else {
          setDragOffset(0);
        }
      }
      dragStartY.current = null;
      dragCurrentY.current = null;
    };
    sheet.addEventListener('touchstart', handleTouchStart);
    sheet.addEventListener('touchmove', handleTouchMove);
    sheet.addEventListener('touchend', handleTouchEnd);
    return () => {
      sheet.removeEventListener('touchstart', handleTouchStart);
      sheet.removeEventListener('touchmove', handleTouchMove);
      sheet.removeEventListener('touchend', handleTouchEnd);
    };
  }, [showBookingDetails]);

  // Notify parent component when modal state changes
  useEffect(() => {
    onModalStateChange?.(showBookingDetails);
  }, [showBookingDetails, onModalStateChange]);

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

      // Reload current view
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
      // Resolve customer email from customers table when possible
      let toEmail = booking.customer_email || '';
      if (!toEmail && booking.customer_id) {
        try {
          const customer = await customerService.getCustomerById(booking.customer_id);
          toEmail = customer?.email || '';
        } catch (e) {
          console.error('Error fetching customer for notification:', e);
        }
      }

      if (!toEmail) {
        modal.notify('Customer email not available. Please update customer information first.', 'error');
        return;
      }

      // Use the booking confirmation template for customer notifications
      console.log('📧 Sending booking confirmation notification with language:', language);
      await NotificationsService.sendNotification({
        type: 'customer_confirmation',
        booking_id: booking.id,
        booking_data: booking,
        language,
        to: toEmail
      });
      modal.notify('Notification sent successfully!', 'success');
    } catch (error) {
      console.error('Error sending notification:', error);
      modal.notify('Failed to send notification', 'error');
    }
  };

  // Copy booking details to clipboard for WhatsApp
  const copyBookingToClipboard = async (booking: Booking) => {
    try {
      const formattedDate = formatDate(booking.date);
      const formattedTime = formatTime(booking.time);

      let whatsappText = `📅 *BOOKING CONFIRMATION - Edge & Co Barbershop*\n\n`;
      whatsappText += `👤 Customer: *${booking.customer_name}*\n`;
      whatsappText += `✂️ Service: ${booking.service}\n`;
      whatsappText += `💰 Price: ₺${booking.price}\n`;
      whatsappText += `📅 Date: ${formattedDate}\n`;
      whatsappText += `⏰ Time: ${formattedTime}\n`;

      if (booking.users?.name) {
        whatsappText += `👨‍💼 Barber: ${booking.users.name}\n`;
      }

      whatsappText += `📊 Status: ${booking.status}\n`;

      if (booking.notes) {
        whatsappText += `📝 Notes: ${booking.notes}\n`;
      }

      whatsappText += `\n🙏 Thank you for choosing Edge & Co!\n`;
      whatsappText += `📍 Your trusted barbershop\n`;
      whatsappText += `📞 +90 533 854 67 96\n\n`;
      whatsappText += `#EdgeAndCo #Barbershop #Booking`;

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

      modal.notify('Booking details copied to clipboard! Share via WhatsApp.', 'success');
    } catch (error) {
      console.error('Error copying booking to clipboard:', error);
      modal.notify('Failed to copy booking details', 'error');
    }
  };

  // Send invoice
  const sendInvoice = async (booking: Booking) => {
    try {
      // Fetch the latest booking data from the database
      const { data: latest, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', booking.id)
        .single();
      if (fetchError || !latest) {
        console.warn('Could not fetch latest booking, using current booking object.');
        await InvoiceService.sendInvoice(booking, language);
      } else {
        await InvoiceService.sendInvoice(latest, language);
      }
      modal.notify('Invoice sent successfully!', 'success');
    } catch (error) {
      console.error('Error sending invoice:', error);
      modal.notify('Failed to send invoice', 'error');
    }
  };

  // Copy invoice to clipboard for WhatsApp sharing
  const copyInvoiceToClipboard = async (booking: Booking) => {
    try {
      // Fetch the latest booking data from the database
      const { data: latest, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', booking.id)
        .single();
      if (fetchError || !latest) {
        console.warn('Could not fetch latest booking, using current booking object.');
        await InvoiceService.copyInvoiceToClipboard(booking, language);
      } else {
        await InvoiceService.copyInvoiceToClipboard(latest, language);
      }
      modal.notify('Invoice copied to clipboard! 📋', 'success');
    } catch (error) {
      console.error('Error copying invoice to clipboard:', error);
      modal.notify('Failed to copy invoice', 'error');
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

  // Create the booking. Do NOT store customer_email on bookings table; rely on customers.email.
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

      // Send notification to the staff member
      try {
        await NotificationsService.sendNotification({
          type: 'booking_created',
          booking_data: {
            ...booking,
            barber_name: selectedStaff.name,
            barber_email: selectedStaff.email
          }
        });
        console.log('Staff notification sent successfully');
      } catch (notificationError) {
        console.error('Failed to send staff notification:', notificationError);
        // Don't fail the booking creation if notification fails
      }

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

  // Handler to start editing a booking from All Bookings list
  const handleEditBooking = (booking: Booking) => {
    setBookingFormData({
      customer_name: booking.customer_name,
      customer_id: booking.customer_id || '',
      service_type: booking.service,
      staff_member: booking.user_id || '',
      booking_date: booking.date,
      booking_time: booking.time.length > 5 ? booking.time.substring(0,5) : booking.time,
      price: booking.price,
      notes: booking.notes || ''
    });
    // mark selectedBooking as the one we're editing
    setSelectedBooking(booking);
    setShowBookingForm(true);
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

  // Copy booking confirmation to clipboard for WhatsApp (i18n, with review link, no invoice/payment info)
  const copyBookingConfirmationToClipboard = async (booking: Booking) => {
    try {
      // Get translation for selected language
      const lang = langCtx.language || 'en';
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

  return (
    <div className="w-full max-w-full overflow-hidden">
      {/* Main Content - Hidden when modal is open */}
      {!showBookingDetails && (
        <>
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

      {/* Sticky Search Bar (present in all tabs) */}
      <div className="sticky top-0 z-20 bg-white pb-2 mb-4">
        <div className="relative">
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
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* View Tabs */}
      <div className="bg-white border border-gray-200 rounded-lg p-1 mb-6">
        <div className="overflow-x-auto">
          <div className="flex space-x-1 min-w-max">
            {currentUser.role === 'Owner' && (
              <button
                onClick={() => setCurrentView('all')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm min-w-[120px] justify-center ${
                  currentView === 'all'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Eye className="h-4 w-4" />
                All Bookings
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
                    {booking.users?.name && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="h-3.5 w-3.5 text-gray-400" />
                        <span>Barber: {booking.users.name}</span>
                      </div>
                    )}
                    
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
                      aria-label="Mark as paid"
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
                      aria-label="Mark as unpaid"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEditBooking(booking); }}
                    className="bg-gray-100 text-gray-700 p-2 rounded-lg hover:bg-gray-200 transition-colors shadow-sm ml-2"
                    title="Edit booking"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      </>
      )}

      {/* Booking Details Modal */}
      {showBookingDetails && selectedBooking && (
        <div
          className="fixed left-0 right-0 z-[1000] flex items-end md:items-center justify-center bg-black bg-opacity-60"
          style={{ top: 0, bottom: 0 }}
        >
          {/* Full-screen bottom sheet modal for mobile, centered modal for desktop */}
          <div
            ref={bottomSheetRef}
            className={`w-full md:max-w-md bg-white shadow-2xl rounded-t-2xl md:rounded-2xl max-h-[95vh] min-h-[60vh] overflow-y-auto relative flex flex-col transition-transform duration-300 ease-out ${dragOffset ? '' : 'animate-slide-up'}`}
            style={{
              transform: dragOffset ? `translateY(${dragOffset}px)` : 'translateY(0)',
              touchAction: 'none',
            }}
          >
            {/* Drag handle for swipe-to-close */}
            <div className="w-16 h-2 bg-gray-300 rounded-full mx-auto mt-3 mb-3 cursor-pointer" />
            {/* Close button always visible in top-right */}
            <button
              onClick={closeBookingDetails}
              className="absolute top-3 right-3 z-10 text-gray-500 hover:text-gray-700 bg-white bg-opacity-80 rounded-full p-2 shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Close booking details"
            >
              <X className="h-6 w-6" />
            </button>
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="bg-white bg-opacity-20 p-2 rounded-full">
                  <CalendarIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedBooking.customer_name}</h3>
                  <p className="text-blue-100 text-sm">Booking Details</p>
                </div>
              </div>
            </div>
            {/* Booking Content */}
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
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
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Service & Price</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">₺{selectedBooking.price}</div>
                      <div className="text-sm text-gray-500">{selectedBooking.service}</div>
                    </div>
                  </div>
                  {selectedBooking.users?.name && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Barber</span>
                      </div>
                      <span className="font-medium">{selectedBooking.users.name}</span>
                    </div>
                  )}
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
                    setSelectedBooking(selectedBooking);
                    setShowNotificationOptions(true);
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
                  <Mail className="h-4 w-4" />
                  Send Invoice (Email)
                </button>
                <button
                  onClick={() => {
                    copyInvoiceToClipboard(selectedBooking);
                    closeBookingDetails();
                  }}
                  className="flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  <Copy className="h-4 w-4" />
                  Copy Invoice (WhatsApp)
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
                <button onClick={() => setShowBookingForm(false)} className="text-gray-400 hover:text-gray-600" aria-label="Close booking form">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  // If selectedBooking is set, update existing booking
                  if (selectedBooking) {
                    const updates = {
                      customer_name: bookingFormData.customer_name,
                      customer_id: bookingFormData.customer_id || undefined,
                      service: bookingFormData.service_type,
                      price: bookingFormData.price,
                      date: bookingFormData.booking_date,
                      time: bookingFormData.booking_time,
                      notes: bookingFormData.notes
                    };
                    const updated = await bookingService.updateBooking(selectedBooking.id, updates);
                    if (updated) {
                      modal.notify('Booking updated successfully!', 'success');
                      // Refresh bookings in current view
                      if (currentView === 'upcoming') await loadUpcomingBookings();
                      else if (currentView === 'history') await loadBookingHistory();
                      else await loadAllBookings();
                    }
                    setSelectedBooking(null);
                    setShowBookingForm(false);
                    return;
                  }

                  // Otherwise create new booking
                  await createBooking();
                } catch (err) {
                  console.error('Error saving booking:', err);
                  modal.notify('Failed to save booking', 'error');
                }
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    value={bookingFormData.customer_name}
                    onChange={(e) => setBookingFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                    className="w-full p-2 border rounded-lg"
                    required
                    placeholder="Enter customer name"
                    aria-label="Customer name"
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
                    aria-label="Select existing customer"
                  >
                    <option value="">Select existing customer...</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>{customer.name}</option>
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
                    aria-label="Select staff member"
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
                      aria-label="Booking date"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                    <select
                      value={bookingFormData.booking_time}
                      onChange={(e) => setBookingFormData(prev => ({ ...prev, booking_time: e.target.value }))}
                      className="w-full p-2 border rounded-lg"
                      required
                      aria-label="Select booking time"
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
                    placeholder="0.00"
                    aria-label="Price in Turkish Lira"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={bookingFormData.notes}
                    onChange={(e) => setBookingFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full p-2 border rounded-lg"
                    rows={3}
                    placeholder="Add any additional notes..."
                    aria-label="Booking notes"
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    {selectedBooking ? 'Update Booking' : 'Create Booking'}
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

      {/* Notification Options Modal */}
      {showNotificationOptions && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-[1200] px-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mt-8 sm:mt-16 animate-fade-in-top">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white bg-opacity-20 p-2 rounded-full">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Send Notification</h3>
                    <p className="text-blue-100 text-sm">Choose how to notify {selectedBooking.customer_name}</p>
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
                    await sendCustomerNotification(selectedBooking);
                    setShowNotificationOptions(false);
                    closeBookingDetails();
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
                    await copyBookingConfirmationToClipboard(selectedBooking);
                    setShowNotificationOptions(false);
                    closeBookingDetails();
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
                  onClick={() => setShowNotificationOptions(false)}
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
  );
};

export default BookingManagement;
