-- Phase 2D authoritative Profiles, Teacher details, and Course assignments.
-- Apply after 012_secure_auth_and_rls.sql through 014_admissions_enrollment_phase2.sql.

begin;

alter table public.profiles add column if not exists status text not null default 'active';

do $$ begin
  if not exists (select 1 from pg_constraint where conname='profiles_status_valid' and conrelid='public.profiles'::regclass) then
    alter table public.profiles add constraint profiles_status_valid check (status in ('active','inactive')) not valid;
  end if;
end $$;

create table if not exists public.teacher_details (
  teacher_id uuid primary key references public.profiles(id),
  branch_id uuid not null references public.branches(id),
  qualification text,
  specialization text,
  experience_years integer not null default 0,
  status text not null default 'active',
  joining_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teacher_details_experience_valid check (experience_years between 0 and 100),
  constraint teacher_details_status_valid check (status in ('active','inactive')),
  constraint teacher_details_teacher_branch_fkey foreign key (teacher_id, branch_id)
    references public.profiles(id, branch_id)
);

create table if not exists public.teacher_course_assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null,
  course_id uuid not null,
  branch_id uuid not null references public.branches(id),
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teacher_course_assignments_status_valid check (status in ('active','inactive')),
  constraint teacher_course_assignments_teacher_branch_fkey foreign key (teacher_id, branch_id)
    references public.profiles(id, branch_id),
  constraint teacher_course_assignments_course_branch_fkey foreign key (course_id, branch_id)
    references public.courses(id, branch_id),
  constraint teacher_course_assignments_unique unique (teacher_id, course_id)
);

create index if not exists teacher_details_branch_id_idx on public.teacher_details(branch_id);
create index if not exists teacher_course_assignments_branch_id_idx on public.teacher_course_assignments(branch_id);
create index if not exists teacher_course_assignments_course_id_idx on public.teacher_course_assignments(course_id);

create or replace function public.enforce_teacher_identity()
returns trigger language plpgsql set search_path='' as $$
begin
  if not exists (select 1 from public.profiles p where p.id=new.teacher_id and p.role='teacher' and p.branch_id=new.branch_id) then
    raise exception 'Teacher profile and branch are inconsistent' using errcode='23514';
  end if;
  return new;
end $$;
revoke all on function public.enforce_teacher_identity() from public, anon, authenticated;
drop trigger if exists teacher_details_enforce_identity on public.teacher_details;
create trigger teacher_details_enforce_identity before insert or update on public.teacher_details for each row execute function public.enforce_teacher_identity();
drop trigger if exists teacher_assignments_enforce_identity on public.teacher_course_assignments;
create trigger teacher_assignments_enforce_identity before insert or update on public.teacher_course_assignments for each row execute function public.enforce_teacher_identity();

alter table public.teacher_details enable row level security;
alter table public.teacher_course_assignments enable row level security;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists teacher_details_set_updated_at on public.teacher_details;
create trigger teacher_details_set_updated_at before update on public.teacher_details for each row execute function public.set_updated_at();
drop trigger if exists teacher_course_assignments_set_updated_at on public.teacher_course_assignments;
create trigger teacher_course_assignments_set_updated_at before update on public.teacher_course_assignments for each row execute function public.set_updated_at();

drop policy if exists profiles_admin_update on public.profiles;
drop policy if exists teacher_details_select_scoped on public.teacher_details;
drop policy if exists teacher_details_manage_scoped on public.teacher_details;
drop policy if exists teacher_assignments_select_scoped on public.teacher_course_assignments;
drop policy if exists teacher_assignments_manage_scoped on public.teacher_course_assignments;

revoke all on public.teacher_details, public.teacher_course_assignments from anon;
revoke all on public.teacher_details, public.teacher_course_assignments from public;
grant select, insert, update, delete on public.teacher_details, public.teacher_course_assignments to authenticated;
grant update (full_name, phone, role, branch_id, status) on public.profiles to authenticated;

create or replace function public.current_user_profile_status()
returns text language sql stable security definer set search_path='' as $$
  select status from public.profiles where id=auth.uid();
$$;
revoke all on function public.current_user_profile_status() from public, anon;
grant execute on function public.current_user_profile_status() to authenticated;

