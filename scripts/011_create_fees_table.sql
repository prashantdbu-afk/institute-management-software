-- Create fees table
create table if not exists public.fees (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id),
  batch_id uuid references public.batches(id),
  course_id uuid references public.courses(id),
  amount decimal(10,2) not null,
  payment_date date,
  payment_method text,
  status text not null default 'pending',
  due_date date,
  branch_id uuid references public.branches(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.fees enable row level security;

-- Everyone can read fees
create policy "fees_select_all"
  on public.fees for select
  using (true);

-- Authenticated users can manage fees
create policy "fees_insert_auth"
  on public.fees for insert
  with check (auth.uid() is not null);

create policy "fees_update_auth"
  on public.fees for update
  using (auth.uid() is not null);

create policy "fees_delete_auth"
  on public.fees for delete
  using (auth.uid() is not null);
