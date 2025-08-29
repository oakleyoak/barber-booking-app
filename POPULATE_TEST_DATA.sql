-- ===================================================================
-- POPULATE TEST DATA FOR BARBER SHOP APP
-- Run this after the main setup to add some sample data for testing
-- ===================================================================

-- Insert sample cleaning tasks if none exist
INSERT INTO public.cleaning_tasks (task_name, description, category, frequency, estimated_time_minutes, instructions) VALUES
('Sweep and mop floors', 'Daily floor cleaning and sanitization', 'floors', 'daily', 15, 'Sweep all areas thoroughly, then mop with disinfectant solution'),
('Clean barber chairs', 'Sanitize and wipe down all barber chairs', 'equipment', 'daily', 10, 'Use disinfectant wipes on all surfaces, check hydraulics'),
('Sanitize tools and clippers', 'Clean and sterilize all cutting tools', 'equipment', 'daily', 20, 'Disassemble, clean, sterilize, and oil all tools after each use'),
('Clean mirrors and counters', 'Polish mirrors and sanitize work surfaces', 'common_areas', 'daily', 10, 'Use glass cleaner and microfiber cloth, disinfect counters'),
('Empty trash bins', 'Remove waste and replace liners', 'common_areas', 'daily', 5, 'Empty all bins, replace liners, sanitize bin edges'),
('Clean bathroom facilities', 'Complete bathroom sanitization', 'bathrooms', 'daily', 15, 'Clean sink, toilet, mirrors, and floors with appropriate cleaners'),
('Dust shelves and displays', 'Remove dust from all surfaces and products', 'common_areas', 'weekly', 10, 'Use microfiber cloth to dust all shelves, product displays'),
('Deep clean equipment', 'Thorough cleaning of all barber equipment', 'equipment', 'weekly', 30, 'Complete disassembly and deep cleaning of clippers, trimmers, etc.')
ON CONFLICT DO NOTHING;

-- Insert sample maintenance tasks if none exist
INSERT INTO public.maintenance_tasks (equipment_name, task_name, frequency, estimated_time_minutes, instructions, requires_specialist) VALUES
('Barber Chairs', 'Check hydraulic systems and moving parts', 'weekly', 15, 'Inspect for leaks, test up/down movement, lubricate if needed', false),
('Clippers and Trimmers', 'Clean, oil, and check blade sharpness', 'daily', 5, 'Disassemble, clean thoroughly, oil blades, check for sharpness', false),
('Sterilizer/Autoclave', 'Check water levels and sterilization cycles', 'daily', 5, 'Verify water level, test cycle completion, clean chamber', false),
('Hair Dryers', 'Check cords, filters, and airflow', 'weekly', 10, 'Inspect power cords for damage, clean air filters, test airflow', false),
('Cash Register/POS', 'Test all functions and printer', 'daily', 5, 'Verify drawer operation, test card reader, check receipt printer', false),
('Air Conditioning', 'Check filters and temperature control', 'weekly', 10, 'Replace/clean air filters, verify temperature settings', false),
('Lighting System', 'Check all bulbs and fixtures', 'monthly', 20, 'Replace burnt bulbs, clean fixtures, check electrical connections', true),
('Plumbing', 'Check sinks, faucets, and drainage', 'weekly', 15, 'Test water pressure, check for leaks, ensure proper drainage', false)
ON CONFLICT DO NOTHING;

-- Insert sample safety check items if none exist
INSERT INTO public.safety_check_items (check_name, description, frequency, compliance_requirement, instructions) VALUES
('Electrical outlets and cords', 'Visual inspection of electrical safety', 'daily', true, 'Check all outlets for damage, inspect cords for fraying or exposed wires'),
('Fire extinguisher', 'Fire safety equipment check', 'daily', true, 'Verify pressure gauge is in green zone, check accessibility'),
('Emergency exits', 'Ensure safe evacuation routes', 'daily', true, 'Verify all emergency exits are clear and doors open freely'),
('First aid kit', 'Medical emergency preparedness', 'daily', true, 'Check contents completeness and expiry dates of supplies'),
('Hand sanitizer stations', 'Hygiene compliance check', 'daily', true, 'Ensure dispensers are filled and functioning properly'),
('Floor conditions', 'Slip and fall prevention', 'daily', true, 'Check for wet spots, obstacles, or uneven surfaces'),
('Tool sterilization', 'Infection control compliance', 'daily', true, 'Verify sterilizer is working and tools are properly cleaned'),
('Ventilation system', 'Air quality and circulation', 'weekly', false, 'Check air circulation and filter cleanliness')
ON CONFLICT DO NOTHING;

-- Insert sample supplies inventory if none exist
INSERT INTO public.supplies_inventory (item_name, category, current_stock, minimum_stock, unit, supplier, unit_cost) VALUES
('Disposable razors', 'consumables', 50, 20, 'pieces', 'Barber Supply Co', 2.50),
('Shaving cream', 'consumables', 12, 5, 'tubes', 'Professional Products Ltd', 8.99),
('Hair gel', 'consumables', 8, 3, 'bottles', 'Style Masters Inc', 12.50),
('Towels (small)', 'linens', 25, 10, 'pieces', 'Textile Warehouse', 15.00),
('Towels (large)', 'linens', 15, 8, 'pieces', 'Textile Warehouse', 22.00),
('Disinfectant spray', 'cleaning', 6, 3, 'bottles', 'Clean Pro Supplies', 9.75),
('Paper towels', 'disposables', 20, 8, 'rolls', 'Office Depot', 3.25),
('Clipper oil', 'maintenance', 4, 2, 'bottles', 'Equipment Care Ltd', 6.50),
('Blade wash', 'cleaning', 3, 2, 'bottles', 'Barber Supply Co', 11.00),
('Neck strips', 'disposables', 500, 100, 'pieces', 'Hygiene Products Inc', 0.05)
ON CONFLICT DO NOTHING;

