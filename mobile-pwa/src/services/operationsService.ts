import { supabase } from '../lib/supabase';

export interface DailyOperations {
  id: string;
  date: string;
  barber_id: string;
  shift_start: string;
  shift_end: string;
  total_customers_served: number;
  total_revenue: number;
  notes: string;
}

export interface CleaningTask {
  id: string;
  task_name: string;
  category: string;
  frequency: string;
  estimated_time_minutes: number;
  instructions: string;
}

export interface CleaningLog {
  id: string;
  date: string;
  barber_id: string;
  task_id: string;
  completed: boolean;
  completed_at: string;
  notes: string;
}

export interface SafetyCheckItem {
  id: string;
  item_name: string;
  category: string;
  check_type: string;
  frequency: string;
  instructions: string;
}

export interface SafetyCheckLog {
  id: string;
  date: string;
  barber_id: string;
  item_id: string;
  status: 'pass' | 'fail' | 'n/a';
  reading_value: string;
  notes: string;
}

export interface StaffAccountability {
  id: string;
  date: string;
  barber_id: string;
  check_in_time: string;
  check_out_time: string;
  uniform_compliant: boolean;
  hygiene_compliant: boolean;
  behavior_rating: number;
  performance_notes: string;
  issues_reported: string;
}

export const operationsService = {
  // Daily Operations
  async getDailyOperations(date: string, barberId: string): Promise<DailyOperations | null> {
    const { data, error } = await supabase
      .from('daily_operations')
      .select('*')
      .eq('date', date)
      .eq('barber_id', barberId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching daily operations:', error);
      return null;
    }

    return data;
  },

  async updateDailyOperations(operations: Partial<DailyOperations>): Promise<DailyOperations | null> {
    const { data, error } = await supabase
      .from('daily_operations')
      .upsert(operations)
      .select()
      .single();

    if (error) {
      console.error('Error updating daily operations:', error);
      return null;
    }

    return data;
  },

  // Cleaning Tasks
  async getCleaningTasks(): Promise<CleaningTask[]> {
    const { data, error } = await supabase
      .from('cleaning_tasks')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true });

    if (error) {
      console.error('Error fetching cleaning tasks:', error);
      return [];
    }

    return data || [];
  },

  async getCleaningLogs(date: string, barberId: string): Promise<CleaningLog[]> {
    const { data, error } = await supabase
      .from('daily_cleaning_log')
      .select(`
        *,
        task:cleaning_tasks(*)
      `)
      .eq('date', date)
      .eq('barber_id', barberId);

    if (error) {
      console.error('Error fetching cleaning logs:', error);
      return [];
    }

    return data || [];
  },

  async updateCleaningLog(log: Partial<CleaningLog>): Promise<CleaningLog | null> {
    const { data, error } = await supabase
      .from('daily_cleaning_log')
      .upsert(log)
      .select()
      .single();

    if (error) {
      console.error('Error updating cleaning log:', error);
      return null;
    }

    return data;
  },

  // Safety Checks
  async getSafetyCheckItems(): Promise<SafetyCheckItem[]> {
    const { data, error } = await supabase
      .from('safety_check_items')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true });

    if (error) {
      console.error('Error fetching safety check items:', error);
      return [];
    }

    return data || [];
  },

  async getSafetyCheckLogs(date: string, barberId: string): Promise<SafetyCheckLog[]> {
    const { data, error } = await supabase
      .from('daily_safety_checks')
      .select(`
        *,
        item:safety_check_items(*)
      `)
      .eq('date', date)
      .eq('barber_id', barberId);

    if (error) {
      console.error('Error fetching safety check logs:', error);
      return [];
    }

    return data || [];
  },

  async updateSafetyCheckLog(log: Partial<SafetyCheckLog>): Promise<SafetyCheckLog | null> {
    const { data, error } = await supabase
      .from('daily_safety_checks')
      .upsert(log)
      .select()
      .single();

    if (error) {
      console.error('Error updating safety check log:', error);
      return null;
    }

    return data;
  },

  // Staff Accountability
  async getStaffAccountability(date: string, barberId: string): Promise<StaffAccountability | null> {
    const { data, error } = await supabase
      .from('staff_accountability')
      .select('*')
      .eq('date', date)
      .eq('barber_id', barberId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching staff accountability:', error);
      return null;
    }

    return data;
  },

  async updateStaffAccountability(accountability: Partial<StaffAccountability>): Promise<StaffAccountability | null> {
    const { data, error } = await supabase
      .from('staff_accountability')
      .upsert(accountability)
      .select()
      .single();

    if (error) {
      console.error('Error updating staff accountability:', error);
      return null;
    }

    return data;
  },

  // Maintenance Tasks
  async getMaintenanceTasks(): Promise<any[]> {
    const { data, error } = await supabase
      .from('maintenance_tasks')
      .select('*')
      .eq('is_active', true)
      .order('equipment_name', { ascending: true });

    if (error) {
      console.error('Error fetching maintenance tasks:', error);
      return [];
    }

    return data || [];
  },

  async getMaintenanceLogs(date: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('equipment_maintenance_log')
      .select(`
        *,
        task:maintenance_tasks(*)
      `)
      .eq('date', date);

    if (error) {
      console.error('Error fetching maintenance logs:', error);
      return [];
    }

    return data || [];
  },

  async updateMaintenanceLog(log: any): Promise<any | null> {
    const { data, error } = await supabase
      .from('equipment_maintenance_log')
      .upsert(log)
      .select()
      .single();

    if (error) {
      console.error('Error updating maintenance log:', error);
      return null;
    }

    return data;
  },

  async toggleMaintenanceTask(taskId: number, date: string, completed: boolean): Promise<any | null> {
    const { data, error } = await supabase
      .from('equipment_maintenance_log')
      .upsert({
        task_id: taskId,
        date: date,
        completed: completed,
        completed_at: completed ? new Date().toISOString() : null,
        completed_by: completed ? 'current_user' : null
      })
      .select()
      .single();

    if (error) {
      console.error('Error toggling maintenance task:', error);
      return null;
    }

    return data;
  },

  async updateMaintenanceNotes(taskId: number, date: string, notes: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('equipment_maintenance_log')
      .upsert({
        task_id: taskId,
        date: date,
        notes: notes
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating maintenance notes:', error);
      return null;
    }

    return data;
  },

  async saveStaffAccountability(accountability: any): Promise<any | null> {
    const { data, error } = await supabase
      .from('staff_accountability')
      .upsert({
        ...accountability,
        date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving staff accountability:', error);
      return null;
    }

    return data;
  },

  // Equipment Inventory
  async getEquipmentInventory(): Promise<any[]> {
    const { data, error } = await supabase
      .from('equipment_inventory')
      .select('*')
      .eq('is_active', true)
      .order('equipment_name', { ascending: true });

    if (error) {
      console.error('Error fetching equipment inventory:', error);
      return [];
    }

    return data || [];
  },

  // Supplies Inventory
  async getSuppliesInventory(): Promise<any[]> {
    const { data, error } = await supabase
      .from('supplies_inventory')
      .select('*')
      .eq('is_active', true)
      .order('item_name', { ascending: true });

    if (error) {
      console.error('Error fetching supplies inventory:', error);
      return [];
    }

    return data || [];
  },

  // Incident Reports
  async getIncidentReports(): Promise<any[]> {
    const { data, error } = await supabase
      .from('incident_reports')
      .select('*')
      .order('date', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching incident reports:', error);
      return [];
    }

    return data || [];
  },

  async createIncidentReport(report: any): Promise<any | null> {
    const { data, error } = await supabase
      .from('incident_reports')
      .insert(report)
      .select()
      .single();

    if (error) {
      console.error('Error creating incident report:', error);
      return null;
    }

    return data;
  }
};
