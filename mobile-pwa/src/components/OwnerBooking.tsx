import React, { useState, useEffect } from 'react';
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
}

const OwnerBooking: React.FC<OwnerBookingProps> = ({ currentUser, onBookingCreated }) => {
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookingData, setBookingData] = useState<BookingData>({
    customer_name: '',
    service_type: 'Haircut',
    staff_member: '',
    booking_date: new Date().toISOString().split('T')[0],
    booking_time: '09:00',
    amount: 200
  });

  // Time slots for booking
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'
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

  // Handle form submission
  const handleSubmit = async () => {
    if (!bookingData.customer_name.trim() || !bookingData.staff_member) {
      alert('Please fill in customer name and select a staff member');
      return;
    }

    setLoading(true);
    
    try {
      // First, check if customer exists in customers table
      let customerId = null;
      const { data: existingCustomers } = await supabase
        .from('customers')
        .select('id')
        .eq('name', bookingData.customer_name)
        .single();

      if (existingCustomers) {
        customerId = existingCustomers.id;
      } else {
        // Create new customer if not exists
        const { data: newCustomer } = await supabase
          .from('customers')
          .insert({
            name: bookingData.customer_name,
            phone: '', // We don't have phone in this form
            email: ''  // We don't have email in this form
          })
          .select('id')
          .single();
        
        if (newCustomer) {
          customerId = newCustomer.id;
        }
      }

      // Get staff member user_id
      const staffMember = staffMembers.find(staff => staff.name === bookingData.staff_member);
      const userId = staffMember?.id || currentUser.id;

      // Save booking to Supabase bookings table
      const { error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: userId,
          customer_id: customerId,
          customer_name: bookingData.customer_name,
          service: bookingData.service_type,
          price: bookingData.amount,
          date: new Date(`${bookingData.booking_date}T${bookingData.booking_time}`).toISOString(),
          status: 'pending', // Default to pending instead of completed
          payment_status: 'unpaid', // Default to unpaid
          created_by: currentUser.id
        });

      if (bookingError) {
        throw bookingError;
      }

      // ALSO add to earnings service for immediate display and local tracking
      EarningsService.addTransaction(currentUser.shop_name, {
        service: `${bookingData.service_type} - ${bookingData.customer_name}`,
        customer: bookingData.customer_name,
        date: new Date(`${bookingData.booking_date}T${bookingData.booking_time}`).toISOString(),
        amount: bookingData.amount,
        barber: bookingData.staff_member,
        commission: 60, // Default commission
        status: 'pending' // Start as pending, not completed
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
      alert('Booking created successfully!');
      
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to create booking. Please try again.');
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add New Booking for Staff</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                <input
                  type="text"
                  value={bookingData.customer_name}
                  onChange={(e) => setBookingData(prev => ({ ...prev, customer_name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Enter customer name"
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
      )}
    </div>
  );
};

export default OwnerBooking;
