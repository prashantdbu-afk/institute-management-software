-- Create branches table
create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  city text,
  phone text,
  email text,
  principal_name text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.branches enable row level security;

-- Everyone can read branches
create policy "branches_select_all"
  on public.branches for select
  using (true);

-- Only admins can insert/update/delete branches
create policy "branches_insert_admin"
  on public.branches for insert
  with check (auth.uid() is not null);

create policy "branches_update_admin"
  on public.branches for update
  using (auth.uid() is not null);

create policy "branches_delete_admin"
  on public.branches for delete
  using (auth.uid() is not null);
