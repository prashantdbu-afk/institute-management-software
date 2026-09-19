-- Phase 2F relational Homework and student submissions. Apply after 012-016.
begin;

alter table public.homework add column if not exists description text;
alter table public.homework_submissions add column if not exists submitted_at timestamptz;
alter table public.homework_submissions add column if not exists submission_content text;
alter table public.homework_submissions add column if not exists teacher_feedback text;

alter table public.homework enable row level security;
alter table public.homework_submissions enable row level security;

do $$ begin
  if not exists(select 1 from pg_constraint where conname='homework_branch_required' and conrelid='public.homework'::regclass) then alter table public.homework add constraint homework_branch_required check(branch_id is not null) not valid; end if;
  if not exists(select 1 from pg_constraint where conname='homework_course_required' and conrelid='public.homework'::regclass) then alter table public.homework add constraint homework_course_required check(course_id is not null) not valid; end if;
  if not exists(select 1 from pg_constraint where conname='homework_batch_required' and conrelid='public.homework'::regclass) then alter table public.homework add constraint homework_batch_required check(batch_id is not null) not valid; end if;
  if not exists(select 1 from pg_constraint where conname='homework_teacher_required' and conrelid='public.homework'::regclass) then alter table public.homework add constraint homework_teacher_required check(teacher_id is not null) not valid; end if;
  if not exists(select 1 from pg_constraint where conname='homework_dates_valid' and conrelid='public.homework'::regclass) then alter table public.homework add constraint homework_dates_valid check(due_date>=assigned_date) not valid; end if;
  if not exists(select 1 from pg_constraint where conname='homework_course_branch_fkey' and conrelid='public.homework'::regclass) then alter table public.homework add constraint homework_course_branch_fkey foreign key(course_id,branch_id) references public.courses(id,branch_id) not valid; end if;
  if not exists(select 1 from pg_constraint where conname='homework_batch_course_branch_fkey' and conrelid='public.homework'::regclass) then alter table public.homework add constraint homework_batch_course_branch_fkey foreign key(batch_id,course_id,branch_id) references public.batches(id,course_id,branch_id) not valid; end if;
  if not exists(select 1 from pg_constraint where conname='homework_teacher_branch_fkey' and conrelid='public.homework'::regclass) then alter table public.homework add constraint homework_teacher_branch_fkey foreign key(teacher_id,branch_id) references public.profiles(id,branch_id) not valid; end if;
  if not exists(select 1 from pg_constraint where conname='homework_teacher_assignment_fkey' and conrelid='public.homework'::regclass) then alter table public.homework add constraint homework_teacher_assignment_fkey foreign key(teacher_id,course_id,branch_id) references public.teacher_course_assignments(teacher_id,course_id,branch_id) not valid; end if;
end $$;

-- Replace the legacy cascade so deleting Homework never silently destroys student work.
do $$ declare n text; begin
  select conname into n from pg_constraint where conrelid='public.homework_submissions'::regclass and contype='f' and confrelid='public.homework'::regclass and conkey=array[(select attnum::smallint from pg_attribute where attrelid='public.homework_submissions'::regclass and attname='homework_id')];
  if n is not null and pg_get_constraintdef((select oid from pg_constraint where conrelid='public.homework_submissions'::regclass and conname=n)) ilike '%ON DELETE CASCADE%' then execute format('alter table public.homework_submissions drop constraint %I',n); end if;
  if not exists(select 1 from pg_constraint where conname='homework_submissions_homework_restrict_fkey' and conrelid='public.homework_submissions'::regclass) then alter table public.homework_submissions add constraint homework_submissions_homework_restrict_fkey foreign key(homework_id) references public.homework(id) on delete restrict not valid; end if;
end $$;

update public.homework_submissions set submitted_at=coalesce(submitted_at,submitted_date::timestamptz) where submitted_date is not null and submitted_at is null;
update public.homework_submissions set status='submitted' where status='pending' and submitted_date is not null;
do $$ begin
  if exists(select 1 from public.homework_submissions group by homework_id,student_id having count(*)>1) then
    raise exception 'Duplicate legacy homework submissions must be resolved before applying migration 017';
  end if;
