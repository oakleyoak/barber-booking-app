import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Wrench,
  Shield,
  Users,
  AlertTriangle,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Plus,
  Edit2,
  Trash2
} from 'lucide-react';
import { operationsService } from '../services/operationsService';
import type {
  DailyOperations,
  CleaningTask,
  CleaningLog,
  SafetyCheckItem,
  SafetyCheckLog,
  StaffAccountability
} from '../services/operationsService';

interface MaintenanceTask {
  id: string;
  equipment_name: string;
  task_name: string;
  frequency: string;
  estimated_time_minutes: number;
  instructions: string;
  requires_specialist: boolean;
}

interface MaintenanceLog {
  id: string;
  date: string;
  barber_id: string;
  task_id: string;
  completed: boolean;
  completed_at: string;
  next_due_date: string;
  notes: string;
  issues_found: string;
}

interface OperationsManualProps {
  currentUser: any;
}

const OperationsManual: React.FC<OperationsManualProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'cleaning' | 'maintenance' | 'safety' | 'staff' | 'incidents' | 'inventory'>('overview');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // State for different sections
  const [dailyOps, setDailyOps] = useState<DailyOperations | null>(null);
  const [cleaningTasks, setCleaningTasks] = useState<CleaningTask[]>([]);
  const [cleaningLogs, setCleaningLogs] = useState<CleaningLog[]>([]);
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [safetyItems, setSafetyItems] = useState<SafetyCheckItem[]>([]);
  const [safetyLogs, setSafetyLogs] = useState<SafetyCheckLog[]>([]);
  const [staffAccountability, setStaffAccountability] = useState<StaffAccountability | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOperationsData();
  }, [selectedDate, currentUser]);

  const loadOperationsData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadDailyOperations(),
        loadCleaningData(),
        loadMaintenanceData(),
        loadSafetyData(),
        loadStaffAccountability()
      ]);
    } catch (error) {
      console.error('Error loading operations data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDailyOperations = async () => {
    try {
      const data = await operationsService.getDailyOperations(selectedDate, currentUser.id);
      setDailyOps(data);
    } catch (error) {
      console.error('Error loading daily operations:', error);
    }
  };

  const loadCleaningData = async () => {
    try {
      console.log('Loading cleaning data...');
      const [tasks, logs] = await Promise.all([
        operationsService.getCleaningTasks(),
        operationsService.getCleaningLogs(selectedDate, currentUser.id)
      ]);

      console.log('Cleaning tasks loaded:', tasks.length);
      console.log('Cleaning logs loaded:', logs.length);

      setCleaningTasks(tasks);
      setCleaningLogs(logs);
    } catch (error) {
      console.error('Error loading cleaning data:', error);
    }
  };

  const loadSafetyData = async () => {
    try {
      console.log('Loading safety data...');
      const [items, logs] = await Promise.all([
        operationsService.getSafetyCheckItems(),
        operationsService.getSafetyCheckLogs(selectedDate, currentUser.id)
      ]);

      console.log('Safety items loaded:', items.length);
      console.log('Safety logs loaded:', logs.length);

      setSafetyItems(items);
      setSafetyLogs(logs);
    } catch (error) {
      console.error('Error loading safety data:', error);
    }
  };

  const loadStaffAccountability = async () => {
    try {
      const data = await operationsService.getStaffAccountability(selectedDate, currentUser.id);
      setStaffAccountability(data);
    } catch (error) {
      console.error('Error loading staff accountability:', error);
    }
  };

  const loadMaintenanceData = async () => {
    try {
      const [tasks, logs] = await Promise.all([
        operationsService.getMaintenanceTasks(),
        operationsService.getMaintenanceLogs(selectedDate)
      ]);

      setMaintenanceTasks(tasks);
      setMaintenanceLogs(logs);
    } catch (error) {
      console.error('Error loading maintenance data:', error);
    }
  };

  const updateDailyOperations = async (updates: Partial<DailyOperations>) => {
    try {
      const data = await operationsService.updateDailyOperations({
        ...updates,
        date: selectedDate,
        barber_id: currentUser.id
      });
      setDailyOps(data);
    } catch (error) {
      console.error('Error updating daily operations:', error);
      alert('Failed to update daily operations');
    }
  };

  const toggleCleaningTask = async (taskId: string, completed: boolean) => {
    try {
      const log = cleaningLogs.find(l => l.task_id === taskId);
      const logData = {
        date: selectedDate,
        barber_id: currentUser.id,
        task_id: taskId,
        completed,
        completed_at: completed ? new Date().toISOString() : undefined
      };

      await operationsService.updateCleaningLog(logData);
      await loadCleaningData();
    } catch (error) {
      console.error('Error updating cleaning task:', error);
      alert('Failed to update cleaning task');
    }
  };

  const updateSafetyCheck = async (itemId: string, status: 'pass' | 'fail' | 'n/a', notes?: string) => {
    try {
      const logData = {
        date: selectedDate,
        barber_id: currentUser.id,
        item_id: itemId,
        status,
        notes
      };

      await operationsService.updateSafetyCheckLog(logData);
      await loadSafetyData();
    } catch (error) {
      console.error('Error updating safety check:', error);
      alert('Failed to update safety check');
    }
  };

  const updateStaffAccountability = async (updates: Partial<StaffAccountability>) => {
    try {
      const data = await operationsService.updateStaffAccountability({
        ...updates,
        date: selectedDate,
        barber_id: currentUser.id
      });
      setStaffAccountability(data);
    } catch (error) {
      console.error('Error updating staff accountability:', error);
      alert('Failed to update staff accountability');
    }
  };

  const saveStaffAccountability = async () => {
    try {
      if (!staffAccountability) {
        alert('No staff accountability data to save');
        return;
      }

      const result = await operationsService.saveStaffAccountability({
        ...staffAccountability,
        barber_id: currentUser.id
      });

      if (result) {
        alert('Staff accountability saved successfully');
        await loadStaffAccountability();
      } else {
        alert('Failed to save staff accountability');
      }
    } catch (error) {
      console.error('Error saving staff accountability:', error);
      alert('Failed to save staff accountability');
    }
  };

  const toggleMaintenanceTask = async (taskId: string, completed: boolean) => {
    try {
      const result = await operationsService.toggleMaintenanceTask(
        parseInt(taskId),
        selectedDate,
        completed
      );

      if (result) {
        await loadMaintenanceData();
      } else {
        alert('Failed to update maintenance task');
      }
    } catch (error) {
      console.error('Error updating maintenance task:', error);
      alert('Failed to update maintenance task');
    }
  };

  const updateMaintenanceNotes = async (taskId: string, notes: string) => {
    try {
      const result = await operationsService.updateMaintenanceNotes(
        parseInt(taskId),
        selectedDate,
        notes
      );

      if (result) {
        await loadMaintenanceData();
      } else {
        alert('Failed to update maintenance notes');
      }
    } catch (error) {
      console.error('Error updating maintenance notes:', error);
      alert('Failed to update maintenance notes');
    }
  };

  const calculateNextDueDate = (taskId: string): string => {
    const task = maintenanceTasks.find(t => t.id === taskId);
    if (!task) return '';

    const currentDate = new Date();
    switch (task.frequency) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
      case 'quarterly':
        currentDate.setMonth(currentDate.getMonth() + 3);
        break;
      default:
        currentDate.setDate(currentDate.getDate() + 30); // Default to monthly
    }

    return currentDate.toISOString().split('T')[0];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'text-green-600 bg-green-100';
      case 'fail': return 'text-red-600 bg-red-100';
      case 'completed': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cleaning': return <ClipboardList className="h-4 w-4" />;
      case 'maintenance': return <Wrench className="h-4 w-4" />;
      case 'safety': return <Shield className="h-4 w-4" />;
      case 'staff': return <Users className="h-4 w-4" />;
      default: return <ClipboardList className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 md:p-6 lg:p-8">
      <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
            Operations Manual
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Daily operations tracking for TRNC-compliant barber shop management
          </p>

          {/* Date Selector */}
          <div className="flex items-center gap-4 mb-4">
            <label className="text-sm font-medium text-gray-700">Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200">
          {[
            { id: 'overview', label: 'Overview', icon: ClipboardList },
            { id: 'cleaning', label: 'Cleaning', icon: ClipboardList },
            { id: 'maintenance', label: 'Maintenance', icon: Wrench },
            { id: 'safety', label: 'Safety', icon: Shield },
            { id: 'staff', label: 'Staff', icon: Users },
            { id: 'incidents', label: 'Incidents', icon: AlertTriangle },
            { id: 'inventory', label: 'Inventory', icon: Package }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center px-3 py-2 rounded-t-lg text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Daily Operations Summary */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Daily Operations</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Customers Served:</span>
                    <span className="font-medium">{dailyOps?.total_customers_served || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Revenue:</span>
                    <span className="font-medium">₺{dailyOps?.total_revenue || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shift:</span>
                    <span className="font-medium">
                      {dailyOps?.shift_start || 'Not set'} - {dailyOps?.shift_end || 'Not set'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cleaning Progress */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium text-green-900 mb-2">Cleaning Tasks</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Completed:</span>
                    <span className="font-medium">
                      {cleaningLogs.filter(log => log.completed).length} / {cleaningTasks.length}
                    </span>
                  </div>
                  <div className="w-full bg-green-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${cleaningTasks.length > 0 ? (cleaningLogs.filter(log => log.completed).length / cleaningTasks.length) * 100 : 0}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Safety Checks */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-medium text-yellow-900 mb-2">Safety Checks</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Passed:</span>
                    <span className="font-medium">
                      {safetyLogs.filter(log => log.status === 'pass').length} / {safetyItems.length}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {safetyLogs.filter(log => log.status === 'fail').length > 0 && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                        {safetyLogs.filter(log => log.status === 'fail').length} failed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cleaning' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Daily Cleaning Checklist</h3>
              <div className="grid gap-4">
                {cleaningTasks.map(task => {
                  const log = cleaningLogs.find(l => l.task_id === task.id);
                  return (
                    <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{task.task_name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{task.instructions}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>Category: {task.category}</span>
                            <span>Frequency: {task.frequency}</span>
                            <span>Est. Time: {task.estimated_time_minutes}min</span>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleCleaningTask(task.id, !log?.completed)}
                          className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition ${
                            log?.completed
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {log?.completed ? (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          ) : (
                            <XCircle className="h-4 w-4 mr-2" />
                          )}
                          {log?.completed ? 'Completed' : 'Mark Complete'}
                        </button>
                      </div>
                      {log?.completed && log.completed_at && (
                        <p className="text-xs text-gray-500 mt-2">
                          Completed at: {new Date(log.completed_at).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'safety' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Daily Safety Checks</h3>
              <div className="grid gap-4">
                {safetyItems.map(item => {
                  const log = safetyLogs.find(l => l.item_id === item.id);
                  return (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.item_name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{item.instructions}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>Category: {item.category}</span>
                            <span>Type: {item.check_type}</span>
                            <span>Frequency: {item.frequency}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {['pass', 'fail', 'n/a'].map(status => (
                            <button
                              key={status}
                              onClick={() => updateSafetyCheck(item.id, status as any)}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                                log?.status === status
                                  ? getStatusColor(status)
                                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                              }`}
                            >
                              {status.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>
                      {log?.notes && (
                        <p className="text-sm text-gray-600 mt-2">Notes: {log.notes}</p>
                      )}
                    </div>
                  );
                })}
                {safetyItems.length === 0 && !isLoading && (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">No safety check items found</p>
                    <p className="text-sm text-gray-400 mt-1">Safety check items will appear here once added to the system</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'maintenance' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Equipment Maintenance</h3>
              <div className="grid gap-4">
                {maintenanceTasks.map(task => {
                  const log = maintenanceLogs.find(l => l.task_id === task.id);
                  return (
                    <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{task.equipment_name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{task.task_name}</p>
                          <p className="text-xs text-gray-500 mt-1">{task.instructions}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>Frequency: {task.frequency}</span>
                            <span>Est. Time: {task.estimated_time_minutes}min</span>
                            {task.requires_specialist && (
                              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                Requires Specialist
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => toggleMaintenanceTask(task.id, !log?.completed)}
                            className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition ${
                              log?.completed
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            }`}
                          >
                            {log?.completed ? (
                              <CheckCircle className="h-4 w-4 mr-2" />
                            ) : (
                              <XCircle className="h-4 w-4 mr-2" />
                            )}
                            {log?.completed ? 'Completed' : 'Mark Complete'}
                          </button>
                          {log?.completed && (
                            <button
                              onClick={() => updateMaintenanceNotes(task.id, '')}
                              className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm hover:bg-blue-200 transition"
                            >
                              Add Notes
                            </button>
                          )}
                        </div>
                      </div>
                      {log?.completed && log.completed_at && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-500">
                            Completed at: {new Date(log.completed_at).toLocaleTimeString()}
                          </p>
                          {log.next_due_date && (
                            <p className="text-xs text-gray-500">
                              Next due: {new Date(log.next_due_date).toLocaleDateString()}
                            </p>
                          )}
                          {log.issues_found && (
                            <p className="text-xs text-red-600 mt-1">
                              Issues: {log.issues_found}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {maintenanceTasks.length === 0 && !isLoading && (
                  <div className="text-center py-8">
                    <Wrench className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">No maintenance tasks found</p>
                    <p className="text-sm text-gray-400 mt-1">Maintenance tasks will appear here once added to the system</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'staff' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Staff Accountability</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Check-in Time
                    </label>
                    <input
                      type="time"
                      value={staffAccountability?.check_in_time || ''}
                      onChange={(e) => updateStaffAccountability({ check_in_time: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Check-out Time
                    </label>
                    <input
                      type="time"
                      value={staffAccountability?.check_out_time || ''}
                      onChange={(e) => updateStaffAccountability({ check_out_time: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Compliance
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={staffAccountability?.uniform_compliant || false}
                          onChange={(e) => updateStaffAccountability({ uniform_compliant: e.target.checked })}
                          className="mr-2"
                        />
                        Uniform Compliant
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={staffAccountability?.hygiene_compliant || false}
                          onChange={(e) => updateStaffAccountability({ hygiene_compliant: e.target.checked })}
                          className="mr-2"
                        />
                        Hygiene Compliant
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Behavior Rating (1-5)
                    </label>
                    <select
                      value={staffAccountability?.behavior_rating || ''}
                      onChange={(e) => updateStaffAccountability({ behavior_rating: parseInt(e.target.value) })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select rating</option>
                      {[1, 2, 3, 4, 5].map(rating => (
                        <option key={rating} value={rating}>{rating}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Performance Notes
                  </label>
                  <textarea
                    value={staffAccountability?.performance_notes || ''}
                    onChange={(e) => updateStaffAccountability({ performance_notes: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Notes about today's performance..."
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Issues Reported
                  </label>
                  <textarea
                    value={staffAccountability?.issues_reported || ''}
                    onChange={(e) => updateStaffAccountability({ issues_reported: e.target.value })}
                    rows={2}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Any issues or concerns..."
                  />
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={saveStaffAccountability}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    Save Staff Accountability
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'incidents' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Incident Reports</h3>
                <button className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                  <Plus className="h-4 w-4 mr-2" />
                  Report Incident
                </button>
              </div>
              <div className="bg-gray-50 p-8 text-center rounded-lg">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Incident reporting system coming soon...</p>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Inventory Management</h3>
                <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </button>
              </div>
              <div className="bg-gray-50 p-8 text-center rounded-lg">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Inventory management system coming soon...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OperationsManual;
