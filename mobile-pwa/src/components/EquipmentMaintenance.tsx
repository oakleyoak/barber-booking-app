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

  if (loading) return <div className="p-6"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Equipment Maintenance</h1>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ date: new Date().toISOString().split('T')[0], barber_id: '', task_id: '', completed: false, next_due_date: '', notes: '', issues_found: '' }); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg">Add Log</button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit Maintenance Log' : 'Add Maintenance Log'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full p-2 border rounded" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Performed By</label>
              <select value={form.barber_id} onChange={e => setForm({...form, barber_id: e.target.value})} className="w-full p-2 border rounded">
                <option value="">Select User</option>
                {users.map(u => <option key={u.id} value={u.auth_user_id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Task ID</label>
              <input type="text" value={form.task_id} onChange={e => setForm({...form, task_id: e.target.value})} className="w-full p-2 border rounded" placeholder="task id" />
            </div>
            <div>
              <label className="flex items-center">
                <input type="checkbox" checked={form.completed} onChange={e => setForm({...form, completed: e.target.checked})} className="mr-2" />
                <span className="text-sm">Completed</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Next Due Date</label>
              <input type="date" value={form.next_due_date} onChange={e => setForm({...form, next_due_date: e.target.value})} className="w-full p-2 border rounded" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full p-2 border rounded" rows={2}></textarea>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Issues Found</label>
              <textarea value={form.issues_found} onChange={e => setForm({...form, issues_found: e.target.value})} className="w-full p-2 border rounded" rows={2}></textarea>
            </div>
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg">{editing ? 'Update' : 'Create'}</button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="bg-gray-500 text-white px-4 py-2 rounded-lg">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">User</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Task</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Completed</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Next Due</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.map(row => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{new Date(row.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{users.find(u => u.auth_user_id === row.barber_id)?.name || '—'}</td>
                  <td className="px-4 py-3">{row.task_id || '—'}</td>
                  <td className="px-4 py-3">{row.completed ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3">{row.next_due_date ? new Date(row.next_due_date).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(row)} className="text-blue-600">Edit</button>
                      <button onClick={() => handleDelete(row.id)} className="text-red-600">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