end $$;
create unique index if not exists homework_submissions_homework_student_key on public.homework_submissions(homework_id,student_id);
create index if not exists homework_branch_batch_idx on public.homework(branch_id,course_id,batch_id);
create index if not exists homework_teacher_idx on public.homework(teacher_id,due_date);
create index if not exists homework_submissions_student_idx on public.homework_submissions(student_id,homework_id);

do $$ begin
  if not exists(select 1 from pg_constraint where conname='homework_submission_status_valid' and conrelid='public.homework_submissions'::regclass) then alter table public.homework_submissions add constraint homework_submission_status_valid check(status in('submitted','late','reviewed')) not valid; end if;
  if not exists(select 1 from pg_constraint where conname='homework_submission_marks_valid' and conrelid='public.homework_submissions'::regclass) then alter table public.homework_submissions add constraint homework_submission_marks_valid check(marks is null or marks>=0) not valid; end if;
end $$;

drop trigger if exists homework_set_updated_at on public.homework;
create trigger homework_set_updated_at before update on public.homework for each row execute function public.set_updated_at();
drop trigger if exists homework_submissions_set_updated_at on public.homework_submissions;
create trigger homework_submissions_set_updated_at before update on public.homework_submissions for each row execute function public.set_updated_at();

create or replace function public.enforce_homework_integrity() returns trigger language plpgsql set search_path='' as $$ begin
 if not exists(select 1 from public.teacher_course_assignments a join public.profiles p on p.id=a.teacher_id and p.branch_id=a.branch_id join public.teacher_details d on d.teacher_id=a.teacher_id and d.branch_id=a.branch_id where a.teacher_id=new.teacher_id and a.course_id=new.course_id and a.branch_id=new.branch_id and a.status='active' and p.role='teacher' and p.status='active' and d.status='active') then raise exception 'homework_teacher_assignment_invalid' using errcode='23514'; end if;
 return new;
end $$;
revoke all on function public.enforce_homework_integrity() from public,anon,authenticated;
drop trigger if exists homework_enforce_integrity on public.homework;
create trigger homework_enforce_integrity before insert or update on public.homework for each row execute function public.enforce_homework_integrity();

create or replace function public.enforce_homework_submission() returns trigger language plpgsql set search_path='' as $$ declare h public.homework; begin
 select * into h from public.homework where id=new.homework_id;
 if new.student_id<>auth.uid() then raise exception 'homework_submission_impersonation' using errcode='42501'; end if;
 if not exists(select 1 from public.student_enrollments e where e.student_id=new.student_id and e.status='active' and e.branch_id=h.branch_id and e.course_id=h.course_id and e.batch_id=h.batch_id) then raise exception 'homework_student_not_eligible' using errcode='42501'; end if;
 new.submitted_at=coalesce(new.submitted_at,now()); new.submitted_date=(new.submitted_at at time zone 'Asia/Kolkata')::date;
 new.status=case when new.submitted_date>h.due_date then 'late' else 'submitted' end; new.marks=null; new.teacher_feedback=null;
 return new;
end $$;
revoke all on function public.enforce_homework_submission() from public,anon,authenticated;
drop trigger if exists homework_submission_enforce on public.homework_submissions;
create trigger homework_submission_enforce before insert on public.homework_submissions for each row execute function public.enforce_homework_submission();

create or replace function public.block_homework_delete_with_submissions() returns trigger language plpgsql set search_path='' as $$ begin if exists(select 1 from public.homework_submissions s where s.homework_id=old.id) then raise exception 'homework_has_submissions' using errcode='23503'; end if; return old; end $$;
revoke all on function public.block_homework_delete_with_submissions() from public,anon,authenticated;
drop trigger if exists homework_block_delete on public.homework;
create trigger homework_block_delete before delete on public.homework for each row execute function public.block_homework_delete_with_submissions();

drop policy if exists homework_select_scoped on public.homework; drop policy if exists homework_management_write on public.homework;
drop policy if exists homework_insert_scoped on public.homework; drop policy if exists homework_update_scoped on public.homework; drop policy if exists homework_delete_scoped on public.homework;
drop policy if exists submissions_select_scoped on public.homework_submissions; drop policy if exists submissions_student_insert on public.homework_submissions; drop policy if exists submissions_staff_update on public.homework_submissions; drop policy if exists submissions_admin_delete on public.homework_submissions;
revoke all on public.homework,public.homework_submissions from anon,public;
grant select,insert,update,delete on public.homework to authenticated;
grant select,insert on public.homework_submissions to authenticated;
revoke update on public.homework_submissions from authenticated;
grant update(status,marks,teacher_feedback) on public.homework_submissions to authenticated;
grant delete on public.homework_submissions to authenticated;

