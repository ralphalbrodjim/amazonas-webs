-- Warren Investment Intelligence · Phase 2
-- Run in the Supabase SQL editor after warren_phase1.sql.
-- Does not touch public.app_state, public.content, or the phase 1 rows.
-- Anon has no access. Authenticated writes require auth.uid() = owner_id.
-- No sample rows: empty tables stay empty.

create table if not exists public.warren_radar (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.warren_profile (user_id) on delete cascade,
  company_id uuid references public.warren_companies (id) on delete set null,
  ticker text not null,
  name text not null default '',
  status text not null default 'vigilar' check (status in ('vigilar', 'en_analisis', 'descartada')),
  thesis text not null default '',
  as_of date,
  note text,
  sort integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.warren_news (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.warren_profile (user_id) on delete cascade,
  company_id uuid references public.warren_companies (id) on delete set null,
  ticker text not null default '',
  published_on date not null,
  kind text not null check (kind in ('noticia', 'comentario', 'idea')),
  title text not null,
  url text not null default '',
  source text not null default '',
  summary text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.warren_virtual_entries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.warren_profile (user_id) on delete cascade,
  company_id uuid references public.warren_companies (id) on delete set null,
  ticker text not null,
  entered_on date not null,
  entry_price numeric not null check (entry_price > 0),
  currency text not null,
  price_source text not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.warren_benchmark_levels (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.warren_profile (user_id) on delete cascade,
  symbol text not null,
  name text not null default '',
  price_date date not null,
  level numeric not null check (level > 0),
  source text not null,
  updated_at timestamptz not null default now(),
  unique (owner_id, symbol, price_date)
);

create index if not exists warren_radar_owner_idx on public.warren_radar (owner_id, sort, ticker);
create index if not exists warren_news_owner_date_idx on public.warren_news (owner_id, published_on desc, created_at desc);
create index if not exists warren_virtual_owner_idx on public.warren_virtual_entries (owner_id, entered_on desc);
create index if not exists warren_benchmark_owner_idx on public.warren_benchmark_levels (owner_id, symbol, price_date);

drop trigger if exists warren_radar_touch on public.warren_radar;
create trigger warren_radar_touch before update on public.warren_radar
for each row execute function public.warren_set_updated_at();
drop trigger if exists warren_benchmark_touch on public.warren_benchmark_levels;
create trigger warren_benchmark_touch before update on public.warren_benchmark_levels
for each row execute function public.warren_set_updated_at();

drop trigger if exists warren_radar_audit on public.warren_radar;
create trigger warren_radar_audit after insert or update or delete on public.warren_radar
for each row execute function public.warren_audit_row();
drop trigger if exists warren_news_audit on public.warren_news;
create trigger warren_news_audit after insert or update or delete on public.warren_news
for each row execute function public.warren_audit_row();
drop trigger if exists warren_virtual_audit on public.warren_virtual_entries;
create trigger warren_virtual_audit after insert or update or delete on public.warren_virtual_entries
for each row execute function public.warren_audit_row();
drop trigger if exists warren_benchmark_audit on public.warren_benchmark_levels;
create trigger warren_benchmark_audit after insert or update or delete on public.warren_benchmark_levels
for each row execute function public.warren_audit_row();

alter table public.warren_radar enable row level security;
alter table public.warren_news enable row level security;
alter table public.warren_virtual_entries enable row level security;
alter table public.warren_benchmark_levels enable row level security;
alter table public.warren_radar force row level security;
alter table public.warren_news force row level security;
alter table public.warren_virtual_entries force row level security;
alter table public.warren_benchmark_levels force row level security;

revoke all on table
  public.warren_radar,
  public.warren_news,
  public.warren_virtual_entries,
  public.warren_benchmark_levels
from public, anon;

grant select, insert, update, delete on table
  public.warren_radar,
  public.warren_news,
  public.warren_virtual_entries,
  public.warren_benchmark_levels
to authenticated;

drop policy if exists warren_radar_all on public.warren_radar;
create policy warren_radar_all on public.warren_radar
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists warren_news_all on public.warren_news;
create policy warren_news_all on public.warren_news
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists warren_virtual_all on public.warren_virtual_entries;
create policy warren_virtual_all on public.warren_virtual_entries
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists warren_benchmark_all on public.warren_benchmark_levels;
create policy warren_benchmark_all on public.warren_benchmark_levels
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

do $$
declare
  t text;
begin
  foreach t in array array['warren_radar', 'warren_news', 'warren_virtual_entries', 'warren_benchmark_levels']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

comment on table public.warren_radar is 'Watchlist candidates. Metrics come from warren_quotes when the ticker matches a company. No seeded ideas.';
comment on table public.warren_news is 'Daily notes and news typed or inserted by SQL. Newest published_on first. Not a feed scraper.';
comment on table public.warren_virtual_entries is 'Simulated entries. Return is latest close / entry_price - 1. No share count and no euros.';
comment on table public.warren_benchmark_levels is 'Index levels by date. Two dates are required before a price return exists.';
comment on table public.warren_financial_years is 'Historical or estimated year. source TIKR holds a manual TIKR export, at most the next three fiscal years. Null lines stay null.';
