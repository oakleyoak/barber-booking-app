import React, { useState, useEffect } from 'react';
import { useModal } from './ui/ModalProvider';
import { UserManagementService, User, UserCreate } from '../services/userManagementService';

interface UserManagementProps {
  shopName: string;
}

interface NewStaffForm {
  name: string;
  email: string;
  role: 'Manager' | 'Barber' | 'Apprentice';
  commission_rate: number;
  target_weekly: number;
  target_monthly: number;
}

const UserManagement: React.FC<UserManagementProps> = ({ shopName }) => {
  const [staffMembers, setStaffMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newStaff, setNewStaff] = useState<NewStaffForm>({
    name: '',
    email: '',
    role: 'Apprentice',
    commission_rate: 0,
    target_weekly: 0,
    target_monthly: 0,
  });

  useEffect(() => {
    loadStaffMembers();
  }, [shopName]);

  const loadStaffMembers = async () => {
    try {
      const staff = await UserManagementService.getStaffMembers(shopName);
      setStaffMembers(staff);
    } catch (error) {
      console.error('Error loading staff members:', error);
      setError('Failed to load staff members');
    }
  };

  const handleCreateStaff = async () => {
    if (!newStaff.name.trim() || !newStaff.email.trim()) {
      setError('Name and email are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const staffData: UserCreate = {
        name: newStaff.name.trim(),
        email: newStaff.email.trim(),
        role: newStaff.role,
        shop_name: shopName,
        commission_rate: newStaff.commission_rate,
        target_weekly: newStaff.target_weekly,
        target_monthly: newStaff.target_monthly,
      };

      const result = await UserManagementService.addStaffMember(shopName, staffData);

      if (result) {
        setSuccess('Staff member created successfully!');
        setNewStaff({
          name: '',
          email: '',
          role: 'Apprentice',
          commission_rate: 0,
          target_weekly: 0,
          target_monthly: 0,
        });
        await loadStaffMembers();
      } else {
        setError('Failed to create staff member');
      }
    } catch (error) {
      console.error('Error creating staff member:', error);
      setError('Failed to create staff member');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStaff = async (userId: string, updates: Partial<User>) => {
    setLoading(true);
    setError('');

    try {
      const success = await UserManagementService.updateStaffMember(shopName, userId, updates);
      if (success) {
        setSuccess('Staff member updated successfully!');
        await loadStaffMembers();
      } else {
        setError('Failed to update staff member');
      }
    } catch (error) {
      console.error('Error updating staff member:', error);
      setError('Failed to update staff member');
    } finally {
      setLoading(false);
    }
  };

  const modal = useModal();

  const handleDeleteStaff = async (userId: string) => {
    const ok = await modal.confirm('Are you sure you want to delete this staff member?');
    if (!ok) return;

    setLoading(true);
    setError('');

    try {
      const success = await UserManagementService.deleteStaffMember(shopName, userId);
      if (success) {
        modal.notify('Staff member deleted successfully!', 'success');
        await loadStaffMembers();
      } else {
        modal.notify('Failed to delete staff member', 'error');
      }
    } catch (error) {
      console.error('Error deleting staff member:', error);
      modal.notify('Failed to delete staff member', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteStaff = async (userId: string, newRole: 'Manager' | 'Barber' | 'Apprentice') => {
    setLoading(true);
    setError('');

    try {
      const success = await UserManagementService.promoteStaffMember(shopName, userId, newRole);
      if (success) {
        setSuccess('Staff member promoted successfully!');
        await loadStaffMembers();
      } else {
        setError('Failed to promote staff member');
      }
    } catch (error) {
      console.error('Error promoting staff member:', error);
      setError('Failed to promote staff member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Staff Management</h2>

      {/* Success/Error Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      {/* Add New Staff Form */}
      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Add New Staff Member</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={newStaff.name}
              onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter staff name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={newStaff.email}
              onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter email address"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={newStaff.role}
              onChange={(e) => {
                const role = e.target.value as 'Manager' | 'Barber' | 'Apprentice';
                const defaultCommissionRates = {
                  'Apprentice': 40,  // Staff gets 40%, Owner gets 60%
                  'Barber': 60,      // Staff gets 60%, Owner gets 40%
                  'Manager': 70      // Staff gets 70%, Owner gets 30%
                };
                setNewStaff({ 
                  ...newStaff, 
                  role, 
                  commission_rate: defaultCommissionRates[role] 
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Apprentice">Apprentice</option>
              <option value="Barber">Barber</option>
              <option value="Manager">Manager</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate (%)</label>
            <select
              value={newStaff.commission_rate}
              onChange={(e) => setNewStaff({ ...newStaff, commission_rate: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="40">40% (Apprentice)</option>
              <option value="60">60% (Barber)</option>
              <option value="70">70% (Manager)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weekly Target</label>
            <input
              type="number"
              value={newStaff.target_weekly}
              onChange={(e) => setNewStaff({ ...newStaff, target_weekly: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Target</label>
            <input
              type="number"
              value={newStaff.target_monthly}
              onChange={(e) => setNewStaff({ ...newStaff, target_monthly: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
              min="0"
            />
          </div>
        </div>
        <button
          onClick={handleCreateStaff}
          disabled={loading}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Add Staff Member'}
        </button>
      </div>

      {/* Staff Members List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-700">Current Staff Members</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weekly Target</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Target</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {staffMembers.map((staff) => (
                <tr key={staff.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{staff.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      staff.role === 'Manager' ? 'bg-purple-100 text-purple-800' :
                      staff.role === 'Barber' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {staff.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.commission_rate}%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${staff.target_weekly}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${staff.target_monthly}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handlePromoteStaff(staff.id, staff.role === 'Apprentice' ? 'Barber' : staff.role === 'Barber' ? 'Manager' : 'Apprentice')}
                      className="text-blue-600 hover:text-blue-900"
                      disabled={loading}
                    >
                      Promote
                    </button>
                    <button
                      onClick={() => handleDeleteStaff(staff.id)}
                      className="text-red-600 hover:text-red-900"
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {staffMembers.length === 0 && (
          <div className="px-6 py-4 text-center text-gray-500">
            No staff members found. Add your first staff member above.
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
