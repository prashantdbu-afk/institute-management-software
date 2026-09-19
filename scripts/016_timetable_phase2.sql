-- Phase 2E relational timetable integrity, conflict protection, and scoped access.
-- Apply after migrations 012 through 015. Safe to run repeatedly.
begin;

alter table public.timetable enable row level security;

do $$ begin
  if not exists (select 1 from pg_constraint where conname='timetable_branch_required' and conrelid='public.timetable'::regclass) then alter table public.timetable add constraint timetable_branch_required check(branch_id is not null) not valid; end if;
  if not exists (select 1 from pg_constraint where conname='timetable_course_required' and conrelid='public.timetable'::regclass) then alter table public.timetable add constraint timetable_course_required check(course_id is not null) not valid; end if;
  if not exists (select 1 from pg_constraint where conname='timetable_batch_required' and conrelid='public.timetable'::regclass) then alter table public.timetable add constraint timetable_batch_required check(batch_id is not null) not valid; end if;
  if not exists (select 1 from pg_constraint where conname='timetable_teacher_required' and conrelid='public.timetable'::regclass) then alter table public.timetable add constraint timetable_teacher_required check(teacher_id is not null) not valid; end if;
  if not exists (select 1 from pg_constraint where conname='timetable_day_valid' and conrelid='public.timetable'::regclass) then alter table public.timetable add constraint timetable_day_valid check(day_of_week in ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')) not valid; end if;
  if not exists (select 1 from pg_constraint where conname='timetable_time_valid' and conrelid='public.timetable'::regclass) then alter table public.timetable add constraint timetable_time_valid check(end_time>start_time) not valid; end if;
end $$;

create unique index if not exists teacher_assignments_teacher_course_branch_key on public.teacher_course_assignments(teacher_id,course_id,branch_id);

do $$ begin
  if not exists (select 1 from pg_constraint where conname='timetable_course_branch_fkey' and conrelid='public.timetable'::regclass) then alter table public.timetable add constraint timetable_course_branch_fkey foreign key(course_id,branch_id) references public.courses(id,branch_id) not valid; end if;
  if not exists (select 1 from pg_constraint where conname='timetable_batch_course_branch_fkey' and conrelid='public.timetable'::regclass) then alter table public.timetable add constraint timetable_batch_course_branch_fkey foreign key(batch_id,course_id,branch_id) references public.batches(id,course_id,branch_id) not valid; end if;
  if not exists (select 1 from pg_constraint where conname='timetable_teacher_branch_fkey' and conrelid='public.timetable'::regclass) then alter table public.timetable add constraint timetable_teacher_branch_fkey foreign key(teacher_id,branch_id) references public.profiles(id,branch_id) not valid; end if;
  if not exists (select 1 from pg_constraint where conname='timetable_teacher_course_assignment_fkey' and conrelid='public.timetable'::regclass) then alter table public.timetable add constraint timetable_teacher_course_assignment_fkey foreign key(teacher_id,course_id,branch_id) references public.teacher_course_assignments(teacher_id,course_id,branch_id) not valid; end if;
end $$;

create index if not exists timetable_branch_day_idx on public.timetable(branch_id,day_of_week,start_time);
create index if not exists timetable_teacher_day_idx on public.timetable(teacher_id,day_of_week,start_time,end_time);
create index if not exists timetable_batch_day_idx on public.timetable(batch_id,day_of_week,start_time,end_time);
create index if not exists timetable_room_day_idx on public.timetable(branch_id,day_of_week,room_number,start_time,end_time) where room_number is not null;

drop trigger if exists timetable_set_updated_at on public.timetable;
create trigger timetable_set_updated_at before update on public.timetable for each row execute function public.set_updated_at();

create or replace function public.enforce_timetable_integrity()
returns trigger language plpgsql set search_path='' as $$
begin
  -- Serialize writes for a branch/day so concurrent inserts cannot pass conflict checks together.
  perform pg_advisory_xact_lock(hashtextextended('timetable:'||new.branch_id::text||':'||new.day_of_week,0));
  if new.end_time<=new.start_time then raise exception 'timetable_invalid_time' using errcode='23514'; end if;
  if not exists(
    select 1 from public.teacher_course_assignments a
    join public.profiles p on p.id=a.teacher_id and p.branch_id=a.branch_id
    join public.teacher_details d on d.teacher_id=a.teacher_id and d.branch_id=a.branch_id
    where a.teacher_id=new.teacher_id and a.course_id=new.course_id and a.branch_id=new.branch_id
      and a.status='active' and p.role='teacher' and p.status='active' and d.status='active'
  ) then raise exception 'timetable_teacher_assignment_invalid' using errcode='23514'; end if;
  if exists(select 1 from public.timetable t where t.id<>new.id and t.day_of_week=new.day_of_week and t.teacher_id=new.teacher_id and t.start_time<new.end_time and new.start_time<t.end_time) then raise exception 'timetable_teacher_conflict' using errcode='23P01'; end if;
  if exists(select 1 from public.timetable t where t.id<>new.id and t.day_of_week=new.day_of_week and t.batch_id=new.batch_id and t.start_time<new.end_time and new.start_time<t.end_time) then raise exception 'timetable_batch_conflict' using errcode='23P01'; end if;
  if nullif(trim(new.room_number),'') is not null and exists(select 1 from public.timetable t where t.id<>new.id and t.branch_id=new.branch_id and t.day_of_week=new.day_of_week and lower(trim(t.room_number))=lower(trim(new.room_number)) and t.start_time<new.end_time and new.start_time<t.end_time) then raise exception 'timetable_room_conflict' using errcode='23P01'; end if;
  return new;
end $$;
revoke all on function public.enforce_timetable_integrity() from public,anon,authenticated;
drop trigger if exists timetable_enforce_integrity on public.timetable;
create trigger timetable_enforce_integrity before insert or update on public.timetable for each row execute function public.enforce_timetable_integrity();

drop policy if exists timetable_select_scoped on public.timetable;
drop policy if exists timetable_management_write on public.timetable;
drop policy if exists timetable_insert_scoped on public.timetable;
drop policy if exists timetable_update_scoped on public.timetable;
drop policy if exists timetable_delete_scoped on public.timetable;
revoke all on public.timetable from anon,public;
grant select,insert,update,delete on public.timetable to authenticated;

create policy timetable_select_scoped on public.timetable for select to authenticated using(
  public.is_admin()
  or (public.current_user_role()='branch_manager' and branch_id=public.current_user_branch_id())
  or (public.current_user_role()='teacher' and teacher_id=auth.uid())
  or (public.current_user_role()='student' and exists(select 1 from public.student_enrollments e where e.student_id=auth.uid() and e.status='active' and e.branch_id=timetable.branch_id and e.course_id=timetable.course_id and e.batch_id=timetable.batch_id))
);
create policy timetable_insert_scoped on public.timetable for insert to authenticated with check(public.is_admin() or (public.current_user_role()='branch_manager' and branch_id=public.current_user_branch_id()));
create policy timetable_update_scoped on public.timetable for update to authenticated using(public.is_admin() or (public.current_user_role()='branch_manager' and branch_id=public.current_user_branch_id())) with check(public.is_admin() or (public.current_user_role()='branch_manager' and branch_id=public.current_user_branch_id()));
create policy timetable_delete_scoped on public.timetable for delete to authenticated using(public.is_admin() or (public.current_user_role()='branch_manager' and branch_id=public.current_user_branch_id()));

-- Permit read-only lookup rows only when they support the caller's own timetable.
drop policy if exists student_enrollments_select_scoped on public.student_enrollments;
create policy student_enrollments_select_scoped on public.student_enrollments for select to authenticated using(
  public.is_admin() or (public.current_user_role()='branch_manager' and branch_id=public.current_user_branch_id()) or (public.current_user_role()='student' and student_id=auth.uid())
);
drop policy if exists courses_select_scoped on public.courses;
create policy courses_select_scoped on public.courses for select to authenticated using(
  public.is_admin() or (public.current_user_role()='branch_manager' and branch_id=public.current_user_branch_id())
  or (public.current_user_role()='teacher' and exists(select 1 from public.teacher_course_assignments a where a.teacher_id=auth.uid() and a.course_id=courses.id and a.branch_id=courses.branch_id and a.status='active'))
  or (public.current_user_role()='student' and exists(select 1 from public.student_enrollments e where e.student_id=auth.uid() and e.course_id=courses.id and e.branch_id=courses.branch_id and e.status='active'))
);
drop policy if exists batches_select_scoped on public.batches;
create policy batches_select_scoped on public.batches for select to authenticated using(
  public.is_admin() or (public.current_user_role()='branch_manager' and branch_id=public.current_user_branch_id())
  or (public.current_user_role()='teacher' and exists(select 1 from public.timetable t where t.teacher_id=auth.uid() and t.batch_id=batches.id))
  or (public.current_user_role()='student' and exists(select 1 from public.student_enrollments e where e.student_id=auth.uid() and e.batch_id=batches.id and e.status='active'))
);
drop policy if exists profiles_select_authorized on public.profiles;
create policy profiles_select_authorized on public.profiles for select to authenticated using(
  id=auth.uid() or public.is_admin() or (public.current_user_role()='branch_manager' and branch_id=public.current_user_branch_id())
  or (role='teacher' and public.current_user_role()='student' and exists(
    select 1 from public.timetable t join public.student_enrollments e on e.branch_id=t.branch_id and e.course_id=t.course_id and e.batch_id=t.batch_id
    where t.teacher_id=profiles.id and e.student_id=auth.uid() and e.status='active'
  ))
);

commit;
