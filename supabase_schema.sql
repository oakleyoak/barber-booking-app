-- Create users table (extends Supabase auth.users)
create table public.users (
  id uuid not null default auth.uid(),
  name text not null,
  email text not null,
  role text not null check (role in ('Owner', 'Barber', 'Apprentice')),
  shop_name text not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint users_pkey primary key (id),
  constraint users_email_key unique (email)
) TABLESPACE pg_default;

-- Create customers table
create table public.customers (
  id uuid not null default gen_random_uuid(),
  user_id uuid null,
  name text not null,
  email text null,
  phone text null,
  last_visit date null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint customers_pkey primary key (id),
  constraint customers_user_id_fkey foreign key (user_id) references users (id) on delete cascade
) TABLESPACE pg_default;

-- Create bookings table
create table public.bookings (
  id uuid not null default gen_random_uuid(),
  user_id uuid null,
  customer_id uuid null,
  customer_name text not null,
  service text not null,
  price numeric(10, 2) not null,
  date date not null,
  time time without time zone not null,
  status text not null default 'scheduled',
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint bookings_pkey primary key (id),
  constraint bookings_user_id_fkey foreign key (user_id) references users (id) on delete cascade,
  constraint bookings_customer_id_fkey foreign key (customer_id) references customers (id) on delete cascade,
  constraint bookings_status_check check (
    (status = any (array['scheduled'::text, 'completed'::text, 'cancelled'::text]))
  )
) TABLESPACE pg_default;

-- Create transactions table for earnings tracking
create table public.transactions (
  id uuid not null default gen_random_uuid(),
  booking_id uuid null,
  user_id uuid not null,
  customer_name text not null,
  service text not null,
  amount numeric(10, 2) not null,
  commission numeric(5, 2) not null,
  commission_amount numeric(10, 2) not null,
  date date not null,
  status text not null default 'completed',
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint transactions_pkey primary key (id),
  constraint transactions_user_id_fkey foreign key (user_id) references users (id) on delete cascade,
  constraint transactions_booking_id_fkey foreign key (booking_id) references bookings (id) on delete set null
) TABLESPACE pg_default;

-- Create shop_settings table
create table public.shop_settings (
  id uuid not null default gen_random_uuid(),
  shop_name text not null,
  daily_target numeric(10, 2) not null default 1500,
  weekly_target numeric(10, 2) not null default 9000,
  monthly_target numeric(10, 2) not null default 45000,
  barber_commission numeric(5, 2) not null default 60,
  apprentice_commission numeric(5, 2) not null default 40,
  social_insurance_rate numeric(5, 2) not null default 20,
  income_tax_rate numeric(5, 2) not null default 15,
  income_tax_threshold numeric(10, 2) not null default 3000,
  opening_time time without time zone not null default '09:00:00',
  closing_time time without time zone not null default '20:00:00',
  closed_days text[] not null default array['Thursday', 'Sunday'],
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint shop_settings_pkey primary key (id),
  constraint shop_settings_shop_name_key unique (shop_name)
) TABLESPACE pg_default;

-- Create expenses table
create table public.expenses (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  category text not null,
  description text not null,
  amount numeric(10, 2) not null,
  date date not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint expenses_pkey primary key (id),
  constraint expenses_user_id_fkey foreign key (user_id) references users (id) on delete cascade
) TABLESPACE pg_default;

-- Create payroll table
create table public.payroll (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  staff_name text not null,
  period_start date not null,
  period_end date not null,
  base_salary numeric(10, 2) not null default 0,
  commission_earned numeric(10, 2) not null default 0,
  total_earnings numeric(10, 2) not null default 0,
  deductions numeric(10, 2) not null default 0,
  net_pay numeric(10, 2) not null default 0,
  status text not null default 'pending',
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint payroll_pkey primary key (id),
  constraint payroll_user_id_fkey foreign key (user_id) references users (id) on delete cascade,
  constraint payroll_status_check check (
    (status = any (array['pending'::text, 'processed'::text, 'paid'::text]))
  )
) TABLESPACE pg_default;

-- Create staff_targets table
create table public.staff_targets (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  staff_name text not null,
  target_type text not null check (target_type in ('daily', 'weekly', 'monthly')),
  target_amount numeric(10, 2) not null,
  period_start date not null,
  period_end date not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint staff_targets_pkey primary key (id),
  constraint staff_targets_user_id_fkey foreign key (user_id) references users (id) on delete cascade
) TABLESPACE pg_default;

