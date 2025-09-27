import React, { useState, useEffect, useRef } from 'react';
import { useModal } from './ui/ModalProvider';
import { UserPlus, Calendar, Clock, User, Phone, Mail, Save, X } from 'lucide-react';
import { UserManagementService } from '../services/userManagementService';
import { SERVICES, ServicePricingService } from '../services/servicePricing';
import { EarningsService } from '../services/earningsService';
import { supabase } from '../lib/supabase';

interface Staff {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
}

interface BookingData {
  customer_name: string;
  service_type: string;
  staff_member: string;
  booking_date: string;
  booking_time: string;
  amount: number;
}

interface OwnerBookingProps {
  currentUser: {
    id?: string;
    name: string;
    email: string;
    role: string;
    shop_name: string;
  };
  onBookingCreated: () => void;
  onModalStateChange?: (isOpen: boolean) => void;
}

const OwnerBooking: React.FC<OwnerBookingProps> = ({ currentUser, onBookingCreated, onModalStateChange }) => {
  const modal = useModal();
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookingData, setBookingData] = useState<BookingData>({
    customer_name: '',
    service_type: 'Haircut',
    staff_member: '',
    booking_date: new Date().toISOString().split('T')[0],
    booking_time: '09:00',
    amount: ServicePricingService.getServicePrice('Haircut')
  });

  // For bottom sheet modal drag/swipe
  const bottomSheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const dragCurrentY = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  // Time slots for booking
  const timeSlots = [
    '09:00', '09:15', '09:30', '09:45',
    '10:00', '10:15', '10:30', '10:45',
    '11:00', '11:15', '11:30', '11:45',
    '12:00', '12:15', '12:30', '12:45',
    '13:00', '13:15', '13:30', '13:45',
    '14:00', '14:15', '14:30', '14:45',
    '15:00', '15:15', '15:30', '15:45',
    '16:00', '16:15', '16:30', '16:45',
    '17:00', '17:15', '17:30', '17:45',
    '18:00'
  ];

  // Use the same service options as BookingCalendar
  const serviceOptions = SERVICES;

  // Load staff members when component mounts
  useEffect(() => {
    const loadStaff = async () => {
      try {
        // Sync staff first
        await UserManagementService.syncStaffToCurrentShop(currentUser.shop_name);
        // Load staff members
        const staff = await UserManagementService.getStaffMembers(currentUser.shop_name);
        setStaffMembers(staff);
        
        // If staff found, set first one as default
        if (staff.length > 0) {
          setBookingData(prev => ({ ...prev, staff_member: staff[0].name }));
        }
      } catch (error) {
        console.error('Error loading staff:', error);
      }
    };
    
    loadStaff();
  }, [currentUser.shop_name]);

  // Modal state management for body scroll prevention and navigation integration
  useEffect(() => {
    if (showBookingForm) {
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
  }, [showBookingForm, onModalStateChange]);

  // Touch event handlers for swipe-to-close functionality
  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStartY.current === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - dragStartY.current;
    if (diff > 0) { // Only allow downward drag
      dragCurrentY.current = currentY;
      setDragOffset(Math.min(diff, 300)); // Limit drag distance
    }
  };

  const handleTouchEnd = () => {
    if (dragOffset > 150) { // If dragged more than 150px, close modal
      setShowBookingForm(false);
      setBookingData({
        customer_name: '',
        service_type: 'Haircut',
        staff_member: staffMembers.length > 0 ? staffMembers[0].name : '',
        booking_date: new Date().toISOString().split('T')[0],
        booking_time: '09:00',
        amount: ServicePricingService.getServicePrice('Haircut')
      });
    }
    setDragOffset(0);
    dragStartY.current = null;
    dragCurrentY.current = null;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!bookingData.customer_name.trim() || !bookingData.staff_member) {
      modal.notify('Please fill in customer name and select a staff member', 'info');
      return;
    }

    setLoading(true);
    
    try {
      // First, check if customer exists in customers table
      let customerId = null;
      const { data: existingCustomers, error: customerError } = await supabase
        .from('customers')
        .select('id')
        .eq('name', bookingData.customer_name)
        .maybeSingle();

      if (existingCustomers && !customerError) {
        customerId = existingCustomers.id;
      } else {
        // Create new customer if not exists
        const { data: newCustomer, error: createError } = await supabase
          .from('customers')
          .insert({
            name: bookingData.customer_name,
            phone: '', // We don't have phone in this form
            email: ''  // We don't have email in this form
          })
          .select('id')
          .single();
        
        if (newCustomer && !createError) {
          customerId = newCustomer.id;
        } else {
          console.error('Error creating customer:', createError);
        }
      }

      // Make sure we have a valid customer ID
      if (!customerId) {
        throw new Error('Failed to create or find customer');
      }

      // Get staff member user_id
      const staffMember = staffMembers.find(staff => staff.name === bookingData.staff_member);
      const userId = staffMember?.id || currentUser.id;

      // Make sure we have a valid user ID
      if (!userId) {
        throw new Error('No valid user ID found for booking');
      }

      // Generate a UUID for the booking ID
      const bookingId = crypto.randomUUID();

      // Save booking to Supabase bookings table with separate date and time
      const { data: bookingResult, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          id: bookingId,
          user_id: userId,
          customer_id: customerId,
          customer_name: bookingData.customer_name,
          service: bookingData.service_type,
          price: bookingData.amount,
          date: bookingData.booking_date,
          time: bookingData.booking_time,
          status: 'scheduled'
        })
        .select('*')
        .single();

      if (bookingError) {
        console.error('Booking insertion error:', bookingError);
        throw bookingError;
      }

      // ALSO add to earnings service for immediate display and local tracking
      EarningsService.addTransaction(currentUser.id!, {
        service: `${bookingData.service_type} - ${bookingData.customer_name}`,
        customer_name: bookingData.customer_name,
        amount: bookingData.amount,
        commission: 60, // Default commission
      });

      // Reset form
      setBookingData({
        customer_name: '',
        service_type: 'Haircut',
        staff_member: staffMembers[0]?.name || '',
        booking_date: new Date().toISOString().split('T')[0],
        booking_time: '09:00',
        amount: 200
      });

  setShowBookingForm(false);
  onBookingCreated();
  modal.notify('Booking created successfully!', 'success');
      
    } catch (error) {
      console.error('Error creating booking:', error);
  modal.notify('Failed to create booking. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Book Staff</h2>
        <p className="text-gray-600">Create bookings for your staff members</p>
      </div>

      {!showBookingForm ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-center py-8">
            <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Staff Booking System</h3>
            <p className="text-gray-500 mb-4">Create appointments for your barbers and staff</p>
            
            {staffMembers.length === 0 ? (
              <div className="text-center text-gray-500 mb-4">
                <p>No staff members found. Please add staff members first in the Admin panel.</p>
              </div>
            ) : (
              <div className="mb-4">
                <p className="text-sm text-gray-600">Available Staff: {staffMembers.map(s => s.name).join(', ')}</p>
              </div>
            )}
            
            <button 
              onClick={() => setShowBookingForm(true)}
              disabled={staffMembers.length === 0}
              className={`px-6 py-2 rounded-lg transition-colors ${
                staffMembers.length === 0 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Create Staff Booking
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black bg-opacity-50 z-[1200]" onClick={() => setShowBookingForm(false)} />
          
          {/* Modal */}
          <div
            ref={bottomSheetRef}
            className="fixed z-[1200] w-full md:max-w-md md:mx-auto md:inset-x-0 md:top-4 bottom-0 left-0 right-0 bg-white rounded-t-lg md:rounded-lg shadow-xl max-h-[90vh] overflow-hidden mt-4"
            style={{
              transform: `translateY(${dragOffset}px)`,
              transition: dragOffset === 0 ? 'transform 0.3s ease-out' : 'none'
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Drag handle for mobile */}
            <div className="md:hidden w-full flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
            </div>

            {/* Modal content */}
            <div className="px-6 pb-6 max-h-[85vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4 pt-2 md:pt-0">Add New Booking for Staff</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={bookingData.customer_name}
                    onChange={(e) => setBookingData(prev => ({ ...prev, customer_name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Enter customer name"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Staff Member</label>
                  <select
                    value={bookingData.staff_member}
                    onChange={(e) => setBookingData(prev => ({ ...prev, staff_member: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    {staffMembers.map(staff => (
                      <option key={staff.id} value={staff.name}>
                        {staff.name} ({staff.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                  <select
                    value={bookingData.service_type}
                    onChange={(e) => {
                      const service = serviceOptions.find(s => s.name === e.target.value);
                      setBookingData(prev => ({
                        ...prev,
                        service_type: e.target.value,
                        amount: service?.price || 200
                      }));
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    {serviceOptions.map(service => (
                      <option key={service.name} value={service.name}>
                        {ServicePricingService.formatServiceDisplay(service)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={bookingData.booking_date}
                    onChange={(e) => setBookingData(prev => ({ ...prev, booking_date: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <select
                    value={bookingData.booking_time}
                    onChange={(e) => setBookingData(prev => ({ ...prev, booking_time: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    {timeSlots.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    type="number"
                    value={bookingData.amount}
                    onChange={(e) => setBookingData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSubmit}
                  disabled={!bookingData.customer_name.trim() || !bookingData.staff_member}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg"
                >
                  Add Booking
                </button>
                <button
                  onClick={() => setShowBookingForm(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OwnerBooking;
