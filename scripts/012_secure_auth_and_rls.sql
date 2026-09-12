-- Phase 1 security baseline. Apply after 001-011.
-- profiles is the authoritative source for roles and branch assignments.

begin;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_branch_id_fkey'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_branch_id_fkey
      foreign key (branch_id) references public.branches(id) not valid;
  end if;
end $$;

alter table public.profiles
  drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('admin', 'branch_manager', 'teacher', 'student')) not valid;

alter table public.profiles enable row level security;
alter table public.branches enable row level security;
alter table public.courses enable row level security;
alter table public.batches enable row level security;
alter table public.admissions enable row level security;
alter table public.timetable enable row level security;
alter table public.stock enable row level security;
alter table public.homework enable row level security;
alter table public.homework_submissions enable row level security;
alter table public.test_results enable row level security;
alter table public.fees enable row level security;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_user_branch_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select branch_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_user_role() = 'admin', false);
$$;

revoke all on function public.current_user_role() from public;
revoke all on function public.current_user_branch_id() from public;
revoke all on function public.is_admin() from public;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.current_user_branch_id() to authenticated;
grant execute on function public.is_admin() to authenticated;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, role, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    'student',
    nullif(trim(concat_ws(' ', new.raw_user_meta_data ->> 'first_name', new.raw_user_meta_data ->> 'last_name')), '')
  );
  return new;
end;
$$;

revoke all on function public.handle_new_auth_user() from public;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Backfill missing profiles at the lowest privilege. Existing profile roles are
-- preserved; elevated access for users without a profile must be assigned manually.
insert into public.profiles (id, email, role, full_name)
select
  u.id,
  coalesce(u.email, ''),
  'student',
  nullif(trim(concat_ws(' ', u.raw_user_meta_data ->> 'first_name', u.raw_user_meta_data ->> 'last_name')), '')
from auth.users u
on conflict (id) do nothing;

-- Remove all policies shipped by 001-011 before installing the secure baseline.
drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_select_admin on public.profiles;
drop policy if exists branches_select_all on public.branches;
drop policy if exists branches_insert_admin on public.branches;
drop policy if exists branches_update_admin on public.branches;
drop policy if exists branches_delete_admin on public.branches;
drop policy if exists courses_select_all on public.courses;
drop policy if exists courses_insert_auth on public.courses;
drop policy if exists courses_update_auth on public.courses;
drop policy if exists courses_delete_auth on public.courses;
drop policy if exists batches_select_all on public.batches;
drop policy if exists batches_insert_auth on public.batches;
drop policy if exists batches_update_auth on public.batches;
drop policy if exists batches_delete_auth on public.batches;
drop policy if exists admissions_select_all on public.admissions;
drop policy if exists admissions_insert_auth on public.admissions;
drop policy if exists admissions_update_auth on public.admissions;
drop policy if exists admissions_delete_auth on public.admissions;
drop policy if exists timetable_select_all on public.timetable;
drop policy if exists timetable_insert_auth on public.timetable;
drop policy if exists timetable_update_auth on public.timetable;
drop policy if exists timetable_delete_auth on public.timetable;
drop policy if exists stock_select_all on public.stock;
drop policy if exists stock_insert_auth on public.stock;
drop policy if exists stock_update_auth on public.stock;
drop policy if exists stock_delete_auth on public.stock;
drop policy if exists homework_select_all on public.homework;
drop policy if exists homework_insert_auth on public.homework;
drop policy if exists homework_update_auth on public.homework;
drop policy if exists homework_delete_auth on public.homework;
drop policy if exists submissions_select_all on public.homework_submissions;
drop policy if exists submissions_insert_auth on public.homework_submissions;
drop policy if exists submissions_update_auth on public.homework_submissions;
drop policy if exists submissions_delete_auth on public.homework_submissions;
drop policy if exists test_results_select_all on public.test_results;
drop policy if exists test_results_insert_auth on public.test_results;
drop policy if exists test_results_update_auth on public.test_results;
drop policy if exists test_results_delete_auth on public.test_results;
drop policy if exists fees_select_all on public.fees;
drop policy if exists fees_insert_auth on public.fees;
drop policy if exists fees_update_auth on public.fees;
drop policy if exists fees_delete_auth on public.fees;

