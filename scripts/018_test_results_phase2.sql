-- V1 relational assessments. Apply after 001-017.
begin;

alter table public.test_results add column if not exists batch_id uuid references public.batches(id);
alter table public.test_results add column if not exists teacher_id uuid references public.profiles(id);
alter table public.test_results add column if not exists notes text;
alter table public.test_results alter column total_marks set default 100;
alter table public.test_results enable row level security;

create index if not exists test_results_student_idx on public.test_results(student_id,test_date);
create index if not exists test_results_scope_idx on public.test_results(branch_id,course_id,batch_id);

do $$ begin
 if not exists(select 1 from pg_constraint where conname='test_results_marks_valid' and conrelid='public.test_results'::regclass) then alter table public.test_results add constraint test_results_marks_valid check(total_marks>0 and marks_obtained>=0 and marks_obtained<=total_marks) not valid; end if;
 if not exists(select 1 from pg_constraint where conname='test_results_percentage_derived' and conrelid='public.test_results'::regclass) then alter table public.test_results add constraint test_results_percentage_derived check(percentage is null or percentage=round((marks_obtained/total_marks)*100,2)) not valid; end if;
 if not exists(select 1 from pg_constraint where conname='test_results_course_branch_fkey' and conrelid='public.test_results'::regclass) then alter table public.test_results add constraint test_results_course_branch_fkey foreign key(course_id,branch_id) references public.courses(id,branch_id) not valid; end if;
 if not exists(select 1 from pg_constraint where conname='test_results_batch_course_branch_fkey' and conrelid='public.test_results'::regclass) then alter table public.test_results add constraint test_results_batch_course_branch_fkey foreign key(batch_id,course_id,branch_id) references public.batches(id,course_id,branch_id) not valid; end if;
end $$;

create or replace function public.enforce_test_result() returns trigger language plpgsql set search_path='' as $$ begin
 if not exists(select 1 from public.profiles p where p.id=new.student_id and p.role='student' and p.branch_id=new.branch_id) then raise exception 'invalid_test_student' using errcode='23514'; end if;
 if not exists(select 1 from public.student_enrollments e where e.student_id=new.student_id and e.branch_id=new.branch_id and e.course_id=new.course_id and e.batch_id=new.batch_id and e.status='active') then raise exception 'student_not_enrolled' using errcode='23514'; end if;
 if new.teacher_id is not null and not exists(select 1 from public.teacher_course_assignments a where a.teacher_id=new.teacher_id and a.branch_id=new.branch_id and a.course_id=new.course_id and a.status='active') then raise exception 'teacher_not_assigned' using errcode='23514'; end if;
 new.percentage=round((new.marks_obtained/new.total_marks)*100,2);
 return new;
end $$;
revoke all on function public.enforce_test_result() from public,anon,authenticated;
drop trigger if exists test_results_enforce on public.test_results;
create trigger test_results_enforce before insert or update on public.test_results for each row execute function public.enforce_test_result();
drop trigger if exists test_results_set_updated_at on public.test_results;
create trigger test_results_set_updated_at before update on public.test_results for each row execute function public.set_updated_at();

drop policy if exists test_results_select_all on public.test_results; drop policy if exists test_results_insert_auth on public.test_results; drop policy if exists test_results_update_auth on public.test_results; drop policy if exists test_results_delete_auth on public.test_results; drop policy if exists test_results_select_scoped on public.test_results; drop policy if exists test_results_manage_scoped on public.test_results;
revoke all on public.test_results from anon,public; grant select,insert,update,delete on public.test_results to authenticated;
create policy test_results_select_scoped on public.test_results for select to authenticated using(public.is_admin() or student_id=auth.uid() or (public.current_user_role()='branch_manager' and branch_id=public.current_user_branch_id()) or (public.current_user_role()='teacher' and teacher_id=auth.uid()));
create policy test_results_manage_scoped on public.test_results for all to authenticated using(public.is_admin() or (public.current_user_role()='branch_manager' and branch_id=public.current_user_branch_id()) or (public.current_user_role()='teacher' and teacher_id=auth.uid())) with check(public.is_admin() or (public.current_user_role()='branch_manager' and branch_id=public.current_user_branch_id()) or (public.current_user_role()='teacher' and teacher_id=auth.uid() and branch_id=public.current_user_branch_id() and exists(select 1 from public.teacher_course_assignments a where a.teacher_id=auth.uid() and a.course_id=test_results.course_id and a.branch_id=test_results.branch_id and a.status='active')));

drop policy if exists student_enrollments_select_scoped on public.student_enrollments;
create policy student_enrollments_select_scoped on public.student_enrollments for select to authenticated using(public.is_admin() or student_id=auth.uid() or (public.current_user_role()='branch_manager' and branch_id=public.current_user_branch_id()) or (public.current_user_role()='teacher' and exists(select 1 from public.teacher_course_assignments a where a.teacher_id=auth.uid() and a.course_id=student_enrollments.course_id and a.branch_id=student_enrollments.branch_id and a.status='active')));

drop policy if exists profiles_select_authorized on public.profiles;
create policy profiles_select_authorized on public.profiles for select to authenticated using(
 id=auth.uid() or public.is_admin() or (public.current_user_role()='branch_manager' and branch_id=public.current_user_branch_id())
 or (role='teacher' and public.current_user_role()='student' and exists(select 1 from public.student_enrollments e where e.student_id=auth.uid() and e.branch_id=profiles.branch_id and e.status='active'))
 or (role='student' and public.current_user_role()='teacher' and exists(select 1 from public.student_enrollments e join public.teacher_course_assignments a on a.course_id=e.course_id and a.branch_id=e.branch_id where e.student_id=profiles.id and e.status='active' and a.teacher_id=auth.uid() and a.status='active'))
);

commit;
