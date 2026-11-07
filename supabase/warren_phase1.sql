-- Warren Investment Intelligence · Phase 1
-- Run this in the Supabase SQL editor (postgres). Do not run it from the website.
-- It does not touch public.app_state or public.content.
--
-- After it succeeds:
-- 1. Authentication → URL configuration:
--    Site URL  https://ralphalbrodjim.github.io/amazonas-webs/warren/
--    Redirect  https://ralphalbrodjim.github.io/amazonas-webs/warren/
-- 2. Authentication → Providers → Email: enabled.
--    For the first login, either turn "Confirm email" off or confirm the message.
-- 3. Alberto creates the ONE account from the Warren login page (password or magic link).
--    The trigger below refuses every later signup.
-- 4. Optional: run supabase/warren_seed.sql to load the figures already on the old site.

create table if not exists public.warren_profile (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text,
  role text not null default 'owner' check (role = 'owner'),
  created_at timestamptz not null default now()
);

create table if not exists public.warren_companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.warren_profile (user_id) on delete cascade,
  ticker text not null,
  name text not null,
  exchange text,
  currency text not null,
  in_portfolio boolean not null default false,
  classification text,
  quality_stars integer check (quality_stars between 1 and 5),
  verdict text,
  notes text,
  sort integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (owner_id, ticker)
);

create table if not exists public.warren_quotes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.warren_companies (id) on delete cascade,
  price numeric not null,
  currency text not null,
  price_date date not null,
  fetched_at timestamptz not null default now(),
  source text not null,
  manual boolean not null default false,
  note text,
  unique (company_id, price_date, source)
);

create table if not exists public.warren_fx_rates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.warren_profile (user_id) on delete cascade,
  rate_date date not null,
  quote text not null,
  units_per_eur numeric not null check (units_per_eur > 0),
  source text not null default 'ECB',
  fetched_at timestamptz not null default now(),
  unique (owner_id, rate_date, quote, source)
);

create table if not exists public.warren_financial_years (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.warren_companies (id) on delete cascade,
  fiscal_label text not null,
  fiscal_year integer,
  kind text not null check (kind in ('historico', 'estimado')),
  sales numeric,
  ebitda numeric,
  ebit numeric,
  net_income numeric,
  bpa numeric,
  shares_diluted numeric,
  cash numeric,
  gross_debt numeric,
  net_debt numeric,
  cfo numeric,
  capex numeric,
  fcf numeric,
  currency text,
  source text not null,
  as_of date,
  note text,
  updated_at timestamptz not null default now(),
  unique (company_id, fiscal_label, source)
);

create table if not exists public.warren_estimates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.warren_companies (id) on delete cascade,
  source text not null check (source in ('warren', 'tikr', 'excel_bajista', 'excel_optimista')),
  horizon_years smallint not null check (horizon_years between 1 and 3),
  fiscal_label text not null,
  bpa numeric,
  bpa_base numeric,
  growth numeric,
  per numeric,
  ev_fcf numeric,
  ev_ebitda numeric,
  ev_ebit numeric,
  fcf numeric,
  ebitda numeric,
  ebit numeric,
  net_debt numeric,
  equity_adjustments numeric,
  diluted_shares numeric,
  target_price numeric,
  target_currency text,
  as_of date,
  note text,
  updated_at timestamptz not null default now(),
  unique (company_id, source, horizon_years, fiscal_label)
);

create table if not exists public.warren_positions (
  company_id uuid primary key references public.warren_companies (id) on delete cascade,
  shares numeric,
  avg_price numeric,
  currency text,
  reported_weight_pct numeric,
  weight_as_of date,
  weight_source text,
  note text,
  updated_at timestamptz not null default now()
);

create table if not exists public.warren_audit (
  id bigint generated always as identity primary key,
  actor uuid,
  table_name text not null,
  operation text not null,
  row_id uuid,
  payload jsonb,
  at timestamptz not null default now()
);