-- Phase 1 policy names are also dropped so this migration is safely repeatable.
drop policy if exists profiles_select_authorized on public.profiles;
drop policy if exists profiles_update_own_safe_fields on public.profiles;
drop policy if exists branches_select_scoped on public.branches;
drop policy if exists branches_admin_insert on public.branches;
drop policy if exists branches_admin_update on public.branches;
drop policy if exists branches_admin_delete on public.branches;
drop policy if exists courses_select_scoped on public.courses;
drop policy if exists courses_manage_scoped on public.courses;
drop policy if exists batches_select_scoped on public.batches;
drop policy if exists batches_manage_scoped on public.batches;
drop policy if exists admissions_management_select on public.admissions;
drop policy if exists admissions_management_write on public.admissions;
drop policy if exists timetable_select_scoped on public.timetable;
drop policy if exists timetable_management_write on public.timetable;
drop policy if exists stock_management_select on public.stock;
drop policy if exists stock_management_write on public.stock;
drop policy if exists homework_select_scoped on public.homework;
drop policy if exists homework_management_write on public.homework;
drop policy if exists submissions_select_scoped on public.homework_submissions;
drop policy if exists submissions_student_insert on public.homework_submissions;
drop policy if exists submissions_staff_update on public.homework_submissions;
drop policy if exists submissions_admin_delete on public.homework_submissions;
drop policy if exists test_results_select_scoped on public.test_results;
drop policy if exists test_results_staff_write on public.test_results;
drop policy if exists fees_select_scoped on public.fees;
drop policy if exists fees_management_write on public.fees;

revoke all on public.profiles, public.branches, public.courses, public.batches,
  public.admissions, public.timetable, public.stock, public.homework,
  public.homework_submissions, public.test_results, public.fees from anon;
revoke all on public.profiles, public.branches, public.courses, public.batches,
  public.admissions, public.timetable, public.stock, public.homework,
  public.homework_submissions, public.test_results, public.fees from public;
revoke update on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

create policy profiles_select_authorized on public.profiles for select to authenticated
using (
  id = auth.uid()
  or public.is_admin()
  or (
    public.current_user_role() = 'branch_manager'
    and branch_id = public.current_user_branch_id()
  )
);

create policy profiles_update_own_safe_fields on public.profiles for update to authenticated
using (id = auth.uid())
with check (
  id = auth.uid()
  and role = public.current_user_role()
  and branch_id is not distinct from public.current_user_branch_id()
);

grant select, insert, update, delete on public.branches, public.courses, public.batches,
  public.admissions, public.timetable, public.stock, public.homework,
  public.homework_submissions, public.test_results, public.fees to authenticated;

create policy branches_select_scoped on public.branches for select to authenticated
using (public.is_admin() or id = public.current_user_branch_id());
create policy branches_admin_insert on public.branches for insert to authenticated with check (public.is_admin());
create policy branches_admin_update on public.branches for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy branches_admin_delete on public.branches for delete to authenticated using (public.is_admin());

create policy courses_select_scoped on public.courses for select to authenticated
using (
  public.is_admin()
  or (public.current_user_role() = 'branch_manager' and branch_id = public.current_user_branch_id())
  or (public.current_user_role() = 'teacher' and instructor_id = auth.uid() and branch_id = public.current_user_branch_id())
);
create policy courses_manage_scoped on public.courses for all to authenticated
using (public.is_admin() or (public.current_user_role() = 'branch_manager' and branch_id = public.current_user_branch_id()))
with check (public.is_admin() or (public.current_user_role() = 'branch_manager' and branch_id = public.current_user_branch_id()));

create policy batches_select_scoped on public.batches for select to authenticated
using (
  public.is_admin()
  or (public.current_user_role() = 'branch_manager' and branch_id = public.current_user_branch_id())
  or (public.current_user_role() = 'teacher' and teacher_id = auth.uid() and branch_id = public.current_user_branch_id())
);
create policy batches_manage_scoped on public.batches for all to authenticated
using (public.is_admin() or (public.current_user_role() = 'branch_manager' and branch_id = public.current_user_branch_id()))
with check (public.is_admin() or (public.current_user_role() = 'branch_manager' and branch_id = public.current_user_branch_id()));

-- Admissions do not yet link to auth.users. Student/teacher access is denied until
-- Phase 2 adds an ownership/enrollment relationship.
create policy admissions_management_select on public.admissions for select to authenticated
using (public.is_admin() or (public.current_user_role() = 'branch_manager' and branch_id = public.current_user_branch_id()));
create policy admissions_management_write on public.admissions for all to authenticated
using (public.is_admin() or (public.current_user_role() = 'branch_manager' and branch_id = public.current_user_branch_id()))
with check (public.is_admin() or (public.current_user_role() = 'branch_manager' and branch_id = public.current_user_branch_id()));

