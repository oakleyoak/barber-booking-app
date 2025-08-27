import React, { useState, useEffect } from 'react';
import { UserPlus, Calendar, Clock, User, Phone, Mail, Save, X } from 'lucide-react';
import { UserManagementService } from '../services/userManagementService';
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
  customer_phone: string;
  customer_email: string;
  service_type: string;
  staff_member: string;
  date: string;
  time: string;
  duration: number;
  price: number;
  notes: string;
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
    customer_phone: '',
    customer_email: '',
    service_type: 'Haircut',
    staff_member: '',
    date: '',
    time: '',
    duration: 30,
    price: 200,
    notes: ''
  });

  // Service options with Turkish pricing
  const services = [
    { name: 'Haircut', duration: 30, price: 200 },
    { name: 'Beard Trim', duration: 20, price: 150 },
    { name: 'Hair + Beard', duration: 45, price: 300 },
    { name: 'Hair Wash', duration: 15, price: 100 },
    { name: 'Styling', duration: 25, price: 180 },
    { name: 'Full Service', duration: 60, price: 400 }
  ];

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

  // Handle service selection
  const handleServiceChange = (serviceName: string) => {
    const service = services.find(s => s.name === serviceName);
    if (service) {
      setBookingData(prev => ({
        ...prev,
        service_type: serviceName,
        duration: service.duration,
        price: service.price
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bookingData.customer_name.trim() || !bookingData.customer_phone.trim() || 
        !bookingData.staff_member || !bookingData.date || !bookingData.time) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    
    try {
      // Create booking in Supabase
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          customer_name: bookingData.customer_name,
          customer_phone: bookingData.customer_phone,
          customer_email: bookingData.customer_email || null,
          service_type: bookingData.service_type,
          staff_member: bookingData.staff_member,
          date: bookingData.date,
          time: bookingData.time,
          duration: bookingData.duration,
          price: bookingData.price,
          notes: bookingData.notes || null,
          shop_name: currentUser.shop_name,
          status: 'confirmed',
          created_by: currentUser.name,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Reset form
      setBookingData({
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        service_type: 'Haircut',
        staff_member: staffMembers[0]?.name || '',
        date: '',
        time: '',
        duration: 30,
        price: 200,
        notes: ''
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
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Create New Booking</h3>
            <button
              onClick={() => setShowBookingForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={bookingData.customer_name}
                  onChange={(e) => setBookingData(prev => ({ ...prev, customer_name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter customer name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={bookingData.customer_phone}
                  onChange={(e) => setBookingData(prev => ({ ...prev, customer_phone: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+90 555 123 4567"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email (Optional)
              </label>
              <input
                type="email"
                value={bookingData.customer_email}
                onChange={(e) => setBookingData(prev => ({ ...prev, customer_email: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="customer@example.com"
              />
            </div>

            {/* Service and Staff */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service *
                </label>
                <select
                  value={bookingData.service_type}
                  onChange={(e) => handleServiceChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {services.map(service => (
                    <option key={service.name} value={service.name}>
                      {service.name} - ₺{service.price} ({service.duration}min)
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Staff Member *
                </label>
                <select
                  value={bookingData.staff_member}
                  onChange={(e) => setBookingData(prev => ({ ...prev, staff_member: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {staffMembers.map(staff => (
                    <option key={staff.id} value={staff.name}>
                      {staff.name} ({staff.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  value={bookingData.date}
                  onChange={(e) => setBookingData(prev => ({ ...prev, date: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time *
                </label>
                <input
                  type="time"
                  value={bookingData.time}
                  onChange={(e) => setBookingData(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Price and Duration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={bookingData.duration}
                  onChange={(e) => setBookingData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                  min="15"
                  max="180"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (₺)
                </label>
                <input
                  type="number"
                  value={bookingData.price}
                  onChange={(e) => setBookingData(prev => ({ ...prev, price: parseInt(e.target.value) }))}
                  min="50"
                  max="1000"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                value={bookingData.notes}
                onChange={(e) => setBookingData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Any special requests or notes..."
              />
            </div>

            {/* Submit */}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowBookingForm(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>Creating...</>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Create Booking
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default OwnerBooking;
