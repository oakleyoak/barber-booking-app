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
  Trash2,
  Filter,
  Download,
  Upload,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  Save,
  RotateCcw
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
  
  // Filter and view states
  const [cleaningFilter, setCleaningFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [safetyFilter, setSafetyFilter] = useState<'all' | 'pass' | 'fail' | 'pending'>('all');
  const [maintenanceFilter, setMaintenanceFilter] = useState<'all' | 'due' | 'overdue' | 'completed'>('all');
  const [showNotes, setShowNotes] = useState<{[key: string]: boolean}>({});
  const [editingNotes, setEditingNotes] = useState<{[key: string]: string}>({});

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
  const [isSaving, setIsSaving] = useState(false);

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
      case 'overdue': return 'text-red-600 bg-red-100';
      case 'due': return 'text-yellow-600 bg-yellow-100';
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

  const filteredCleaningTasks = cleaningTasks.filter(task => {
    const log = cleaningLogs.find(l => l.task_id === task.id);
    switch (cleaningFilter) {
      case 'completed': return log?.completed;
      case 'pending': return !log?.completed;
      default: return true;
    }
  });

  const filteredSafetyItems = safetyItems.filter(item => {
    const log = safetyLogs.find(l => l.item_id === item.id);
    switch (safetyFilter) {
      case 'pass': return log?.status === 'pass';
      case 'fail': return log?.status === 'fail';
      case 'pending': return !log?.status;
      default: return true;
    }
  });

  const filteredMaintenanceTasks = maintenanceTasks.filter(task => {
    const log = maintenanceLogs.find(l => l.task_id === task.id);
    const today = new Date().toISOString().split('T')[0];
    
    switch (maintenanceFilter) {
      case 'completed': return log?.completed;
      case 'overdue': return log?.next_due_date && log.next_due_date < today && !log.completed;
      case 'due': return log?.next_due_date === today && !log.completed;
      default: return true;
    }
  });

  const toggleNotes = (id: string) => {
    setShowNotes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const startEditingNotes = (id: string, currentNotes: string = '') => {
    setEditingNotes(prev => ({ ...prev, [id]: currentNotes }));
  };

  const saveNotes = async (taskId: string, type: 'maintenance' | 'safety' | 'cleaning') => {
    const notes = editingNotes[taskId] || '';
    
    try {
      setIsSaving(true);
      
      if (type === 'maintenance') {
        await updateMaintenanceNotes(taskId, notes);
      } else if (type === 'safety') {
        await updateSafetyCheck(taskId, 'pass', notes);
      } else if (type === 'cleaning') {
        await operationsService.updateCleaningNotes(taskId, selectedDate, currentUser.id, notes);
        await loadCleaningData(); // Reload to get updated data
      }
      
      setEditingNotes(prev => {
        const newState = { ...prev };
        delete newState[taskId];
        return newState;
      });
      
      setShowNotes(prev => ({ ...prev, [taskId]: false }));
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Failed to save notes');
    } finally {
      setIsSaving(false);
    }
  };

  const bulkCompleteCleaningTasks = async () => {
    const pendingTasks = cleaningTasks.filter(task => {
      const log = cleaningLogs.find(l => l.task_id === task.id);
      return !log?.completed;
    });

    try {
      setIsSaving(true);
      await Promise.all(
        pendingTasks.map(task => toggleCleaningTask(task.id, true))
      );
    } catch (error) {
      console.error('Error bulk completing tasks:', error);
    } finally {
      setIsSaving(false);
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
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={bulkCompleteCleaningTasks}
                  disabled={isSaving}
                  className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete All Cleaning
                </button>
                <button
                  onClick={() => loadOperationsData()}
                  disabled={isLoading}
                  className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Refresh Data
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Daily Operations Summary */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-blue-900">Daily Operations</h3>
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Customers:</span>
                      <span className="font-bold text-blue-800">{dailyOps?.total_customers_served || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Revenue:</span>
                      <span className="font-bold text-blue-800">₺{dailyOps?.total_revenue || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shift:</span>
                      <span className="font-medium text-xs">
                        {dailyOps?.shift_start || '--'} - {dailyOps?.shift_end || '--'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cleaning Progress */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-green-900">Cleaning Tasks</h3>
                    <ClipboardList className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Completed:</span>
                      <span className="font-bold text-green-800">
                        {cleaningLogs.filter(log => log.completed).length} / {cleaningTasks.length}
                      </span>
                    </div>
                    <div className="w-full bg-green-200 rounded-full h-3">
                      <div
                        className="bg-green-600 h-3 rounded-full transition-all duration-300"
                        style={{
                          width: `${cleaningTasks.length > 0 ? (cleaningLogs.filter(log => log.completed).length / cleaningTasks.length) * 100 : 0}%`
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-green-700">
                      {cleaningTasks.length > 0 ? Math.round((cleaningLogs.filter(log => log.completed).length / cleaningTasks.length) * 100) : 0}% Complete
                    </div>
                  </div>
                </div>

                {/* Safety Checks */}
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-yellow-900">Safety Checks</h3>
                    <Shield className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Passed:</span>
                      <span className="font-bold text-yellow-800">
                        {safetyLogs.filter(log => log.status === 'pass').length} / {safetyItems.length}
                      </span>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {safetyLogs.filter(log => log.status === 'fail').length > 0 && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                          {safetyLogs.filter(log => log.status === 'fail').length} failed
                        </span>
                      )}
                      {safetyItems.length - safetyLogs.length > 0 && (
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                          {safetyItems.length - safetyLogs.length} pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Maintenance Status */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-purple-900">Maintenance</h3>
                    <Wrench className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Completed:</span>
                      <span className="font-bold text-purple-800">
                        {maintenanceLogs.filter(log => log.completed).length} / {maintenanceTasks.length}
                      </span>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {filteredMaintenanceTasks.filter(task => {
                        const log = maintenanceLogs.find(l => l.task_id === task.id);
                        const today = new Date().toISOString().split('T')[0];
                        return log?.next_due_date && log.next_due_date < today && !log.completed;
                      }).length > 0 && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                          Overdue
                        </span>
                      )}
                      {filteredMaintenanceTasks.filter(task => {
                        const log = maintenanceLogs.find(l => l.task_id === task.id);
                        const today = new Date().toISOString().split('T')[0];
                        return log?.next_due_date === today && !log.completed;
                      }).length > 0 && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                          Due Today
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Staff Status */}
              {staffAccountability && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Today's Staff Status
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Check-in:</span>
                      <p className="font-medium">{staffAccountability.check_in_time || 'Not set'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Check-out:</span>
                      <p className="font-medium">{staffAccountability.check_out_time || 'Not set'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Compliance:</span>
                      <div className="flex gap-1 mt-1">
                        {staffAccountability.uniform_compliant && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Uniform</span>
                        )}
                        {staffAccountability.hygiene_compliant && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Hygiene</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Rating:</span>
                      <p className="font-medium">
                        {staffAccountability.behavior_rating ? 
                          `${staffAccountability.behavior_rating}/5` : 'Not rated'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'cleaning' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h3 className="text-lg font-medium text-gray-900">Daily Cleaning Checklist</h3>
                
                {/* Cleaning Controls */}
                <div className="flex items-center gap-2">
                  <select
                    value={cleaningFilter}
                    onChange={(e) => setCleaningFilter(e.target.value as any)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Tasks</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                  </select>
                  
                  <button
                    onClick={bulkCompleteCleaningTasks}
                    disabled={isSaving || filteredCleaningTasks.every(task => {
                      const log = cleaningLogs.find(l => l.task_id === task.id);
                      return log?.completed;
                    })}
                    className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 text-sm"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Complete All
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                  <span className="text-sm text-gray-600">
                    {cleaningLogs.filter(log => log.completed).length} of {cleaningTasks.length} completed
                  </span>
                </div>
                <div className="w-full bg-gray-300 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${cleaningTasks.length > 0 ? (cleaningLogs.filter(log => log.completed).length / cleaningTasks.length) * 100 : 0}%`
                    }}
                  ></div>
                </div>
              </div>

              <div className="grid gap-4">
                {filteredCleaningTasks.map(task => {
                  const log = cleaningLogs.find(l => l.task_id === task.id);
                  return (
                    <div key={task.id} className={`border rounded-lg p-4 transition-all ${
                      log?.completed ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900">{task.task_name}</h4>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              task.category === 'sanitization' ? 'bg-blue-100 text-blue-800' :
                              task.category === 'equipment' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {task.category}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{task.instructions}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>Frequency: {task.frequency}</span>
                            <span>Est. Time: {task.estimated_time_minutes}min</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => toggleCleaningTask(task.id, !log?.completed)}
                            disabled={isSaving}
                            className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 ${
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
                              onClick={() => toggleNotes(task.id)}
                              className="flex items-center px-3 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm hover:bg-blue-200 transition"
                            >
                              {showNotes[task.id] ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                              Notes
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {log?.completed && log.completed_at && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-500">
                            Completed at: {new Date(log.completed_at).toLocaleTimeString()}
                          </p>
                          {showNotes[task.id] && (
                            <div className="mt-2">
                              <textarea
                                value={editingNotes[task.id] ?? log.notes ?? ''}
                                onChange={(e) => setEditingNotes(prev => ({ ...prev, [task.id]: e.target.value }))}
                                placeholder="Add notes about this cleaning task..."
                                className="w-full text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                rows={2}
                              />
                              <div className="flex gap-2 mt-1">
                                <button
                                  onClick={() => saveNotes(task.id, 'cleaning')}
                                  disabled={isSaving}
                                  className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingNotes(prev => {
                                    const newState = { ...prev };
                                    delete newState[task.id];
                                    return newState;
                                  })}
                                  className="text-xs px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {filteredCleaningTasks.length === 0 && !isLoading && (
                  <div className="text-center py-8">
                    <ClipboardList className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">
                      {cleaningFilter === 'all' ? 'No cleaning tasks found' : `No ${cleaningFilter} cleaning tasks`}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {cleaningFilter !== 'all' && 'Try changing the filter to see more tasks'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'safety' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h3 className="text-lg font-medium text-gray-900">Daily Safety Checks</h3>
                
                {/* Safety Controls */}
                <div className="flex items-center gap-2">
                  <select
                    value={safetyFilter}
                    onChange={(e) => setSafetyFilter(e.target.value as any)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Checks</option>
                    <option value="pending">Pending</option>
                    <option value="pass">Passed</option>
                    <option value="fail">Failed</option>
                  </select>
                </div>
              </div>

              {/* Safety Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-800">Passed</span>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-900">
                    {safetyLogs.filter(log => log.status === 'pass').length}
                  </p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-red-800">Failed</span>
                    <XCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <p className="text-2xl font-bold text-red-900">
                    {safetyLogs.filter(log => log.status === 'fail').length}
                  </p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-800">Pending</span>
                    <Clock className="h-5 w-5 text-gray-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {safetyItems.length - safetyLogs.length}
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                {filteredSafetyItems.map(item => {
                  const log = safetyLogs.find(l => l.item_id === item.id);
                  return (
                    <div key={item.id} className={`border rounded-lg p-4 transition-all ${
                      log?.status === 'pass' ? 'border-green-200 bg-green-50' :
                      log?.status === 'fail' ? 'border-red-200 bg-red-50' :
                      'border-gray-200 bg-white'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900">{item.item_name}</h4>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              item.category === 'equipment' ? 'bg-purple-100 text-purple-800' :
                              item.category === 'environment' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {item.category}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              item.check_type === 'visual' ? 'bg-green-100 text-green-800' :
                              item.check_type === 'measurement' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {item.check_type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{item.instructions}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>Frequency: {item.frequency}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {['pass', 'fail', 'n/a'].map(status => (
                            <button
                              key={status}
                              onClick={() => updateSafetyCheck(item.id, status as any)}
                              disabled={isSaving}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 ${
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
                      
                      {log?.status && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-500">Status: {log.status.toUpperCase()}</span>
                            <button
                              onClick={() => toggleNotes(item.id)}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              {showNotes[item.id] ? 'Hide Notes' : 'Add Notes'}
                            </button>
                          </div>
                          
                          {showNotes[item.id] && (
                            <div className="mt-2">
                              <textarea
                                value={editingNotes[item.id] ?? log.notes ?? ''}
                                onChange={(e) => setEditingNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                                placeholder="Add notes about this safety check..."
                                className="w-full text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                rows={2}
                              />
                              <div className="flex gap-2 mt-1">
                                <button
                                  onClick={() => saveNotes(item.id, 'safety')}
                                  disabled={isSaving}
                                  className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                                >
                                  Save Notes
                                </button>
                                <button
                                  onClick={() => setEditingNotes(prev => {
                                    const newState = { ...prev };
                                    delete newState[item.id];
                                    return newState;
                                  })}
                                  className="text-xs px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                          
                          {log.notes && !showNotes[item.id] && (
                            <p className="text-sm text-gray-600 mt-2">Notes: {log.notes}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {filteredSafetyItems.length === 0 && !isLoading && (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">
                      {safetyFilter === 'all' ? 'No safety check items found' : `No ${safetyFilter} safety checks`}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {safetyFilter !== 'all' && 'Try changing the filter to see more checks'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'maintenance' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h3 className="text-lg font-medium text-gray-900">Equipment Maintenance</h3>
                
                {/* Maintenance Controls */}
                <div className="flex items-center gap-2">
                  <select
                    value={maintenanceFilter}
                    onChange={(e) => setMaintenanceFilter(e.target.value as any)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Tasks</option>
                    <option value="due">Due Today</option>
                    <option value="overdue">Overdue</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Maintenance Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-800">Completed</span>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-900">
                    {maintenanceLogs.filter(log => log.completed).length}
                  </p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-yellow-800">Due Today</span>
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <p className="text-2xl font-bold text-yellow-900">
                    {filteredMaintenanceTasks.filter(task => {
                      const log = maintenanceLogs.find(l => l.task_id === task.id);
                      const today = new Date().toISOString().split('T')[0];
                      return log?.next_due_date === today && !log.completed;
                    }).length}
                  </p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-red-800">Overdue</span>
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <p className="text-2xl font-bold text-red-900">
                    {filteredMaintenanceTasks.filter(task => {
                      const log = maintenanceLogs.find(l => l.task_id === task.id);
                      const today = new Date().toISOString().split('T')[0];
                      return log?.next_due_date && log.next_due_date < today && !log.completed;
                    }).length}
                  </p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-purple-800">Specialist Required</span>
                    <Wrench className="h-5 w-5 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-purple-900">
                    {maintenanceTasks.filter(task => task.requires_specialist).length}
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                {filteredMaintenanceTasks.map(task => {
                  const log = maintenanceLogs.find(l => l.task_id === task.id);
                  const today = new Date().toISOString().split('T')[0];
                  const isOverdue = log?.next_due_date && log.next_due_date < today && !log.completed;
                  const isDueToday = log?.next_due_date === today && !log.completed;
                  
                  return (
                    <div key={task.id} className={`border rounded-lg p-4 transition-all ${
                      log?.completed ? 'border-green-200 bg-green-50' :
                      isOverdue ? 'border-red-200 bg-red-50' :
                      isDueToday ? 'border-yellow-200 bg-yellow-50' :
                      'border-gray-200 bg-white'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900">{task.equipment_name}</h4>
                            {task.requires_specialist && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                Specialist Required
                              </span>
                            )}
                            {isOverdue && (
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full flex items-center">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Overdue
                              </span>
                            )}
                            {isDueToday && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                Due Today
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1 font-medium">{task.task_name}</p>
                          <p className="text-xs text-gray-500 mt-1">{task.instructions}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>Frequency: {task.frequency}</span>
                            <span>Est. Time: {task.estimated_time_minutes}min</span>
                            {log?.next_due_date && (
                              <span>Next Due: {new Date(log.next_due_date).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => toggleMaintenanceTask(task.id, !log?.completed)}
                            disabled={isSaving}
                            className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 ${
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
                          
                          <button
                            onClick={() => toggleNotes(task.id)}
                            className="flex items-center px-3 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm hover:bg-blue-200 transition"
                          >
                            {showNotes[task.id] ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                            Notes
                          </button>
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

                      {showNotes[task.id] && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <textarea
                            value={editingNotes[task.id] ?? log?.notes ?? ''}
                            onChange={(e) => setEditingNotes(prev => ({ ...prev, [task.id]: e.target.value }))}
                            placeholder="Add maintenance notes, issues found, or observations..."
                            className="w-full text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            rows={3}
                          />
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => saveNotes(task.id, 'maintenance')}
                              disabled={isSaving}
                              className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                            >
                              <Save className="h-3 w-3 mr-1 inline" />
                              Save Notes
                            </button>
                            <button
                              onClick={() => setEditingNotes(prev => {
                                const newState = { ...prev };
                                delete newState[task.id];
                                return newState;
                              })}
                              className="text-xs px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {filteredMaintenanceTasks.length === 0 && !isLoading && (
                  <div className="text-center py-8">
                    <Wrench className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">
                      {maintenanceFilter === 'all' ? 'No maintenance tasks found' : `No ${maintenanceFilter} maintenance tasks`}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {maintenanceFilter !== 'all' && 'Try changing the filter to see more tasks'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'staff' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Staff Accountability</h3>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    staffAccountability ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {staffAccountability ? 'Data Recorded' : 'No Data'}
                  </span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Time Tracking */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Time Tracking
                    </h4>
                    <div className="space-y-3">
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
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      {staffAccountability?.check_in_time && staffAccountability?.check_out_time && (
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                          <p className="text-sm text-blue-800">
                            <strong>Total Hours:</strong> {
                              (() => {
                                const checkIn = new Date(`2000-01-01T${staffAccountability.check_in_time}`);
                                const checkOut = new Date(`2000-01-01T${staffAccountability.check_out_time}`);
                                const diffMs = checkOut.getTime() - checkIn.getTime();
                                const hours = Math.floor(diffMs / (1000 * 60 * 60));
                                const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                                return `${hours}h ${minutes}m`;
                              })()
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Compliance & Rating */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Compliance & Performance
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          TRNC Compliance Checklist
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center p-2 border border-gray-200 rounded-md hover:bg-gray-50">
                            <input
                              type="checkbox"
                              checked={staffAccountability?.uniform_compliant || false}
                              onChange={(e) => updateStaffAccountability({ uniform_compliant: e.target.checked })}
                              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div>
                              <span className="text-sm font-medium">Uniform Compliant</span>
                              <p className="text-xs text-gray-500">Clean, professional attire as per TRNC standards</p>
                            </div>
                          </label>
                          <label className="flex items-center p-2 border border-gray-200 rounded-md hover:bg-gray-50">
                            <input
                              type="checkbox"
                              checked={staffAccountability?.hygiene_compliant || false}
                              onChange={(e) => updateStaffAccountability({ hygiene_compliant: e.target.checked })}
                              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div>
                              <span className="text-sm font-medium">Hygiene Compliant</span>
                              <p className="text-xs text-gray-500">Meets health department hygiene standards</p>
                            </div>
                          </label>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Behavior Rating (1-5)
                        </label>
                        <div className="flex items-center gap-2">
                          <select
                            value={staffAccountability?.behavior_rating || ''}
                            onChange={(e) => updateStaffAccountability({ behavior_rating: parseInt(e.target.value) })}
                            className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select rating</option>
                            {[1, 2, 3, 4, 5].map(rating => (
                              <option key={rating} value={rating}>
                                {rating} - {
                                  rating === 1 ? 'Poor' :
                                  rating === 2 ? 'Below Average' :
                                  rating === 3 ? 'Average' :
                                  rating === 4 ? 'Good' : 'Excellent'
                                }
                              </option>
                            ))}
                          </select>
                          {staffAccountability?.behavior_rating && (
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map(star => (
                                <span
                                  key={star}
                                  className={`text-lg ${
                                    star <= staffAccountability.behavior_rating
                                      ? 'text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes Section */}
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Performance Notes
                    </label>
                    <textarea
                      value={staffAccountability?.performance_notes || ''}
                      onChange={(e) => updateStaffAccountability({ performance_notes: e.target.value })}
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Notes about today's performance, achievements, areas for improvement..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Issues Reported
                    </label>
                    <textarea
                      value={staffAccountability?.issues_reported || ''}
                      onChange={(e) => updateStaffAccountability({ issues_reported: e.target.value })}
                      rows={2}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Any issues, incidents, or concerns to report..."
                    />
                  </div>
                </div>

                {/* Save Button */}
                <div className="mt-6 flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    {staffAccountability?.id ? (
                      <>Last saved: {new Date().toLocaleDateString()}</>
                    ) : (
                      'No data saved for today'
                    )}
                  </div>
                  <button
                    onClick={saveStaffAccountability}
                    disabled={isSaving}
                    className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Staff Accountability
                      </>
                    )}
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
