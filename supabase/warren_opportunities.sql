-- Warren · Oportunidades
-- Run this once in the Supabase SQL editor (postgres). Do not run it from the website.
-- It does not insert companies, prices, or portfolio rows.
--
-- Alberto approves a proposal from the Radar screen (button OK).
-- The function adds the ticker to warren_companies with in_portfolio = false,
-- the same pattern as DUOL, and never writes warren_positions.

create table if not exists public.warren_opportunities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.warren_profile (user_id) on delete cascade,
  ticker text not null,
  name text not null,
  reason text not null,
  report_md text,
  currency text,
  exchange text,
  api_symbol text,
  quote_unit text,
  cik text,
  status text not null default 'pending' check (status in ('pending', 'approved')),
  company_id uuid references public.warren_companies (id) on delete set null,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  unique (owner_id, ticker)
);

-- Already applied on the live database. report_md is the private Markdown analysis.
-- The website only reads it. Do not store the text in this repository.
alter table public.warren_opportunities add column if not exists report_md text;

alter table public.warren_opportunities enable row level security;
alter table public.warren_opportunities force row level security;

revoke all on table public.warren_opportunities from public, anon;
grant select on table public.warren_opportunities to authenticated;

drop policy if exists warren_opportunities_select on public.warren_opportunities;
create policy warren_opportunities_select on public.warren_opportunities
  for select to authenticated
  using (owner_id = auth.uid());

create or replace function public.warren_approve_opportunity(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  rec public.warren_opportunities%rowtype;
  cid uuid;
begin
  if auth.uid() is null then
    raise exception 'Warren: autenticación requerida';
  end if;
  select user_id into v_owner
  from public.warren_profile
  where user_id = auth.uid() and role = 'owner';
  if v_owner is null then
    raise exception 'Warren: solo el owner';
  end if;

  select * into rec
  from public.warren_opportunities
  where id = p_id and owner_id = v_owner
  for update;
  if not found then
    raise exception 'La propuesta no existe';
  end if;
  if rec.status = 'approved' then
    return jsonb_build_object('ok', true, 'already', true, 'company_id', rec.company_id);
  end if;

  select id into cid
  from public.warren_companies
  where owner_id = v_owner and ticker = upper(rec.ticker);

  if cid is null then
    if rec.currency is null or length(trim(rec.currency)) = 0 then
      raise exception 'Falta la divisa; no se inventa';
    end if;
    if rec.name is null or length(trim(rec.name)) = 0 then
      raise exception 'Falta el nombre; no se inventa';
    end if;
    insert into public.warren_companies (
      owner_id, ticker, name, currency, exchange, api_symbol, quote_unit, cik, in_portfolio, notes
    ) values (
      v_owner,
      upper(rec.ticker),
      rec.name,
      upper(rec.currency),
      nullif(trim(rec.exchange), ''),
      nullif(trim(rec.api_symbol), ''),
      coalesce(nullif(trim(rec.quote_unit), ''), '1'),
      nullif(trim(rec.cik), ''),
      false,
      rec.reason
    )
    returning id into cid;
  end if;

  update public.warren_opportunities
  set status = 'approved', approved_at = now(), company_id = cid
  where id = rec.id;

  return jsonb_build_object('ok', true, 'already', false, 'company_id', cid);
end;
$$;

revoke all on function public.warren_approve_opportunity(uuid) from public, anon;
grant execute on function public.warren_approve_opportunity(uuid) to authenticated;

-- How Warren or Ralph adds a real proposal. Do not run the example as-is.
-- Replace every placeholder with a figure that already exists in a free source.
-- Leave cik null when no free source has it. Never insert a price or a holding.
--
-- insert into public.warren_opportunities
--   (owner_id, ticker, name, reason, currency, exchange, api_symbol, quote_unit, cik)
-- select user_id, 'TICKER', 'Nombre legal', 'Motivo breve', 'USD', 'NASDAQ', 'TICKER', '1', null
-- from public.warren_profile
-- where role = 'owner';
