import React, { useEffect, useState } from 'react';
import { bookingService, userService } from '../services/completeDatabase';

const StaffReviewModal = ({ staffId, onClose }: { staffId: string, onClose: () => void }) => {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [staff, setStaff] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      bookingService.getBookings(staffId),
      userService.getUserById(staffId)
    ]).then(([bookings, staff]) => {
      setBookings(bookings || []);
      setStaff(staff);
      setNotes(staff?.performance_notes || '');
      setLoading(false);
    });
  }, [staffId]);

  const totalRevenue = bookings.reduce((sum, b) => sum + (b.price || 0), 0);
  const avgPrice = bookings.length ? (totalRevenue / bookings.length) : 0;

  const handleSaveNotes = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      await userService.updateUser(staffId, { performance_notes: notes });
      setSaveMsg('Notes saved!');
    } catch (e) {
      setSaveMsg('Error saving notes.');
    }
    setSaving(false);
  };

  return (
    <div className="mt-4 p-4 border rounded bg-white max-w-xl">
      {loading ? (
        <div className="text-gray-500">Loading staff performance...</div>
      ) : (
        <>
          <h4 className="font-bold mb-2">Performance for {staff?.name}</h4>
          <div className="mb-2 text-sm">
            <span className="font-semibold">Total Bookings:</span> {bookings.length}<br />
            <span className="font-semibold">Total Revenue:</span> ₺{(totalRevenue / 100).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}<br />
            <span className="font-semibold">Average Price:</span> ₺{(avgPrice / 100).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Recent Bookings:</span>
            <ul className="max-h-32 overflow-y-auto text-xs mt-1">
              {bookings.slice(0, 10).map(b => (
                <li key={b.id} className="border-b last:border-b-0 py-1">
                  {b.date} - {b.customer_name} - {b.service} - ₺{(b.price / 100).toFixed(2)} {b.notes ? (<span className="italic text-gray-500">({b.notes})</span>) : null}
                </li>
              ))}
              {bookings.length === 0 && <li className="text-gray-400">No bookings found.</li>}
            </ul>
          </div>
          <div className="mb-2">
            <span className="font-semibold">Performance Notes:</span>
            <textarea
              className="w-full border rounded p-2 text-xs mt-1"
              rows={4}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Enter performance review notes for this staff member..."
              disabled={saving}
            />
            <div className="flex items-center gap-2 mt-1">
              <button
                className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                onClick={handleSaveNotes}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Notes'}
              </button>
              {saveMsg && <span className="text-xs text-green-600">{saveMsg}</span>}
            </div>
          </div>
          <button className="mt-2 px-3 py-1 bg-gray-200 rounded" onClick={onClose}>Close</button>
        </>
      )}
    </div>
  );
};

export default StaffReviewModal;