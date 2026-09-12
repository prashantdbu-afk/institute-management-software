-- Create courses table
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  level text not null,
  duration_hours integer,
  instructor_id uuid references public.profiles(id),
  price decimal(10,2),
  branch_id uuid references public.branches(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.courses enable row level security;

-- Everyone can read courses
create policy "courses_select_all"
  on public.courses for select
  using (true);

-- Authenticated users can insert courses
create policy "courses_insert_auth"
  on public.courses for insert
  with check (auth.uid() is not null);

create policy "courses_update_auth"
  on public.courses for update
  using (auth.uid() is not null);

create policy "courses_delete_auth"
  on public.courses for delete
  using (auth.uid() is not null);
