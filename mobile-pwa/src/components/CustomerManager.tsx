import React, { useState, useEffect } from 'react';
import { User } from '../lib/supabase';
import { Customer, CustomerService } from '../services/supabaseCustomerService';
import { supabase } from '../lib/supabase';

interface CustomerManagerProps {
  currentUser: User;
}

const CustomerManager: React.FC<CustomerManagerProps> = ({ currentUser }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);

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
    appointment_time: '09:00'
  });

  const services = [
    { name: 'Haircut', price: 700, duration: 45 },
    { name: 'Beard trim', price: 300, duration: 20 },
    { name: 'Shave', price: 250, duration: 30 },
    { name: 'Hair wash', price: 150, duration: 15 },
    { name: 'Colour', price: 1000, duration: 60 },
    { name: 'Styling', price: 400, duration: 30 }
  ];

  const formatCurrency = (amount: number): string => {
    return `₺${amount.toLocaleString('tr-TR')}`;
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.phone && customer.phone.includes(searchTerm)) ||
        (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [customers, searchTerm]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await CustomerService.getCustomers(currentUser.shop_name);
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      if (editingCustomer) {
        await CustomerService.updateCustomer(currentUser.shop_name, editingCustomer.id, formData);
      } else {
        await CustomerService.addCustomer(currentUser.shop_name, formData);
      }
      
      setFormData({ name: '', phone: '', email: '', notes: '' });
      setShowForm(false);
      setEditingCustomer(null);
      await loadCustomers();
    } catch (error) {
      console.error('Error saving customer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      notes: customer.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        setLoading(true);
        await CustomerService.deleteCustomer(currentUser.shop_name, id);
        await loadCustomers();
      } catch (error) {
        console.error('Error deleting customer:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const openBookingModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setBookingData({
      service: 'Haircut',
      price: 700,
      notes: '',
      appointment_date: new Date().toISOString().split('T')[0],
      appointment_time: '09:00'
    });
    setShowBookingModal(true);
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
    if (!selectedCustomer) return;

    try {
      setLoading(true);
      
      const selectedService = services.find(s => s.name === bookingData.service);
      const appointmentDateTime = new Date(`${bookingData.appointment_date}T${bookingData.appointment_time}`);
      
      // Create booking using Supabase directly
      const { data, error } = await supabase
        .from('bookings')
        .insert([{
          customer_id: selectedCustomer.id,
          customer_name: selectedCustomer.name,
          customer_phone: selectedCustomer.phone,
          service: bookingData.service,
          price: bookingData.price,
          date: bookingData.appointment_date,
          time: bookingData.appointment_time,
          status: 'scheduled',
          user_id: currentUser.id
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      setShowBookingModal(false);
      setSelectedCustomer(null);
      
      // Show success message
      alert('Booking created successfully!');
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Error creating booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', phone: '', email: '', notes: '' });
    setShowForm(false);
    setEditingCustomer(null);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Customer Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Add New Customer
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search customers by name, phone, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Customer Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">
              {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {loading ? 'Saving...' : (editingCustomer ? 'Update' : 'Add Customer')}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">
              Create Booking for {selectedCustomer.name}
            </h3>
            
            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service
                </label>
                <select
                  value={bookingData.service}
                  onChange={(e) => handleServiceChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {services.map((service) => (
                    <option key={service.name} value={service.name}>
                      {service.name} - {formatCurrency(service.price)} ({service.duration} min)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (₺)
                </label>
                <input
                  type="number"
                  value={bookingData.price}
                  onChange={(e) => setBookingData(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={bookingData.appointment_date}
                  onChange={(e) => setBookingData(prev => ({ ...prev, appointment_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={bookingData.appointment_time}
                  onChange={(e) => setBookingData(prev => ({ ...prev, appointment_time: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={bookingData.notes}
                  onChange={(e) => setBookingData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 transition"
                >
                  {loading ? 'Creating...' : 'Create Booking'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customers List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading && !showForm && !showBookingModal ? (
          <div className="p-6 text-center">Loading customers...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {searchTerm ? 'No customers found matching your search.' : 'No customers found. Add your first customer!'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{customer.phone}</div>
                      {customer.email && (
                        <div className="text-sm text-gray-500">{customer.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {customer.totalVisits} visits
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatCurrency(customer.totalSpent)} spent
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{customer.notes || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => openBookingModal(customer)}
                          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition text-xs"
                        >
                          Book
                        </button>
                        <button
                          onClick={() => handleEdit(customer)}
                          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition text-xs"
                        >
                          Delete
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
    </div>
  );
};

export default CustomerManager;
