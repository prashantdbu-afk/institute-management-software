-- Create users profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'student',
  full_name text,
  phone text,
  branch_id uuid,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;

-- Users can read their own profile
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can update their own profile
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Allow reading profiles for admin/managers (will be enhanced with RBAC)
create policy "profiles_select_admin"
  on public.profiles for select
  using (auth.uid() is not null);
