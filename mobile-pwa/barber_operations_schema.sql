-- Barber Shop Operations Manual Database Schema
-- TRNC-compliant daily operations tracking system

-- Main daily operations log
CREATE TABLE IF NOT EXISTS daily_operations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    barber_id UUID REFERENCES auth.users(id),
    shop_id UUID, -- For multi-shop support
    shift_start TIME,
    shift_end TIME,
    total_customers_served INTEGER DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, barber_id)
);

-- Cleaning tasks checklist
CREATE TABLE IF NOT EXISTS cleaning_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'floors', 'equipment', 'bathrooms', 'common_areas'
    frequency VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly'
    estimated_time_minutes INTEGER DEFAULT 15,
    instructions TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily cleaning log
CREATE TABLE IF NOT EXISTS daily_cleaning_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    barber_id UUID REFERENCES auth.users(id),
    task_id UUID REFERENCES cleaning_tasks(id),
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, barber_id, task_id)
);

-- Equipment maintenance tasks
CREATE TABLE IF NOT EXISTS maintenance_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    equipment_name VARCHAR(255) NOT NULL,
    task_name VARCHAR(255) NOT NULL,
    frequency VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly'
    estimated_time_minutes INTEGER DEFAULT 30,
    instructions TEXT,
    requires_specialist BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Equipment maintenance log
CREATE TABLE IF NOT EXISTS equipment_maintenance_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    barber_id UUID REFERENCES auth.users(id),
    task_id UUID REFERENCES maintenance_tasks(id),
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    next_due_date DATE,
    notes TEXT,
    issues_found TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, task_id)
);

-- Safety check items
CREATE TABLE IF NOT EXISTS safety_check_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'electrical', 'fire_safety', 'hygiene', 'equipment'
    check_type VARCHAR(50) NOT NULL, -- 'visual', 'functional', 'measurement'
    frequency VARCHAR(50) NOT NULL,
    acceptable_range TEXT, -- For measurements like temperature ranges
    instructions TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily safety checks log
CREATE TABLE IF NOT EXISTS daily_safety_checks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    barber_id UUID REFERENCES auth.users(id),
    item_id UUID REFERENCES safety_check_items(id),
    status VARCHAR(20) NOT NULL, -- 'pass', 'fail', 'n/a'
    reading_value TEXT, -- For measurements
    notes TEXT,
    corrective_action TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, item_id)
);

-- Staff accountability log
CREATE TABLE IF NOT EXISTS staff_accountability (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    barber_id UUID REFERENCES auth.users(id),
    check_in_time TIME,
    check_out_time TIME,
    breaks_taken JSONB, -- Array of break periods
    uniform_compliant BOOLEAN DEFAULT true,
    hygiene_compliant BOOLEAN DEFAULT true,
    behavior_rating INTEGER CHECK (behavior_rating >= 1 AND behavior_rating <= 5),
    performance_notes TEXT,
    issues_reported TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, barber_id)
);

-- Equipment inventory
CREATE TABLE IF NOT EXISTS equipment_inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    equipment_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    serial_number VARCHAR(255),
    purchase_date DATE,
    warranty_expiry DATE,
    location VARCHAR(255),
    condition_rating INTEGER CHECK (condition_rating >= 1 AND condition_rating <= 5),
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supplies inventory
CREATE TABLE IF NOT EXISTS supplies_inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'consumables', 'disposables', 'chemicals'
    current_stock INTEGER DEFAULT 0,
    minimum_stock INTEGER DEFAULT 0,
    unit VARCHAR(50) DEFAULT 'pieces',
    supplier VARCHAR(255),
    last_restocked DATE,
    expiry_date DATE,
    unit_cost DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Incident reports
CREATE TABLE IF NOT EXISTS incident_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time TIME NOT NULL DEFAULT CURRENT_TIME,
    reported_by UUID REFERENCES auth.users(id),
    incident_type VARCHAR(100) NOT NULL, -- 'accident', 'equipment_failure', 'customer_complaint', 'safety_hazard'
    severity VARCHAR(20) NOT NULL, -- 'minor', 'moderate', 'serious', 'critical'
    location VARCHAR(255),
    description TEXT NOT NULL,
    immediate_action_taken TEXT,
    witnesses TEXT,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_notes TEXT,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_daily_operations_date ON daily_operations(date);
