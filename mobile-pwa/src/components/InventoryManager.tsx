import React, { useState, useEffect } from 'react';
import { useModal } from './ui/ModalProvider';
import { equipmentService, type EquipmentInventory } from '../services/completeDatabase';

export default function InventoryManager() {
  const modal = useModal(); // Top-aligned modals only
  const [equipment, setEquipment] = useState<EquipmentInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<EquipmentInventory | null>(null);
  const [newItem, setNewItem] = useState({
    equipment_name: '',
    category: '',
    serial_number: '',
    purchase_date: '',
    warranty_expiry: '',
    location: '',
    condition_rating: 5,
    current_value: '',
    notes: ''
  });

  const categories = [
    'Hair Clippers', 'Scissors', 'Combs & Brushes', 'Chairs', 'Mirrors', 
    'Sterilization Equipment', 'Dryers', 'Styling Tools', 'Furniture', 'Other'
  ];

  const conditionLabels: { [key: number]: string } = {
    5: 'Excellent',
    4: 'Good', 
    3: 'Fair',
    2: 'Poor',
    1: 'Critical'
  };

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    try {
      setLoading(true);
      const data = await equipmentService.getEquipment();
      setEquipment(data);
    } catch (error) {
      console.error('Failed to load equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const itemData = {
        equipment_name: newItem.equipment_name,
        category: newItem.category,
        serial_number: newItem.serial_number || undefined,
        purchase_date: newItem.purchase_date || undefined,
        warranty_expiry: newItem.warranty_expiry || undefined,
        location: newItem.location || undefined,
        condition_rating: newItem.condition_rating,
        current_value: newItem.current_value ? parseFloat(newItem.current_value) : undefined,
        notes: newItem.notes || undefined,
        is_active: true
      };

      if (editingItem) {
        await equipmentService.updateEquipment(editingItem.id, itemData);
        setEditingItem(null);
      } else {
        await equipmentService.createEquipment(itemData);
      }

      setNewItem({
        equipment_name: '',
        category: '',
        serial_number: '',
        purchase_date: '',
        warranty_expiry: '',
        location: '',
        condition_rating: 5,
        current_value: '',
        notes: ''
      });
      setShowAddForm(false);
      await loadEquipment();
    } catch (error) {
  console.error('Failed to save equipment:', error);
  modal.notify('Failed to save equipment. Please try again.', 'error');
    }
  };

  const handleEdit = (item: EquipmentInventory) => {
    setEditingItem(item);
    setNewItem({
      equipment_name: item.equipment_name,
      category: item.category,
      serial_number: item.serial_number || '',
      purchase_date: item.purchase_date || '',
      warranty_expiry: item.warranty_expiry || '',
      location: item.location || '',
      condition_rating: item.condition_rating || 5,
      current_value: item.current_value?.toString() || '',
      notes: item.notes || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
  const ok = await modal.confirm('Are you sure you want to remove this equipment from inventory?');
  if (!ok) return;
    try {
      await equipmentService.deleteEquipment(id);
      await loadEquipment();
    } catch (error) {
  console.error('Failed to delete equipment:', error);
  modal.notify('Failed to delete equipment. Please try again.', 'error');
    }
  };

  const getConditionColor = (rating: number) => {
    switch (rating) {
      case 5: return 'text-green-600 bg-green-100';
      case 4: return 'text-blue-600 bg-blue-100';
      case 3: return 'text-yellow-600 bg-yellow-100';
      case 2: return 'text-orange-600 bg-orange-100';
      case 1: return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const isWarrantyExpiring = (warrantyDate: string) => {
    if (!warrantyDate) return false;
    const warranty = new Date(warrantyDate);
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
    return warranty <= thirtyDaysFromNow && warranty >= today;
  };

  const isWarrantyExpired = (warrantyDate: string) => {
    if (!warrantyDate) return false;
    const warranty = new Date(warrantyDate);
    const today = new Date();
    return warranty < today;
  };

  const totalValue = equipment.reduce((sum, item) => sum + (item.current_value || 0), 0);
  const criticalItems = equipment.filter(item => (item.condition_rating || 5) <= 2).length;
  const expiringWarranties = equipment.filter(item => item.warranty_expiry && isWarrantyExpiring(item.warranty_expiry)).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Equipment Inventory</h1>
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditingItem(null);
            setNewItem({
              equipment_name: '',
              category: '',
              serial_number: '',
              purchase_date: '',
              warranty_expiry: '',
              location: '',
              condition_rating: 5,
              current_value: '',
              notes: ''
            });
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Equipment
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <h3 className="text-sm text-gray-600 mb-1">Total Items</h3>
          <p className="text-2xl font-bold text-blue-600">{equipment.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <h3 className="text-sm text-gray-600 mb-1">Total Value</h3>
          <p className="text-2xl font-bold text-green-600">₺{totalValue.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <h3 className="text-sm text-gray-600 mb-1">Critical Items</h3>
          <p className="text-2xl font-bold text-red-600">{criticalItems}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
          <h3 className="text-sm text-gray-600 mb-1">Warranties Expiring</h3>
          <p className="text-2xl font-bold text-orange-600">{expiringWarranties}</p>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingItem ? 'Edit Equipment' : 'Add New Equipment'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Equipment Name</label>
              <input
                type="text"
                value={newItem.equipment_name}
                onChange={(e) => setNewItem({...newItem, equipment_name: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={newItem.category}
                onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
              <input
                type="text"
                value={newItem.serial_number}
                onChange={(e) => setNewItem({...newItem, serial_number: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
              <input
                type="date"
                value={newItem.purchase_date}
                onChange={(e) => setNewItem({...newItem, purchase_date: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Expiry</label>
              <input
                type="date"
                value={newItem.warranty_expiry}
                onChange={(e) => setNewItem({...newItem, warranty_expiry: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={newItem.location}
                onChange={(e) => setNewItem({...newItem, location: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Station 1, Storage Room"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condition Rating</label>
              <select
                value={newItem.condition_rating}
                onChange={(e) => setNewItem({...newItem, condition_rating: parseInt(e.target.value)})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.entries(conditionLabels).map(([rating, label]) => (
                  <option key={rating} value={rating}>{rating} - {label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Value (₺)</label>
              <input
                type="number"
                step="0.01"
                value={newItem.current_value}
                onChange={(e) => setNewItem({...newItem, current_value: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={newItem.notes}
                onChange={(e) => setNewItem({...newItem, notes: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Additional notes, maintenance history, etc."
              />
            </div>

            <div className="lg:col-span-3 flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingItem ? 'Update Equipment' : 'Add Equipment'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingItem(null);
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Equipment List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Equipment</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Category</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Location</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Condition</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Value</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Warranty</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {equipment.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.equipment_name}</div>
                      {item.serial_number && (
                        <div className="text-xs text-gray-500">S/N: {item.serial_number}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{item.category}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{item.location || 'Not specified'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(item.condition_rating || 5)}`}>
                      {conditionLabels[item.condition_rating || 5]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                    {item.current_value ? `₺${item.current_value.toFixed(2)}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {item.warranty_expiry ? (
                      <div>
                        <div className={`text-xs ${isWarrantyExpired(item.warranty_expiry) ? 'text-red-600' : 
                          isWarrantyExpiring(item.warranty_expiry) ? 'text-orange-600' : 'text-gray-600'}`}>
                          {new Date(item.warranty_expiry).toLocaleDateString()}
                        </div>
                        {isWarrantyExpired(item.warranty_expiry) && (
                          <div className="text-xs text-red-600 font-medium">Expired</div>
                        )}
                        {isWarrantyExpiring(item.warranty_expiry) && !isWarrantyExpired(item.warranty_expiry) && (
                          <div className="text-xs text-orange-600 font-medium">Expiring Soon</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">No warranty</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {equipment.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No equipment in inventory yet. Add your first item to get started.
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
