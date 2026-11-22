-- Alberto's own notes on Detalle → Notas. One row per company.
-- Does not change warren_companies.notes (that text stays on the company sheet).
-- Run once in the Supabase SQL editor. The website does not run this.

create table if not exists public.warren_company_notes (
  company_id uuid primary key references public.warren_companies (id) on delete cascade,
  body text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.warren_company_notes enable row level security;
alter table public.warren_company_notes force row level security;

revoke all on table public.warren_company_notes from public, anon;
grant select, insert, update, delete on table public.warren_company_notes to authenticated;

drop policy if exists warren_company_notes_all on public.warren_company_notes;
create policy warren_company_notes_all on public.warren_company_notes
  for all to authenticated
  using (company_id in (select id from public.warren_companies where owner_id = auth.uid()))
  with check (company_id in (select id from public.warren_companies where owner_id = auth.uid()));

drop trigger if exists warren_company_notes_touch on public.warren_company_notes;
create trigger warren_company_notes_touch
  before update on public.warren_company_notes
  for each row execute function public.warren_set_updated_at();

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'warren_company_notes'
  ) then
    alter publication supabase_realtime add table public.warren_company_notes;
  end if;
end $$;

comment on table public.warren_company_notes is 'Editable notes Alberto writes in Detalle. Empty body is a blank note, not a missing company.';
