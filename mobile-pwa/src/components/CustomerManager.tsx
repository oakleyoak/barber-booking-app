import React, { useState, useEffect, useRef } from 'react';
import { useModal } from './ui/ModalProvider';
import { User } from '../lib/supabase';
import { customerService, type Customer, userService, bookingService } from '../services/completeDatabase';
import { SERVICES } from '../services/servicePricing';
import { supabase } from '../lib/supabase';
import { NotificationsService } from '../services/notifications';
import { Phone, Mail, User as UserIcon, Calendar, Edit, Trash2, Plus, Search, X, Clock, MapPin } from 'lucide-react';

interface CustomerManagerProps {
  currentUser: {
    id?: string;
    name: string;
    email: string;
    role: string;
    shop_name: string;
  };
  onModalStateChange?: (isOpen: boolean) => void;
}

const CustomerManager: React.FC<CustomerManagerProps> = ({ currentUser, onModalStateChange }) => {
  const modal = useModal();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerProfile, setShowCustomerProfile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [allStaff, setAllStaff] = useState<{id: string, name: string, email: string}[]>([]);

  // Remove bottom sheet modal logic for top-aligned modals

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: ''
  });

  // Booking form data
  const [bookingData, setBookingData] = useState({
    service: 'Haircut',
    price: SERVICES.find(s => s.name === 'Haircut')?.price || 700,
    notes: '',
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '09:00',
    user_id: currentUser.id
  });

  const [allStaffMembers, setAllStaffMembers] = useState<{id: string, name: string}[]>([]);

  const services = SERVICES.map(s => ({ name: s.name, price: s.price }));

  useEffect(() => {
    loadCustomers();
    if (currentUser.role === 'Owner' || currentUser.role === 'Manager') {
      userService.getUsers().then(users => {
        setAllStaffMembers(users.map(u => ({ id: u.id, name: u.name })));
        setAllStaff(users.map(u => ({ id: u.id, name: u.name, email: u.email })));
      });
    }
  }, []);

  useEffect(() => {
    const filtered = customers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.phone && customer.phone.includes(searchTerm)) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    // Keep filtered list sorted alphabetically
    const sortedFiltered = filtered.sort((a, b) => a.name.localeCompare(b.name));
    setFilteredCustomers(sortedFiltered);
  }, [customers, searchTerm]);

  // Modal state management for body scroll prevention and navigation integration
  useEffect(() => {
    const isAnyModalOpen = showForm || showBookingModal || showCustomerProfile;
    if (isAnyModalOpen) {
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
  }, [showForm, showBookingModal, showCustomerProfile, onModalStateChange]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerService.getCustomers();
      // Sort customers alphabetically by name
      const sortedData = data.sort((a, b) => a.name.localeCompare(b.name));
      setCustomers(sortedData);
    } catch (error) {
      console.error('Error loading customers:', error);
      modal.notify('Failed to load customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openCustomerProfile = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerProfile(true);
  };

  const closeCustomerProfile = () => {
    setShowCustomerProfile(false);
    setSelectedCustomer(null);
  };

  const openBookingModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowBookingModal(true);
    setShowCustomerProfile(false); // Close profile when opening booking
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      if (editingCustomer) {
        await customerService.updateCustomer(editingCustomer.id, formData);
        modal.notify('Customer updated successfully!', 'success');
      } else {
        await customerService.createCustomer({
          ...formData,
          user_id: currentUser.id
        });
        modal.notify('Customer added successfully!', 'success');
      }
      
      resetForm();
      await loadCustomers();
    } catch (error) {
      console.error('Error saving customer:', error);
      modal.notify('Failed to save customer', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', phone: '', email: '', notes: '' });
    setShowForm(false);
    setEditingCustomer(null);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || '',
      notes: customer.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (customerId: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await customerService.deleteCustomer(customerId);
        modal.notify('Customer deleted successfully!', 'success');
        await loadCustomers();
      } catch (error) {
        console.error('Error deleting customer:', error);
        modal.notify('Failed to delete customer', 'error');
      }
    }
  };

  const handleServiceChange = (serviceName: string) => {
    const service = services.find(s => s.name === serviceName);
    if (service) {
      setBookingData(prev => ({
        ...prev,
        service: serviceName,
        price: service.price
      }));
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Create appointment object
      const appointment = {
        customer_id: selectedCustomer!.id,
        customer_name: selectedCustomer!.name,
        service: bookingData.service,
        price: bookingData.price,
        date: bookingData.appointment_date,
        time: bookingData.appointment_time,
        notes: bookingData.notes,
        status: 'scheduled' as const,
        user_id: bookingData.user_id
      };

      // Create booking using the booking service
      await bookingService.createBooking(appointment);
      
      modal.notify('Booking created successfully!', 'success');
      setShowBookingModal(false);
      setSelectedCustomer(null);
      
      // Reset booking form
      setBookingData({
        service: 'Haircut',
        price: SERVICES.find(s => s.name === 'Haircut')?.price || 700,
        notes: '',
        appointment_date: new Date().toISOString().split('T')[0],
        appointment_time: '09:00',
        user_id: currentUser.id
      });
      
    } catch (error) {
      console.error('Error creating booking:', error);
      modal.notify('Failed to create booking', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <UserIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Customer Manager</h2>
            <p className="text-sm text-gray-600">{customers.length} total customers</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm w-full sm:w-auto justify-center"
        >
          <Plus className="h-4 w-4" />
          Add Customer
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search customers by name, phone, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Customer Cards */}
      {loading && !showForm && !showBookingModal ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center gap-2 text-gray-600">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            Loading customers...
          </div>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No customers found' : 'No customers yet'}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm 
              ? 'Try adjusting your search terms.' 
              : 'Add your first customer to get started!'
            }
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Customer
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              onClick={() => openCustomerProfile(customer)}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-blue-100 p-1.5 rounded-full">
                      <UserIcon className="h-4 w-4 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 truncate">{customer.name}</h3>
                  </div>
                  
                  <div className="space-y-1">
                    {customer.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-3.5 w-3.5 text-gray-400" />
                        <span className="truncate">{customer.phone}</span>
                      </div>
                    )}
                    {customer.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-3.5 w-3.5 text-gray-400" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                    )}
                    {customer.notes && (
                      <div className="text-xs text-gray-500 bg-gray-50 rounded p-2 mt-2 line-clamp-2">
                        {customer.notes}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-1 ml-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openBookingModal(customer);
                    }}
                    className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                  >
                    <Calendar className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Customer Profile Modal */}
      {showCustomerProfile && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[1200] p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowCustomerProfile(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto mt-4 md:mt-8">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white bg-opacity-20 p-2 rounded-full">
                    <UserIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{selectedCustomer.name}</h3>
                    <p className="text-blue-100 text-sm">Customer Profile</p>
                  </div>
                </div>
                <button
                  onClick={closeCustomerProfile}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Profile Content */}
            <div className="p-6 space-y-6">
              {/* Contact Information */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-600" />
                  Contact Information
                </h4>
                <div className="space-y-3">
                  {selectedCustomer.phone && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Phone</span>
                      </div>
                      <a
                        href={`tel:${selectedCustomer.phone}`}
                        className="text-blue-600 font-medium hover:underline"
                      >
                        {selectedCustomer.phone}
                      </a>
                    </div>
                  )}
                  {selectedCustomer.email && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Email</span>
                      </div>
                      <a
                        href={`mailto:${selectedCustomer.email}`}
                        className="text-blue-600 font-medium hover:underline truncate max-w-[60%]"
                      >
                        {selectedCustomer.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes Section */}
              {selectedCustomer.notes && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Notes</h4>
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedCustomer.notes}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-4">
                <button
                  onClick={() => openBookingModal(selectedCustomer)}
                  className="flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  <Calendar className="h-4 w-4" />
                  Book Appointment
                </button>
                <button
                  onClick={() => {
                    handleEdit(selectedCustomer);
                    closeCustomerProfile();
                  }}
                  className="flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Edit className="h-4 w-4" />
                  Edit Details
                </button>
              </div>
              
              <button
                onClick={() => {
                  handleDelete(selectedCustomer.id);
                  closeCustomerProfile();
                }}
                className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 py-3 rounded-lg hover:bg-red-100 transition-colors font-medium border border-red-200"
              >
                <Trash2 className="h-4 w-4" />
                Delete Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex z-[1200] p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowForm(false)} />
          <div 
            className="modal-top bg-white rounded-t-2xl md:rounded-2xl shadow-lg w-full md:max-w-md max-h-[90vh] md:max-h-[85vh] overflow-hidden transform transition-transform duration-300 ease-out mt-4 md:mt-8"
          >
            <div className="flex justify-center py-3 md:hidden">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
            </div>
            <div className="px-6 pb-6 pt-0 md:p-6 overflow-y-auto max-h-[calc(90vh-3rem)] md:max-h-[calc(85vh-3rem)]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                </h3>
                <button
                  title="Close modal"
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter customer name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Enter any additional notes"
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {editingCustomer ? 'Update' : 'Add'} Customer
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
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

      {/* Booking Modal */}
      {showBookingModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[1200] p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowBookingModal(false)} />
          <div 
            className="modal-top bg-white rounded-t-2xl md:rounded-2xl shadow-lg w-full md:max-w-md max-h-[90vh] md:max-h-[85vh] overflow-hidden transform transition-transform duration-300 ease-out mt-4 md:mt-8"
          >
            <div className="flex justify-center py-3 md:hidden">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
            </div>
            <div className="px-6 pb-6 pt-0 md:p-6 overflow-y-auto max-h-[calc(90vh-3rem)] md:max-h-[calc(85vh-3rem)]">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Book Appointment for {selectedCustomer.name}
              </h3>
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                  <select
                    value={bookingData.service}
                    onChange={(e) => handleServiceChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {services.map(service => (
                      <option key={service.name} value={service.name}>
                        {service.name} - ₺{service.price}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Price will auto-fill but can be customized below</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Custom Price (₺) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={bookingData.price}
                    onChange={(e) => setBookingData(prev => ({ ...prev, price: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    required
                    placeholder="Enter custom amount"
                  />
                  <p className="text-xs text-gray-500 mt-1">Modify this amount as needed for custom pricing</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={bookingData.appointment_date}
                    onChange={(e) => setBookingData(prev => ({ ...prev, appointment_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input
                    type="time"
                    value={bookingData.appointment_time}
                    onChange={(e) => setBookingData(prev => ({ ...prev, appointment_time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                {(currentUser.role === 'Owner' || currentUser.role === 'Manager') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Barber</label>
                    <select
                      value={bookingData.user_id}
                      onChange={(e) => setBookingData(prev => ({ ...prev, user_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {allStaffMembers.map(staff => (
                        <option key={staff.id} value={staff.id}>{staff.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    Create Booking
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowBookingModal(false);
                      setSelectedCustomer(null);
                    }}
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
    </div>
  );
};

export default CustomerManager;
