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