create index if not exists warren_quotes_company_date_idx on public.warren_quotes (company_id, price_date desc, fetched_at desc);
create index if not exists warren_fx_lookup_idx on public.warren_fx_rates (owner_id, quote, rate_date desc);
create index if not exists warren_years_company_idx on public.warren_financial_years (company_id, fiscal_label);
create index if not exists warren_estimates_company_idx on public.warren_estimates (company_id, source, horizon_years);

create or replace function public.warren_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists warren_companies_touch on public.warren_companies;
create trigger warren_companies_touch before update on public.warren_companies
for each row execute function public.warren_set_updated_at();
drop trigger if exists warren_years_touch on public.warren_financial_years;
create trigger warren_years_touch before update on public.warren_financial_years
for each row execute function public.warren_set_updated_at();
drop trigger if exists warren_estimates_touch on public.warren_estimates;
create trigger warren_estimates_touch before update on public.warren_estimates
for each row execute function public.warren_set_updated_at();
drop trigger if exists warren_positions_touch on public.warren_positions;
create trigger warren_positions_touch before update on public.warren_positions
for each row execute function public.warren_set_updated_at();

create or replace function public.warren_audit_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.warren_audit (actor, table_name, operation, row_id, payload)
  values (
    auth.uid(),
    tg_table_name,
    tg_op,
    case when tg_op = 'DELETE' then old.id else new.id end,
    case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$$;

drop trigger if exists warren_companies_audit on public.warren_companies;
create trigger warren_companies_audit after insert or update or delete on public.warren_companies
for each row execute function public.warren_audit_row();
drop trigger if exists warren_quotes_audit on public.warren_quotes;
create trigger warren_quotes_audit after insert or update or delete on public.warren_quotes
for each row execute function public.warren_audit_row();
drop trigger if exists warren_fx_audit on public.warren_fx_rates;
create trigger warren_fx_audit after insert or update or delete on public.warren_fx_rates
for each row execute function public.warren_audit_row();
drop trigger if exists warren_years_audit on public.warren_financial_years;
create trigger warren_years_audit after insert or update or delete on public.warren_financial_years
for each row execute function public.warren_audit_row();
drop trigger if exists warren_estimates_audit on public.warren_estimates;
create trigger warren_estimates_audit after insert or update or delete on public.warren_estimates
for each row execute function public.warren_audit_row();

-- Positions use company_id as primary key, so the audit trigger reads company_id.
create or replace function public.warren_audit_position()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.warren_audit (actor, table_name, operation, row_id, payload)
  values (
    auth.uid(),
    tg_table_name,
    tg_op,
    case when tg_op = 'DELETE' then old.company_id else new.company_id end,
    case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$$;

drop trigger if exists warren_positions_audit on public.warren_positions;
create trigger warren_positions_audit after insert or update or delete on public.warren_positions
for each row execute function public.warren_audit_position();

-- One account only. The first auth user becomes the owner. A second signup is rejected.
create or replace function public.warren_guard_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  existing integer;
begin
  select count(*) into existing from auth.users;
  if existing >= 1 then
    raise exception 'Warren admite un solo usuario';
  end if;
  return new;
end;
$$;

drop trigger if exists warren_guard_signup on auth.users;
create trigger warren_guard_signup
  before insert on auth.users
  for each row execute function public.warren_guard_signup();

create or replace function public.warren_create_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.warren_profile (user_id, email, role)
  values (new.id, new.email, 'owner')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists warren_create_profile on auth.users;
create trigger warren_create_profile
  after insert on auth.users
  for each row execute function public.warren_create_profile();

-- If the account was created before this file ran, attach that single user. Never guess among several.
do $$
declare
  n integer;
begin
  select count(*) into n from auth.users;
  if n = 1 then
    insert into public.warren_profile (user_id, email, role)
    select id, email, 'owner' from auth.users
    on conflict (user_id) do nothing;
  elsif n > 1 then
    raise exception 'Hay más de un usuario en auth.users. Warren admite uno solo; no se ha elegido ninguno.';
  end if;
end $$;

alter table public.warren_profile enable row level security;
alter table public.warren_companies enable row level security;
alter table public.warren_quotes enable row level security;
alter table public.warren_fx_rates enable row level security;
alter table public.warren_financial_years enable row level security;
alter table public.warren_estimates enable row level security;
alter table public.warren_positions enable row level security;
alter table public.warren_audit enable row level security;

alter table public.warren_profile force row level security;
alter table public.warren_companies force row level security;
alter table public.warren_quotes force row level security;
alter table public.warren_fx_rates force row level security;
alter table public.warren_financial_years force row level security;
alter table public.warren_estimates force row level security;
alter table public.warren_positions force row level security;
alter table public.warren_audit force row level security;

revoke all on table
  public.warren_profile,
  public.warren_companies,
  public.warren_quotes,
  public.warren_fx_rates,
  public.warren_financial_years,
  public.warren_estimates,
  public.warren_positions,
  public.warren_audit
from public, anon;

grant select on table public.warren_profile, public.warren_audit to authenticated;
grant select, insert, update, delete on table
  public.warren_companies,
  public.warren_quotes,
  public.warren_fx_rates,
  public.warren_financial_years,
  public.warren_estimates,
  public.warren_positions
to authenticated;

drop policy if exists warren_profile_select on public.warren_profile;
create policy warren_profile_select on public.warren_profile
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists warren_companies_all on public.warren_companies;
create policy warren_companies_all on public.warren_companies
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists warren_quotes_all on public.warren_quotes;
create policy warren_quotes_all on public.warren_quotes
  for all to authenticated
  using (company_id in (select id from public.warren_companies where owner_id = auth.uid()))
  with check (company_id in (select id from public.warren_companies where owner_id = auth.uid()));

drop policy if exists warren_fx_all on public.warren_fx_rates;
create policy warren_fx_all on public.warren_fx_rates
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists warren_years_all on public.warren_financial_years;
create policy warren_years_all on public.warren_financial_years
  for all to authenticated
  using (company_id in (select id from public.warren_companies where owner_id = auth.uid()))
  with check (company_id in (select id from public.warren_companies where owner_id = auth.uid()));

drop policy if exists warren_estimates_all on public.warren_estimates;
create policy warren_estimates_all on public.warren_estimates
  for all to authenticated
  using (company_id in (select id from public.warren_companies where owner_id = auth.uid()))
  with check (company_id in (select id from public.warren_companies where owner_id = auth.uid()));

drop policy if exists warren_positions_all on public.warren_positions;
create policy warren_positions_all on public.warren_positions
  for all to authenticated
  using (company_id in (select id from public.warren_companies where owner_id = auth.uid()))
  with check (company_id in (select id from public.warren_companies where owner_id = auth.uid()));

drop policy if exists warren_audit_select on public.warren_audit;
create policy warren_audit_select on public.warren_audit
  for select to authenticated
  using (actor = auth.uid());

do $$
declare
  t text;
begin
  foreach t in array array[
    'warren_companies', 'warren_quotes', 'warren_fx_rates',
    'warren_financial_years', 'warren_estimates', 'warren_positions'
  ]
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

comment on table public.warren_quotes is 'Daily closes or a manual price. price_date is the session date, fetched_at is when it was stored.';
comment on column public.warren_fx_rates.units_per_eur is 'ECB convention: how many units of quote currency equal 1 EUR.';
comment on column public.warren_estimates.target_price is 'Direct target in target_currency. When null, the site computes PER and EV methods. Never store a zero for a missing input; leave it null.';
comment on column public.warren_positions.reported_weight_pct is 'Weight as published by the source (Excel). Not recomputed.';