create policy timetable_select_scoped on public.timetable for select to authenticated
using (
  public.is_admin()
  or (public.current_user_role() = 'branch_manager' and branch_id = public.current_user_branch_id())
  or (public.current_user_role() = 'teacher' and teacher_id = auth.uid() and branch_id = public.current_user_branch_id())
);
create policy timetable_management_write on public.timetable for all to authenticated
using (public.is_admin() or (public.current_user_role() = 'branch_manager' and branch_id = public.current_user_branch_id()) or teacher_id = auth.uid())
with check (public.is_admin() or (public.current_user_role() = 'branch_manager' and branch_id = public.current_user_branch_id()) or (teacher_id = auth.uid() and branch_id = public.current_user_branch_id()));

create policy stock_management_select on public.stock for select to authenticated
using (public.is_admin() or (public.current_user_role() = 'branch_manager' and branch_id = public.current_user_branch_id()));
create policy stock_management_write on public.stock for all to authenticated
using (public.is_admin() or (public.current_user_role() = 'branch_manager' and branch_id = public.current_user_branch_id()))
with check (public.is_admin() or (public.current_user_role() = 'branch_manager' and branch_id = public.current_user_branch_id()));

create policy homework_select_scoped on public.homework for select to authenticated
using (
  public.is_admin()
  or (public.current_user_role() = 'branch_manager' and branch_id = public.current_user_branch_id())
  or (public.current_user_role() = 'teacher' and teacher_id = auth.uid() and branch_id = public.current_user_branch_id())
);
create policy homework_management_write on public.homework for all to authenticated
using (public.is_admin() or (public.current_user_role() = 'branch_manager' and branch_id = public.current_user_branch_id()) or teacher_id = auth.uid())
with check (public.is_admin() or (public.current_user_role() = 'branch_manager' and branch_id = public.current_user_branch_id()) or (teacher_id = auth.uid() and branch_id = public.current_user_branch_id()));

create policy submissions_select_scoped on public.homework_submissions for select to authenticated
using (
  public.is_admin()
  or student_id = auth.uid()
  or exists (
    select 1 from public.homework h
    where h.id = homework_id
      and (
        h.teacher_id = auth.uid()
        or (public.current_user_role() = 'branch_manager' and h.branch_id = public.current_user_branch_id())
      )
  )
);
create policy submissions_student_insert on public.homework_submissions for insert to authenticated
with check (student_id = auth.uid() and public.current_user_role() = 'student');
revoke update on public.homework_submissions from authenticated;
grant update (submitted_date, status, marks) on public.homework_submissions to authenticated;
create policy submissions_staff_update on public.homework_submissions for update to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.homework h
    where h.id = homework_id
      and (h.teacher_id = auth.uid() or (public.current_user_role() = 'branch_manager' and h.branch_id = public.current_user_branch_id()))
  )
)
with check (
  public.is_admin()
  or exists (
    select 1 from public.homework h
    where h.id = homework_id
      and (h.teacher_id = auth.uid() or (public.current_user_role() = 'branch_manager' and h.branch_id = public.current_user_branch_id()))
  )
);
create policy submissions_admin_delete on public.homework_submissions for delete to authenticated using (public.is_admin());

create policy test_results_select_scoped on public.test_results for select to authenticated
using (
  public.is_admin()
  or student_id = auth.uid()
  or (public.current_user_role() = 'branch_manager' and branch_id = public.current_user_branch_id())
  or exists (
    select 1 from public.courses c
    where c.id = course_id
      and c.instructor_id = auth.uid()
      and c.branch_id = public.current_user_branch_id()
      and branch_id = c.branch_id
  )
);
create policy test_results_staff_write on public.test_results for all to authenticated
using (
  public.is_admin()
  or (public.current_user_role() = 'branch_manager' and branch_id = public.current_user_branch_id())
  or exists (
    select 1 from public.courses c
    where c.id = course_id
      and c.instructor_id = auth.uid()
      and c.branch_id = public.current_user_branch_id()
      and branch_id = c.branch_id
  )
)
with check (
  public.is_admin()
  or (public.current_user_role() = 'branch_manager' and branch_id = public.current_user_branch_id())
  or exists (
    select 1 from public.courses c
    where c.id = course_id
      and c.instructor_id = auth.uid()
      and c.branch_id = public.current_user_branch_id()
      and branch_id = c.branch_id
  )
);

create policy fees_select_scoped on public.fees for select to authenticated
using (
  public.is_admin()
  or student_id = auth.uid()
  or (public.current_user_role() = 'branch_manager' and branch_id = public.current_user_branch_id())
);
create policy fees_management_write on public.fees for all to authenticated
using (public.is_admin() or (public.current_user_role() = 'branch_manager' and branch_id = public.current_user_branch_id()))
with check (public.is_admin() or (public.current_user_role() = 'branch_manager' and branch_id = public.current_user_branch_id()));

commit;
