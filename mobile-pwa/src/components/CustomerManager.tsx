import React, { useState, useEffect } from 'react';
import { Users, Phone, Mail, Plus, Search, Edit, Trash2, Calendar, CreditCard, CalendarDays } from 'lucide-react';
import { CustomerService, Customer, CustomerCreate } from '../services/supabaseCustomerService';
import { supabase } from '../lib/supabase';

interface CustomerManagerProps {
  currentUser: {
    id?: string;
    name: string;
    email: string;
    role: string;
    shop_name: string;
  };
}

const CustomerManager: React.FC<CustomerManagerProps> = ({ currentUser }) => {
  // Helper function to format dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [customerToBook, setCustomerToBook] = useState<Customer | null>(null);
  const [newCustomer, setNewCustomer] = useState<CustomerCreate>({
    name: '',
    phone: '',
    email: '',
    notes: '',
    preferredBarber: ''
  });
  const [bookingData, setBookingData] = useState({
    service: 'Haircut',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    price: 700
  });

  // Load customers on component mount
  useEffect(() => {
    loadCustomers();
  }, [currentUser.shop_name]);

  const loadCustomers = async () => {
    const shopCustomers = await CustomerService.getCustomers(currentUser.shop_name);
    setCustomers(shopCustomers);
    setFilteredCustomers(shopCustomers);
  };

  // Handle search
  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim()) {
        const searchResults = await CustomerService.searchCustomers(currentUser.shop_name, searchQuery);
        setFilteredCustomers(searchResults);
      } else {
        setFilteredCustomers(customers);
      }
    };
    performSearch();
  }, [searchQuery, customers]);

  const handleAddCustomer = async () => {
    if (!newCustomer.name.trim()) {
      alert('Customer name is required');
      return;
    }

    try {
      await CustomerService.addCustomer(currentUser.shop_name, newCustomer);
      await loadCustomers();
      setShowAddModal(false);
      setNewCustomer({ name: '', phone: '', email: '', notes: '', preferredBarber: '' });
    } catch (error) {
      alert('Failed to add customer');
    }
  };

  const handleUpdateCustomer = async () => {
    if (!editingCustomer) return;

    try {
      await CustomerService.updateCustomer(currentUser.shop_name, editingCustomer.id, editingCustomer);
      await loadCustomers();
      setEditingCustomer(null);
    } catch (error) {
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
      await CustomerService.deleteCustomer(currentUser.shop_name, customerToDelete.id);
      await loadCustomers();
      setShowDeleteModal(false);
      setCustomerToDelete(null);
    } catch (error) {
      alert('Failed to delete customer');
    }
  };

  const handleBookAppointment = (customer: Customer) => {
    setCustomerToBook(customer);
    setShowBookingModal(true);
  };

  const handleCreateBooking = async () => {
    if (!customerToBook || !currentUser.id) return;

    try {
      // Generate a UUID for the booking ID
      const bookingId = crypto.randomUUID();

      // Save booking to Supabase bookings table
      const { error: bookingError } = await supabase
        .from('bookings')
        .insert({
          id: bookingId,
          user_id: currentUser.id,
          customer_id: customerToBook.id,
          customer_name: customerToBook.name,
          service: bookingData.service,
          price: bookingData.price,
          date: bookingData.date,
          time: bookingData.time,
          status: 'scheduled'
        });

      if (bookingError) {
        console.error('Error creating booking:', bookingError);
        alert('Failed to book appointment');
        return;
      }

      setShowBookingModal(false);
      setCustomerToBook(null);
      setBookingData({
        service: 'Haircut',
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        price: 700
      });
      alert('Appointment booked successfully!');
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to book appointment');
    }
  };
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Database</h2>
          <p className="text-gray-600">Shared customer database for {currentUser.shop_name}</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </button>
      </div>

      {/* Customer Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-900">{customers.length}</div>
          <div className="text-sm text-blue-600">Total Customers</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-900">
            {customers.reduce((sum, c) => sum + c.totalVisits, 0)}
          </div>
          <div className="text-sm text-green-600">Total Visits</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-900">
            ₺{customers.reduce((sum, c) => sum + c.totalSpent, 0).toFixed(0)}
          </div>
          <div className="text-sm text-purple-600">Total Revenue</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-orange-900">
            ₺{customers.length > 0 ? (customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length).toFixed(0) : '0'}
          </div>
          <div className="text-sm text-orange-600">Avg per Customer</div>
        </div>
      </div>

      {/* Search Bar - Enhanced for mobile */}
      <div className="mb-6 sticky top-0 z-10 bg-white border-b border-gray-200 pb-4">
        <div className="relative">
          <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search customers by name, phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
          />
        </div>
        {searchQuery && (
          <div className="mt-2 text-sm text-gray-600">
            Found {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Customer List - Mobile Responsive */}
      <div className="bg-white border border-gray-200 rounded-lg">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No customers found' : 'No customers yet'}
            </h3>
            <p className="text-gray-500">
              {searchQuery ? 'Try adjusting your search terms' : 'Start adding customers to manage your client base'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card Layout */}
            <div className="block md:hidden">
              {filteredCustomers.map((customer) => (
                <div key={customer.id} className="border-b border-gray-100 p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 text-lg">{customer.name}</h3>
                      {customer.notes && (
                        <p className="text-sm text-gray-500 mt-1">{customer.notes}</p>
                      )}
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleBookAppointment(customer)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                        title="Book appointment"
                      >
                        <CalendarDays className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setEditingCustomer(customer)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                        title="Edit customer"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCustomer(customer)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                        title="Delete customer"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="flex items-center text-gray-600 mb-2">
                        <Phone className="h-4 w-4 mr-2" />
                        <span className="font-medium">Phone:</span>
                      </div>
                      <div className="text-gray-900 ml-6">{customer.phone || 'Not provided'}</div>
                    </div>

                    <div>
                      <div className="flex items-center text-gray-600 mb-2">
                        <Mail className="h-4 w-4 mr-2" />
                        <span className="font-medium">Email:</span>
                      </div>
                      <div className="text-gray-900 ml-6">{customer.email || 'Not provided'}</div>
                    </div>

                    <div>
                      <div className="flex items-center text-gray-600 mb-2">
                        <Users className="h-4 w-4 mr-2" />
                        <span className="font-medium">Preferred Barber:</span>
                      </div>
                      <div className="text-gray-900 ml-6">{customer.preferredBarber || 'Not specified'}</div>
                    </div>

                    <div>
                      <div className="flex items-center text-gray-600 mb-2">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span className="font-medium">Last Visit:</span>
                      </div>
                      <div className="text-gray-900 ml-6">
                        {customer.lastVisit ? formatDate(customer.lastVisit) : 'Never'}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="flex items-center text-blue-600">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span className="font-medium">{customer.totalVisits}</span>
                        </div>
                        <div className="text-xs text-gray-500">Visits</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center text-green-600 font-medium">
                          <CreditCard className="h-4 w-4 mr-1" />
                          <span>₺{customer.totalSpent.toFixed(0)}</span>
                        </div>
                        <div className="text-xs text-gray-500">Total Spent</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Customer</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Contact</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Preferred Barber</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600">Visits</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600">Total Spent</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600">Last Visit</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-900">{customer.name}</div>
                          {customer.notes && (
                            <div className="text-sm text-gray-500">{customer.notes}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <Phone className="h-4 w-4 mr-2 text-gray-400" />
                            {customer.phone}
                          </div>
                          {customer.email && (
                            <div className="flex items-center text-sm">
                              <Mail className="h-4 w-4 mr-2 text-gray-400" />
                              {customer.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {customer.preferredBarber || '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center">
                          <Calendar className="h-4 w-4 mr-1 text-blue-500" />
                          {customer.totalVisits}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center text-green-600 font-medium">
                          <CreditCard className="h-4 w-4 mr-1" />
                          ₺{customer.totalSpent.toFixed(0)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center text-sm text-gray-500">
                        {customer.lastVisit ? formatDate(customer.lastVisit) : 'Never'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleBookAppointment(customer)}
                            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                            title="Book appointment"
                          >
                            <CalendarDays className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingCustomer(customer)}
                            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                            title="Edit customer"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCustomer(customer)}
                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                            title="Delete customer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Add New Customer</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Customer Name *"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="tel"
                placeholder="Phone Number (optional)"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                placeholder="Email (optional)"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Preferred Barber (optional)"
                value={newCustomer.preferredBarber}
                onChange={(e) => setNewCustomer({...newCustomer, preferredBarber: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                placeholder="Notes (optional)"
                value={newCustomer.notes}
                onChange={(e) => setNewCustomer({...newCustomer, notes: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomer}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Edit Customer</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Customer Name *"
                value={editingCustomer.name}
                onChange={(e) => setEditingCustomer({...editingCustomer, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="tel"
                placeholder="Phone Number (optional)"
                value={editingCustomer.phone || ''}
                onChange={(e) => setEditingCustomer({...editingCustomer, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                placeholder="Email (optional)"
                value={editingCustomer.email || ''}
                onChange={(e) => setEditingCustomer({...editingCustomer, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Preferred Barber (optional)"
                value={editingCustomer.preferredBarber || ''}
                onChange={(e) => setEditingCustomer({...editingCustomer, preferredBarber: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                placeholder="Notes (optional)"
                value={editingCustomer.notes || ''}
                onChange={(e) => setEditingCustomer({...editingCustomer, notes: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setEditingCustomer(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateCustomer}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Update Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && customerToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete customer <strong>{customerToDelete.name}</strong>?
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setCustomerToDelete(null);
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteCustomer}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && customerToBook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Book Appointment</h3>
            <p className="text-gray-600 mb-4">
              Booking for: <strong>{customerToBook.name}</strong>
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                <select
                  value={bookingData.service}
                  onChange={(e) => setBookingData({...bookingData, service: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Haircut">Haircut - ₺700</option>
                  <option value="Shave">Shave - ₺500</option>
                  <option value="Beard Trim">Beard Trim - ₺300</option>
                  <option value="Hair Wash">Hair Wash - ₺200</option>
                  <option value="Face Mask">Face Mask - ₺200</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={bookingData.date}
                  onChange={(e) => setBookingData({...bookingData, date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <select
                  value={bookingData.time}
                  onChange={(e) => setBookingData({...bookingData, time: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({length: 18}, (_, i) => {
                    const hour = Math.floor(i / 2) + 9;
                    const minute = i % 2 === 0 ? '00' : '30';
                    return (
                      <option key={i} value={`${hour.toString().padStart(2, '0')}:${minute}`}>
                        {hour > 12 ? hour - 12 : hour === 0 ? 12 : hour}:{minute} {hour >= 12 ? 'PM' : 'AM'}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₺)</label>
                <input
                  type="number"
                  value={bookingData.price}
                  onChange={(e) => setBookingData({...bookingData, price: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowBookingModal(false);
                  setCustomerToBook(null);
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBooking}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Book Appointment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { CustomerManager };
