-- Create stock/inventory table
create table if not exists public.stock (
  id uuid primary key default gen_random_uuid(),
  item_name text not null,
  category text,
  quantity integer not null default 0,
  minimum_stock integer default 10,
  unit_price decimal(10,2),
  branch_id uuid references public.branches(id),
  last_updated timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

alter table public.stock enable row level security;

-- Everyone can read stock
create policy "stock_select_all"
  on public.stock for select
  using (true);

-- Authenticated users can manage stock
create policy "stock_insert_auth"
  on public.stock for insert
  with check (auth.uid() is not null);

create policy "stock_update_auth"
  on public.stock for update
  using (auth.uid() is not null);

create policy "stock_delete_auth"
  on public.stock for delete
  using (auth.uid() is not null);
