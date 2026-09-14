-- Phase 2B integrity safeguards for durable Course and Batch records.
-- Apply after 012_secure_auth_and_rls.sql.

begin;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public;
revoke all on function public.set_updated_at() from anon;
revoke all on function public.set_updated_at() from authenticated;

drop trigger if exists courses_set_updated_at on public.courses;
create trigger courses_set_updated_at
  before update on public.courses
  for each row execute function public.set_updated_at();

drop trigger if exists batches_set_updated_at on public.batches;
create trigger batches_set_updated_at
  before update on public.batches
  for each row execute function public.set_updated_at();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'courses_branch_required' and conrelid = 'public.courses'::regclass) then
    alter table public.courses add constraint courses_branch_required check (branch_id is not null) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'courses_name_required' and conrelid = 'public.courses'::regclass) then
    alter table public.courses add constraint courses_name_required check (length(trim(name)) > 0) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'courses_level_valid' and conrelid = 'public.courses'::regclass) then
    alter table public.courses add constraint courses_level_valid check (level in ('Beginner', 'Intermediate', 'Advanced')) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'courses_duration_nonnegative' and conrelid = 'public.courses'::regclass) then
    alter table public.courses add constraint courses_duration_nonnegative check (duration_hours is null or duration_hours >= 0) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'courses_price_nonnegative' and conrelid = 'public.courses'::regclass) then
    alter table public.courses add constraint courses_price_nonnegative check (price is null or price >= 0) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'batches_branch_required' and conrelid = 'public.batches'::regclass) then
    alter table public.batches add constraint batches_branch_required check (branch_id is not null) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'batches_name_required' and conrelid = 'public.batches'::regclass) then
    alter table public.batches add constraint batches_name_required check (length(trim(name)) > 0) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'batches_capacity_valid' and conrelid = 'public.batches'::regclass) then
    alter table public.batches add constraint batches_capacity_valid
      check (capacity is not null and current_enrollment is not null
        and capacity > 0 and current_enrollment >= 0 and current_enrollment <= capacity) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'batches_date_range_valid' and conrelid = 'public.batches'::regclass) then
    alter table public.batches add constraint batches_date_range_valid
      check (start_date is null or end_date is null or end_date >= start_date) not valid;
  end if;
end $$;

-- A composite key lets Postgres enforce that a Batch belongs to the same
-- branch as its Course. NULL legacy branches remain available for cleanup,
-- while the NOT VALID checks above prevent new NULL writes.
create unique index if not exists courses_id_branch_id_key
  on public.courses (id, branch_id);
create unique index if not exists profiles_id_branch_id_key
  on public.profiles (id, branch_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'batches_course_branch_fkey'
      and conrelid = 'public.batches'::regclass
  ) then
    alter table public.batches
      add constraint batches_course_branch_fkey
      foreign key (course_id, branch_id)
      references public.courses (id, branch_id)
      not valid;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'courses_instructor_branch_fkey'
      and conrelid = 'public.courses'::regclass
  ) then
    alter table public.courses
      add constraint courses_instructor_branch_fkey
      foreign key (instructor_id, branch_id)
      references public.profiles (id, branch_id)
      not valid;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'batches_teacher_branch_fkey'
      and conrelid = 'public.batches'::regclass
  ) then
    alter table public.batches
      add constraint batches_teacher_branch_fkey
      foreign key (teacher_id, branch_id)
      references public.profiles (id, branch_id)
      not valid;
  end if;
end $$;

commit;
