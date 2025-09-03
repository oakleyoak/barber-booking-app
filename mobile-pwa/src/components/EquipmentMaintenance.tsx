import React, { useEffect, useState } from 'react';
import { equipmentMaintenanceService, userService } from '../services/completeDatabase';
import { useModal } from './ui/ModalProvider';

export default function EquipmentMaintenance() {
  const modal = useModal();
  const [logs, setLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], barber_id: '', task_id: '', completed: false, next_due_date: '', notes: '', issues_found: '' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const [allUsers] = await Promise.all([userService.getUsers()]);
      setUsers(allUsers || []);
      const data = await equipmentMaintenanceService.getLogsByDate(new Date().toISOString().split('T')[0]);
      setLogs(data || []);
    } catch (err) {
      console.error('Failed to load equipment maintenance logs', err);
    } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (editing) {
        await equipmentMaintenanceService.updateLog(editing.id, payload);
        setEditing(null);
      } else {
        await equipmentMaintenanceService.createLog(payload);
      }
      setShowForm(false);
      await load();
    } catch (err) {
      console.error('Save failed', err);
      modal.notify('Failed to save maintenance log', 'error');
    }
  };

  const handleEdit = (row: any) => {
    setEditing(row);
    setForm({ date: row.date || '', barber_id: row.barber_id || '', task_id: row.task_id || '', completed: !!row.completed, next_due_date: row.next_due_date || '', notes: row.notes || '', issues_found: row.issues_found || '' });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const ok = await modal.confirm('Delete this maintenance log?');
    if (!ok) return;
    await equipmentMaintenanceService.deleteLog(id);
    await load();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Equipment Maintenance</h2>
            <p className="text-gray-600 mt-1">Track equipment maintenance logs and schedules</p>
          </div>
          <button
            onClick={() => {
              setShowForm(true);
              setEditing(null);
              setForm({
                date: new Date().toISOString().split('T')[0],
                barber_id: '',
                task_id: '',
                completed: false,
                next_due_date: '',
                notes: '',
                issues_found: ''
              });
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            Add Log
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-sm text-blue-600 font-medium mb-1">Total Logs</h3>
          <p className="text-2xl font-bold text-blue-700">{logs.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h3 className="text-sm text-green-600 font-medium mb-1">Completed Tasks</h3>
          <p className="text-2xl font-bold text-green-700">{logs.filter(log => log.completed).length}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <h3 className="text-sm text-orange-600 font-medium mb-1">Pending Tasks</h3>
          <p className="text-2xl font-bold text-orange-700">{logs.filter(log => !log.completed).length}</p>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-gray-50 p-6 rounded-lg border mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editing ? 'Edit Maintenance Log' : 'Add Maintenance Log'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm({...form, date: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Performed By</label>
                <select
                  value={form.barber_id}
                  onChange={e => setForm({...form, barber_id: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value="">Select User</option>
                  {users.map(u => (
                    <option key={u.id} value={u.auth_user_id || u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Task ID</label>
                <input
                  type="text"
                  value={form.task_id}
                  onChange={e => setForm({...form, task_id: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter task identifier"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Next Due Date</label>
                <input
                  type="date"
                  value={form.next_due_date}
                  onChange={e => setForm({...form, next_due_date: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="completed"
                checked={form.completed}
                onChange={e => setForm({...form, completed: e.target.checked})}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="completed" className="text-sm font-medium text-gray-700">
                Task Completed
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                value={form.notes}
                onChange={e => setForm({...form, notes: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                rows={3}
                placeholder="Add any maintenance notes or observations..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Issues Found</label>
              <textarea
                value={form.issues_found}
                onChange={e => setForm({...form, issues_found: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                rows={3}
                placeholder="Document any issues or problems discovered..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
              >
                {editing ? 'Update Log' : 'Create Log'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Maintenance Logs Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">Maintenance Logs</h3>
          <p className="text-sm text-gray-600 mt-1">Equipment maintenance history and scheduled tasks</p>
        </div>
        
        {logs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-2">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No maintenance logs</h3>
            <p className="text-gray-500">Start tracking equipment maintenance by adding your first log entry.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performed By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Due</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map(row => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(row.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {users.find(u => (u.auth_user_id === row.barber_id) || (u.id === row.barber_id))?.name || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {row.task_id || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {row.completed ? (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                          Completed
                        </span>
                      ) : (
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.next_due_date ? new Date(row.next_due_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleEdit(row)}
                          className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(row.id)}
                          className="text-red-600 hover:text-red-800 font-medium transition-colors"
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
}
