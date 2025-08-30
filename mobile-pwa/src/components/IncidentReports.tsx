import React, { useState, useEffect } from 'react';
import { useModal } from './ui/ModalProvider';
import { incidentService, userService, type IncidentReport, type User } from '../services/completeDatabase';

interface Props {
  currentUserId: string;
}

export default function IncidentReports({ currentUserId }: Props) {
  const modal = useModal();
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIncident, setEditingIncident] = useState<IncidentReport | null>(null);
  const [newIncident, setNewIncident] = useState({
    incident_type: '',
    severity: '',
    location: '',
    description: '',
    immediate_action_taken: '',
    witnesses: '',
    follow_up_required: false,
    follow_up_notes: ''
  });

  const incidentTypes = [
    'Injury', 'Equipment Malfunction', 'Safety Violation', 'Property Damage',
    'Customer Complaint', 'Health Code Violation', 'Theft', 'Emergency', 'Other'
  ];

  const severityLevels = ['Low', 'Medium', 'High', 'Critical'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [incidentData, userData] = await Promise.all([
        incidentService.getIncidents(),
        userService.getUsers()
      ]);
      setIncidents(incidentData);
      setUsers(userData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const incidentData = {
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0],
        reported_by: currentUserId,
        incident_type: newIncident.incident_type,
        severity: newIncident.severity,
        location: newIncident.location || undefined,
        description: newIncident.description,
        immediate_action_taken: newIncident.immediate_action_taken || undefined,
        witnesses: newIncident.witnesses || undefined,
        follow_up_required: newIncident.follow_up_required,
        follow_up_notes: newIncident.follow_up_notes || undefined,
        resolved: false
      };

      if (editingIncident) {
        await incidentService.updateIncident(editingIncident.id, incidentData);
        setEditingIncident(null);
      } else {
        await incidentService.createIncident(incidentData);
      }

      setNewIncident({
        incident_type: '',
        severity: '',
        location: '',
        description: '',
        immediate_action_taken: '',
        witnesses: '',
        follow_up_required: false,
        follow_up_notes: ''
      });
      setShowAddForm(false);
      await loadData();
    } catch (error) {
  console.error('Failed to save incident:', error);
  modal.notify('Failed to save incident report. Please try again.', 'error');
    }
  };

  const handleResolve = async (incident: IncidentReport) => {
  const resolutionNotes = await modal.prompt('Enter resolution notes:');
  if (resolutionNotes === null) return;
    
    try {
      await incidentService.resolveIncident(incident.id, resolutionNotes);
      await loadData();
    } catch (error) {
  console.error('Failed to resolve incident:', error);
  modal.notify('Failed to resolve incident. Please try again.', 'error');
    }
  };

  const handleEdit = (incident: IncidentReport) => {
    setEditingIncident(incident);
    setNewIncident({
      incident_type: incident.incident_type,
      severity: incident.severity,
      location: incident.location || '',
      description: incident.description,
      immediate_action_taken: incident.immediate_action_taken || '',
      witnesses: incident.witnesses || '',
      follow_up_required: incident.follow_up_required,
      follow_up_notes: incident.follow_up_notes || ''
    });
    setShowAddForm(true);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown';
  };

  const totalIncidents = incidents.length;
  const resolvedIncidents = incidents.filter(incident => incident.resolved).length;
  const pendingIncidents = totalIncidents - resolvedIncidents;
  const criticalIncidents = incidents.filter(incident => 
    incident.severity.toLowerCase() === 'critical' && !incident.resolved
  ).length;

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
        <h1 className="text-2xl font-bold text-gray-800">Incident Reports</h1>
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditingIncident(null);
            setNewIncident({
              incident_type: '',
              severity: '',
              location: '',
              description: '',
              immediate_action_taken: '',
              witnesses: '',
              follow_up_required: false,
              follow_up_notes: ''
            });
          }}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Report Incident
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <h3 className="text-sm text-gray-600 mb-1">Total Incidents</h3>
          <p className="text-2xl font-bold text-blue-600">{totalIncidents}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
          <h3 className="text-sm text-gray-600 mb-1">Pending</h3>
          <p className="text-2xl font-bold text-orange-600">{pendingIncidents}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <h3 className="text-sm text-gray-600 mb-1">Resolved</h3>
          <p className="text-2xl font-bold text-green-600">{resolvedIncidents}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <h3 className="text-sm text-gray-600 mb-1">Critical Open</h3>
          <p className="text-2xl font-bold text-red-600">{criticalIncidents}</p>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingIncident ? 'Edit Incident Report' : 'Report New Incident'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Incident Type</label>
              <select
                value={newIncident.incident_type}
                onChange={(e) => setNewIncident({...newIncident, incident_type: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Incident Type</option>
                {incidentTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
              <select
                value={newIncident.severity}
                onChange={(e) => setNewIncident({...newIncident, severity: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Severity</option>
                {severityLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={newIncident.location}
                onChange={(e) => setNewIncident({...newIncident, location: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Station 1, Reception, Back Room"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Witnesses</label>
              <input
                type="text"
                value={newIncident.witnesses}
                onChange={(e) => setNewIncident({...newIncident, witnesses: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Names of witnesses (if any)"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={newIncident.description}
                onChange={(e) => setNewIncident({...newIncident, description: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Detailed description of what happened"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Immediate Action Taken</label>
              <textarea
                value={newIncident.immediate_action_taken}
                onChange={(e) => setNewIncident({...newIncident, immediate_action_taken: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                placeholder="What immediate actions were taken to address the incident?"
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newIncident.follow_up_required}
                  onChange={(e) => setNewIncident({...newIncident, follow_up_required: e.target.checked})}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Follow-up Required</span>
              </label>
            </div>

            {newIncident.follow_up_required && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Notes</label>
                <textarea
                  value={newIncident.follow_up_notes}
                  onChange={(e) => setNewIncident({...newIncident, follow_up_notes: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="What follow-up actions are needed?"
                />
              </div>
            )}

            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                {editingIncident ? 'Update Report' : 'Submit Report'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingIncident(null);
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Incidents List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date/Time</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Severity</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Location</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Reported By</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {incidents.map((incident) => (
                <tr key={incident.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900">
                      {new Date(incident.date).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {incident.time}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{incident.incident_type}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                      {incident.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{incident.location || 'Not specified'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {incident.reported_by ? getUserName(incident.reported_by) : 'Unknown'}
                  </td>
                  <td className="px-4 py-3">
                    {incident.resolved ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        Resolved
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          const text = `Description: ${incident.description}\n\nImmediate Action: ${incident.immediate_action_taken || 'None'}\n\nWitnesses: ${incident.witnesses || 'None'}`;
                          await modal.prompt(text, '');
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View
                      </button>
                      {!incident.resolved && (
                        <>
                          <button
                            onClick={() => handleEdit(incident)}
                            className="text-yellow-600 hover:text-yellow-800"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleResolve(incident)}
                            className="text-green-600 hover:text-green-800"
                          >
                            Resolve
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {incidents.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No incidents reported yet. This is good news!
          </div>
        )}
      </div>
    </div>
  );
}
