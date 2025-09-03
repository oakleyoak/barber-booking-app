import React, { useState, useEffect } from 'react';
import { useModal } from './ui/ModalProvider';
import { User } from '../lib/supabase';
import { customerService, type Customer } from '../services/completeDatabase';
import { supabase } from '../lib/supabase';
import { userService } from '../services/completeDatabase';
import { NotificationsService } from '../services/notifications';

interface CustomerManagerProps {
  currentUser: User;
}

const CustomerManager: React.FC<CustomerManagerProps> = ({ currentUser }) => {
  const modal = useModal();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [allStaff, setAllStaff] = useState<{id: string, name: string, email: string}[]>([]);

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
    price: 700,
    notes: '',
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '09:00',
    user_id: currentUser.id
  });

  const [allStaffMembers, setAllStaffMembers] = useState<{id: string, name: string}[]>([]);

  const services = [
    { name: 'Haircut', price: 700 },
    { name: 'Beard Trim', price: 300 },
    { name: 'Hair Wash', price: 200 },
    { name: 'Full Service', price: 900 },
    { name: 'Hot Towel Shave', price: 500 }
  ];

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
    setFilteredCustomers(filtered);
  }, [customers, searchTerm]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerService.getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
      modal.notify('Failed to load customers', 'error');
    } finally {
      setLoading(false);
    }
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
      
      await loadCustomers();
      resetForm();
    } catch (error) {
      console.error('Error saving customer:', error);
      modal.notify('Failed to save customer', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', phone: '', email: '', notes: '' });
    setEditingCustomer(null);
    setShowForm(false);
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
    if (!confirm('Are you sure you want to delete this customer?')) return;
    
    try {
      setLoading(true);
      await customerService.deleteCustomer(customerId);
      modal.notify('Customer deleted successfully!', 'success');
      await loadCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      modal.notify('Failed to delete customer', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openBookingModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowBookingModal(true);
  };

  const handleServiceChange = (serviceName: string) => {
    const service = services.find(s => s.name === serviceName);
    setBookingData(prev => ({
      ...prev,
      service: serviceName,
      price: service?.price || 0
    }));
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    
    try {
      setLoading(true);
      const bookingUserId = (currentUser.role === 'Owner' || currentUser.role === 'Manager') ? bookingData.user_id : currentUser.id;
      
      const { data, error } = await supabase.from('bookings').insert([{
        user_id: bookingUserId,
        customer_id: selectedCustomer.id,
        customer_name: selectedCustomer.name,
        service: bookingData.service,
        price: bookingData.price,
        date: bookingData.appointment_date,
        time: bookingData.appointment_time,
        status: 'scheduled'
      }]).select();
      
      if (error) throw error;
      
      modal.notify('Booking created successfully!', 'success');
      setShowBookingModal(false);
      setSelectedCustomer(null);
    } catch (error) {
      console.error('Error creating booking:', error);
      modal.notify('Failed to create booking', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Customer Manager</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + Add Customer
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search customers by name, phone, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Customers Table */}
      <div className="bg-gray-50 rounded-lg overflow-hidden">
        {loading && !showForm && !showBookingModal ? (
          <div className="p-8 text-center text-gray-600">Loading customers...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchTerm ? 'No customers found matching your search.' : 'No customers found. Add your first customer!'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider hidden md:table-cell">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                      <div className="text-sm text-gray-500 md:hidden">
                        {customer.phone} {customer.email && `• ${customer.email}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="text-sm text-gray-900">{customer.phone}</div>
                      {customer.email && (
                        <div className="text-sm text-gray-500">{customer.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openBookingModal(customer)}
                          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors text-sm"
                        >
                          Book
                        </button>
                        <button
                          onClick={() => handleEdit(customer)}
                          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors text-sm"
                        >
                          Del
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
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
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
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
      )}
      </div>
    </div>
  );
};

export default CustomerManager;