create policy homework_select_scoped on public.homework for select to authenticated using(public.is_admin() or (public.current_user_role()='branch_manager' and branch_id=public.current_user_branch_id()) or (public.current_user_role()='teacher' and teacher_id=auth.uid()) or (public.current_user_role()='student' and exists(select 1 from public.student_enrollments e where e.student_id=auth.uid() and e.status='active' and e.branch_id=homework.branch_id and e.course_id=homework.course_id and e.batch_id=homework.batch_id)));
create policy homework_insert_scoped on public.homework for insert to authenticated with check(public.is_admin() or (public.current_user_role()='branch_manager' and branch_id=public.current_user_branch_id()) or (public.current_user_role()='teacher' and teacher_id=auth.uid() and branch_id=public.current_user_branch_id()));
create policy homework_update_scoped on public.homework for update to authenticated using(public.is_admin() or (public.current_user_role()='branch_manager' and branch_id=public.current_user_branch_id()) or (public.current_user_role()='teacher' and teacher_id=auth.uid())) with check(public.is_admin() or (public.current_user_role()='branch_manager' and branch_id=public.current_user_branch_id()) or (public.current_user_role()='teacher' and teacher_id=auth.uid() and branch_id=public.current_user_branch_id()));
create policy homework_delete_scoped on public.homework for delete to authenticated using(public.is_admin() or (public.current_user_role()='branch_manager' and branch_id=public.current_user_branch_id()) or (public.current_user_role()='teacher' and teacher_id=auth.uid()));
create policy submissions_select_scoped on public.homework_submissions for select to authenticated using(public.is_admin() or student_id=auth.uid() or exists(select 1 from public.homework h where h.id=homework_id and ((public.current_user_role()='teacher' and h.teacher_id=auth.uid()) or (public.current_user_role()='branch_manager' and h.branch_id=public.current_user_branch_id()))));
create policy submissions_student_insert on public.homework_submissions for insert to authenticated with check(student_id=auth.uid() and public.current_user_role()='student' and exists(select 1 from public.homework h join public.student_enrollments e on e.branch_id=h.branch_id and e.course_id=h.course_id and e.batch_id=h.batch_id where h.id=homework_id and e.student_id=auth.uid() and e.status='active'));
create policy submissions_staff_update on public.homework_submissions for update to authenticated using(public.is_admin() or exists(select 1 from public.homework h where h.id=homework_id and ((public.current_user_role()='teacher' and h.teacher_id=auth.uid()) or (public.current_user_role()='branch_manager' and h.branch_id=public.current_user_branch_id())))) with check(public.is_admin() or exists(select 1 from public.homework h where h.id=homework_id and ((public.current_user_role()='teacher' and h.teacher_id=auth.uid()) or (public.current_user_role()='branch_manager' and h.branch_id=public.current_user_branch_id()))));
create policy submissions_admin_delete on public.homework_submissions for delete to authenticated using(public.is_admin());

-- Permit only the profile names needed to render an authorized Homework relationship.
drop policy if exists profiles_select_authorized on public.profiles;
create policy profiles_select_authorized on public.profiles for select to authenticated using(
  id=auth.uid() or public.is_admin() or (public.current_user_role()='branch_manager' and branch_id=public.current_user_branch_id())
  or (role='teacher' and public.current_user_role()='student' and (
    exists(select 1 from public.timetable t join public.student_enrollments e on e.branch_id=t.branch_id and e.course_id=t.course_id and e.batch_id=t.batch_id where t.teacher_id=profiles.id and e.student_id=auth.uid() and e.status='active')
    or exists(select 1 from public.homework h join public.student_enrollments e on e.branch_id=h.branch_id and e.course_id=h.course_id and e.batch_id=h.batch_id where h.teacher_id=profiles.id and e.student_id=auth.uid() and e.status='active')
  ))
  or (role='student' and public.current_user_role()='teacher' and exists(select 1 from public.homework_submissions s join public.homework h on h.id=s.homework_id where s.student_id=profiles.id and h.teacher_id=auth.uid()))
);

commit;
