-- Create homework table
create table if not exists public.homework (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  course_id uuid references public.courses(id),
  batch_id uuid references public.batches(id),
  teacher_id uuid references public.profiles(id),
  assigned_date date default current_date,
  due_date date not null,
  branch_id uuid references public.branches(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.homework enable row level security;

-- Everyone can read homework
create policy "homework_select_all"
  on public.homework for select
  using (true);

-- Authenticated users can manage homework
create policy "homework_insert_auth"
  on public.homework for insert
  with check (auth.uid() is not null);

create policy "homework_update_auth"
  on public.homework for update
  using (auth.uid() is not null);

create policy "homework_delete_auth"
  on public.homework for delete
  using (auth.uid() is not null);
