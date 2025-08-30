import React, { useState, useEffect } from 'react';
import { useModal } from './ui/ModalProvider';
import { suppliesService, type SuppliesInventory } from '../services/completeDatabase';

export default function SuppliesInventory() {
  const modal = useModal();
  const [supplies, setSupplies] = useState<SuppliesInventory[]>([]);
  const [lowStockItems, setLowStockItems] = useState<SuppliesInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<SuppliesInventory | null>(null);
  const [showRestockForm, setShowRestockForm] = useState<SuppliesInventory | null>(null);
  const [newItem, setNewItem] = useState({
    item_name: '',
    category: '',
    current_stock: '',
    minimum_stock: '',
    unit: 'pieces',
    supplier: '',
    expiry_date: '',
    unit_cost: ''
  });

  const categories = [
    'Hair Products', 'Cleaning Supplies', 'Tools & Accessories', 'Sanitization',
    'Towels & Linens', 'Office Supplies', 'Safety Equipment', 'Other'
  ];

  const units = ['pieces', 'bottles', 'packages', 'liters', 'kilograms', 'sets', 'pairs'];

  useEffect(() => {
    loadSupplies();
  }, []);

  const loadSupplies = async () => {
    try {
      setLoading(true);
      const [allSupplies, lowStock] = await Promise.all([
        suppliesService.getSupplies(),
        suppliesService.getLowStockSupplies()
      ]);
      setSupplies(allSupplies);
      setLowStockItems(lowStock);
    } catch (error) {
      console.error('Failed to load supplies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const itemData = {
        item_name: newItem.item_name,
        category: newItem.category,
        current_stock: parseInt(newItem.current_stock),
        minimum_stock: parseInt(newItem.minimum_stock),
        unit: newItem.unit,
        supplier: newItem.supplier || undefined,
        expiry_date: newItem.expiry_date || undefined,
        unit_cost: newItem.unit_cost ? parseFloat(newItem.unit_cost) : undefined,
        is_active: true,
        last_restocked: new Date().toISOString().split('T')[0]
      };

      if (editingItem) {
        await suppliesService.updateSupply(editingItem.id, itemData);
        setEditingItem(null);
      } else {
        await suppliesService.createSupply(itemData);
      }

      setNewItem({
        item_name: '',
        category: '',
        current_stock: '',
        minimum_stock: '',
        unit: 'pieces',
        supplier: '',
        expiry_date: '',
        unit_cost: ''
      });
      setShowAddForm(false);
      await loadSupplies();
    } catch (error) {
  console.error('Failed to save supply item:', error);
  modal.notify('Failed to save supply item. Please try again.', 'error');
    }
  };

  const handleEdit = (item: SuppliesInventory) => {
    setEditingItem(item);
    setNewItem({
      item_name: item.item_name,
      category: item.category,
      current_stock: item.current_stock.toString(),
      minimum_stock: item.minimum_stock.toString(),
      unit: item.unit,
      supplier: item.supplier || '',
      expiry_date: item.expiry_date || '',
      unit_cost: item.unit_cost?.toString() || ''
    });
    setShowAddForm(true);
  };

  const handleRestock = async (item: SuppliesInventory, newStock: number) => {
    try {
      await suppliesService.updateStock(item.id, newStock);
      setShowRestockForm(null);
      await loadSupplies();
    } catch (error) {
      console.error('Failed to update stock:', error);
      modal.notify('Failed to update stock. Please try again.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
  const ok = await modal.confirm('Are you sure you want to remove this item from inventory?');
  if (!ok) return;
    try {
      await suppliesService.updateSupply(id, { is_active: false });
      await loadSupplies();
    } catch (error) {
  console.error('Failed to delete supply item:', error);
  modal.notify('Failed to delete supply item. Please try again.', 'error');
    }
  };

  const isExpiring = (expiryDate: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
    return expiry <= thirtyDaysFromNow && expiry >= today;
  };

  const isExpired = (expiryDate: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    return expiry < today;
  };

  const getStockStatusColor = (current: number, minimum: number) => {
    if (current === 0) return 'text-red-600 bg-red-100';
    if (current <= minimum) return 'text-orange-600 bg-orange-100';
    if (current <= minimum * 1.5) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getStockStatusText = (current: number, minimum: number) => {
    if (current === 0) return 'Out of Stock';
    if (current <= minimum) return 'Low Stock';
    if (current <= minimum * 1.5) return 'Running Low';
    return 'In Stock';
  };

  const totalItems = supplies.length;
  const totalValue = supplies.reduce((sum, item) => sum + (item.current_stock * (item.unit_cost || 0)), 0);
  const outOfStockItems = supplies.filter(item => item.current_stock === 0).length;
  const expiringItems = supplies.filter(item => item.expiry_date && isExpiring(item.expiry_date)).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Supplies Inventory</h1>
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditingItem(null);
            setNewItem({
              item_name: '',
              category: '',
              current_stock: '',
              minimum_stock: '',
              unit: 'pieces',
              supplier: '',
              expiry_date: '',
              unit_cost: ''
            });
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Supply Item
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <h3 className="text-sm text-gray-600 mb-1">Total Items</h3>
          <p className="text-2xl font-bold text-blue-600">{totalItems}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <h3 className="text-sm text-gray-600 mb-1">Total Value</h3>
          <p className="text-2xl font-bold text-green-600">₺{totalValue.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <h3 className="text-sm text-gray-600 mb-1">Out of Stock</h3>
          <p className="text-2xl font-bold text-red-600">{outOfStockItems}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
          <h3 className="text-sm text-gray-600 mb-1">Low/Expiring</h3>
          <p className="text-2xl font-bold text-orange-600">{lowStockItems.length + expiringItems}</p>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-orange-800">Low Stock Alert</h3>
              <div className="mt-2 text-sm text-orange-700">
                <p>{lowStockItems.length} items are running low and need to be restocked.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingItem ? 'Edit Supply Item' : 'Add New Supply Item'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
              <input
                type="text"
                value={newItem.item_name}
                onChange={(e) => setNewItem({...newItem, item_name: e.target.value})}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
              <input
                type="number"
                min="0"
                value={newItem.current_stock}
                onChange={(e) => setNewItem({...newItem, current_stock: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Stock</label>
              <input
                type="number"
                min="0"
                value={newItem.minimum_stock}
                onChange={(e) => setNewItem({...newItem, minimum_stock: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <select
                value={newItem.unit}
                onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {units.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
              <input
                type="text"
                value={newItem.supplier}
                onChange={(e) => setNewItem({...newItem, supplier: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
              <input
                type="date"
                value={newItem.expiry_date}
                onChange={(e) => setNewItem({...newItem, expiry_date: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost (₺)</label>
              <input
                type="number"
                step="0.01"
                value={newItem.unit_cost}
                onChange={(e) => setNewItem({...newItem, unit_cost: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="lg:col-span-3 flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingItem ? 'Update Item' : 'Add Item'}
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

      {/* Restock Form */}
      {showRestockForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Restock {showRestockForm.item_name}</h2>
          <form onSubmit={(e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const formData = new FormData(form);
            const newStock = parseInt(formData.get('newStock') as string);
            handleRestock(showRestockForm, newStock);
          }} className="flex gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Stock: {showRestockForm.current_stock} {showRestockForm.unit}
              </label>
              <input
                name="newStock"
                type="number"
                min={showRestockForm.current_stock}
                defaultValue={showRestockForm.current_stock}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Update Stock
            </button>
            <button
              type="button"
              onClick={() => setShowRestockForm(null)}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Supplies List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Item</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Category</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Stock</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Unit Cost</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Expiry</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {supplies.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.item_name}</div>
                      {item.supplier && (
                        <div className="text-xs text-gray-500">Supplier: {item.supplier}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{item.category}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {item.current_stock} / {item.minimum_stock} {item.unit}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStockStatusColor(item.current_stock, item.minimum_stock)}`}>
                      {getStockStatusText(item.current_stock, item.minimum_stock)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                    {item.unit_cost ? `₺${item.unit_cost.toFixed(2)}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {item.expiry_date ? (
                      <div>
                        <div className={`text-xs ${isExpired(item.expiry_date) ? 'text-red-600' : 
                          isExpiring(item.expiry_date) ? 'text-orange-600' : 'text-gray-600'}`}>
                          {new Date(item.expiry_date).toLocaleDateString()}
                        </div>
                        {isExpired(item.expiry_date) && (
                          <div className="text-xs text-red-600 font-medium">Expired</div>
                        )}
                        {isExpiring(item.expiry_date) && !isExpired(item.expiry_date) && (
                          <div className="text-xs text-orange-600 font-medium">Expiring Soon</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">No expiry</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowRestockForm(item)}
                        className="text-green-600 hover:text-green-800"
                      >
                        Restock
                      </button>
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

        {supplies.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No supply items in inventory yet. Add your first item to get started.
          </div>
        )}
      </div>
    </div>
  );
}