-- Create indexes for better performance
create index if not exists idx_bookings_user_id on public.bookings using btree (user_id) TABLESPACE pg_default;
create index if not exists idx_bookings_date on public.bookings using btree (date) TABLESPACE pg_default;
create index if not exists idx_bookings_status on public.bookings using btree (status) TABLESPACE pg_default;
create index if not exists idx_customers_user_id on public.customers using btree (user_id) TABLESPACE pg_default;
create index if not exists idx_transactions_user_id on public.transactions using btree (user_id) TABLESPACE pg_default;
create index if not exists idx_transactions_date on public.transactions using btree (date) TABLESPACE pg_default;
create index if not exists idx_expenses_user_id on public.expenses using btree (user_id) TABLESPACE pg_default;
create index if not exists idx_payroll_user_id on public.payroll using btree (user_id) TABLESPACE pg_default;
create index if not exists idx_staff_targets_user_id on public.staff_targets using btree (user_id) TABLESPACE pg_default;

-- Create triggers for updated_at columns
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_users_updated_at before update on users for each row execute function update_updated_at_column();
create trigger update_customers_updated_at before update on customers for each row execute function update_updated_at_column();
create trigger update_bookings_updated_at before update on bookings for each row execute function update_updated_at_column();
create trigger update_transactions_updated_at before update on transactions for each row execute function update_updated_at_column();
create trigger update_shop_settings_updated_at before update on shop_settings for each row execute function update_updated_at_column();
create trigger update_expenses_updated_at before update on expenses for each row execute function update_updated_at_column();
create trigger update_payroll_updated_at before update on payroll for each row execute function update_updated_at_column();
create trigger update_staff_targets_updated_at before update on staff_targets for each row execute function update_updated_at_column();

-- Enable Row Level Security (RLS)
alter table public.users enable row level security;
alter table public.customers enable row level security;
alter table public.bookings enable row level security;
alter table public.transactions enable row level security;
alter table public.shop_settings enable row level security;
alter table public.expenses enable row level security;
alter table public.payroll enable row level security;
alter table public.staff_targets enable row level security;

-- Create RLS policies
create policy "Users can view own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);

create policy "Users can view own customers" on public.customers for select using (auth.uid() = user_id);
create policy "Users can insert own customers" on public.customers for insert with check (auth.uid() = user_id);
create policy "Users can update own customers" on public.customers for update using (auth.uid() = user_id);
create policy "Users can delete own customers" on public.customers for delete using (auth.uid() = user_id);

create policy "Users can view own bookings" on public.bookings for select using (auth.uid() = user_id);
create policy "Users can insert own bookings" on public.bookings for insert with check (auth.uid() = user_id);
create policy "Users can update own bookings" on public.bookings for update using (auth.uid() = user_id);
create policy "Users can delete own bookings" on public.bookings for delete using (auth.uid() = user_id);

create policy "Users can view own transactions" on public.transactions for select using (auth.uid() = user_id);
create policy "Users can insert own transactions" on public.transactions for insert with check (auth.uid() = user_id);
create policy "Users can update own transactions" on public.transactions for update using (auth.uid() = user_id);
create policy "Users can delete own transactions" on public.transactions for delete using (auth.uid() = user_id);

create policy "Users can view shop settings" on public.shop_settings for select using (true);
create policy "Users can insert shop settings" on public.shop_settings for insert with check (true);
create policy "Users can update shop settings" on public.shop_settings for update using (true);

create policy "Users can view own expenses" on public.expenses for select using (auth.uid() = user_id);
create policy "Users can insert own expenses" on public.expenses for insert with check (auth.uid() = user_id);
create policy "Users can update own expenses" on public.expenses for update using (auth.uid() = user_id);
create policy "Users can delete own expenses" on public.expenses for delete using (auth.uid() = user_id);

create policy "Users can view own payroll" on public.payroll for select using (auth.uid() = user_id);
create policy "Users can insert own payroll" on public.payroll for insert with check (auth.uid() = user_id);
create policy "Users can update own payroll" on public.payroll for update using (auth.uid() = user_id);
create policy "Users can delete own payroll" on public.payroll for delete using (auth.uid() = user_id);

create policy "Users can view own staff targets" on public.staff_targets for select using (auth.uid() = user_id);
create policy "Users can insert own staff targets" on public.staff_targets for insert with check (auth.uid() = user_id);
create policy "Users can update own staff targets" on public.staff_targets for update using (auth.uid() = user_id);
create policy "Users can delete own staff targets" on public.staff_targets for delete using (auth.uid() = user_id);
