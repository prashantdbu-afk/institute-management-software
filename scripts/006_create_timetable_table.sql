-- Create timetable table
create table if not exists public.timetable (
  id uuid primary key default gen_random_uuid(),
  day_of_week text not null,
  start_time time not null,
  end_time time not null,
  course_id uuid references public.courses(id),
  batch_id uuid references public.batches(id),
  teacher_id uuid references public.profiles(id),
  room_number text,
  branch_id uuid references public.branches(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.timetable enable row level security;

-- Everyone can read timetable
create policy "timetable_select_all"
  on public.timetable for select
  using (true);

-- Authenticated users can manage timetable
create policy "timetable_insert_auth"
  on public.timetable for insert
  with check (auth.uid() is not null);

create policy "timetable_update_auth"
  on public.timetable for update
  using (auth.uid() is not null);

create policy "timetable_delete_auth"
  on public.timetable for delete
  using (auth.uid() is not null);
