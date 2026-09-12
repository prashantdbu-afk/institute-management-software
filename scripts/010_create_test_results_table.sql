-- Create test results table
create table if not exists public.test_results (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id),
  course_id uuid references public.courses(id),
  test_name text not null,
  subject text,
  marks_obtained decimal(5,2),
  total_marks decimal(5,2) default 100,
  percentage decimal(5,2),
  grade text,
  test_date date default current_date,
  branch_id uuid references public.branches(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.test_results enable row level security;

-- Everyone can read test results
create policy "test_results_select_all"
  on public.test_results for select
  using (true);

-- Authenticated users can manage test results
create policy "test_results_insert_auth"
  on public.test_results for insert
  with check (auth.uid() is not null);

create policy "test_results_update_auth"
  on public.test_results for update
  using (auth.uid() is not null);

create policy "test_results_delete_auth"
  on public.test_results for delete
  using (auth.uid() is not null);
