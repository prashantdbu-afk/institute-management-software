-- Create batches table
create table if not exists public.batches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  course_id uuid not null references public.courses(id),
  start_date date,
  end_date date,
  teacher_id uuid references public.profiles(id),
  capacity integer default 30,
  current_enrollment integer default 0,
  branch_id uuid references public.branches(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.batches enable row level security;

-- Everyone can read batches
create policy "batches_select_all"
  on public.batches for select
  using (true);

-- Authenticated users can manage batches
create policy "batches_insert_auth"
  on public.batches for insert
  with check (auth.uid() is not null);

create policy "batches_update_auth"
  on public.batches for update
  using (auth.uid() is not null);

create policy "batches_delete_auth"
  on public.batches for delete
  using (auth.uid() is not null);