drop policy if exists profiles_update_own_safe_fields on public.profiles;
create policy profiles_update_own_safe_fields on public.profiles for update to authenticated
using (id=auth.uid())
with check (
  id=auth.uid()
  and role=public.current_user_role()
  and branch_id is not distinct from public.current_user_branch_id()
  and status=public.current_user_profile_status()
);

create policy profiles_admin_update on public.profiles for update to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy teacher_details_select_scoped on public.teacher_details for select to authenticated using (
  public.is_admin() or teacher_id=auth.uid() or
  (public.current_user_role()='branch_manager' and branch_id=public.current_user_branch_id())
);
create policy teacher_details_manage_scoped on public.teacher_details for all to authenticated using (
  public.is_admin() or (public.current_user_role()='branch_manager' and branch_id=public.current_user_branch_id())
) with check (
  (public.is_admin() or (public.current_user_role()='branch_manager' and branch_id=public.current_user_branch_id()))
  and exists (select 1 from public.profiles p where p.id=teacher_id and p.role='teacher' and p.branch_id=branch_id)
);

create policy teacher_assignments_select_scoped on public.teacher_course_assignments for select to authenticated using (
  public.is_admin() or teacher_id=auth.uid() or
  (public.current_user_role()='branch_manager' and branch_id=public.current_user_branch_id())
);
create policy teacher_assignments_manage_scoped on public.teacher_course_assignments for all to authenticated using (
  public.is_admin() or (public.current_user_role()='branch_manager' and branch_id=public.current_user_branch_id())
) with check (
  (public.is_admin() or (public.current_user_role()='branch_manager' and branch_id=public.current_user_branch_id()))
  and exists (select 1 from public.profiles p where p.id=teacher_id and p.role='teacher' and p.branch_id=branch_id)
  and exists (select 1 from public.courses c where c.id=course_id and c.branch_id=branch_id)
);

-- Branch managers may update basic teacher metadata, never role, branch, email, or status.
create or replace function public.update_teacher_identity(p_teacher_id uuid, p_full_name text, p_phone text)
returns public.profiles language plpgsql security definer set search_path='' as $$
declare v_actor public.profiles; v_target public.profiles;
begin
  select * into v_actor from public.profiles where id=auth.uid();
  select * into v_target from public.profiles where id=p_teacher_id for update;
  if v_target.role <> 'teacher' or not (v_actor.role='admin' or (v_actor.role='branch_manager' and v_actor.branch_id=v_target.branch_id)) then
    raise exception 'Not authorized to update teacher' using errcode='42501';
  end if;
  update public.profiles set full_name=nullif(trim(p_full_name),''), phone=nullif(trim(p_phone),'') where id=p_teacher_id returning * into v_target;
  return v_target;
end $$;
revoke all on function public.update_teacher_identity(uuid,text,text) from public, anon;
grant execute on function public.update_teacher_identity(uuid,text,text) to authenticated;

create or replace function public.replace_teacher_course_assignments(p_teacher_id uuid, p_branch_id uuid, p_course_ids uuid[])
returns setof public.teacher_course_assignments language plpgsql security invoker set search_path='' as $$
begin
  if exists (
    select 1 from unnest(coalesce(p_course_ids, array[]::uuid[])) as requested(course_id)
    where not exists (select 1 from public.courses c where c.id=requested.course_id and c.branch_id=p_branch_id)
  ) then raise exception 'A course belongs to another branch' using errcode='23514'; end if;
  delete from public.teacher_course_assignments where teacher_id=p_teacher_id;
  insert into public.teacher_course_assignments(teacher_id,course_id,branch_id,status)
    select p_teacher_id,requested.course_id,p_branch_id,'active'
    from unnest(coalesce(p_course_ids,array[]::uuid[])) as requested(course_id);
  return query select * from public.teacher_course_assignments where teacher_id=p_teacher_id;
end $$;
revoke all on function public.replace_teacher_course_assignments(uuid,uuid,uuid[]) from public, anon;
grant execute on function public.replace_teacher_course_assignments(uuid,uuid,uuid[]) to authenticated;

-- Preserve public-signup least privilege after adding the profile status field.
create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into public.profiles(id,email,role,full_name,status) values (
    new.id, coalesce(new.email,''), 'student',
    nullif(trim(concat_ws(' ',new.raw_user_meta_data->>'first_name',new.raw_user_meta_data->>'last_name')),''), 'active'
  );
  return new;
end $$;
revoke all on function public.handle_new_auth_user() from public, anon, authenticated;

commit;