-- Insert sample equipment inventory if none exist
INSERT INTO public.equipment_inventory (equipment_name, category, serial_number, purchase_date, warranty_expiry, location, condition_rating, current_value) VALUES
('Wahl Professional Clipper #1', 'clippers', 'WHL2024001', '2024-01-15', '2025-01-15', 'Station 1', 5, 150.00),
('Wahl Professional Clipper #2', 'clippers', 'WHL2024002', '2024-01-15', '2025-01-15', 'Station 2', 5, 150.00),
('Andis T-Outliner Trimmer #1', 'trimmers', 'AND2024001', '2024-02-10', '2025-02-10', 'Station 1', 4, 120.00),
('Andis T-Outliner Trimmer #2', 'trimmers', 'AND2024002', '2024-02-10', '2025-02-10', 'Station 2', 4, 120.00),
('Hydraulic Barber Chair #1', 'furniture', 'HBC2023001', '2023-06-20', '2026-06-20', 'Station 1', 4, 800.00),
('Hydraulic Barber Chair #2', 'furniture', 'HBC2023002', '2023-06-20', '2026-06-20', 'Station 2', 4, 800.00),
('Professional Hair Dryer', 'appliances', 'PHD2024001', '2024-03-05', '2025-03-05', 'Styling area', 5, 200.00),
('UV Sterilizer Cabinet', 'sterilization', 'UVS2023001', '2023-08-12', '2025-08-12', 'Back room', 5, 300.00)
ON CONFLICT DO NOTHING;

-- Insert a sample customer for testing
INSERT INTO public.customers (name, email, phone, preferred_barber, notes) VALUES
('John Smith', 'john.smith@email.com', '+90 555 123 4567', 'Okan', 'Regular customer, prefers short cuts'),
('Ahmed Demir', 'ahmed.demir@email.com', '+90 555 987 6543', 'İsmail Hassan Azimkar', 'Comes monthly, likes beard trimming'),
('Michael Johnson', 'michael.j@email.com', '+90 555 456 7890', 'Okan', 'New customer, referred by friend')
ON CONFLICT DO NOTHING;

-- Insert sample bookings for this week
INSERT INTO public.bookings (user_id, customer_name, service, price, date, time, status, notes) VALUES
((SELECT id FROM public.users WHERE email = 'omustafa2@googlemail.com'), 'John Smith', 'Haircut & Beard Trim', 80.00, CURRENT_DATE, '10:00', 'completed', 'Regular service'),
((SELECT id FROM public.users WHERE email = 'ismailhmahmut@googlemail.com'), 'Ahmed Demir', 'Haircut', 50.00, CURRENT_DATE, '11:30', 'completed', 'Monthly cut'),
((SELECT id FROM public.users WHERE email = 'omustafa2@googlemail.com'), 'Michael Johnson', 'Full Service', 120.00, CURRENT_DATE + 1, '14:00', 'scheduled', 'First time customer'),
((SELECT id FROM public.users WHERE email = 'ismailhmahmut@googlemail.com'), 'John Smith', 'Beard Trim', 30.00, CURRENT_DATE + 2, '09:30', 'scheduled', 'Quick trim')
ON CONFLICT DO NOTHING;

-- Insert corresponding transactions for completed bookings
INSERT INTO public.transactions (
  booking_id, 
  user_id, 
  customer_name, 
  service, 
  amount, 
  commission, 
  commission_amount, 
  date, 
  status
) 
SELECT 
  b.id,
  b.user_id,
  b.customer_name,
  b.service,
  b.price,
  CASE 
    WHEN u.role = 'Owner' THEN 100.00
    ELSE COALESCE(u.commission_rate * 100, 40.00)
  END,
  CASE 
    WHEN u.role = 'Owner' THEN b.price
    ELSE b.price * COALESCE(u.commission_rate, 0.40)
  END,
  b.date,
  'completed'
FROM public.bookings b
JOIN public.users u ON b.user_id = u.id
WHERE b.status = 'completed'
AND NOT EXISTS (
  SELECT 1 FROM public.transactions t 
  WHERE t.booking_id = b.id
);

-- Insert sample expenses
INSERT INTO public.expenses (user_id, category, description, amount, date) VALUES
((SELECT id FROM public.users WHERE role = 'Owner' LIMIT 1), 'Supplies', 'Monthly supply restock', 250.00, CURRENT_DATE - 5),
((SELECT id FROM public.users WHERE role = 'Owner' LIMIT 1), 'Utilities', 'Electricity bill', 180.00, CURRENT_DATE - 10),
((SELECT id FROM public.users WHERE role = 'Owner' LIMIT 1), 'Maintenance', 'Clipper blade sharpening', 45.00, CURRENT_DATE - 3),
((SELECT id FROM public.users WHERE role = 'Owner' LIMIT 1), 'Rent', 'Monthly shop rent', 2000.00, CURRENT_DATE - 1)
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'Test data populated successfully! You can now test all app features.' as status;