CREATE INDEX IF NOT EXISTS idx_daily_operations_barber ON daily_operations(barber_id);
CREATE INDEX IF NOT EXISTS idx_daily_cleaning_date ON daily_cleaning_log(date);
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_date ON equipment_maintenance_log(date);
CREATE INDEX IF NOT EXISTS idx_safety_checks_date ON daily_safety_checks(date);
CREATE INDEX IF NOT EXISTS idx_staff_accountability_date ON staff_accountability(date);
CREATE INDEX IF NOT EXISTS idx_incident_reports_date ON incident_reports(date);

-- Enable Row Level Security (RLS)
ALTER TABLE daily_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_cleaning_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_maintenance_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_safety_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_accountability ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies (adjust based on your user roles)
CREATE POLICY "Users can view their own operations" ON daily_operations
    FOR ALL USING (auth.uid() = barber_id);

CREATE POLICY "Users can view their own cleaning logs" ON daily_cleaning_log
    FOR ALL USING (auth.uid() = barber_id);

CREATE POLICY "Users can view maintenance logs" ON equipment_maintenance_log
    FOR ALL USING (true);

CREATE POLICY "Users can view their own safety checks" ON daily_safety_checks
    FOR ALL USING (auth.uid() = barber_id);

CREATE POLICY "Users can view their own accountability" ON staff_accountability
    FOR ALL USING (auth.uid() = barber_id);

CREATE POLICY "Users can view incident reports" ON incident_reports
    FOR ALL USING (true);

-- Insert default cleaning tasks
INSERT INTO cleaning_tasks (task_name, category, frequency, estimated_time_minutes, instructions) VALUES
('Sweep and mop floors', 'floors', 'daily', 15, 'Sweep all areas, mop with disinfectant solution'),
('Clean barber chairs', 'equipment', 'daily', 10, 'Wipe down chairs with disinfectant wipes'),
('Sanitize tools and clippers', 'equipment', 'daily', 20, 'Clean and sterilize all tools after each use'),
('Clean mirrors and counters', 'common_areas', 'daily', 10, 'Use glass cleaner and microfiber cloth'),
('Empty trash bins', 'common_areas', 'daily', 5, 'Replace liners and take out trash'),
('Clean bathroom facilities', 'bathrooms', 'daily', 15, 'Clean sink, toilet, and floors'),
('Dust shelves and displays', 'common_areas', 'weekly', 10, 'Remove dust from all surfaces'),
('Clean windows and doors', 'common_areas', 'weekly', 20, 'Use appropriate cleaning solution');

-- Insert default maintenance tasks
INSERT INTO maintenance_tasks (equipment_name, task_name, frequency, estimated_time_minutes, instructions) VALUES
('Barber Chairs', 'Check hydraulic systems', 'weekly', 15, 'Inspect for leaks and proper operation'),
('Clippers', 'Clean and oil blades', 'daily', 5, 'Disassemble, clean, and lubricate'),
('Sterilizer', 'Check water levels and function', 'daily', 5, 'Verify sterilization cycle completion'),
('Hair Dryer', 'Check cord and filter', 'weekly', 10, 'Inspect for damage and clean filter'),
('Cash Register', 'Test all functions', 'daily', 5, 'Verify drawer opens and printer works'),
('Air Conditioning', 'Check filters and temperature', 'weekly', 10, 'Clean filters if needed');

-- Insert default safety check items
INSERT INTO safety_check_items (item_name, category, check_type, frequency, instructions) VALUES
('Electrical outlets', 'electrical', 'visual', 'daily', 'Check for exposed wires or damage'),
('Fire extinguisher', 'fire_safety', 'visual', 'daily', 'Verify gauge is in green zone'),
('Emergency exit', 'fire_safety', 'functional', 'daily', 'Ensure doors open freely'),
('First aid kit', 'hygiene', 'visual', 'daily', 'Check contents and expiry dates'),
('Hand sanitizer stations', 'hygiene', 'functional', 'daily', 'Verify dispensers are filled'),
('Floor condition', 'safety', 'visual', 'daily', 'Check for wet spots or obstacles'),
('Temperature check', 'hygiene', 'measurement', 'daily', 'Room temperature should be 20-25°C'),
('Ventilation system', 'safety', 'functional', 'weekly', 'Ensure proper air circulation');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_daily_operations_updated_at BEFORE UPDATE ON daily_operations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_accountability_updated_at BEFORE UPDATE ON staff_accountability
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_inventory_updated_at BEFORE UPDATE ON equipment_inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supplies_inventory_updated_at BEFORE UPDATE ON supplies_inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incident_reports_updated_at BEFORE UPDATE ON incident_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
