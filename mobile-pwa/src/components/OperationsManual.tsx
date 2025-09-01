import React, { useState, useEffect } from 'react';
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
import { 
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

const OperationsManual: React.FC = () => {
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

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Load history when switching to history tab
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cleaning, maintenance, safety, stats] = await Promise.all([
        getCleaningTasksWithStatus(),
        getMaintenanceTasksWithStatus(),
        getSafetyCheckItemsWithStatus(),
        getOperationsStatistics()
      ]);
      
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
      const res = await (await import('../services/operationsService')).getLogsHistory(start, end);
      setLogs(res);
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">{showNewTaskForm ? `Add New ${label}` : `Select ${label}`}</h3>
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
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Operations Manual</h1>
        <p className="text-gray-600 mt-1">Manage daily operations, cleaning schedules, maintenance tasks, and safety compliance</p>
      </div>

      {/* Stats Cards */}
      {data.statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed Today</p>
                <p className="text-2xl font-bold text-green-600">
                  {data.statistics.tasks_completed_today || 0}
                </p>
              </div>
              <CheckCircle className="text-green-500" size={32} />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-l-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Tasks</p>
                <p className="text-2xl font-bold text-orange-600">
                  {data.statistics.tasks_pending || 0}
                </p>
              </div>
              <Clock className="text-orange-500" size={32} />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold text-blue-600">
                  {(data.cleaningTasks.length + data.maintenanceTasks.length + data.safetyItems.length)}
                </p>
              </div>
              <ClipboardList className="text-blue-500" size={32} />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Compliance Rate</p>
                <p className="text-2xl font-bold text-purple-600">
                  {data.statistics.compliance_rate || '0%'}
                </p>
              </div>
              <Shield className="text-purple-500" size={32} />
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex flex-wrap gap-6">
          {[
            { id: 'cleaning', label: 'Cleaning Tasks', icon: ClipboardList, count: data.cleaningTasks.length },
            { id: 'maintenance', label: 'Maintenance', icon: Wrench, count: data.maintenanceTasks.length },
            { id: 'safety', label: 'Safety Checks', icon: Shield, count: data.safetyItems.length }
            , { id: 'history', label: 'Completion History', icon: Clock, count: 0 }
            , { id: 'daily_cleaning_logs', label: 'Cleaning Logs', icon: ClipboardList, count: logs.cleaning.length }
            , { id: 'daily_safety_checks', label: 'Safety Logs', icon: Shield, count: logs.safety.length }
            , { id: 'equipment_maintenance', label: 'Equipment Logs', icon: Wrench, count: logs.maintenance.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center pb-4 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon size={20} className="mr-2" />
              {tab.label}
              <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Cleaning Tasks */}
        {activeTab === 'cleaning' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <ClipboardList className="mr-2" size={24} />
                Cleaning Tasks
              </h2>
              <button
                onClick={() => setShowAddForm('cleaning')}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Plus size={16} className="mr-2" />
                Add Cleaning Task
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
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <Wrench className="mr-2" size={24} />
                Maintenance Tasks
              </h2>
              <button
                onClick={() => setShowAddForm('maintenance')}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Plus size={16} className="mr-2" />
                Add Maintenance Task
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
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <Shield className="mr-2" size={24} />
                Safety Check Items
              </h2>
              <button
                onClick={() => setShowAddForm('safety')}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Plus size={16} className="mr-2" />
                Add Safety Check
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

        {/* Daily Cleaning Logs (new) */}
        {activeTab === 'daily_cleaning_logs' && (
          <div>
            <DailyCleaningLogs />
          </div>
        )}

        {/* Daily Safety Checks (new) */}
        {activeTab === 'daily_safety_checks' && (
          <div>
            <DailySafetyChecks />
          </div>
        )}

        {/* Equipment Maintenance Logs (new) */}
        {activeTab === 'equipment_maintenance' && (
          <div>
            <EquipmentMaintenance />
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <Clock className="mr-2" size={24} />
                Completion & Incomplete History
              </h2>
              <div className="flex items-center space-x-2">
                <input type="date" value={historyFilters.start} onChange={e => setHistoryFilters(prev => ({ ...prev, start: e.target.value }))} className="p-2 border rounded" />
                <input type="date" value={historyFilters.end} onChange={e => setHistoryFilters(prev => ({ ...prev, end: e.target.value }))} className="p-2 border rounded" />
                <button onClick={loadHistory} className="px-3 py-2 bg-blue-600 text-white rounded">Filter</button>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Cleaning Logs</h3>
                <div className="overflow-x-auto bg-white rounded shadow">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-left">
                      <tr>
                        <th className="p-2">Task</th>
                        <th className="p-2">Barber</th>
                        <th className="p-2">Completed Date</th>
                        <th className="p-2">Completed At</th>
                        <th className="p-2">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.cleaning.map(l => (
                        <tr key={l.id} className="border-t">
                          <td className="p-2">{l.cleaning_tasks?.task_name || l.task_name}</td>
                          <td className="p-2">{l.barber_id}</td>
                          <td className="p-2">{l.completed_date}</td>
                          <td className="p-2">{l.completed_at}</td>
                          <td className="p-2">{l.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Maintenance Logs</h3>
                <div className="overflow-x-auto bg-white rounded shadow">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-left">
                      <tr>
                        <th className="p-2">Task</th>
                        <th className="p-2">Equipment</th>
                        <th className="p-2">Barber</th>
                        <th className="p-2">Completed Date</th>
                        <th className="p-2">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.maintenance.map(l => (
                        <tr key={l.id} className="border-t">
                          <td className="p-2">{l.maintenance_tasks?.task_name || l.task_name}</td>
                          <td className="p-2">{l.maintenance_tasks?.equipment_name || l.equipment_name}</td>
                          <td className="p-2">{l.barber_id}</td>
                          <td className="p-2">{l.completed_date}</td>
                          <td className="p-2">{l.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Safety Check Logs</h3>
                <div className="overflow-x-auto bg-white rounded shadow">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-left">
                      <tr>
                        <th className="p-2">Item</th>
                        <th className="p-2">Status</th>
                        <th className="p-2">Barber</th>
                        <th className="p-2">Check Date</th>
                        <th className="p-2">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.safety.map(l => (
                        <tr key={l.id} className="border-t">
                          <td className="p-2">{l.safety_check_items?.check_name || l.item_name}</td>
                          <td className="p-2">{l.status}</td>
                          <td className="p-2">{l.barber_id}</td>
                          <td className="p-2">{l.check_date}</td>
                          <td className="p-2">{l.notes}</td>
                        </tr>
                      ))}
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
  );
};

export default OperationsManual;
