-- V1 student fee records. Apply after 001-018.
begin;

alter table public.fees add column if not exists total_amount numeric(12,2);
alter table public.fees add column if not exists amount_paid numeric(12,2) not null default 0;
alter table public.fees add column if not exists notes text;
update public.fees set total_amount=coalesce(total_amount,amount),amount_paid=case when status='paid' then coalesce(amount,0) else amount_paid end where total_amount is null;
alter table public.fees enable row level security;
create index if not exists fees_student_idx on public.fees(student_id,due_date);
create index if not exists fees_scope_idx on public.fees(branch_id,course_id,batch_id);

do $$ begin
 if not exists(select 1 from pg_constraint where conname='fees_amounts_valid' and conrelid='public.fees'::regclass) then alter table public.fees add constraint fees_amounts_valid check(total_amount>=0 and amount_paid>=0 and amount_paid<=total_amount) not valid; end if;
 if not exists(select 1 from pg_constraint where conname='fees_status_valid_v1' and conrelid='public.fees'::regclass) then alter table public.fees add constraint fees_status_valid_v1 check(status in('pending','partial','paid','overdue')) not valid; end if;
 if not exists(select 1 from pg_constraint where conname='fees_course_branch_fkey' and conrelid='public.fees'::regclass) then alter table public.fees add constraint fees_course_branch_fkey foreign key(course_id,branch_id) references public.courses(id,branch_id) not valid; end if;
 if not exists(select 1 from pg_constraint where conname='fees_batch_course_branch_fkey' and conrelid='public.fees'::regclass) then alter table public.fees add constraint fees_batch_course_branch_fkey foreign key(batch_id,course_id,branch_id) references public.batches(id,course_id,branch_id) not valid; end if;
end $$;
create or replace function public.enforce_fee() returns trigger language plpgsql set search_path='' as $$ begin
 if not exists(select 1 from public.student_enrollments e where e.student_id=new.student_id and e.branch_id=new.branch_id and e.course_id=new.course_id and e.batch_id=new.batch_id and e.status='active') then raise exception 'student_not_enrolled' using errcode='23514'; end if;
 new.amount=new.total_amount; new.status=case when new.amount_paid>=new.total_amount then 'paid' when new.amount_paid>0 then 'partial' when new.due_date<current_date then 'overdue' else 'pending' end; if new.status='paid' and new.payment_date is null then new.payment_date=current_date; end if; return new;
end $$;
revoke all on function public.enforce_fee() from public,anon,authenticated;
drop trigger if exists fees_enforce on public.fees; create trigger fees_enforce before insert or update on public.fees for each row execute function public.enforce_fee();
drop trigger if exists fees_set_updated_at on public.fees; create trigger fees_set_updated_at before update on public.fees for each row execute function public.set_updated_at();
drop policy if exists fees_select_all on public.fees; drop policy if exists fees_insert_auth on public.fees; drop policy if exists fees_update_auth on public.fees; drop policy if exists fees_delete_auth on public.fees; drop policy if exists fees_select_scoped on public.fees; drop policy if exists fees_manage_scoped on public.fees;
revoke all on public.fees from anon,public; grant select on public.fees to authenticated; grant insert,update,delete on public.fees to authenticated;
create policy fees_select_scoped on public.fees for select to authenticated using(public.is_admin() or student_id=auth.uid() or (public.current_user_role()='branch_manager' and branch_id=public.current_user_branch_id()));
create policy fees_manage_scoped on public.fees for all to authenticated using(public.is_admin() or (public.current_user_role()='branch_manager' and branch_id=public.current_user_branch_id())) with check(public.is_admin() or (public.current_user_role()='branch_manager' and branch_id=public.current_user_branch_id()));

commit;
