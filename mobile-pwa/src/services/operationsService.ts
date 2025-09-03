import { supabase } from '../lib/supabase';

// Type definitions
export interface CleaningTask {
  id: string;
  task_name: string;
  description: string;
  frequency: string;
  estimated_time_minutes: number;
  priority: string;
  category: string;
  compliance_requirement: boolean;
  instructions: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceTask {
  id: string;
  equipment_name: string;
  task_name: string;
  frequency: string;
  estimated_time_minutes: number;
  instructions: string;
  requires_specialist: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SafetyCheckItem {
  id: string;
  check_name: string;
  description: string;
  frequency: string;
  compliance_requirement: boolean;
  instructions: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CleaningLog {
  id: string;
  task_id: string;
  barber_id: string;
  completed_date: string;
  completed_at: string;
  notes: string;
  created_at: string;
}

export interface MaintenanceLog {
  id: string;
  task_id: string;
  barber_id: string;
  completed_date: string;
  completed_at: string;
  notes: string;
  created_at: string;
}

export interface SafetyCheckLog {
  id: string;
  item_id: string;
  barber_id: string;
  check_date: string;
  status: string;
  notes: string;
  created_at: string;
}

// Get current user/barber ID helper with better error handling
const getCurrentBarberId = async () => {
  try {
    // Get current user from Supabase Auth session
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error getting auth session:', error);
      return null;
    }
    
    if (!session?.user) {
      return null;
    }
    
    // Get the user profile from the users table using the auth user ID
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', session.user.id)
      .single();
    
    if (profileError) {
      console.error('Error getting user profile:', profileError);
      if (profileError.code === 'PGRST116') {
        throw new Error('User profile not found. Please contact support.');
      }
      return null;
    }
    
    return profile?.id || null;
  } catch (error) {
    console.error('Error in getCurrentBarberId:', error);
    throw error; // Re-throw to preserve the specific error message
  }
};

// Cleaning Tasks Operations
export const getCleaningTasks = async (): Promise<CleaningTask[]> => {
  try {
    const { data, error } = await supabase
      .from('cleaning_tasks')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .order('task_name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching cleaning tasks:', error);
    return [];
  }
};

export const addCleaningTask = async (task: Omit<CleaningTask, 'id' | 'is_active' | 'created_at' | 'updated_at'>): Promise<CleaningTask | null> => {
  try {
    const { data, error } = await supabase
      .from('cleaning_tasks')
      .insert([{
        ...task,
        is_active: true
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding cleaning task:', error);
    throw error;
  }
};

export const updateCleaningTask = async (id: string, updates: Partial<CleaningTask>): Promise<CleaningTask | null> => {
  try {
    const { data, error } = await supabase
      .from('cleaning_tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating cleaning task:', error);
    throw error;
  }
};

export const deleteCleaningTask = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('cleaning_tasks')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting cleaning task:', error);
    throw error;
  }
};

// Maintenance Tasks Operations
export const getMaintenanceTasks = async (): Promise<MaintenanceTask[]> => {
  try {
    const { data, error } = await supabase
      .from('maintenance_tasks')
      .select('*')
      .eq('is_active', true)
      .order('equipment_name')
      .order('task_name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching maintenance tasks:', error);
    return [];
  }
};

export const addMaintenanceTask = async (task: Omit<MaintenanceTask, 'id' | 'is_active' | 'created_at' | 'updated_at'>): Promise<MaintenanceTask | null> => {
  try {
    const { data, error } = await supabase
      .from('maintenance_tasks')
      .insert([{
        ...task,
        is_active: true
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding maintenance task:', error);
    throw error;
  }
};

export const updateMaintenanceTask = async (id: string, updates: Partial<MaintenanceTask>): Promise<MaintenanceTask | null> => {
  try {
    const { data, error } = await supabase
      .from('maintenance_tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating maintenance task:', error);
    throw error;
  }
};

export const deleteMaintenanceTask = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('maintenance_tasks')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting maintenance task:', error);
    throw error;
  }
};

// Safety Check Items Operations
export const getSafetyCheckItems = async (): Promise<SafetyCheckItem[]> => {
  try {
    const { data, error } = await supabase
      .from('safety_check_items')
      .select('*')
      .eq('is_active', true)
      .order('check_name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching safety check items:', error);
    return [];
  }
};

export const addSafetyCheckItem = async (item: Omit<SafetyCheckItem, 'id' | 'is_active' | 'created_at' | 'updated_at'>): Promise<SafetyCheckItem | null> => {
  try {
    const { data, error } = await supabase
      .from('safety_check_items')
      .insert([{
        ...item,
        is_active: true
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding safety check item:', error);
    throw error;
  }
};

export const updateSafetyCheckItem = async (id: string, updates: Partial<SafetyCheckItem>): Promise<SafetyCheckItem | null> => {
  try {
    const { data, error } = await supabase
      .from('safety_check_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating safety check item:', error);
    throw error;
  }
};

export const deleteSafetyCheckItem = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('safety_check_items')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting safety check item:', error);
    throw error;
  }
};

// Task Completion Operations
export const updateTaskCompletion = async (type: string, taskId: string, completed: boolean): Promise<void> => {
  try {
    const barberId = await getCurrentBarberId();
    if (!barberId) {
      throw new Error('No current user found. Please log in again.');
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    if (type === 'cleaning') {
      if (completed) {
        // Add completion log
        const { error } = await supabase
          .from('cleaning_logs')
          .upsert([{
            task_id: taskId,
            barber_id: barberId,
            completed_date: today,
            completed_at: new Date().toISOString(),
            notes: ''
          }], { onConflict: 'task_id,barber_id,completed_date' });
        
        if (error) throw error;
      } else {
        // Remove completion log
        const { error } = await supabase
          .from('cleaning_logs')
          .delete()
          .eq('task_id', taskId)
          .eq('barber_id', barberId)
          .eq('completed_date', today);
        
        if (error) throw error;
      }
    } else if (type === 'maintenance') {
      if (completed) {
        const { error } = await supabase
          .from('maintenance_logs')
          .upsert([{
            task_id: taskId,
            barber_id: barberId,
            completed_date: today,
            completed_at: new Date().toISOString(),
            notes: ''
          }], { onConflict: 'task_id,barber_id,completed_date' });
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('maintenance_logs')
          .delete()
          .eq('task_id', taskId)
          .eq('barber_id', barberId)
          .eq('completed_date', today);
        
        if (error) throw error;
      }
    } else if (type === 'safety') {
      if (completed) {
        const { error } = await supabase
          .from('safety_check_logs')
          .upsert([{
            item_id: taskId,
            barber_id: barberId,
            check_date: today,
            status: 'pass',
            notes: ''
          }], { onConflict: 'item_id,barber_id,check_date' });
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('safety_check_logs')
          .delete()
          .eq('item_id', taskId)
          .eq('barber_id', barberId)
          .eq('check_date', today);
        
        if (error) throw error;
      }
    }
  } catch (error) {
    console.error('Error updating task completion:', error);
    throw error;
  }
};

// Statistics and Reports
export const getOperationsStatistics = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const barberId = await getCurrentBarberId();

    // If no user is authenticated, return empty statistics (silently)
    if (!barberId) {
      return {
        total_tasks: 0,
        tasks_completed_today: 0,
        tasks_pending: 0,
        compliance_rate: '0%'
      };
    }

    // Get total tasks
    const [cleaningTasks, maintenanceTasks, safetyItems] = await Promise.all([
      getCleaningTasks(),
      getMaintenanceTasks(),
      getSafetyCheckItems()
    ]);

    // Get completed tasks today
    const [cleaningLogs, maintenanceLogs, safetyLogs] = await Promise.all([
      supabase.from('cleaning_logs').select('*').eq('barber_id', barberId).eq('completed_date', today),
      supabase.from('maintenance_logs').select('*').eq('barber_id', barberId).eq('completed_date', today),
      supabase.from('safety_check_logs').select('*').eq('barber_id', barberId).eq('check_date', today)
    ]);

    const totalTasks = cleaningTasks.length + maintenanceTasks.length + safetyItems.length;
    const completedToday = (cleaningLogs.data?.length || 0) + (maintenanceLogs.data?.length || 0) + (safetyLogs.data?.length || 0);
    const pendingTasks = totalTasks - completedToday;
    const complianceRate = totalTasks > 0 ? Math.round((completedToday / totalTasks) * 100) : 0;

    return {
      total_tasks: totalTasks,
      tasks_completed_today: completedToday,
      tasks_pending: pendingTasks,
      compliance_rate: `${complianceRate}%`
    };
  } catch (error) {
    console.error('Error getting operations statistics:', error);
    return {
      total_tasks: 0,
      tasks_completed_today: 0,
      tasks_pending: 0,
      compliance_rate: '0%'
    };
  }
};

export const getComplianceReports = async (startDate: string, endDate: string) => {
  try {
    const barberId = await getCurrentBarberId();
    
    // If no user is authenticated, return empty compliance report (silently)
    if (!barberId) {
      return {
        cleaning_compliance: [],
        maintenance_compliance: [],
        safety_compliance: [],
        overall_compliance_rate: 0
      };
    }

    const [cleaningCompliance, maintenanceCompliance, safetyCompliance] = await Promise.all([
      supabase
        .from('cleaning_logs')
        .select(`
          *,
          cleaning_tasks(task_name, compliance_requirement)
        `)
        .eq('barber_id', barberId)
        .gte('completed_date', startDate)
        .lte('completed_date', endDate),
      
      supabase
        .from('maintenance_logs')
        .select(`
          *,
          maintenance_tasks(equipment_name, task_name)
        `)
        .eq('barber_id', barberId)
        .gte('completed_date', startDate)
        .lte('completed_date', endDate),
      
      supabase
        .from('safety_check_logs')
        .select(`
          *,
          safety_check_items(check_name, compliance_requirement)
        `)
        .eq('barber_id', barberId)
        .gte('check_date', startDate)
        .lte('check_date', endDate)
    ]);

    return {
      cleaning: cleaningCompliance.data || [],
      maintenance: maintenanceCompliance.data || [],
      safety: safetyCompliance.data || []
    };
  } catch (error) {
    console.error('Error getting compliance reports:', error);
    return {
      cleaning: [],
      maintenance: [],
      safety: []
    };
  }
};

// Fetch logs / history (cleaning, maintenance, safety). If startDate/endDate omitted, returns recent logs.
export const getLogsHistory = async (startDate?: string, endDate?: string) => {
  try {
    const barberId = await getCurrentBarberId();
    
    // If no user is authenticated, return empty logs (silently)
    if (!barberId) {
      return {
        cleaning: [],
        maintenance: [],
        safety: []
      };
    }

    const cleaningQuery = supabase
      .from('cleaning_logs')
      .select(`*, cleaning_tasks(task_name)`)
      .eq('barber_id', barberId)
      .order('created_at', { ascending: false });

    const maintenanceQuery = supabase
      .from('maintenance_logs')
      .select(`*, maintenance_tasks(task_name, equipment_name)`)
      .eq('barber_id', barberId)
      .order('created_at', { ascending: false });

    const safetyQuery = supabase
      .from('safety_check_logs')
      .select(`*, safety_check_items(check_name)`)
      .eq('barber_id', barberId)
      .order('created_at', { ascending: false });

    if (startDate) {
      cleaningQuery.gte('completed_date', startDate);
      maintenanceQuery.gte('completed_date', startDate);
      safetyQuery.gte('check_date', startDate);
    }
    if (endDate) {
      cleaningQuery.lte('completed_date', endDate);
      maintenanceQuery.lte('completed_date', endDate);
      safetyQuery.lte('check_date', endDate);
    }

    const [cleaningRes, maintenanceRes, safetyRes] = await Promise.all([
      cleaningQuery,
      maintenanceQuery,
      safetyQuery
    ]);

    return {
      cleaning: cleaningRes.data || [],
      maintenance: maintenanceRes.data || [],
      safety: safetyRes.data || []
    };
  } catch (error) {
    console.error('Error fetching logs history:', error);
    return { cleaning: [], maintenance: [], safety: [] };
  }
};

// Enhanced task fetching with completion status
export const getCleaningTasksWithStatus = async (): Promise<(CleaningTask & { completed_today: boolean })[]> => {
  try {
    const tasks = await getCleaningTasks();
    const today = new Date().toISOString().split('T')[0];
    const barberId = await getCurrentBarberId();

    // If no user is authenticated, return tasks without completion status (silently)
    if (!barberId) {
      return tasks.map(task => ({
        ...task,
        completed_today: false
      }));
    }

    const { data: logs } = await supabase
      .from('cleaning_logs')
      .select('task_id')
      .eq('barber_id', barberId)
      .eq('completed_date', today);

    const completedTaskIds = new Set(logs?.map(log => log.task_id) || []);

    return tasks.map(task => ({
      ...task,
      completed_today: completedTaskIds.has(task.id)
    }));
  } catch (error) {
    console.error('Error fetching cleaning tasks with status:', error);
    return [];
  }
};

export const getMaintenanceTasksWithStatus = async (): Promise<(MaintenanceTask & { completed_today: boolean })[]> => {
  try {
    const tasks = await getMaintenanceTasks();
    const today = new Date().toISOString().split('T')[0];
    const barberId = await getCurrentBarberId();

    // If no user is authenticated, return tasks without completion status (silently)
    if (!barberId) {
      return tasks.map(task => ({
        ...task,
        completed_today: false
      }));
    }

    const { data: logs } = await supabase
      .from('maintenance_logs')
      .select('task_id')
      .eq('barber_id', barberId)
      .eq('completed_date', today);

    const completedTaskIds = new Set(logs?.map(log => log.task_id) || []);

    return tasks.map(task => ({
      ...task,
      completed_today: completedTaskIds.has(task.id)
    }));
  } catch (error) {
    console.error('Error fetching maintenance tasks with status:', error);
    return [];
  }
};

export const getSafetyCheckItemsWithStatus = async (): Promise<(SafetyCheckItem & { completed_today: boolean })[]> => {
  try {
    const items = await getSafetyCheckItems();
    const today = new Date().toISOString().split('T')[0];
    const barberId = await getCurrentBarberId();

    // If no user is authenticated, return items without completion status (silently)
    if (!barberId) {
      return items.map(item => ({
        ...item,
        completed_today: false
      }));
    }

    const { data: logs } = await supabase
      .from('safety_check_logs')
      .select('item_id')
      .eq('barber_id', barberId)
      .eq('check_date', today);

    const completedItemIds = new Set(logs?.map(log => log.item_id) || []);

    return items.map(item => ({
      ...item,
      completed_today: completedItemIds.has(item.id)
    }));
  } catch (error) {
    console.error('Error fetching safety check items with status:', error);
    return [];
  }
};

export default {
  getCleaningTasks,
  getMaintenanceTasks,
  getSafetyCheckItems,
  addCleaningTask,
  addMaintenanceTask,
  addSafetyCheckItem,
  updateCleaningTask,
  updateMaintenanceTask,
  updateSafetyCheckItem,
  deleteCleaningTask,
  deleteMaintenanceTask,
  deleteSafetyCheckItem,
  updateTaskCompletion,
  getOperationsStatistics,
  getComplianceReports,
  getCleaningTasksWithStatus,
  getMaintenanceTasksWithStatus,
  getSafetyCheckItemsWithStatus
};
