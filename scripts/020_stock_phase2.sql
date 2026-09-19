-- V1 branch inventory. Apply after 001-019.
begin;
alter table public.stock add column if not exists supplier text;
alter table public.stock add column if not exists updated_at timestamptz not null default now();
alter table public.stock enable row level security;
create index if not exists stock_branch_idx on public.stock(branch_id,item_name);
do $$ begin
 if not exists(select 1 from pg_constraint where conname='stock_values_valid' and conrelid='public.stock'::regclass) then alter table public.stock add constraint stock_values_valid check(quantity>=0 and minimum_stock>=0 and (unit_price is null or unit_price>=0)) not valid; end if;
 if not exists(select 1 from pg_constraint where conname='stock_branch_required' and conrelid='public.stock'::regclass) then alter table public.stock add constraint stock_branch_required check(branch_id is not null) not valid; end if;
end $$;
drop trigger if exists stock_set_updated_at on public.stock; create trigger stock_set_updated_at before update on public.stock for each row execute function public.set_updated_at();
drop policy if exists stock_select_all on public.stock; drop policy if exists stock_insert_auth on public.stock; drop policy if exists stock_update_auth on public.stock; drop policy if exists stock_delete_auth on public.stock; drop policy if exists stock_select_scoped on public.stock; drop policy if exists stock_manage_scoped on public.stock;
revoke all on public.stock from anon,public; grant select,insert,update,delete on public.stock to authenticated;
create policy stock_select_scoped on public.stock for select to authenticated using(public.is_admin() or (public.current_user_role()='branch_manager' and branch_id=public.current_user_branch_id()));
create policy stock_manage_scoped on public.stock for all to authenticated using(public.is_admin() or (public.current_user_role()='branch_manager' and branch_id=public.current_user_branch_id())) with check(public.is_admin() or (public.current_user_role()='branch_manager' and branch_id=public.current_user_branch_id()));
commit;
