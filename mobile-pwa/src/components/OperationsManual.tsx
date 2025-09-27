import React, { useState, useEffect, useRef } from 'react';
import { useModal } from './ui/ModalProvider';
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
import DailyCleaningLogs from './DailyCleaningLogs';
import DailySafetyChecks from './DailySafetyChecks';
import EquipmentMaintenance from './EquipmentMaintenance';
import { userService } from '../services/completeDatabase';
import operationsService, { 
  getCleaningTasksWithStatus, 
  getMaintenanceTasksWithStatus, 
  getSafetyCheckItemsWithStatus,
  addCleaningTask,
  addMaintenanceTask,
  addSafetyCheckItem,
  updateTaskCompletion,
  deleteCleaningTask,
  deleteMaintenanceTask,
  deleteSafetyCheckItem,
  getComplianceReports,
  getOperationsStatistics
} from '../services/operationsService';

interface OperationsData {
  cleaningTasks: any[];
  maintenanceTasks: any[];
  safetyItems: any[];
  statistics: any;
}

interface OperationsManualProps {
  onModalStateChange?: (isOpen: boolean) => void;
}

const OperationsManual: React.FC<OperationsManualProps> = ({ onModalStateChange }) => {
  const modal = useModal();
  const [activeTab, setActiveTab] = useState('cleaning');
  const [historyFilters, setHistoryFilters] = useState({ start: '', end: '' });
  const [logs, setLogs] = useState<{ cleaning: any[]; maintenance: any[]; safety: any[] }>({ cleaning: [], maintenance: [], safety: [] });
  const [data, setData] = useState<OperationsData>({
    cleaningTasks: [],
    maintenanceTasks: [],
    safetyItems: [],
    statistics: null
  });
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState('');
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    frequency: 'daily',
    priority: 'medium',
    estimated_time: 15,
    category: '',
    compliance_requirement: false,
    instructions: '',
    equipment_name: '',
    requires_specialist: false,
    selectedId: undefined as string | undefined,
    check_type: '',
    acceptable_range: ''
  });

  // Remove bottom sheet modal logic for top-aligned modals

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Load history when switching to history tab
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  // Modal state management for body scroll prevention and navigation integration
  useEffect(() => {
    const isModalOpen = showAddForm !== '';
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
      onModalStateChange?.(true);
    } else {
      document.body.style.overflow = 'unset';
      onModalStateChange?.(false);
    }

    return () => {
      document.body.style.overflow = 'unset';
      onModalStateChange?.(false);
    };
  }, [showAddForm, onModalStateChange]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cleaning, maintenance, safety, stats] = await Promise.all([
        getCleaningTasksWithStatus(),
        getMaintenanceTasksWithStatus(),
        getSafetyCheckItemsWithStatus(),
        getOperationsStatistics()
      ]);
      // fetch users for name lookup
      try {
        const u = await userService.getUsers();
        setUsers(u || []);
      } catch (e) {
        console.warn('Failed to load users for OperationsManual:', e);
        setUsers([]);
      }
      
      setData({
        cleaningTasks: cleaning || [],
        maintenanceTasks: maintenance || [],
        safetyItems: safety || [],
        statistics: stats
      });
    } catch (error) {
      console.error('Failed to load operations data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async () => {
    try {
      if (showAddForm === 'cleaning') {
        await addCleaningTask({
          task_name: newTask.name,
          description: newTask.description,
          frequency: newTask.frequency,
          estimated_time_minutes: newTask.estimated_time,
          priority: newTask.priority,
          category: newTask.category,
          compliance_requirement: newTask.compliance_requirement,
          instructions: newTask.instructions
        });
      } else if (showAddForm === 'maintenance') {
        await addMaintenanceTask({
          equipment_name: newTask.equipment_name,
          task_name: newTask.name,
          frequency: newTask.frequency,
          estimated_time_minutes: newTask.estimated_time,
          instructions: newTask.instructions,
          requires_specialist: newTask.requires_specialist
        });
      } else if (showAddForm === 'safety') {
        await addSafetyCheckItem({
          check_name: newTask.name,
          description: newTask.description,
          frequency: newTask.frequency,
          compliance_requirement: newTask.compliance_requirement,
          instructions: newTask.instructions
        });
      }
      
      await loadData();
      setShowAddForm('');
      setNewTask({
        name: '',
        description: '',
        frequency: 'daily',
        priority: 'medium',
        estimated_time: 15,
        category: '',
        compliance_requirement: false,
        instructions: '',
        equipment_name: '',
        requires_specialist: false,
        selectedId: undefined,
        check_type: '',
        acceptable_range: ''
      });
    } catch (error) {
      console.error('Failed to add task:', error);
      modal.notify('Failed to add task. Please try again.', 'error');
    }
  };

  const handleDeleteTask = async (type: string, id: string) => {
  const ok = await modal.confirm('Are you sure you want to delete this task?');
  if (!ok) return;
    
    try {
      if (type === 'cleaning') {
        await deleteCleaningTask(id);
      } else if (type === 'maintenance') {
        await deleteMaintenanceTask(id);
      } else if (type === 'safety') {
        await deleteSafetyCheckItem(id);
      }
      
      await loadData();
    } catch (error) {
      console.error('Failed to delete task:', error);
  modal.notify('Failed to delete task. Please try again.', 'error');
    }
  };

  const handleToggleCompletion = async (type: string, taskId: string, completed: boolean) => {
    try {
      await updateTaskCompletion(type, taskId, completed);
      await loadData();
    } catch (error) {
      console.error('Failed to update task completion:', error);
    }
  };

  const loadHistory = async () => {
    try {
      setLoading(true);
      const start = historyFilters.start || undefined;
      const end = historyFilters.end || undefined;
      const res = await operationsService.getLogsHistory(start, end);
      setLogs(res);
      // ensure users are available for name lookup
      if (!users || users.length === 0) {
        try {
          const u = await userService.getUsers();
          setUsers(u || []);
        } catch (e) {
          console.warn('Failed to load users for history view:', e);
        }
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderAddForm = () => {
    if (!showAddForm) return null;

    // Get the correct list of predefined tasks for the current form type
    let predefinedTasks: any[] = [];
    let label = '';
    if (showAddForm === 'cleaning') {
      predefinedTasks = data.cleaningTasks;
      label = 'Cleaning Task';
    } else if (showAddForm === 'maintenance') {
      predefinedTasks = data.maintenanceTasks;
      label = 'Maintenance Task';
    } else if (showAddForm === 'safety') {
      predefinedTasks = data.safetyItems;
      label = 'Safety Check';
    }

    return (
      <>
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[1200]" onClick={() => setShowAddForm('')} />
        
        {/* Modal */}
        <div
          className="modal-top bg-white rounded-t-lg md:rounded-lg shadow-xl max-h-[90vh] overflow-hidden mt-4"
        >
          {/* Drag handle for mobile */}
          <div className="md:hidden w-full flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
          </div>

          {/* Modal content */}
          <div className="px-6 pb-6 max-h-[85vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 pt-2 md:pt-0">{showNewTaskForm ? `Add New ${label}` : `Select ${label}`}</h3>
          {!showNewTaskForm ? (
            <>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{label}</label>
                  <select
                    value={newTask.selectedId || ''}
                    onChange={e => {
                      const selected = predefinedTasks.find(t => t.id === e.target.value || t.uuid === e.target.value);
                      if (selected) {
                        if (showAddForm === 'cleaning') {
                          setNewTask({
                            ...newTask,
                            selectedId: selected.id || selected.uuid,
                            name: selected.task_name,
                            description: selected.description || '',
                            frequency: selected.frequency,
                            priority: selected.priority || '',
                            estimated_time: selected.estimated_time_minutes || 0,
                            category: selected.category || '',
                            compliance_requirement: selected.compliance_requirement || false,
                            instructions: selected.instructions || ''
                          });
                        } else if (showAddForm === 'maintenance') {
                          setNewTask({
                            ...newTask,
                            selectedId: selected.id || selected.uuid,
                            equipment_name: selected.equipment_name,
                            name: selected.task_name,
                            frequency: selected.frequency,
                            estimated_time: selected.estimated_time_minutes || 0,
                            instructions: selected.instructions || '',
                            requires_specialist: selected.requires_specialist || false
                          });
                        } else if (showAddForm === 'safety') {
                          setNewTask({
                            ...newTask,
                            selectedId: selected.id || selected.uuid,
                            name: selected.item_name,
                            description: selected.description || '',
                            frequency: selected.frequency,
                            category: selected.category || '',
                            instructions: selected.instructions || '',
                            check_type: selected.check_type || '',
                            acceptable_range: selected.acceptable_range || ''
                          });
                        }
                      }
                    }}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a {label.toLowerCase()}</option>
                    {predefinedTasks.map(t => (
                      <option key={t.id || t.uuid} value={t.id || t.uuid}>
                        {showAddForm === 'cleaning' && t.task_name}
                        {showAddForm === 'maintenance' && `${t.equipment_name} - ${t.task_name}`}
                        {showAddForm === 'safety' && t.item_name}
                      </option>
                    ))}
                  </select>
                </div>
                {newTask.selectedId && (
                  <div className="bg-gray-50 rounded p-3 text-sm space-y-2">
                    {showAddForm === 'cleaning' && (
                      <>
                        <div><b>Description:</b> {newTask.description}</div>
                        <div><b>Frequency:</b> {newTask.frequency}</div>
                        <div><b>Priority:</b> {newTask.priority}</div>
                        <div><b>Estimated Time:</b> {newTask.estimated_time} min</div>
                        <div><b>Category:</b> {newTask.category}</div>
                        <div><b>Instructions:</b> {newTask.instructions}</div>
                        <div><b>Compliance Requirement:</b> {newTask.compliance_requirement ? 'Yes' : 'No'}</div>
                      </>
                    )}
                    {showAddForm === 'maintenance' && (
                      <>
                        <div><b>Equipment:</b> {newTask.equipment_name}</div>
                        <div><b>Task:</b> {newTask.name}</div>
                        <div><b>Frequency:</b> {newTask.frequency}</div>
                        <div><b>Estimated Time:</b> {newTask.estimated_time} min</div>
                        <div><b>Instructions:</b> {newTask.instructions}</div>
                        <div><b>Requires Specialist:</b> {newTask.requires_specialist ? 'Yes' : 'No'}</div>
                      </>
                    )}
                    {showAddForm === 'safety' && (
                      <>
                        <div><b>Item:</b> {newTask.name}</div>
                        <div><b>Category:</b> {newTask.category}</div>
                        <div><b>Check Type:</b> {newTask.check_type}</div>
                        <div><b>Frequency:</b> {newTask.frequency}</div>
                        <div><b>Acceptable Range:</b> {newTask.acceptable_range}</div>
                        <div><b>Instructions:</b> {newTask.instructions}</div>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="flex justify-between space-x-2 mt-6">
                <button
                  onClick={() => setShowAddForm('')}
                  className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowNewTaskForm(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Add New {label}
                </button>
                <button
                  onClick={async () => {
                    setShowAddForm('');
                    setNewTask({
                      name: '',
                      description: '',
                      frequency: 'daily',
                      priority: 'medium',
                      estimated_time: 15,
                      category: '',
                      compliance_requirement: false,
                      instructions: '',
                      equipment_name: '',
                      requires_specialist: false,
                      selectedId: undefined,
                      check_type: '',
                      acceptable_range: ''
                    });
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={!newTask.selectedId}
                >
                  Select
                </button>
              </div>
            </>
          ) : (
            <>
              {/* New Task Form */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    if (showAddForm === 'cleaning') {
                      await addCleaningTask({
                        task_name: newTask.name,
                        description: newTask.description,
                        frequency: newTask.frequency,
                        estimated_time_minutes: newTask.estimated_time,
                        priority: newTask.priority,
                        category: newTask.category,
                        compliance_requirement: newTask.compliance_requirement,
                        instructions: newTask.instructions
                      });
                    } else if (showAddForm === 'maintenance') {
                      await addMaintenanceTask({
                        equipment_name: newTask.equipment_name,
                        task_name: newTask.name,
                        frequency: newTask.frequency,
                        estimated_time_minutes: newTask.estimated_time,
                        instructions: newTask.instructions,
                        requires_specialist: newTask.requires_specialist
                      });
                    } else if (showAddForm === 'safety') {
                      await addSafetyCheckItem({
                        check_name: newTask.name,
                        description: newTask.description,
                        frequency: newTask.frequency,
                        compliance_requirement: newTask.compliance_requirement,
                        instructions: newTask.instructions
                      });
                    }
                    await loadData();
                    setShowAddForm('');
                    setShowNewTaskForm(false);
                    setNewTask({
                      name: '',
                      description: '',
                      frequency: 'daily',
                      priority: 'medium',
                      estimated_time: 15,
                      category: '',
                      compliance_requirement: false,
                      instructions: '',
                      equipment_name: '',
                      requires_specialist: false,
                      selectedId: undefined,
                      check_type: '',
                      acceptable_range: ''
                    });
                  } catch (error) {
                    modal.notify('Failed to add new task. Please try again.', 'error');
                  }
                }}
                className="space-y-4"
              >
                {/* Fields for each type */}
                {showAddForm === 'cleaning' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Task Name</label>
                      <input type="text" value={newTask.name} onChange={e => setNewTask(prev => ({ ...prev, name: e.target.value }))} className="w-full p-2 border rounded" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <textarea value={newTask.description} onChange={e => setNewTask(prev => ({ ...prev, description: e.target.value }))} className="w-full p-2 border rounded" rows={2} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Frequency</label>
                      <select value={newTask.frequency} onChange={e => setNewTask(prev => ({ ...prev, frequency: e.target.value }))} className="w-full p-2 border rounded">
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="annually">Annually</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Priority</label>
                      <select value={newTask.priority} onChange={e => setNewTask(prev => ({ ...prev, priority: e.target.value }))} className="w-full p-2 border rounded">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Estimated Time (minutes)</label>
                      <input type="number" value={newTask.estimated_time} onChange={e => setNewTask(prev => ({ ...prev, estimated_time: parseInt(e.target.value) || 0 }))} className="w-full p-2 border rounded" min="1" max="480" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Category</label>
                      <input type="text" value={newTask.category} onChange={e => setNewTask(prev => ({ ...prev, category: e.target.value }))} className="w-full p-2 border rounded" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Instructions</label>
                      <textarea value={newTask.instructions} onChange={e => setNewTask(prev => ({ ...prev, instructions: e.target.value }))} className="w-full p-2 border rounded" rows={2} />
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" checked={newTask.compliance_requirement} onChange={e => setNewTask(prev => ({ ...prev, compliance_requirement: e.target.checked }))} className="mr-2" />
                      <span>Compliance Requirement</span>
                    </div>
                  </>
                )}
                {showAddForm === 'maintenance' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Equipment Name</label>
                      <input type="text" value={newTask.equipment_name} onChange={e => setNewTask(prev => ({ ...prev, equipment_name: e.target.value }))} className="w-full p-2 border rounded" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Task Name</label>
                      <input type="text" value={newTask.name} onChange={e => setNewTask(prev => ({ ...prev, name: e.target.value }))} className="w-full p-2 border rounded" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Frequency</label>
                      <select value={newTask.frequency} onChange={e => setNewTask(prev => ({ ...prev, frequency: e.target.value }))} className="w-full p-2 border rounded">
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="annually">Annually</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Estimated Time (minutes)</label>
                      <input type="number" value={newTask.estimated_time} onChange={e => setNewTask(prev => ({ ...prev, estimated_time: parseInt(e.target.value) || 0 }))} className="w-full p-2 border rounded" min="1" max="480" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Instructions</label>
                      <textarea value={newTask.instructions} onChange={e => setNewTask(prev => ({ ...prev, instructions: e.target.value }))} className="w-full p-2 border rounded" rows={2} />
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" checked={newTask.requires_specialist} onChange={e => setNewTask(prev => ({ ...prev, requires_specialist: e.target.checked }))} className="mr-2" />
                      <span>Requires Specialist</span>
                    </div>
                  </>
                )}
                {showAddForm === 'safety' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Item Name</label>
                      <input type="text" value={newTask.name} onChange={e => setNewTask(prev => ({ ...prev, name: e.target.value }))} className="w-full p-2 border rounded" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Category</label>
                      <input type="text" value={newTask.category} onChange={e => setNewTask(prev => ({ ...prev, category: e.target.value }))} className="w-full p-2 border rounded" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Check Type</label>
                      <input type="text" value={newTask.check_type} onChange={e => setNewTask(prev => ({ ...prev, check_type: e.target.value }))} className="w-full p-2 border rounded" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Frequency</label>
                      <select value={newTask.frequency} onChange={e => setNewTask(prev => ({ ...prev, frequency: e.target.value }))} className="w-full p-2 border rounded">
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="annually">Annually</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Acceptable Range</label>
                      <input type="text" value={newTask.acceptable_range} onChange={e => setNewTask(prev => ({ ...prev, acceptable_range: e.target.value }))} className="w-full p-2 border rounded" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Instructions</label>
                      <textarea value={newTask.instructions} onChange={e => setNewTask(prev => ({ ...prev, instructions: e.target.value }))} className="w-full p-2 border rounded" rows={2} />
                    </div>
                  </>
                )}
                <div className="flex justify-between space-x-2 mt-6">
                  <button type="button" onClick={() => { setShowNewTaskForm(false); }} className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50">Back</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Add</button>
                </div>
              </form>
            </>
          )}
          </div>
        </div>
      </>
    );
  };

  const renderTaskCard = (task: any, type: string) => {
    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case 'critical': return 'border-l-red-500 bg-red-50';
        case 'high': return 'border-l-orange-500 bg-orange-50';
        case 'medium': return 'border-l-yellow-500 bg-yellow-50';
        case 'low': return 'border-l-green-500 bg-green-50';
        default: return 'border-l-gray-500 bg-gray-50';
      }
    };

    return (
      <div key={task.id} className={`border-l-4 p-4 rounded-r bg-white shadow-sm ${
        type === 'cleaning' ? getPriorityColor(task.priority) : 'border-l-blue-500'
      }`}>
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">
              {type === 'maintenance' ? task.equipment_name : task.task_name || task.check_name}
            </h4>
            {type === 'maintenance' && task.task_name && (
              <p className="text-sm text-gray-600">{task.task_name}</p>
            )}
            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => handleToggleCompletion(type, task.id, !task.completed_today)}
              className={`p-1 rounded ${
                task.completed_today 
                  ? 'text-green-600 hover:bg-green-50' 
                  : 'text-gray-400 hover:bg-gray-50'
              }`}
              title={task.completed_today ? 'Mark as incomplete' : 'Mark as complete'}
            >
              <CheckCircle size={20} />
            </button>
            <button
              onClick={() => handleDeleteTask(type, task.id)}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
              title="Delete task"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span className="flex items-center">
            <Clock size={14} className="mr-1" />
            {task.estimated_time_minutes || task.estimated_time || 0} min
          </span>
          <span className="capitalize">{task.frequency}</span>
          {task.priority && (
            <span className={`px-2 py-1 rounded-full text-xs ${
              task.priority === 'critical' ? 'bg-red-100 text-red-800' :
              task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {task.priority}
            </span>
          )}
        </div>
        
        {task.instructions && (
          <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
            <p className="text-gray-700">{task.instructions}</p>
          </div>
        )}
        
        {(task.compliance_requirement || task.requires_specialist) && (
          <div className="mt-2 flex space-x-2">
            {task.compliance_requirement && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Compliance Required
              </span>
            )}
            {task.requires_specialist && (
              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                Specialist Required
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Operations Manual</h2>
          <p className="text-gray-600">Manage daily operations, cleaning schedules, maintenance tasks, and safety compliance</p>
        </div>

        {/* Stats Cards */}
        {data.statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Completed Today</p>
                  <p className="text-2xl font-bold text-green-700">
                    {data.statistics.tasks_completed_today || 0}
                  </p>
                </div>
                <CheckCircle className="text-green-500" size={24} />
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-medium">Pending Tasks</p>
                  <p className="text-2xl font-bold text-orange-700">
                    {data.statistics.tasks_pending || 0}
                  </p>
                </div>
                <Clock className="text-orange-500" size={24} />
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Tasks</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {(data.cleaningTasks.length + data.maintenanceTasks.length + data.safetyItems.length)}
                  </p>
                </div>
                <ClipboardList className="text-blue-500" size={24} />
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Compliance Rate</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {data.statistics.compliance_rate || '2%'}
                  </p>
                </div>
                <Shield className="text-purple-500" size={24} />
              </div>
            </div>
          </div>
        )}

        {/* Navigation Grid */}
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { 
                id: 'cleaning', 
                label: 'Cleaning Tasks', 
                icon: ClipboardList, 
                count: data.cleaningTasks.length,
                activeStyles: 'border-blue-500 bg-blue-50',
                iconStyles: 'text-blue-600',
                textStyles: 'text-blue-900',
                countStyles: 'bg-blue-100 text-blue-700'
              },
              { 
                id: 'maintenance', 
                label: 'Maintenance', 
                icon: Wrench, 
                count: data.maintenanceTasks.length,
                activeStyles: 'border-orange-500 bg-orange-50',
                iconStyles: 'text-orange-600',
                textStyles: 'text-orange-900',
                countStyles: 'bg-orange-100 text-orange-700'
              },
              { 
                id: 'safety', 
                label: 'Safety Checks', 
                icon: Shield, 
                count: data.safetyItems.length,
                activeStyles: 'border-green-500 bg-green-50',
                iconStyles: 'text-green-600',
                textStyles: 'text-green-900',
                countStyles: 'bg-green-100 text-green-700'
              },
              { 
                id: 'history', 
                label: 'History', 
                icon: Clock, 
                count: 0,
                activeStyles: 'border-purple-500 bg-purple-50',
                iconStyles: 'text-purple-600',
                textStyles: 'text-purple-900',
                countStyles: 'bg-purple-100 text-purple-700'
              },
              { 
                id: 'daily_cleaning_logs', 
                label: 'Cleaning Logs', 
                icon: ClipboardList, 
                count: logs.cleaning.length,
                activeStyles: 'border-indigo-500 bg-indigo-50',
                iconStyles: 'text-indigo-600',
                textStyles: 'text-indigo-900',
                countStyles: 'bg-indigo-100 text-indigo-700'
              },
              { 
                id: 'daily_safety_checks', 
                label: 'Safety Logs', 
                icon: Shield, 
                count: logs.safety.length,
                activeStyles: 'border-red-500 bg-red-50',
                iconStyles: 'text-red-600',
                textStyles: 'text-red-900',
                countStyles: 'bg-red-100 text-red-700'
              },
              { 
                id: 'equipment_maintenance', 
                label: 'Equipment', 
                icon: Wrench, 
                count: 0,
                activeStyles: 'border-gray-500 bg-gray-50',
                iconStyles: 'text-gray-600',
                textStyles: 'text-gray-900',
                countStyles: 'bg-gray-100 text-gray-700'
              }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    p-4 rounded-lg border-2 transition-all duration-200 text-left
                    ${isActive
                      ? `${tab.activeStyles} shadow-md`
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Icon 
                        className={`mr-3 ${isActive ? tab.iconStyles : 'text-gray-500'}`} 
                        size={24} 
                      />
                      <div>
                        <h3 className={`font-semibold ${isActive ? tab.textStyles : 'text-gray-900'}`}>
                          {tab.label}
                        </h3>
                        {tab.count > 0 && (
                          <p className={`text-sm ${isActive ? tab.iconStyles : 'text-gray-500'}`}>
                            {tab.count} items
                          </p>
                        )}
                      </div>
                    </div>
                    {tab.count > 0 && (
                      <span className={`
                        px-2 py-1 text-xs font-semibold rounded-full
                        ${isActive 
                          ? tab.countStyles
                          : 'bg-gray-100 text-gray-600'
                        }
                      `}>
                        {tab.count}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Cleaning Tasks */}
        {activeTab === 'cleaning' && (
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <ClipboardList className="mr-2" size={20} />
                Cleaning Tasks
              </h2>
              <button
                onClick={() => setShowAddForm('cleaning')}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Plus size={16} className="mr-1" />
                Add Task
              </button>
            </div>
            
            <div className="space-y-3">
              {data.cleaningTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ClipboardList size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No cleaning tasks found. Add your first task to get started.</p>
                </div>
              ) : (
                data.cleaningTasks.map(task => renderTaskCard(task, 'cleaning'))
              )}
            </div>
          </div>
        )}

        {/* Maintenance Tasks */}
        {activeTab === 'maintenance' && (
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <Wrench className="mr-2" size={20} />
                Maintenance Tasks
              </h2>
              <button
                onClick={() => setShowAddForm('maintenance')}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Plus size={16} className="mr-1" />
                Add Task
              </button>
            </div>
            
            <div className="space-y-3">
              {data.maintenanceTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Wrench size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No maintenance tasks found. Add your first task to get started.</p>
                </div>
              ) : (
                data.maintenanceTasks.map(task => renderTaskCard(task, 'maintenance'))
              )}
            </div>
          </div>
        )}

        {/* Safety Checks */}
        {activeTab === 'safety' && (
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <Shield className="mr-2" size={20} />
                Safety Check Items
              </h2>
              <button
                onClick={() => setShowAddForm('safety')}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Plus size={16} className="mr-1" />
                Add Check
              </button>
            </div>
            
            <div className="space-y-3">
              {data.safetyItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Shield size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No safety check items found. Add your first check to get started.</p>
                </div>
              ) : (
                data.safetyItems.map(task => renderTaskCard(task, 'safety'))
              )}
            </div>
          </div>
        )}

        {/* Daily Cleaning Logs */}
        {activeTab === 'daily_cleaning_logs' && (
          <div className="p-4">
            <DailyCleaningLogs />
          </div>
        )}

        {/* Daily Safety Checks */}
        {activeTab === 'daily_safety_checks' && (
          <div className="p-4">
            <DailySafetyChecks />
          </div>
        )}

        {/* Equipment Maintenance Logs */}
        {activeTab === 'equipment_maintenance' && (
          <div className="p-4">
            <EquipmentMaintenance />
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="p-4">
            <div className="mb-4">
              <h2 className="text-xl font-semibold flex items-center mb-3">
                <Clock className="mr-2" size={20} />
                Completion History
              </h2>
              {/* Mobile-responsive filter section */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input 
                    type="date" 
                    value={historyFilters.start} 
                    onChange={e => setHistoryFilters(prev => ({ ...prev, start: e.target.value }))} 
                    className="w-full sm:w-auto px-2 py-1 border border-gray-300 rounded text-sm" 
                    placeholder="Start date"
                  />
                  <input 
                    type="date" 
                    value={historyFilters.end} 
                    onChange={e => setHistoryFilters(prev => ({ ...prev, end: e.target.value }))} 
                    className="w-full sm:w-auto px-2 py-1 border border-gray-300 rounded text-sm" 
                    placeholder="End date"
                  />
                </div>
                <button 
                  onClick={loadHistory} 
                  className="w-full sm:w-auto px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  Filter
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Cleaning Logs</h3>
                <div className="overflow-x-auto bg-white rounded border shadow-sm">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 sm:px-3 py-2 text-left font-medium text-gray-700 min-w-[120px]">Task</th>
                        <th className="px-2 sm:px-3 py-2 text-left font-medium text-gray-700 min-w-[100px]">Barber</th>
                        <th className="px-2 sm:px-3 py-2 text-left font-medium text-gray-700 min-w-[110px]">Date</th>
                        <th className="px-2 sm:px-3 py-2 text-left font-medium text-gray-700 min-w-[100px] hidden sm:table-cell">Time</th>
                        <th className="px-2 sm:px-3 py-2 text-left font-medium text-gray-700 min-w-[120px]">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {logs.cleaning.length > 0 ? logs.cleaning.map(l => (
                        <tr key={l.id} className="hover:bg-gray-50">
                          <td className="px-2 sm:px-3 py-2 font-medium">{l.cleaning_tasks?.task_name || l.task_name || 'N/A'}</td>
                          <td className="px-2 sm:px-3 py-2">{users.find(u => (u.auth_user_id === l.barber_id) || (u.id === l.barber_id))?.name || 'Unknown'}</td>
                          <td className="px-2 sm:px-3 py-2">
                            <div className="flex flex-col">
                              <span>{l.completed_date ? new Date(l.completed_date).toLocaleDateString() : 'N/A'}</span>
                              <span className="text-xs text-gray-500 sm:hidden">{l.completed_at ? new Date(l.completed_at).toLocaleTimeString() : ''}</span>
                            </div>
                          </td>
                          <td className="px-2 sm:px-3 py-2 hidden sm:table-cell">{l.completed_at ? new Date(l.completed_at).toLocaleTimeString() : 'N/A'}</td>
                          <td className="px-2 sm:px-3 py-2 max-w-[150px] truncate" title={l.notes || '—'}>{l.notes || '—'}</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={5} className="px-3 py-4 text-center text-gray-500">No cleaning logs found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Maintenance Logs</h3>
                <div className="overflow-x-auto bg-white rounded border shadow-sm">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 sm:px-3 py-2 text-left font-medium text-gray-700 min-w-[120px]">Task</th>
                        <th className="px-2 sm:px-3 py-2 text-left font-medium text-gray-700 min-w-[100px] hidden sm:table-cell">Equipment</th>
                        <th className="px-2 sm:px-3 py-2 text-left font-medium text-gray-700 min-w-[100px]">Barber</th>
                        <th className="px-2 sm:px-3 py-2 text-left font-medium text-gray-700 min-w-[110px]">Date</th>
                        <th className="px-2 sm:px-3 py-2 text-left font-medium text-gray-700 min-w-[120px]">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {logs.maintenance.length > 0 ? logs.maintenance.map(l => (
                        <tr key={l.id} className="hover:bg-gray-50">
                          <td className="px-2 sm:px-3 py-2 font-medium">
                            <div className="flex flex-col">
                              <span>{l.maintenance_tasks?.task_name || l.task_name || 'N/A'}</span>
                              <span className="text-xs text-gray-500 sm:hidden">{l.maintenance_tasks?.equipment_name || l.equipment_name || ''}</span>
                            </div>
                          </td>
                          <td className="px-2 sm:px-3 py-2 hidden sm:table-cell">{l.maintenance_tasks?.equipment_name || l.equipment_name || 'N/A'}</td>
                          <td className="px-2 sm:px-3 py-2">{users.find(u => (u.auth_user_id === l.barber_id) || (u.id === l.barber_id))?.name || 'Unknown'}</td>
                          <td className="px-2 sm:px-3 py-2">{l.completed_date ? new Date(l.completed_date).toLocaleDateString() : 'N/A'}</td>
                          <td className="px-2 sm:px-3 py-2 max-w-[150px] truncate" title={l.notes || '—'}>{l.notes || '—'}</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={5} className="px-3 py-4 text-center text-gray-500">No maintenance logs found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Safety Check Logs</h3>
                <div className="overflow-x-auto bg-white rounded border shadow-sm">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 sm:px-3 py-2 text-left font-medium text-gray-700 min-w-[120px]">Item</th>
                        <th className="px-2 sm:px-3 py-2 text-left font-medium text-gray-700 min-w-[80px]">Status</th>
                        <th className="px-2 sm:px-3 py-2 text-left font-medium text-gray-700 min-w-[100px] hidden sm:table-cell">Barber</th>
                        <th className="px-2 sm:px-3 py-2 text-left font-medium text-gray-700 min-w-[110px]">Date</th>
                        <th className="px-2 sm:px-3 py-2 text-left font-medium text-gray-700 min-w-[120px]">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {logs.safety.length > 0 ? logs.safety.map(l => (
                        <tr key={l.id} className="hover:bg-gray-50">
                          <td className="px-2 sm:px-3 py-2 font-medium">{l.safety_check_items?.check_name || l.item_name || 'N/A'}</td>
                          <td className="px-2 sm:px-3 py-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              l.status === 'passed' ? 'bg-green-100 text-green-800' :
                              l.status === 'failed' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {l.status || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-2 sm:px-3 py-2 hidden sm:table-cell">{users.find(u => (u.auth_user_id === l.barber_id) || (u.id === l.barber_id))?.name || 'Unknown'}</td>
                          <td className="px-2 sm:px-3 py-2">
                            <div className="flex flex-col">
                              <span>{l.check_date ? new Date(l.check_date).toLocaleDateString() : 'N/A'}</span>
                              <span className="text-xs text-gray-500 sm:hidden">{users.find(u => (u.auth_user_id === l.barber_id) || (u.id === l.barber_id))?.name || 'Unknown'}</span>
                            </div>
                          </td>
                          <td className="px-2 sm:px-3 py-2 max-w-[150px] truncate" title={l.notes || '—'}>{l.notes || '—'}</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={5} className="px-3 py-4 text-center text-gray-500">No safety check logs found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>

        {/* Add Task Form Modal */}
        {renderAddForm()}
      </div>
    </div>
  );
};

export default OperationsManual;
