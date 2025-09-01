import React, { useEffect, useState } from 'react';
import { dailySafetyChecksService, userService } from '../services/completeDatabase';
import { useModal } from './ui/ModalProvider';

export default function DailySafetyChecks() {
  const modal = useModal();
  const [checks, setChecks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], barber_id: '', item_id: '', status: 'OK', reading_value: '', notes: '', corrective_action: '' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const [allUsers] = await Promise.all([userService.getUsers()]);
      setUsers(allUsers || []);
      const data = await dailySafetyChecksService.getChecksByDate(new Date().toISOString().split('T')[0]);
      setChecks(data || []);
    } catch (err) {
      console.error('Failed to load safety checks', err);
    } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (editing) {
        await dailySafetyChecksService.updateCheck(editing.id, payload);
        setEditing(null);
      } else {
        await dailySafetyChecksService.createCheck(payload);
      }
      setShowForm(false);
      await load();
    } catch (err) {
      console.error('Save failed', err);
      modal.notify('Failed to save safety check', 'error');
    }
  };

  const handleEdit = (row: any) => {
    setEditing(row);
    setForm({ date: row.date || '', barber_id: row.barber_id || '', item_id: row.item_id || '', status: row.status || 'OK', reading_value: row.reading_value || '', notes: row.notes || '', corrective_action: row.corrective_action || '' });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const ok = await modal.confirm('Delete this safety check?');
    if (!ok) return;
    await dailySafetyChecksService.deleteCheck(id);
    await load();
  };

  if (loading) return <div className="p-6"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Daily Safety Checks</h1>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ date: new Date().toISOString().split('T')[0], barber_id: '', item_id: '', status: 'OK', reading_value: '', notes: '', corrective_action: '' }); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg">Add Check</button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit Safety Check' : 'Add Safety Check'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full p-2 border rounded" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Barber</label>
              <select value={form.barber_id} onChange={e => setForm({...form, barber_id: e.target.value})} className="w-full p-2 border rounded">
                <option value="">Select Barber</option>
                {users.map(u => <option key={u.id} value={u.auth_user_id || u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item ID</label>
              <input type="text" value={form.item_id} onChange={e => setForm({...form, item_id: e.target.value})} className="w-full p-2 border rounded" placeholder="item id" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full p-2 border rounded">
                <option value="OK">OK</option>
                <option value="Fail">Fail</option>
                <option value="Attention">Needs Attention</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reading / Notes</label>
              <textarea value={form.reading_value} onChange={e => setForm({...form, reading_value: e.target.value})} className="w-full p-2 border rounded" rows={2} placeholder="reading or notes"></textarea>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Corrective Action</label>
              <textarea value={form.corrective_action} onChange={e => setForm({...form, corrective_action: e.target.value})} className="w-full p-2 border rounded" rows={2} placeholder="corrective action if any"></textarea>
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
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Barber</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Item</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Reading</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {checks.map(row => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{new Date(row.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{users.find(u => (u.auth_user_id === row.barber_id) || (u.id === row.barber_id))?.name || '—'}</td>
                  <td className="px-4 py-3">{row.item_id || '—'}</td>
                  <td className="px-4 py-3">{row.status}</td>
                  <td className="px-4 py-3">{row.reading_value || row.notes || ''}</td>
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
