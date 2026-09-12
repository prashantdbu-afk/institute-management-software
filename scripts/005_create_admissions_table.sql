-- Create admissions table
create table if not exists public.admissions (
  id uuid primary key default gen_random_uuid(),
  student_name text not null,
  email text not null,
  phone text,
  dob date,
  address text,
  course_id uuid references public.courses(id),
  batch_id uuid references public.batches(id),
  branch_id uuid references public.branches(id),
  status text not null default 'pending',
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.admissions enable row level security;

-- Everyone can read admissions
create policy "admissions_select_all"
  on public.admissions for select
  using (true);

-- Authenticated users can manage admissions
create policy "admissions_insert_auth"
  on public.admissions for insert
  with check (auth.uid() is not null);

create policy "admissions_update_auth"
  on public.admissions for update
  using (auth.uid() is not null);

create policy "admissions_delete_auth"
  on public.admissions for delete
  using (auth.uid() is not null);
