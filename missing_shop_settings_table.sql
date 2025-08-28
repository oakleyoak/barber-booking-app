-- Missing shop_settings table that your app needs
-- Add this to your Supabase database

create table public.shop_settings (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  shop_name text not null,
  opening_time time without time zone not null default '09:00'::time,
  closing_time time without time zone not null default '18:00'::time,
  sunday_opening_time time without time zone not null default '12:00'::time,
  sunday_closing_time time without time zone not null default '18:00'::time,
  closed_days text[] not null default '{}',
  daily_target numeric(10, 2) not null default 2000.00,
  weekly_target numeric(10, 2) not null default 14000.00,
  monthly_target numeric(10, 2) not null default 60000.00,
  default_commission_rate numeric(5, 2) not null default 50.00,
  barber_commission numeric(5, 2) not null default 50.00,
  apprentice_commission numeric(5, 2) not null default 30.00,
  social_insurance_rate numeric(5, 2) not null default 15.00,
  income_tax_rate numeric(5, 2) not null default 20.00,
  income_tax_threshold numeric(10, 2) not null default 5000.00,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint shop_settings_pkey primary key (id),
  constraint shop_settings_user_id_fkey foreign key (user_id) references users (id) on delete cascade,
  constraint shop_settings_user_id_key unique (user_id)
) tablespace pg_default;

create index if not exists idx_shop_settings_user_id on public.shop_settings using btree (user_id) tablespace pg_default;

create trigger update_shop_settings_updated_at before
update on shop_settings for each row
execute function update_updated_at_column ();
