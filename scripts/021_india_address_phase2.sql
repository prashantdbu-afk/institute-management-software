-- Backward-compatible India branch addresses. Apply after 001-020.
begin;
alter table public.branches add column if not exists address_line_1 text;
alter table public.branches add column if not exists address_line_2 text;
alter table public.branches add column if not exists district text;
alter table public.branches add column if not exists state text;
alter table public.branches add column if not exists pin_code text;
alter table public.branches add column if not exists country text not null default 'India';
update public.branches set address_line_1=address where address_line_1 is null and address is not null;
do $$ begin
 if not exists(select 1 from pg_constraint where conname='branches_pin_code_valid' and conrelid='public.branches'::regclass) then alter table public.branches add constraint branches_pin_code_valid check(pin_code is null or pin_code ~ '^[1-9][0-9]{5}$') not valid; end if;
 if not exists(select 1 from pg_constraint where conname='branches_country_india' and conrelid='public.branches'::regclass) then alter table public.branches add constraint branches_country_india check(country='India') not valid; end if;
end $$;
commit;
