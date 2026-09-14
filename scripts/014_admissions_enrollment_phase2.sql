-- Phase 2C durable Admissions and Student Enrollment foundation.
-- Apply after 012_secure_auth_and_rls.sql and 013_courses_batches_phase2.sql.

begin;

alter table public.admissions add column if not exists parent_name text;
alter table public.admissions add column if not exists enrollment_date date;

create table if not exists public.student_enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.profiles(id),
  admission_id uuid not null unique references public.admissions(id),
  branch_id uuid not null references public.branches(id),
  course_id uuid not null references public.courses(id),
  batch_id uuid not null references public.batches(id),
  status text not null default 'active',
  enrollment_date date not null default current_date,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.student_enrollments enable row level security;

create index if not exists student_enrollments_branch_id_idx on public.student_enrollments (branch_id);
create index if not exists student_enrollments_student_id_idx on public.student_enrollments (student_id);
create index if not exists student_enrollments_course_batch_idx on public.student_enrollments (course_id, batch_id);

create unique index if not exists batches_id_course_id_branch_id_key
  on public.batches (id, course_id, branch_id);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'admissions_branch_required' and conrelid = 'public.admissions'::regclass) then
    alter table public.admissions add constraint admissions_branch_required check (branch_id is not null) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'admissions_course_required' and conrelid = 'public.admissions'::regclass) then
    alter table public.admissions add constraint admissions_course_required check (course_id is not null) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'admissions_batch_required' and conrelid = 'public.admissions'::regclass) then
    alter table public.admissions add constraint admissions_batch_required check (batch_id is not null) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'admissions_name_required' and conrelid = 'public.admissions'::regclass) then
    alter table public.admissions add constraint admissions_name_required check (length(trim(student_name)) > 0) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'admissions_email_required' and conrelid = 'public.admissions'::regclass) then
    alter table public.admissions add constraint admissions_email_required check (length(trim(email)) > 0) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'admissions_status_valid' and conrelid = 'public.admissions'::regclass) then
    alter table public.admissions add constraint admissions_status_valid check (status in ('pending', 'approved', 'rejected')) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'admissions_enrollment_date_valid' and conrelid = 'public.admissions'::regclass) then
    alter table public.admissions add constraint admissions_enrollment_date_valid
      check ((status = 'approved' and enrollment_date is not null) or (status <> 'approved' and enrollment_date is null)) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'admissions_course_branch_fkey' and conrelid = 'public.admissions'::regclass) then
    alter table public.admissions add constraint admissions_course_branch_fkey
      foreign key (course_id, branch_id) references public.courses (id, branch_id) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'admissions_batch_course_branch_fkey' and conrelid = 'public.admissions'::regclass) then
    alter table public.admissions add constraint admissions_batch_course_branch_fkey
      foreign key (batch_id, course_id, branch_id) references public.batches (id, course_id, branch_id) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'student_enrollments_status_valid' and conrelid = 'public.student_enrollments'::regclass) then
    alter table public.student_enrollments add constraint student_enrollments_status_valid
      check (status in ('active', 'inactive', 'completed', 'cancelled'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'student_enrollments_course_branch_fkey' and conrelid = 'public.student_enrollments'::regclass) then
    alter table public.student_enrollments add constraint student_enrollments_course_branch_fkey
      foreign key (course_id, branch_id) references public.courses (id, branch_id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'student_enrollments_batch_course_branch_fkey' and conrelid = 'public.student_enrollments'::regclass) then
    alter table public.student_enrollments add constraint student_enrollments_batch_course_branch_fkey
      foreign key (batch_id, course_id, branch_id) references public.batches (id, course_id, branch_id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'student_enrollments_student_branch_fkey' and conrelid = 'public.student_enrollments'::regclass) then
    alter table public.student_enrollments add constraint student_enrollments_student_branch_fkey
      foreign key (student_id, branch_id) references public.profiles (id, branch_id);
  end if;
end $$;

drop trigger if exists admissions_set_updated_at on public.admissions;
create trigger admissions_set_updated_at before update on public.admissions
  for each row execute function public.set_updated_at();
drop trigger if exists student_enrollments_set_updated_at on public.student_enrollments;
create trigger student_enrollments_set_updated_at before update on public.student_enrollments
  for each row execute function public.set_updated_at();

drop policy if exists student_enrollments_select_scoped on public.student_enrollments;
drop policy if exists student_enrollments_manage_scoped on public.student_enrollments;
revoke all on public.student_enrollments from anon;
revoke all on public.student_enrollments from public;
grant select, insert, update, delete on public.student_enrollments to authenticated;

create policy student_enrollments_select_scoped on public.student_enrollments for select to authenticated
using (
  public.is_admin()
  or (public.current_user_role() = 'branch_manager' and branch_id = public.current_user_branch_id())
);
create policy student_enrollments_manage_scoped on public.student_enrollments for all to authenticated
using (public.is_admin() or (public.current_user_role() = 'branch_manager' and branch_id = public.current_user_branch_id()))
with check (public.is_admin() or (public.current_user_role() = 'branch_manager' and branch_id = public.current_user_branch_id()));

create or replace function public.approve_admission(p_admission_id uuid)
returns public.student_enrollments
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_admission public.admissions;
  v_enrollment public.student_enrollments;
  v_student_id uuid;
begin
  select * into v_admission from public.admissions where id = p_admission_id for update;
  if not found then raise exception 'Admission not found' using errcode = 'P0002'; end if;
  if v_admission.status = 'rejected' then raise exception 'Rejected admissions cannot be approved' using errcode = '23514'; end if;

  select id into v_student_id from public.profiles
  where lower(email) = lower(v_admission.email)
    and role = 'student'
    and branch_id = v_admission.branch_id
  order by created_at limit 1;

  update public.admissions
  set status = 'approved', enrollment_date = coalesce(enrollment_date, current_date)
  where id = p_admission_id
  returning * into v_admission;

  insert into public.student_enrollments
    (student_id, admission_id, branch_id, course_id, batch_id, status, enrollment_date)
  values
    (v_student_id, v_admission.id, v_admission.branch_id, v_admission.course_id,
     v_admission.batch_id, 'active', v_admission.enrollment_date)
  on conflict (admission_id) do nothing;

  select * into v_enrollment from public.student_enrollments where admission_id = p_admission_id;
  return v_enrollment;
end;
$$;

create or replace function public.reject_admission(p_admission_id uuid)
returns public.admissions
language plpgsql
security invoker
set search_path = ''
as $$
declare v_admission public.admissions;
begin
  select * into v_admission from public.admissions where id = p_admission_id for update;
  if not found then raise exception 'Admission not found' using errcode = 'P0002'; end if;
  if exists (select 1 from public.student_enrollments where admission_id = p_admission_id) then
    raise exception 'An enrolled admission cannot be rejected' using errcode = '23503';
  end if;
  update public.admissions set status = 'rejected', enrollment_date = null
  where id = p_admission_id returning * into v_admission;
  return v_admission;
end;
$$;

revoke all on function public.approve_admission(uuid) from public;
revoke all on function public.reject_admission(uuid) from public;
grant execute on function public.approve_admission(uuid) to authenticated;
grant execute on function public.reject_admission(uuid) to authenticated;

commit;
