import React, { useState, useEffect } from 'react';
import { Users, Phone, Mail, Plus, Search, Edit, Trash2, Calendar, CalendarDays } from 'lucide-react';
import { customerService, bookingService } from '../services/supabaseServices';
import type { Customer, User as UserType } from '../lib/supabase';

interface CustomerManagerProps {
  currentUser: UserType;
}

const CustomerManager: React.FC<CustomerManagerProps> = ({ currentUser }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [customerToBook, setCustomerToBook] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [newCustomer, setNewCustomer] = useState<Omit<Customer, 'id' | 'created_at' | 'updated_at'>>({
    name: '',
    phone: '',
    email: '',
    user_id: currentUser.id
  });

  const [bookingData, setBookingData] = useState({
    service: 'Haircut',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    price: 25
  });

  const services = [
    { name: 'Haircut', price: 25 },
    { name: 'Beard Trim', price: 15 },
    { name: 'Hair & Beard', price: 35 },
    { name: 'Shave', price: 20 }
  ];

  useEffect(() => {
    loadCustomers();
  }, [currentUser.id]);

  useEffect(() => {
    // Filter customers based on search query
    if (searchQuery.trim()) {
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (customer.phone && customer.phone.includes(searchQuery)) ||
        (customer.email && customer.email.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [searchQuery, customers]);

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const shopCustomers = await customerService.getAllCustomers(
        currentUser.role === 'Barber' ? currentUser.id : undefined
      );
      setCustomers(shopCustomers);
      setFilteredCustomers(shopCustomers);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.name.trim()) {
      alert('Customer name is required');
      return;
    }

    try {
      const created = await customerService.createCustomer(newCustomer);
      if (created) {
        await loadCustomers();
        setShowAddModal(false);
        setNewCustomer({
          name: '',
          phone: '',
          email: '',
          user_id: currentUser.id
        });
      }
    } catch (error) {
      console.error('Error adding customer:', error);
      alert('Failed to add customer');
    }
  };

  const handleUpdateCustomer = async () => {
    if (!editingCustomer) return;

    try {
      const updated = await customerService.updateCustomer(editingCustomer.id, editingCustomer);
      if (updated) {
        await loadCustomers();
        setEditingCustomer(null);
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      alert('Failed to update customer');
    }
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setCustomerToDelete(customer);
    setShowDeleteModal(true);
  };

  const confirmDeleteCustomer = async () => {
    if (!customerToDelete) return;

    try {
      const deleted = await customerService.deleteCustomer(customerToDelete.id);
      if (deleted) {
        await loadCustomers();
        setShowDeleteModal(false);
        setCustomerToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('Failed to delete customer');
    }
  };

  const handleBookAppointment = (customer: Customer) => {
    setCustomerToBook(customer);
    setShowBookingModal(true);
  };

  const handleCreateBooking = async () => {
    if (!customerToBook) return;

    try {
      const bookingToCreate = {
        customer_name: customerToBook.name,
        service: bookingData.service,
        price: bookingData.price,
        date: bookingData.date,
        time: bookingData.time,
        status: 'scheduled' as const,
        user_id: currentUser.id
      };

      const created = await bookingService.createBooking(bookingToCreate);
      if (created) {
        // Update customer's last visit
        await customerService.updateCustomer(customerToBook.id, {
          last_visit: bookingData.date
        });

        setShowBookingModal(false);
        setCustomerToBook(null);
        setBookingData({
          service: 'Haircut',
          date: new Date().toISOString().split('T')[0],
          time: '09:00',
          price: 25
        });

        await loadCustomers();
        alert('Appointment booked successfully!');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to book appointment');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Customer Database
          </h2>
          <p className="text-gray-600 text-sm">Manage your customer information</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center text-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          placeholder="Search customers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Customer List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {filteredCustomers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">
                {searchQuery ? 'No customers found' : 'No customers yet'}
              </p>
            </div>
          ) : (
            filteredCustomers.map((customer) => (
              <div key={customer.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {customer.name}
                      </h3>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      {customer.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span>{customer.phone}</span>
                        </div>
                      )}
                      {customer.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{customer.email}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        <span>Last visit: {formatDate(customer.last_visit || null)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleBookAppointment(customer)}
                      className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                      title="Book Appointment"
                    >
                      <Calendar className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setEditingCustomer(customer)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Edit Customer"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCustomer(customer)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="Delete Customer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setShowAddModal(false)} />
            <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Customer</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer(prev => ({...prev, name: e.target.value}))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Customer name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={newCustomer.phone || ''}
                      onChange={(e) => setNewCustomer(prev => ({...prev, phone: e.target.value}))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newCustomer.email || ''}
                      onChange={(e) => setNewCustomer(prev => ({...prev, email: e.target.value}))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Email address"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddCustomer}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Add Customer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setEditingCustomer(null)} />
            <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Customer</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={editingCustomer.name}
                      onChange={(e) => setEditingCustomer(prev => prev ? {...prev, name: e.target.value} : null)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={editingCustomer.phone || ''}
                      onChange={(e) => setEditingCustomer(prev => prev ? {...prev, phone: e.target.value} : null)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editingCustomer.email || ''}
                      onChange={(e) => setEditingCustomer(prev => prev ? {...prev, email: e.target.value} : null)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setEditingCustomer(null)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateCustomer}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Update Customer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && customerToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setShowDeleteModal(false)} />
            <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Customer</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete {customerToDelete.name}? This action cannot be undone.
                </p>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteCustomer}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Book Appointment Modal */}
      {showBookingModal && customerToBook && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setShowBookingModal(false)} />
            <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Book Appointment for {customerToBook.name}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Service
                    </label>
                    <select
                      value={bookingData.service}
                      onChange={(e) => {
                        const selectedService = services.find(s => s.name === e.target.value);
                        setBookingData(prev => ({
                          ...prev,
                          service: e.target.value,
                          price: selectedService ? selectedService.price : 25
                        }));
                      }}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {services.map(service => (
                        <option key={service.name} value={service.name}>
                          {service.name} - £{service.price}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={bookingData.date}
                      onChange={(e) => setBookingData(prev => ({...prev, date: e.target.value}))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time
                    </label>
                    <select
                      value={bookingData.time}
                      onChange={(e) => setBookingData(prev => ({...prev, time: e.target.value}))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', 
                        '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', 
                        '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'].map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (£)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={bookingData.price}
                      onChange={(e) => setBookingData(prev => ({...prev, price: Number(e.target.value)}))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowBookingModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateBooking}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Book Appointment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManager;
