import React, { useState, useEffect, useRef } from 'react';
import { useModal } from './ui/ModalProvider';
import { UserPlus, Calendar, Clock, User, Phone, Mail, Save, X } from 'lucide-react';
import { UserManagementService } from '../services/userManagementService';
import { SERVICES, ServicePricingService } from '../services/servicePricing';
import { EarningsService } from '../services/earningsService';
import { supabase } from '../lib/supabase';
import { customerService, type Customer } from '../services/completeDatabase';

interface Staff {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
}

interface BookingData {
  customer_name: string;
  customer_id?: string;
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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Customer search state
  const [customerSearchInput, setCustomerSearchInput] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const customerInputRef = useRef<HTMLDivElement>(null);
  
  const [bookingData, setBookingData] = useState<BookingData>({
    customer_name: '',
    service_type: 'Haircut',
    staff_member: '',
    booking_date: new Date().toISOString().split('T')[0],
    booking_time: '09:00',
    amount: ServicePricingService.getServicePrice('Haircut')
  });

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

  // Click outside to close customer dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customerInputRef.current && !customerInputRef.current.contains(event.target as Node)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load staff members and customers when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        // Sync staff first
        await UserManagementService.syncStaffToCurrentShop(currentUser.shop_name);
        // Load staff members
        const staff = await UserManagementService.getStaffMembers(currentUser.shop_name);
        setStaffMembers(staff);
        
        // Load customers
        const allCustomers = await customerService.getCustomers();
        setCustomers(allCustomers);
        
        // If staff found, set first one as default
        if (staff.length > 0) {
          setBookingData(prev => ({ ...prev, staff_member: staff[0].name }));
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    loadData();
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex z-[1200] modal-top p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => { setShowBookingForm(false); setCustomerSearchInput(''); setShowCustomerDropdown(false); }} />
          <div 
            className="bg-white rounded-2xl shadow-lg w-full max-w-md overflow-hidden transform transition-transform duration-300 ease-out my-auto"
          >
            <div className="px-6 pb-6 pt-6 overflow-y-auto max-h-[90vh]">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Booking for Staff</h3>
              
              <div className="space-y-4">
                <div className="relative" ref={customerInputRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
                  <input
                    type="text"
                    value={customerSearchInput || bookingData.customer_name}
                    onChange={(e) => {
                      const searchValue = e.target.value;
                      setCustomerSearchInput(searchValue);
                      setBookingData(prev => ({ ...prev, customer_name: searchValue, customer_id: undefined }));
                      
                      // Filter customers as user types
                      if (searchValue.trim()) {
                        const filtered = customers
                          .filter(c => c.name.toLowerCase().includes(searchValue.toLowerCase()))
                          .sort((a, b) => a.name.localeCompare(b.name));
                        setFilteredCustomers(filtered);
                        setShowCustomerDropdown(true);
                      } else {
                        setFilteredCustomers([]);
                        setShowCustomerDropdown(false);
                      }
                    }}
                    onFocus={() => {
                      if (customerSearchInput || bookingData.customer_name) {
                        const filtered = customers
                          .filter(c => c.name.toLowerCase().includes((customerSearchInput || bookingData.customer_name).toLowerCase()))
                          .sort((a, b) => a.name.localeCompare(b.name));
                        setFilteredCustomers(filtered);
                        setShowCustomerDropdown(true);
                      }
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Type customer name..."
                    required
                    autoComplete="off"
                    autoFocus
                    aria-label="Customer name"
                  />
                  
                  {/* Filtered customer dropdown */}
                  {showCustomerDropdown && filteredCustomers.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {filteredCustomers.map(customer => (
                        <div
                          key={customer.id}
                          className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setBookingData(prev => ({
                              ...prev,
                              customer_id: customer.id,
                              customer_name: customer.name
                            }));
                            setCustomerSearchInput('');
                            setShowCustomerDropdown(false);
                          }}
                        >
                          <div className="font-medium text-gray-900">{customer.name}</div>
                          {customer.phone && (
                            <div className="text-xs text-gray-500">{customer.phone}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
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
                  onClick={() => { setShowBookingForm(false); setCustomerSearchInput(''); setShowCustomerDropdown(false); }}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
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

export default OwnerBooking;
