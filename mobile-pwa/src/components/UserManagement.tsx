import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, UserCheck, UserX, Crown } from 'lucide-react';
import { UserManagementService, User, UserCreate, UserUpdate } from '../services/userManagementService';

interface UserManagementProps {
  currentUser: {
    id?: string;
    name: string;
    email: string;
    role: string;
    shop_name: string;
  };
}

const UserManagement: React.FC<UserManagementProps> = ({ currentUser }) => {
  const [staffMembers, setStaffMembers] = useState<User[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState<UserCreate>({
    name: '',
    email: '',
    role: 'barber',
    phone: ''
  });

  // Load staff members on component mount
  useEffect(() => {
    loadStaffMembers();
  }, [currentUser.shop_name]);

  const loadStaffMembers = async () => {
    const staff = await UserManagementService.getStaffMembers(currentUser.shop_name);
    setStaffMembers(staff);
  };

  const handleAddUser = async () => {
    if (!newUser.name.trim() || !newUser.email.trim()) {
      alert('Name and email are required');
      return;
    }

    // Check if email is already in use
    const emailInUse = await UserManagementService.isEmailInUse(newUser.email, currentUser.shop_name);
    if (emailInUse) {
      alert('This email is already in use');
      return;
    }

    const success = await UserManagementService.addStaffMember(currentUser.shop_name, newUser);
    if (success) {
      await loadStaffMembers();
      setShowAddModal(false);
      setNewUser({ name: '', email: '', role: 'barber', phone: '' });
    } else {
      alert('Failed to add staff member');
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    const updates: UserUpdate = {
      name: editingUser.name,
      email: editingUser.email,
      role: editingUser.role as 'manager' | 'barber' | 'apprentice',
      phone: editingUser.phone
    };

    // Check if email is already in use by another user
    if (editingUser.email) {
      const emailInUse = await UserManagementService.isEmailInUse(
        editingUser.email, 
        currentUser.shop_name, 
        editingUser.id
      );
      if (emailInUse) {
        alert('This email is already in use by another user');
        return;
      }
    }

    const success = await UserManagementService.updateStaffMember(
      currentUser.shop_name, 
      editingUser.id, 
      updates
    );
    
    if (success) {
      await loadStaffMembers();
      setEditingUser(null);
    } else {
      alert('Failed to update staff member');
    }
  };

  const handlePromoteUser = async (userId: string, currentRole: string) => {
    let newRole: string;
    if (currentRole === 'apprentice') {
      newRole = 'barber';
    } else if (currentRole === 'barber') {
      newRole = 'manager';
    } else if (currentRole === 'manager') {
      newRole = 'barber';
    } else {
      newRole = 'apprentice';
    }
    
    const success = await UserManagementService.promoteStaffMember(
      currentUser.shop_name, 
      userId, 
      newRole
    );
    
    if (success) {
      await loadStaffMembers();
    } else {
      alert('Failed to promote staff member');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      const success = await UserManagementService.deleteStaffMember(currentUser.shop_name, userId);
      if (success) {
        await loadStaffMembers();
      } else {
        alert('Failed to delete staff member');
      }
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'barber':
        return <UserCheck className="w-4 h-4 text-blue-600" />;
      case 'apprentice':
        return <Users className="w-4 h-4 text-orange-600" />;
      default:
        return <Users className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'barber':
        return 'bg-blue-100 text-blue-800';
      case 'apprentice':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Staff Management</h2>
          <p className="text-gray-600">Manage your barbershop staff members</p>
        </div>
        {currentUser.role === 'owner' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Staff Member
          </button>
        )}
      </div>

      {/* Staff Members List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Staff Members ({staffMembers.length})</h3>
        </div>
        
        {staffMembers.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No staff members found</p>
            {currentUser.role === 'owner' && (
              <p className="text-sm">Add your first staff member to get started</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {staffMembers.map((staff) => (
              <div key={staff.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    {getRoleIcon(staff.role)}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{staff.name}</h4>
                    <p className="text-sm text-gray-500">{staff.email}</p>
                    {staff.phone && (
                      <p className="text-sm text-gray-500">{staff.phone}</p>
                    )}
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(staff.role)}`}>
                    {staff.role}
                  </span>
                </div>
                
                {currentUser.role === 'owner' && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePromoteUser(staff.id, staff.role)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title={`Change to ${staff.role === 'apprentice' ? 'barber' : staff.role === 'barber' ? 'manager' : staff.role === 'manager' ? 'barber' : 'apprentice'}`}
                    >
                      <Crown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingUser(staff)}
                      className="text-gray-600 hover:text-gray-800 p-1"
                      title="Edit user"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(staff.id, staff.name)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Delete user"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Staff Member</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Enter full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Enter email address"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Enter phone number"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'manager' | 'barber' | 'apprentice' })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="manager">Manager</option>
                  <option value="barber">Barber</option>
                  <option value="apprentice">Apprentice</option>
                </select>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
              >
                Add Staff Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Staff Member</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={editingUser.phone || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="barber">Barber</option>
                  <option value="apprentice">Apprentice</option>
                </select>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUser}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
              >
                Update Staff Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
