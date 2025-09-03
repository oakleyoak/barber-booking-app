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
    <div className="p-6 bg-white">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Incident Reports</h2>
            <p className="text-gray-600 mt-1">Track safety incidents, violations, and follow-up actions</p>
          </div>
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
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
          >
            Report Incident
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-sm text-blue-600 font-medium mb-1">Total Incidents</h3>
          <p className="text-2xl font-bold text-blue-700">{totalIncidents}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <h3 className="text-sm text-orange-600 font-medium mb-1">Pending</h3>
          <p className="text-2xl font-bold text-orange-700">{pendingIncidents}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h3 className="text-sm text-green-600 font-medium mb-1">Resolved</h3>
          <p className="text-2xl font-bold text-green-700">{resolvedIncidents}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <h3 className="text-sm text-red-600 font-medium mb-1">Critical Open</h3>
          <p className="text-2xl font-bold text-red-700">{criticalIncidents}</p>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-gray-50 p-6 rounded-lg border mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingIncident ? 'Edit Incident Report' : 'Report New Incident'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Incident Type</label>
                <select
                  value={newIncident.incident_type}
                  onChange={(e) => setNewIncident({...newIncident, incident_type: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  required
                >
                  <option value="">Select Incident Type</option>
                  {incidentTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
                <select
                  value={newIncident.severity}
                  onChange={(e) => setNewIncident({...newIncident, severity: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  required
                >
                  <option value="">Select Severity</option>
                  {severityLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={newIncident.location}
                  onChange={(e) => setNewIncident({...newIncident, location: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="e.g., Station 1, Reception, Back Room"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Witnesses</label>
                <input
                  type="text"
                  value={newIncident.witnesses}
                  onChange={(e) => setNewIncident({...newIncident, witnesses: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Names of witnesses (if any)"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={newIncident.description}
                onChange={(e) => setNewIncident({...newIncident, description: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                rows={3}
                placeholder="Detailed description of what happened"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Immediate Action Taken</label>
              <textarea
                value={newIncident.immediate_action_taken}
                onChange={(e) => setNewIncident({...newIncident, immediate_action_taken: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                rows={2}
                placeholder="What immediate actions were taken to address the incident?"
              />
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="followup"
                checked={newIncident.follow_up_required}
                onChange={(e) => setNewIncident({...newIncident, follow_up_required: e.target.checked})}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="followup" className="text-sm font-medium text-gray-700">
                Follow-up Required
              </label>
            </div>

            {newIncident.follow_up_required && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Follow-up Notes</label>
                <textarea
                  value={newIncident.follow_up_notes}
                  onChange={(e) => setNewIncident({...newIncident, follow_up_notes: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  rows={2}
                  placeholder="What follow-up actions are needed?"
                />
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingIncident(null);
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
              >
                {editingIncident ? 'Update Report' : 'Submit Report'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Incidents List */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">Incident Reports</h3>
          <p className="text-sm text-gray-600 mt-1">All reported incidents and their resolution status</p>
        </div>
        
        {incidents.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-2">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No incidents reported</h3>
            <p className="text-gray-500">Great! This indicates a safe working environment. Continue following safety protocols.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date/Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reported By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {incidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(incident.date).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {incident.time}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                        {incident.incident_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                        {incident.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {incident.location || 'Not specified'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {incident.reported_by ? getUserName(incident.reported_by) : 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={async () => {
                            const text = `Description: ${incident.description}\n\nImmediate Action: ${incident.immediate_action_taken || 'None'}\n\nWitnesses: ${incident.witnesses || 'None'}`;
                            await modal.prompt(text, '');
                          }}
                          className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                        >
                          View
                        </button>
                        {!incident.resolved && (
                          <>
                            <button
                              onClick={() => handleEdit(incident)}
                              className="text-yellow-600 hover:text-yellow-800 font-medium transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleResolve(incident)}
                              className="text-green-600 hover:text-green-800 font-medium transition-colors"
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
        )}
      </div>
    </div>
  );
}
