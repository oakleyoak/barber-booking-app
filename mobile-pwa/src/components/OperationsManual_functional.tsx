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
  const [activeTab, setActiveTab] = useState('cleaning');
  const [data, setData] = useState<OperationsData>({
    cleaningTasks: [],
    maintenanceTasks: [],
    safetyItems: [],
    statistics: null
  });
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState('');
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
    requires_specialist: false
  });

  useEffect(() => {
    loadData();
  }, []);

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
        requires_specialist: false
      });
    } catch (error) {
      console.error('Failed to add task:', error);
      alert('Failed to add task. Please try again.');
    }
  };

  const handleDeleteTask = async (type: string, id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
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
      alert('Failed to delete task. Please try again.');
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

  const renderAddForm = () => {
    if (!showAddForm) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">
            Add New {showAddForm === 'cleaning' ? 'Cleaning Task' : 
                     showAddForm === 'maintenance' ? 'Maintenance Task' : 'Safety Check'}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {showAddForm === 'maintenance' ? 'Equipment Name' : 'Task Name'}
              </label>
              <input
                type="text"
                value={showAddForm === 'maintenance' ? newTask.equipment_name : newTask.name}
                onChange={(e) => setNewTask(prev => ({ 
                  ...prev, 
                  [showAddForm === 'maintenance' ? 'equipment_name' : 'name']: e.target.value 
                }))}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                placeholder={showAddForm === 'maintenance' ? 'e.g., Hair Clippers' : 'e.g., Clean mirrors'}
              />
            </div>

            {showAddForm === 'maintenance' && (
              <div>
                <label className="block text-sm font-medium mb-1">Task Name</label>
                <input
                  type="text"
                  value={newTask.name}
                  onChange={(e) => setNewTask(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Oil and clean blades"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Detailed description of the task"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Frequency</label>
              <select
                value={newTask.frequency}
                onChange={(e) => setNewTask(prev => ({ ...prev, frequency: e.target.value }))}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annually">Annually</option>
              </select>
            </div>

            {showAddForm === 'cleaning' && (
              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Estimated Time (minutes)</label>
              <input
                type="number"
                value={newTask.estimated_time}
                onChange={(e) => setNewTask(prev => ({ ...prev, estimated_time: parseInt(e.target.value) || 0 }))}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                min="1"
                max="480"
              />
            </div>

            {showAddForm === 'cleaning' && (
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <input
                  type="text"
                  value={newTask.category}
                  onChange={(e) => setNewTask(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Sanitation, Equipment, Floors"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Instructions</label>
              <textarea
                value={newTask.instructions}
                onChange={(e) => setNewTask(prev => ({ ...prev, instructions: e.target.value }))}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Step-by-step instructions"
              />
            </div>

            <div className="flex items-center space-x-4">
              {(showAddForm === 'cleaning' || showAddForm === 'safety') && (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newTask.compliance_requirement}
                    onChange={(e) => setNewTask(prev => ({ ...prev, compliance_requirement: e.target.checked }))}
                    className="mr-2"
                  />
                  Compliance Requirement
                </label>
              )}

              {showAddForm === 'maintenance' && (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newTask.requires_specialist}
                    onChange={(e) => setNewTask(prev => ({ ...prev, requires_specialist: e.target.checked }))}
                    className="mr-2"
                  />
                  Requires Specialist
                </label>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <button
              onClick={() => setShowAddForm('')}
              className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddTask}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={!newTask.name || (!newTask.equipment_name && showAddForm === 'maintenance')}
            >
              Add Task
            </button>
          </div>
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Operations Manual</h1>
        <p className="text-gray-600">Manage daily operations, cleaning schedules, maintenance tasks, and safety compliance</p>
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
        <nav className="flex space-x-8">
          {[
            { id: 'cleaning', label: 'Cleaning Tasks', icon: ClipboardList, count: data.cleaningTasks.length },
            { id: 'maintenance', label: 'Maintenance', icon: Wrench, count: data.maintenanceTasks.length },
            { id: 'safety', label: 'Safety Checks', icon: Shield, count: data.safetyItems.length }
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
      </div>

      {/* Add Task Form Modal */}
      {renderAddForm()}
    </div>
  );
};

export default OperationsManual;
