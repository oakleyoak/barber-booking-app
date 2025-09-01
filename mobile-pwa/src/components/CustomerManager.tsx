import React, { useState, useEffect } from 'react';
import { useModal } from './ui/ModalProvider';
import { User } from '../lib/supabase';
import { customerService, type Customer } from '../services/completeDatabase';
import { supabase } from '../lib/supabase';
import { userService } from '../services/completeDatabase';
import { sendAdhocEmail, sendBookingEmail } from '../services/email';

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
    appointment_time: '09:00',
    user_id: currentUser.id // default to current user
  });

  const [allStaff, setAllStaff] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    // Only fetch staff if owner/manager
    if (currentUser.role === 'Owner' || currentUser.role === 'Manager') {
      userService.getUsers().then(users => {
        setAllStaff(users.map(u => ({ id: u.id, name: u.name })));
      });
    }
  }, [currentUser.role]);

  const services = [
  { name: 'Haircut', price: 700, duration: 45 },
  { name: 'Beard trim', price: 300, duration: 15 },
  { name: 'Blowdry', price: 500, duration: 30 },
  { name: 'Face mask', price: 200, duration: 30 },
  { name: 'Colour', price: 1000, duration: 60 },
  { name: 'Wax', price: 500, duration: 60 },
  { name: 'Massage', price: 700, duration: 45 },
  { name: 'Shave', price: 500, duration: 30 }
  ];

  const formatCurrency = (amount: number): string => {
    return `₺${amount.toLocaleString('tr-TR')}`;
  };

  useEffect(() => {
    loadCustomers();
  }, [currentUser.id]);

  useEffect(() => {
    const filtered = customers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredCustomers(filtered);
  }, [customers, searchTerm]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      // All customers are shared across the barbershop
      const data = await customerService.getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
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

  const modal = useModal();

  const handleDelete = async (customerId: string) => {
    const ok = await modal.confirm('Are you sure you want to delete this customer?');
    if (!ok) return;
    try {
      setLoading(true);
      await customerService.deleteCustomer(customerId);
      await loadCustomers();
      modal.notify('Customer deleted', 'success');
    } catch (error) {
      console.error('Error deleting customer:', error);
      modal.notify('Failed to delete customer', 'error');
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
      } else {
        await customerService.createCustomer({ ...formData, user_id: currentUser.id });
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
      setBookingData({
        service: 'Haircut',
        price: 700,
        notes: '',
        appointment_date: new Date().toISOString().split('T')[0],
        appointment_time: '09:00',
        user_id: currentUser.id
      });
      
      // Send email notification using the booking ID
      try {
        if (selectedCustomer.email && data && data[0]) {
          console.log('Sending booking email for booking ID:', data[0].id);
          await sendBookingEmail(data[0].id);
          console.log('Booking email sent successfully');
        } else {
          console.warn('Cannot send email: missing email or booking data');
        }
      } catch (e) {
        console.error('Email send failed:', e);
        // Fallback to adhoc email if booking email fails
        try {
          if (selectedCustomer.email) {
            await sendAdhocEmail(
              selectedCustomer.email,
              `Appointment Confirmation - ${bookingData.service}`,
              `<h2>Appointment Confirmed</h2>
               <p>Dear ${selectedCustomer.name},</p>
               <p>Your appointment has been successfully booked:</p>
               <ul>
                 <li><strong>Service:</strong> ${bookingData.service}</li>
                 <li><strong>Date:</strong> ${bookingData.appointment_date}</li>
                 <li><strong>Time:</strong> ${bookingData.appointment_time}</li>
                 <li><strong>Price:</strong> R${bookingData.price}</li>
               </ul>
               <p>We look forward to seeing you!</p>`
            );
          }
        } catch (fallbackError) {
          console.error('Fallback email also failed:', fallbackError);
        }
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      modal.notify('Failed to create booking', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-2 sm:p-4 md:p-6 lg:p-8">
      <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Customer Manager</h2>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm sm:text-base"
          >
            + Add Customer
          </button>
        </div>

        {/* Customer List */}
        <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
          <h3 className="text-md font-medium text-gray-800 mb-2">Customers</h3>
          
          {/* Search Bar */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search customers by name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            />
          </div>

          {/* Customers List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {loading && !showForm && !showBookingModal ? (
              <div className="p-4 sm:p-6 text-center">Loading customers...</div>
            ) : filteredCustomers.length === 0 ? (
              <div className="p-4 sm:p-6 text-center text-gray-500 text-sm sm:text-base">
                {searchTerm ? 'No customers found matching your search.' : 'No customers found. Add your first customer!'}
              </div>
            ) : (
              <div className="overflow-x-auto -mx-3 sm:mx-0">
                <div className="min-w-full inline-block align-middle">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                          Contact
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                          Stats
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                          Notes
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredCustomers.map((customer) => (
                        <tr key={customer.id} className="hover:bg-gray-50">
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                            <div className="text-xs text-gray-500 md:hidden">
                              {customer.phone} {customer.email && `• ${customer.email}`}
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                            <div className="text-sm text-gray-900">{customer.phone}</div>
                            {customer.email && (
                              <div className="text-sm text-gray-500">{customer.email}</div>
                            )}
                          </td>
                          <td className="px-3 sm:px-6 py-4 hidden lg:table-cell">
                            <div className="text-sm text-gray-900">
                              Last visit: {customer.last_visit || 'Never'}
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 hidden xl:table-cell">
                            <div className="text-sm text-gray-900">{customer.notes || '-'}</div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-1 sm:space-x-2">
                              <button
                                onClick={() => openBookingModal(customer)}
                                className="bg-green-600 text-white px-2 sm:px-3 py-1 rounded hover:bg-green-700 transition text-xs"
                              >
                                Book
                              </button>
                              <button
                                onClick={() => handleEdit(customer)}
                                className="bg-blue-600 text-white px-2 sm:px-3 py-1 rounded hover:bg-blue-700 transition text-xs"
                              >
                                Edit
                              </button>
                              {customer.email && (
                                <button
                                  onClick={async () => {
                                    try {
                                      if (!customer.email) throw new Error('customer has no email');
                                      setLoading(true);
                                      const resp = await sendAdhocEmail(
                                        customer.email,
                                        `Reminder: your appointment`,
                                        `<p>Hi ${customer.name},</p><p>This is a reminder about your upcoming appointment.</p>`
                                      );
                                      console.log('email resp', resp);
                                      modal.notify('Email sent', 'success');
                                    } catch (err) {
                                      console.error('send email error', err);
                                      modal.notify('Failed to send email', 'error');
                                    } finally {
                                      setLoading(false);
                                    }
                                  }}
                                  className="bg-indigo-600 text-white px-2 sm:px-3 py-1 rounded hover:bg-indigo-700 transition text-xs"
                                >
                                  Email
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(customer.id)}
                                className="bg-red-600 text-white px-2 sm:px-3 py-1 rounded hover:bg-red-700 transition text-xs"
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
              </div>
            )}
          </div>
        </div>

        {/* Customer Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-xl max-w-sm sm:max-w-md w-full mx-2 sm:mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg sm:text-xl font-bold mb-4">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                    rows={2}
                  />
                </div>

                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 transition text-sm sm:text-base"
                  >
                    {loading ? 'Saving...' : (editingCustomer ? 'Update' : 'Add Customer')}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition text-sm sm:text-base"
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-xl max-w-sm sm:max-w-md w-full mx-2 sm:mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg sm:text-xl font-bold mb-4">
                Create Booking for {selectedCustomer.name}
              </h3>
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                {/* Staff selector for owner/manager */}
                {(currentUser.role === 'Owner' || currentUser.role === 'Manager') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Staff</label>
                    <select
                      value={bookingData.user_id}
                      onChange={e => setBookingData(prev => ({ ...prev, user_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                    >
                      <option value="">Select staff</option>
                      {allStaff.map(staff => (
                        <option key={staff.id} value={staff.id}>{staff.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service
                  </label>
                  <select
                    value={bookingData.service}
                    onChange={(e) => handleServiceChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={bookingData.appointment_date}
                      onChange={(e) => setBookingData(prev => ({ ...prev, appointment_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={bookingData.notes}
                    onChange={(e) => setBookingData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                    rows={2}
                  />
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 transition text-sm sm:text-base"
                  >
                    {loading ? 'Creating...' : 'Create Booking'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBookingModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition text-sm sm:text-base"
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
