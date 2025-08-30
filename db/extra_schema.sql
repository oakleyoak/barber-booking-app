-- Extra schema provided by user (Aug 30, 2025)

create table public.bookings (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  customer_id uuid null,
  customer_name text not null,
  service text not null,
  price numeric(10, 2) not null,
  date date not null,
  time time without time zone not null,
  status text not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint bookings_pkey primary key (id),
  constraint bookings_customer_id_fkey foreign KEY (customer_id) references customers (id) on delete CASCADE,
  constraint bookings_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint bookings_status_check check (
    (
      status = any (
        array[
          'scheduled'::text,
          'completed'::text,
          'cancelled'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_bookings_user_id on public.bookings using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_bookings_date on public.bookings using btree (date) TABLESPACE pg_default;

create index IF not exists idx_bookings_status on public.bookings using btree (status) TABLESPACE pg_default;

create trigger update_bookings_updated_at BEFORE
update on bookings for EACH row
execute FUNCTION update_updated_at_column ();
 
create table public.cleaning_logs (
  id uuid not null default gen_random_uuid (),
  task_id uuid not null,
  barber_id uuid not null,
  completed_date date not null default CURRENT_DATE,
  completed_at timestamp with time zone null,
  notes text null,
  created_at timestamp with time zone null default now(),
  constraint cleaning_logs_pkey primary key (id),
  constraint cleaning_logs_task_id_barber_id_completed_date_key unique (task_id, barber_id, completed_date),
  constraint cleaning_logs_barber_id_fkey foreign KEY (barber_id) references users (id),
  constraint cleaning_logs_task_id_fkey foreign KEY (task_id) references cleaning_tasks (id)
) TABLESPACE pg_default;

 create table public.cleaning_tasks (
  id uuid not null default gen_random_uuid (),
  task_name character varying(255) not null,
  category character varying(100) not null,
  frequency character varying(50) not null,
  estimated_time_minutes integer null default 15,
  instructions text null,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  compliance_requirement boolean null default false,
  priority text null,
  estimated_time integer null,
  description text null,
  constraint cleaning_tasks_pkey primary key (id)
) TABLESPACE pg_default;

create table public.customers (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  name text not null,
  email text null,
  phone text null,
  last_visit date null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint customers_pkey primary key (id),
  constraint customers_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_customers_user_id on public.customers using btree (user_id) TABLESPACE pg_default;

create trigger update_customers_updated_at BEFORE
update on customers for EACH row
execute FUNCTION update_updated_at_column ();

create table public.daily_cleaning_log (
  id uuid not null default gen_random_uuid (),
  date date not null default CURRENT_DATE,
  barber_id uuid null,
  task_id uuid null,
  completed boolean null default false,
  completed_at timestamp with time zone null,
  notes text null,
  created_at timestamp with time zone null default now(),
  constraint daily_cleaning_log_pkey primary key (id),
  constraint daily_cleaning_log_date_barber_id_task_id_key unique (date, barber_id, task_id),
  constraint daily_cleaning_log_barber_id_fkey foreign KEY (barber_id) references auth.users (id),
  constraint daily_cleaning_log_task_id_fkey foreign KEY (task_id) references cleaning_tasks (id)
) TABLESPACE pg_default;

create index IF not exists idx_daily_cleaning_date on public.daily_cleaning_log using btree (date) TABLESPACE pg_default;

create table public.daily_operations (
  id uuid not null default gen_random_uuid (),
  date date not null default CURRENT_DATE,
  barber_id uuid null,
  shop_id uuid null,
  shift_start time without time zone null,
  shift_end time without time zone null,
  total_customers_served integer null default 0,
  total_revenue numeric(10, 2) null default 0,
  notes text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint daily_operations_pkey primary key (id),
  constraint daily_operations_date_barber_id_key unique (date, barber_id),
  constraint daily_operations_barber_id_fkey foreign KEY (barber_id) references auth.users (id)
) TABLESPACE pg_default;

create index IF not exists idx_daily_operations_date on public.daily_operations using btree (date) TABLESPACE pg_default;

create index IF not exists idx_daily_operations_barber on public.daily_operations using btree (barber_id) TABLESPACE pg_default;

create trigger update_daily_operations_updated_at BEFORE
update on daily_operations for EACH row
execute FUNCTION update_updated_at_column ();

 create table public.daily_safety_checks (
  id uuid not null default gen_random_uuid (),
  date date not null default CURRENT_DATE,
  barber_id uuid null,
  item_id uuid null,
  status character varying(20) not null,
  reading_value text null,
  notes text null,
  corrective_action text null,
  created_at timestamp with time zone null default now(),
  constraint daily_safety_checks_pkey primary key (id),
  constraint daily_safety_checks_date_item_id_key unique (date, item_id),
  constraint daily_safety_checks_barber_id_fkey foreign KEY (barber_id) references auth.users (id),
  constraint daily_safety_checks_item_id_fkey foreign KEY (item_id) references safety_check_items (id)
) TABLESPACE pg_default;

create index IF not exists idx_safety_checks_date on public.daily_safety_checks using btree (date) TABLESPACE pg_default;

create table public.equipment_inventory (
  id uuid not null default gen_random_uuid (),
  equipment_name character varying(255) not null,
  category character varying(100) not null,
  serial_number character varying(255) null,
  purchase_date date null,
  warranty_expiry date null,
  location character varying(255) null,
  condition_rating integer null,
  is_active boolean null default true,
  notes text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint equipment_inventory_pkey primary key (id),
  constraint equipment_inventory_condition_rating_check check (
    (
      (condition_rating >= 1)
      and (condition_rating <= 5)
    )
  )
) TABLESPACE pg_default;

create trigger update_equipment_inventory_updated_at BEFORE
update on equipment_inventory for EACH row
execute FUNCTION update_updated_at_column ();

 create table public.equipment_maintenance_log (
  id uuid not null default gen_random_uuid (),
  date date not null default CURRENT_DATE,
  barber_id uuid null,
  task_id uuid null,
  completed boolean null default false,
  completed_at timestamp with time zone null,
  next_due_date date null,
  notes text null,
  issues_found text null,
  created_at timestamp with time zone null default now(),
  constraint equipment_maintenance_log_pkey primary key (id),
  constraint equipment_maintenance_log_date_task_id_key unique (date, task_id),
  constraint equipment_maintenance_log_barber_id_fkey foreign KEY (barber_id) references auth.users (id),
  constraint equipment_maintenance_log_task_id_fkey foreign KEY (task_id) references maintenance_tasks (id)
) TABLESPACE pg_default;

create index IF not exists idx_equipment_maintenance_date on public.equipment_maintenance_log using btree (date) TABLESPACE pg_default;

create table public.expenses (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  category text not null,
  description text not null,
  amount numeric(10, 2) not null,
  date date not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint expenses_pkey primary key (id),
  constraint expenses_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_expenses_user_id on public.expenses using btree (user_id) TABLESPACE pg_default;


create table public.incident_reports (
  id uuid not null default gen_random_uuid (),
  date date not null default CURRENT_DATE,
  time time without time zone not null default CURRENT_TIME,
  reported_by uuid null,
  incident_type character varying(100) not null,
  severity character varying(20) not null,
  location character varying(255) null,
  description text not null,
  immediate_action_taken text null,
  witnesses text null,
  follow_up_required boolean null default false,
  follow_up_notes text null,
  resolved boolean null default false,
  resolved_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint incident_reports_pkey primary key (id),
  constraint incident_reports_reported_by_fkey foreign KEY (reported_by) references auth.users (id)
) TABLESPACE pg_default;

create index IF not exists idx_incident_reports_date on public.incident_reports using btree (date) TABLESPACE pg_default;

create trigger update_incident_reports_updated_at BEFORE
update on incident_reports for EACH row
execute FUNCTION update_updated_at_column ();

create table public.maintenance_logs (
  id uuid not null default gen_random_uuid (),
  task_id uuid not null,
  barber_id uuid not null,
  completed_date date not null default CURRENT_DATE,
  completed_at timestamp with time zone null,
  notes text null,
  created_at timestamp with time zone null default now(),
  constraint maintenance_logs_pkey primary key (id),
  constraint maintenance_logs_task_id_barber_id_completed_date_key unique (task_id, barber_id, completed_date),
  constraint maintenance_logs_barber_id_fkey foreign KEY (barber_id) references users (id),
  constraint maintenance_logs_task_id_fkey foreign KEY (task_id) references maintenance_tasks (id)
) TABLESPACE pg_default;

create table public.maintenance_tasks (
  id uuid not null default gen_random_uuid (),
  equipment_name character varying(255) not null,
  task_name character varying(255) not null,
  frequency character varying(50) not null,
  estimated_time_minutes integer null default 30,
  instructions text null,
  requires_specialist boolean null default false,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  constraint maintenance_tasks_pkey primary key (id)
) TABLESPACE pg_default;

create table public.payroll (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  staff_name text not null,
  period_start date not null,
  period_end date not null,
  base_salary numeric(10, 2) not null default 0,
  commission_earned numeric(10, 2) not null default 0,
  total_earnings numeric(10, 2) not null default 0,
  deductions numeric(10, 2) not null default 0,
  net_pay numeric(10, 2) not null default 0,
  status text not null default 'pending'::text,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint payroll_pkey primary key (id),
  constraint payroll_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint payroll_status_check check (
    (
      status = any (
        array['pending'::text, 'processed'::text, 'paid'::text]
      )
    )
  )
) TABLESPACE pg_default;

create table public.safety_check_items (
  id uuid not null default gen_random_uuid (),
  check_name character varying(255) not null,
  category character varying(100) not null,
  check_type character varying(50) not null,
  frequency character varying(50) not null,
  acceptable_range text null,
  instructions text null,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  description text null,
  compliance_requirement boolean null default false,
  constraint safety_check_items_pkey primary key (id)
) TABLESPACE pg_default;

create table public.safety_check_logs (
  id uuid not null default gen_random_uuid (),
  item_id uuid not null,
  barber_id uuid not null,
  check_date date not null default CURRENT_DATE,
  status character varying(20) not null,
  notes text null,
  created_at timestamp with time zone null default now(),
  constraint safety_check_logs_pkey primary key (id),
  constraint safety_check_logs_item_id_barber_id_check_date_key unique (item_id, barber_id, check_date),
  constraint safety_check_logs_barber_id_fkey foreign KEY (barber_id) references users (id),
  constraint safety_check_logs_item_id_fkey foreign KEY (item_id) references safety_check_items (id)
) TABLESPACE pg_default;

create table public.shop_settings (
  id uuid not null default gen_random_uuid (),
  shop_name text not null,
  daily_target numeric(10, 2) not null default 1500,
  weekly_target numeric(10, 2) not null default 9000,
  monthly_target numeric(10, 2) not null default 45000,
  barber_commission numeric(5, 2) not null default 60,
  apprentice_commission numeric(5, 2) not null default 40,
  social_insurance_rate numeric(5, 2) not null default 20,
  income_tax_rate numeric(5, 2) not null default 15,
  income_tax_threshold numeric(10, 2) not null default 3000,
  opening_time time without time zone not null default '09:00:00'::time without time zone,
  closing_time time without time zone not null default '20:00:00'::time without time zone,
  closed_days text[] not null default array['Thursday'::text, 'Sunday'::text],
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  manager_commission numeric(5, 2) null default 70,
  constraint shop_settings_pkey primary key (id),
  constraint shop_settings_shop_name_key unique (shop_name)
) TABLESPACE pg_default;

create table public.staff_accountability (
  id uuid not null default gen_random_uuid (),
  date date not null default CURRENT_DATE,
  barber_id uuid null,
  check_in_time time without time zone null,
  check_out_time time without time zone null,
  breaks_taken jsonb null,
  uniform_compliant boolean null default true,
  hygiene_compliant boolean null default true,
  behavior_rating integer null,
  performance_notes text null,
  issues_reported text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint staff_accountability_pkey primary key (id),
  constraint staff_accountability_date_barber_id_key unique (date, barber_id),
  constraint staff_accountability_barber_id_fkey foreign KEY (barber_id) references auth.users (id),
  constraint staff_accountability_behavior_rating_check check (
    (
      (behavior_rating >= 1)
      and (behavior_rating <= 5)
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_staff_accountability_date on public.staff_accountability using btree (date) TABLESPACE pg_default;

create trigger update_staff_accountability_updated_at BEFORE
update on staff_accountability for EACH row
execute FUNCTION update_updated_at_column ();

create table public.staff_targets (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  staff_name text not null,
  target_type text not null,
  target_amount numeric(10, 2) not null,
  period_start date not null,
  period_end date not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint staff_targets_pkey primary key (id),
  constraint staff_targets_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint staff_targets_target_type_check check (
    (
      target_type = any (
        array['daily'::text, 'weekly'::text, 'monthly'::text]
      )
    )
  )
) TABLESPACE pg_default;

create table public.supplies_inventory (
  id uuid not null default gen_random_uuid (),
  item_name character varying(255) not null,
  category character varying(100) not null,
  current_stock integer null default 0,
  minimum_stock integer null default 0,
  unit character varying(50) null default 'pieces'::character varying,
  supplier character varying(255) null,
  last_restocked date null,
  expiry_date date null,
  unit_cost numeric(10, 2) null,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint supplies_inventory_pkey primary key (id)
) TABLESPACE pg_default;

create trigger update_supplies_inventory_updated_at BEFORE
update on supplies_inventory for EACH row
execute FUNCTION update_updated_at_column ();

 create table public.transactions (
  id uuid not null default gen_random_uuid (),
  booking_id uuid null,
  user_id uuid not null,
  customer_name text not null,
  service text not null,
  amount numeric(10, 2) not null,
  commission numeric(5, 2) not null,
  commission_amount numeric(10, 2) not null,
  date date not null,
  status text not null default 'completed'::text,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint transactions_pkey primary key (id),
  constraint transactions_booking_id_fkey foreign KEY (booking_id) references bookings (id) on delete set null,
  constraint transactions_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_transactions_user_id on public.transactions using btree (user_id) TABLESPACE pg_default;

create table public.transactions (
  id uuid not null default gen_random_uuid (),
  booking_id uuid null,
  user_id uuid not null,
  customer_name text not null,
  service text not null,
  amount numeric(10, 2) not null,
  commission numeric(5, 2) not null,
  commission_amount numeric(10, 2) not null,
  date date not null,
  status text not null default 'completed'::text,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint transactions_pkey primary key (id),
  constraint transactions_booking_id_fkey foreign KEY (booking_id) references bookings (id) on delete set null,
  constraint transactions_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_transactions_user_id on public.transactions using btree (user_id) TABLESPACE pg_default;
