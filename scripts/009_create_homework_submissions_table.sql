-- Create homework submissions table
create table if not exists public.homework_submissions (
  id uuid primary key default gen_random_uuid(),
  homework_id uuid not null references public.homework(id) on delete cascade,
  student_id uuid not null references public.profiles(id),
  submitted_date date,
  status text not null default 'pending',
  marks integer,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.homework_submissions enable row level security;

-- Everyone can read submissions
create policy "submissions_select_all"
  on public.homework_submissions for select
  using (true);

-- Authenticated users can manage submissions
create policy "submissions_insert_auth"
  on public.homework_submissions for insert
  with check (auth.uid() is not null);

create policy "submissions_update_auth"
  on public.homework_submissions for update
  using (auth.uid() is not null);

create policy "submissions_delete_auth"
  on public.homework_submissions for delete
  using (auth.uid() is not null);
