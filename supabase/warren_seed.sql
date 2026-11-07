-- Optional seed for Warren Phase 1. Run AFTER warren_phase1.sql and AFTER Alberto has created his account.
-- Source: the figures already published on /warren/ (Excel 23/10/2026 prices, cuadro de mando 26/10/2026).
-- TIKR, share counts, ECB rates and every missing financial line are left null. Nothing here is invented.
do $seed$
declare
  owner uuid;
  cid uuid;
begin
  select user_id into owner from public.warren_profile limit 1;
  if owner is null then
    raise exception 'Crea antes la cuenta de Alberto. warren_profile está vacía.';
  end if;
  insert into public.warren_companies (owner_id, ticker, name, currency, in_portfolio, classification, quality_stars, verdict, notes, sort)
  values (owner, 'META', 'Meta Platforms', 'USD', true, 'Pendiente', 5, 'Ni fu ni fa: a vigilar', 'Cifras previas al split 2×1 por dividendo en acciones Clase C (19/01/2027).', 1)
  on conflict (owner_id, ticker) do update set name = excluded.name, currency = excluded.currency, in_portfolio = excluded.in_portfolio, classification = excluded.classification, quality_stars = excluded.quality_stars, verdict = excluded.verdict, notes = excluded.notes, sort = excluded.sort;
  select id into cid from public.warren_companies where owner_id = owner and ticker = 'META';
  insert into public.warren_quotes (company_id, price, currency, price_date, source, manual, note)
  values (cid, 623.21, 'USD', date '2026-10-23', 'Excel', false, 'Excel · 23/10/2026')
  on conflict (company_id, price_date, source) do update set price = excluded.price, currency = excluded.currency, note = excluded.note, manual = excluded.manual;
  insert into public.warren_positions (company_id, shares, avg_price, currency, reported_weight_pct, weight_as_of, weight_source, note)
  values (cid, null, 615.89, 'USD', 25.67, date '2026-10-26', 'Excel', 'Peso del Excel. El número de acciones no estaba en la web.')
  on conflict (company_id) do update set avg_price = excluded.avg_price, currency = excluded.currency, reported_weight_pct = excluded.reported_weight_pct, weight_as_of = excluded.weight_as_of, weight_source = excluded.weight_source, note = excluded.note;
  -- shares is left untouched on conflict so a later count typed by Alberto is not wiped.
  insert into public.warren_companies (owner_id, ticker, name, currency, in_portfolio, classification, quality_stars, verdict, notes, sort)
  values (owner, 'ZEG', 'Zegona Communications', 'GBP', true, 'Pendiente', null, 'Ni fu ni fa: a vigilar', 'Valoración por P/FCFE, no PER (BPA distorsionado por PPA). Objetivo 3 años = FY2030.', 2)
  on conflict (owner_id, ticker) do update set name = excluded.name, currency = excluded.currency, in_portfolio = excluded.in_portfolio, classification = excluded.classification, quality_stars = excluded.quality_stars, verdict = excluded.verdict, notes = excluded.notes, sort = excluded.sort;
  select id into cid from public.warren_companies where owner_id = owner and ticker = 'ZEG';
  insert into public.warren_quotes (company_id, price, currency, price_date, source, manual, note)
  values (cid, 16.96, 'GBP', date '2026-10-23', 'Excel', false, 'Excel · 23/10/2026 (1.696 GBX ÷ 100)')
  on conflict (company_id, price_date, source) do update set price = excluded.price, currency = excluded.currency, note = excluded.note, manual = excluded.manual;
  insert into public.warren_positions (company_id, shares, avg_price, currency, reported_weight_pct, weight_as_of, weight_source, note)
  values (cid, null, 13.93, 'GBP', 23.29, date '2026-10-26', 'Excel', 'Peso del Excel. El número de acciones no estaba en la web.')
  on conflict (company_id) do update set avg_price = excluded.avg_price, currency = excluded.currency, reported_weight_pct = excluded.reported_weight_pct, weight_as_of = excluded.weight_as_of, weight_source = excluded.weight_source, note = excluded.note;
  -- shares is left untouched on conflict so a later count typed by Alberto is not wiped.
  insert into public.warren_companies (owner_id, ticker, name, currency, in_portfolio, classification, quality_stars, verdict, notes, sort)
  values (owner, 'MSFT', 'Microsoft', 'USD', true, 'Pendiente', null, 'Pendiente de análisis', '', 3)
  on conflict (owner_id, ticker) do update set name = excluded.name, currency = excluded.currency, in_portfolio = excluded.in_portfolio, classification = excluded.classification, quality_stars = excluded.quality_stars, verdict = excluded.verdict, notes = excluded.notes, sort = excluded.sort;
  select id into cid from public.warren_companies where owner_id = owner and ticker = 'MSFT';
  insert into public.warren_quotes (company_id, price, currency, price_date, source, manual, note)
  values (cid, 524.51, 'USD', date '2026-10-23', 'Excel', false, 'Excel · 23/10/2026')
  on conflict (company_id, price_date, source) do update set price = excluded.price, currency = excluded.currency, note = excluded.note, manual = excluded.manual;
  insert into public.warren_positions (company_id, shares, avg_price, currency, reported_weight_pct, weight_as_of, weight_source, note)
  values (cid, null, 403.6, 'USD', 15.12, date '2026-10-26', 'Excel', 'Peso del Excel. El número de acciones no estaba en la web.')
  on conflict (company_id) do update set avg_price = excluded.avg_price, currency = excluded.currency, reported_weight_pct = excluded.reported_weight_pct, weight_as_of = excluded.weight_as_of, weight_source = excluded.weight_source, note = excluded.note;
  -- shares is left untouched on conflict so a later count typed by Alberto is not wiped.
  insert into public.warren_companies (owner_id, ticker, name, currency, in_portfolio, classification, quality_stars, verdict, notes, sort)
  values (owner, 'GOOGL', 'Alphabet (clase A)', 'USD', true, 'Pendiente', null, 'Pendiente de análisis', '', 4)
  on conflict (owner_id, ticker) do update set name = excluded.name, currency = excluded.currency, in_portfolio = excluded.in_portfolio, classification = excluded.classification, quality_stars = excluded.quality_stars, verdict = excluded.verdict, notes = excluded.notes, sort = excluded.sort;
  select id into cid from public.warren_companies where owner_id = owner and ticker = 'GOOGL';
  insert into public.warren_quotes (company_id, price, currency, price_date, source, manual, note)
  values (cid, 320.21, 'USD', date '2026-10-23', 'Excel', false, 'Excel · 23/10/2026')
  on conflict (company_id, price_date, source) do update set price = excluded.price, currency = excluded.currency, note = excluded.note, manual = excluded.manual;
  insert into public.warren_positions (company_id, shares, avg_price, currency, reported_weight_pct, weight_as_of, weight_source, note)
  values (cid, null, 170.13, 'USD', 7.45, date '2026-10-26', 'Excel', 'Peso del Excel. El número de acciones no estaba en la web.')
  on conflict (company_id) do update set avg_price = excluded.avg_price, currency = excluded.currency, reported_weight_pct = excluded.reported_weight_pct, weight_as_of = excluded.weight_as_of, weight_source = excluded.weight_source, note = excluded.note;
  -- shares is left untouched on conflict so a later count typed by Alberto is not wiped.
  insert into public.warren_companies (owner_id, ticker, name, currency, in_portfolio, classification, quality_stars, verdict, notes, sort)
  values (owner, 'JD', 'JD.com (ADR Nasdaq)', 'USD', true, 'Pendiente', null, 'Esto es un caramelito', 'Modelo Warren 25/10/2026, pendiente de plantilla CCB. PER 11x sobre BPA operativo + caja.', 5)
  on conflict (owner_id, ticker) do update set name = excluded.name, currency = excluded.currency, in_portfolio = excluded.in_portfolio, classification = excluded.classification, quality_stars = excluded.quality_stars, verdict = excluded.verdict, notes = excluded.notes, sort = excluded.sort;
  select id into cid from public.warren_companies where owner_id = owner and ticker = 'JD';
  insert into public.warren_quotes (company_id, price, currency, price_date, source, manual, note)
  values (cid, 25.36, 'USD', date '2026-10-23', 'Excel', false, 'Excel · 23/10/2026 (USD por ADS)')
  on conflict (company_id, price_date, source) do update set price = excluded.price, currency = excluded.currency, note = excluded.note, manual = excluded.manual;
  insert into public.warren_positions (company_id, shares, avg_price, currency, reported_weight_pct, weight_as_of, weight_source, note)
  values (cid, null, 28.85, 'USD', 3.65, date '2026-10-26', 'Excel', 'Peso del Excel. El número de acciones no estaba en la web.')
  on conflict (company_id) do update set avg_price = excluded.avg_price, currency = excluded.currency, reported_weight_pct = excluded.reported_weight_pct, weight_as_of = excluded.weight_as_of, weight_source = excluded.weight_source, note = excluded.note;
  -- shares is left untouched on conflict so a later count typed by Alberto is not wiped.
  insert into public.warren_companies (owner_id, ticker, name, currency, in_portfolio, classification, quality_stars, verdict, notes, sort)
  values (owner, 'AMZN', 'Amazon', 'USD', true, 'Pendiente', null, 'Pendiente de análisis', '', 6)
  on conflict (owner_id, ticker) do update set name = excluded.name, currency = excluded.currency, in_portfolio = excluded.in_portfolio, classification = excluded.classification, quality_stars = excluded.quality_stars, verdict = excluded.verdict, notes = excluded.notes, sort = excluded.sort;
  select id into cid from public.warren_companies where owner_id = owner and ticker = 'AMZN';
  insert into public.warren_quotes (company_id, price, currency, price_date, source, manual, note)
  values (cid, 248, 'USD', date '2026-10-23', 'Excel', false, 'Excel · 23/10/2026')
  on conflict (company_id, price_date, source) do update set price = excluded.price, currency = excluded.currency, note = excluded.note, manual = excluded.manual;
  insert into public.warren_positions (company_id, shares, avg_price, currency, reported_weight_pct, weight_as_of, weight_source, note)
  values (cid, null, 217.09, 'USD', 3.51, date '2026-10-26', 'Excel', 'Peso del Excel. El número de acciones no estaba en la web.')
  on conflict (company_id) do update set avg_price = excluded.avg_price, currency = excluded.currency, reported_weight_pct = excluded.reported_weight_pct, weight_as_of = excluded.weight_as_of, weight_source = excluded.weight_source, note = excluded.note;
  -- shares is left untouched on conflict so a later count typed by Alberto is not wiped.
  insert into public.warren_companies (owner_id, ticker, name, currency, in_portfolio, classification, quality_stars, verdict, notes, sort)
  values (owner, 'WKL', 'Wolters Kluwer', 'EUR', true, 'Pendiente', null, 'Pendiente de análisis', '', 7)
  on conflict (owner_id, ticker) do update set name = excluded.name, currency = excluded.currency, in_portfolio = excluded.in_portfolio, classification = excluded.classification, quality_stars = excluded.quality_stars, verdict = excluded.verdict, notes = excluded.notes, sort = excluded.sort;
  select id into cid from public.warren_companies where owner_id = owner and ticker = 'WKL';
  insert into public.warren_quotes (company_id, price, currency, price_date, source, manual, note)
  values (cid, 88.18, 'EUR', date '2026-10-23', 'Excel', false, 'Excel · 23/10/2026')
  on conflict (company_id, price_date, source) do update set price = excluded.price, currency = excluded.currency, note = excluded.note, manual = excluded.manual;
  insert into public.warren_positions (company_id, shares, avg_price, currency, reported_weight_pct, weight_as_of, weight_source, note)
  values (cid, null, 106.6, 'EUR', 1.42, date '2026-10-26', 'Excel', 'Peso del Excel. El número de acciones no estaba en la web.')
  on conflict (company_id) do update set avg_price = excluded.avg_price, currency = excluded.currency, reported_weight_pct = excluded.reported_weight_pct, weight_as_of = excluded.weight_as_of, weight_source = excluded.weight_source, note = excluded.note;
  -- shares is left untouched on conflict so a later count typed by Alberto is not wiped.
  select id into cid from public.warren_companies where owner_id = owner and ticker = 'META';
  insert into public.warren_estimates (company_id, source, horizon_years, fiscal_label, bpa_base, growth, per, target_price, target_currency, as_of, note)
  values (cid, 'warren', 3, '2029', 28.4, 0.187, 20, null, 'USD', date '2026-10-26', 'BPA FY2026e 28,40 → FY2029e 47,51 · PER base 20x. Excel publica 950,21; la fórmula da 949,95 por redondeo.')
  on conflict (company_id, source, horizon_years, fiscal_label) do update set bpa_base = excluded.bpa_base, growth = excluded.growth, per = excluded.per, target_price = excluded.target_price, target_currency = excluded.target_currency, as_of = excluded.as_of, note = excluded.note;
  select id into cid from public.warren_companies where owner_id = owner and ticker = 'META';
  insert into public.warren_estimates (company_id, source, horizon_years, fiscal_label, bpa_base, growth, per, target_price, target_currency, as_of, note)
  values (cid, 'excel_bajista', 3, '2029', null, null, null, 316.73, 'USD', date '2026-10-26', 'Valor bajista CCB v1.2 (PER 16x)')
  on conflict (company_id, source, horizon_years, fiscal_label) do update set bpa_base = excluded.bpa_base, growth = excluded.growth, per = excluded.per, target_price = excluded.target_price, target_currency = excluded.target_currency, as_of = excluded.as_of, note = excluded.note;
  select id into cid from public.warren_companies where owner_id = owner and ticker = 'META';
  insert into public.warren_estimates (company_id, source, horizon_years, fiscal_label, bpa_base, growth, per, target_price, target_currency, as_of, note)
  values (cid, 'excel_optimista', 3, '2029', null, null, null, 1319.75, 'USD', date '2026-10-26', 'Valor alcista CCB v1.2 (PER 25x)')
  on conflict (company_id, source, horizon_years, fiscal_label) do update set bpa_base = excluded.bpa_base, growth = excluded.growth, per = excluded.per, target_price = excluded.target_price, target_currency = excluded.target_currency, as_of = excluded.as_of, note = excluded.note;
  select id into cid from public.warren_companies where owner_id = owner and ticker = 'ZEG';
  insert into public.warren_estimates (company_id, source, horizon_years, fiscal_label, bpa_base, growth, per, target_price, target_currency, as_of, note)
  values (cid, 'warren', 3, 'FY30', null, null, null, 20.79, 'GBP', date '2026-10-26', 'Objetivo base 3 años FY2030 (P/FCFE 9x)')
  on conflict (company_id, source, horizon_years, fiscal_label) do update set bpa_base = excluded.bpa_base, growth = excluded.growth, per = excluded.per, target_price = excluded.target_price, target_currency = excluded.target_currency, as_of = excluded.as_of, note = excluded.note;
  select id into cid from public.warren_companies where owner_id = owner and ticker = 'ZEG';
  insert into public.warren_estimates (company_id, source, horizon_years, fiscal_label, bpa_base, growth, per, target_price, target_currency, as_of, note)
  values (cid, 'excel_bajista', 3, 'FY30', null, null, null, 6.3, 'GBP', date '2026-10-26', 'Valor bajista CCB v1.2 (P/FCFE 7x)')
  on conflict (company_id, source, horizon_years, fiscal_label) do update set bpa_base = excluded.bpa_base, growth = excluded.growth, per = excluded.per, target_price = excluded.target_price, target_currency = excluded.target_currency, as_of = excluded.as_of, note = excluded.note;
  select id into cid from public.warren_companies where owner_id = owner and ticker = 'ZEG';
  insert into public.warren_estimates (company_id, source, horizon_years, fiscal_label, bpa_base, growth, per, target_price, target_currency, as_of, note)
  values (cid, 'excel_optimista', 3, 'FY30', null, null, null, 27.67, 'GBP', date '2026-10-26', 'Valor alcista CCB v1.2 (P/FCFE 11x)')
  on conflict (company_id, source, horizon_years, fiscal_label) do update set bpa_base = excluded.bpa_base, growth = excluded.growth, per = excluded.per, target_price = excluded.target_price, target_currency = excluded.target_currency, as_of = excluded.as_of, note = excluded.note;
  select id into cid from public.warren_companies where owner_id = owner and ticker = 'JD';
  insert into public.warren_estimates (company_id, source, horizon_years, fiscal_label, bpa_base, growth, per, target_price, target_currency, as_of, note)
  values (cid, 'warren', 3, '2029', null, null, null, 68.8, 'USD', date '2026-10-25', 'Objetivo base 3 años 2029 (modelo Warren)')
  on conflict (company_id, source, horizon_years, fiscal_label) do update set bpa_base = excluded.bpa_base, growth = excluded.growth, per = excluded.per, target_price = excluded.target_price, target_currency = excluded.target_currency, as_of = excluded.as_of, note = excluded.note;
  select id into cid from public.warren_companies where owner_id = owner and ticker = 'JD';
  insert into public.warren_estimates (company_id, source, horizon_years, fiscal_label, bpa_base, growth, per, target_price, target_currency, as_of, note)
  values (cid, 'excel_bajista', 3, '2029', null, null, null, 23.1, 'USD', date '2026-10-25', 'Valor conservador del modelo Warren (PER 8x)')
  on conflict (company_id, source, horizon_years, fiscal_label) do update set bpa_base = excluded.bpa_base, growth = excluded.growth, per = excluded.per, target_price = excluded.target_price, target_currency = excluded.target_currency, as_of = excluded.as_of, note = excluded.note;
  select id into cid from public.warren_companies where owner_id = owner and ticker = 'JD';
  insert into public.warren_estimates (company_id, source, horizon_years, fiscal_label, bpa_base, growth, per, target_price, target_currency, as_of, note)
  values (cid, 'excel_optimista', 3, '2029', null, null, null, 105.1, 'USD', date '2026-10-25', 'Valor optimista del modelo Warren (PER 14x)')
  on conflict (company_id, source, horizon_years, fiscal_label) do update set bpa_base = excluded.bpa_base, growth = excluded.growth, per = excluded.per, target_price = excluded.target_price, target_currency = excluded.target_currency, as_of = excluded.as_of, note = excluded.note;
  select id into cid from public.warren_companies where owner_id = owner and ticker = 'META';
  insert into public.warren_financial_years (company_id, fiscal_label, fiscal_year, kind, bpa, currency, source, as_of, note)
  values (cid, '2016', 2016, 'historico', 3.49, 'USD', 'Excel', date '2026-10-26', 'Excel · pestaña BPA · [H] SEC 10-K · [E] escenario Base. USD por acción (pre-split).')
  on conflict (company_id, fiscal_label, source) do update set fiscal_year = excluded.fiscal_year, kind = excluded.kind, bpa = excluded.bpa, currency = excluded.currency, as_of = excluded.as_of, note = excluded.note;
  select id into cid from public.warren_companies where owner_id = owner and ticker = 'META';
  insert into public.warren_financial_years (company_id, fiscal_label, fiscal_year, kind, bpa, currency, source, as_of, note)
  values (cid, '2017', 2017, 'historico', 5.39, 'USD', 'Excel', date '2026-10-26', 'Excel · pestaña BPA · [H] SEC 10-K · [E] escenario Base. USD por acción (pre-split).')
  on conflict (company_id, fiscal_label, source) do update set fiscal_year = excluded.fiscal_year, kind = excluded.kind, bpa = excluded.bpa, currency = excluded.currency, as_of = excluded.as_of, note = excluded.note;
  select id into cid from public.warren_companies where owner_id = owner and ticker = 'META';
  insert into public.warren_financial_years (company_id, fiscal_label, fiscal_year, kind, bpa, currency, source, as_of, note)
  values (cid, '2018', 2018, 'historico', 7.57, 'USD', 'Excel', date '2026-10-26', 'Excel · pestaña BPA · [H] SEC 10-K · [E] escenario Base. USD por acción (pre-split).')
  on conflict (company_id, fiscal_label, source) do update set fiscal_year = excluded.fiscal_year, kind = excluded.kind, bpa = excluded.bpa, currency = excluded.currency, as_of = excluded.as_of, note = excluded.note;
  select id into cid from public.warren_companies where owner_id = owner and ticker = 'META';
  insert into public.warren_financial_years (company_id, fiscal_label, fiscal_year, kind, bpa, currency, source, as_of, note)
  values (cid, '2019', 2019, 'historico', 6.43, 'USD', 'Excel', date '2026-10-26', 'Excel · pestaña BPA · [H] SEC 10-K · [E] escenario Base. USD por acción (pre-split).')
  on conflict (company_id, fiscal_label, source) do update set fiscal_year = excluded.fiscal_year, kind = excluded.kind, bpa = excluded.bpa, currency = excluded.currency, as_of = excluded.as_of, note = excluded.note;
  select id into cid from public.warren_companies where owner_id = owner and ticker = 'META';
  insert into public.warren_financial_years (company_id, fiscal_label, fiscal_year, kind, bpa, currency, source, as_of, note)
  values (cid, '2020', 2020, 'historico', 10.09, 'USD', 'Excel', date '2026-10-26', 'Excel · pestaña BPA · [H] SEC 10-K · [E] escenario Base. USD por acción (pre-split).')
  on conflict (company_id, fiscal_label, source) do update set fiscal_year = excluded.fiscal_year, kind = excluded.kind, bpa = excluded.bpa, currency = excluded.currency, as_of = excluded.as_of, note = excluded.note;
  select id into cid from public.warren_companies where owner_id = owner and ticker = 'META';
  insert into public.warren_financial_years (company_id, fiscal_label, fiscal_year, kind, bpa, currency, source, as_of, note)
  values (cid, '2021', 2021, 'historico', 13.77, 'USD', 'Excel', date '2026-10-26', 'Excel · pestaña BPA · [H] SEC 10-K · [E] escenario Base. USD por acción (pre-split).')
  on conflict (company_id, fiscal_label, source) do update set fiscal_year = excluded.fiscal_year, kind = excluded.kind, bpa = excluded.bpa, currency = excluded.currency, as_of = excluded.as_of, note = excluded.note;
  select id into cid from public.warren_companies where owner_id = owner and ticker = 'META';
  insert into public.warren_financial_years (company_id, fiscal_label, fiscal_year, kind, bpa, currency, source, as_of, note)
  values (cid, '2022', 2022, 'historico', 8.59, 'USD', 'Excel', date '2026-10-26', 'Excel · pestaña BPA · [H] SEC 10-K · [E] escenario Base. USD por acción (pre-split).')
  on conflict (company_id, fiscal_label, source) do update set fiscal_year = excluded.fiscal_year, kind = excluded.kind, bpa = excluded.bpa, currency = excluded.currency, as_of = excluded.as_of, note = excluded.note;
  select id into cid from public.warren_companies where owner_id = owner and ticker = 'META';
  insert into public.warren_financial_years (company_id, fiscal_label, fiscal_year, kind, bpa, currency, source, as_of, note)
  values (cid, '2023', 2023, 'historico', 14.87, 'USD', 'Excel', date '2026-10-26', 'Excel · pestaña BPA · [H] SEC 10-K · [E] escenario Base. USD por acción (pre-split).')
  on conflict (company_id, fiscal_label, source) do update set fiscal_year = excluded.fiscal_year, kind = excluded.kind, bpa = excluded.bpa, currency = excluded.currency, as_of = excluded.as_of, note = excluded.note;
  select id into cid from public.warren_companies where owner_id = owner and ticker = 'META';
  insert into public.warren_financial_years (company_id, fiscal_label, fiscal_year, kind, bpa, currency, source, as_of, note)
  values (cid, '2024', 2024, 'historico', 23.86, 'USD', 'Excel', date '2026-10-26', 'Excel · pestaña BPA · [H] SEC 10-K · [E] escenario Base. USD por acción (pre-split).')
  on conflict (company_id, fiscal_label, source) do update set fiscal_year = excluded.fiscal_year, kind = excluded.kind, bpa = excluded.bpa, currency = excluded.currency, as_of = excluded.as_of, note = excluded.note;
  select id into cid from public.warren_companies where owner_id = owner and ticker = 'META';
  insert into public.warren_financial_years (company_id, fiscal_label, fiscal_year, kind, bpa, currency, source, as_of, note)
  values (cid, '2025', 2025, 'historico', 23.49, 'USD', 'Excel', date '2026-10-26', 'Excel · pestaña BPA · [H] SEC 10-K · [E] escenario Base. USD por acción (pre-split).')
  on conflict (company_id, fiscal_label, source) do update set fiscal_year = excluded.fiscal_year, kind = excluded.kind, bpa = excluded.bpa, currency = excluded.currency, as_of = excluded.as_of, note = excluded.note;
  select id into cid from public.warren_companies where owner_id = owner and ticker = 'META';
  insert into public.warren_financial_years (company_id, fiscal_label, fiscal_year, kind, bpa, currency, source, as_of, note)
  values (cid, '2026e', 2026, 'estimado', 28.4, 'USD', 'Excel', date '2026-10-26', 'Excel · pestaña BPA · [H] SEC 10-K · [E] escenario Base. USD por acción (pre-split).')
  on conflict (company_id, fiscal_label, source) do update set fiscal_year = excluded.fiscal_year, kind = excluded.kind, bpa = excluded.bpa, currency = excluded.currency, as_of = excluded.as_of, note = excluded.note;
  select id into cid from public.warren_companies where owner_id = owner and ticker = 'META';
  insert into public.warren_financial_years (company_id, fiscal_label, fiscal_year, kind, bpa, currency, source, as_of, note)
  values (cid, '2027e', 2027, 'estimado', 35.11, 'USD', 'Excel', date '2026-10-26', 'Excel · pestaña BPA · [H] SEC 10-K · [E] escenario Base. USD por acción (pre-split).')
  on conflict (company_id, fiscal_label, source) do update set fiscal_year = excluded.fiscal_year, kind = excluded.kind, bpa = excluded.bpa, currency = excluded.currency, as_of = excluded.as_of, note = excluded.note;
  select id into cid from public.warren_companies where owner_id = owner and ticker = 'META';
  insert into public.warren_financial_years (company_id, fiscal_label, fiscal_year, kind, bpa, currency, source, as_of, note)
  values (cid, '2028e', 2028, 'estimado', 41.13, 'USD', 'Excel', date '2026-10-26', 'Excel · pestaña BPA · [H] SEC 10-K · [E] escenario Base. USD por acción (pre-split).')
  on conflict (company_id, fiscal_label, source) do update set fiscal_year = excluded.fiscal_year, kind = excluded.kind, bpa = excluded.bpa, currency = excluded.currency, as_of = excluded.as_of, note = excluded.note;
  select id into cid from public.warren_companies where owner_id = owner and ticker = 'META';
  insert into public.warren_financial_years (company_id, fiscal_label, fiscal_year, kind, bpa, currency, source, as_of, note)
  values (cid, '2029e', 2029, 'estimado', 47.51, 'USD', 'Excel', date '2026-10-26', 'Excel · pestaña BPA · [H] SEC 10-K · [E] escenario Base. USD por acción (pre-split).')
  on conflict (company_id, fiscal_label, source) do update set fiscal_year = excluded.fiscal_year, kind = excluded.kind, bpa = excluded.bpa, currency = excluded.currency, as_of = excluded.as_of, note = excluded.note;
  select id into cid from public.warren_companies where owner_id = owner and ticker = 'META';
  insert into public.warren_financial_years (company_id, fiscal_label, fiscal_year, kind, bpa, currency, source, as_of, note)
  values (cid, '2030e', 2030, 'estimado', 53.8, 'USD', 'Excel', date '2026-10-26', 'Excel · pestaña BPA · [H] SEC 10-K · [E] escenario Base. USD por acción (pre-split).')
  on conflict (company_id, fiscal_label, source) do update set fiscal_year = excluded.fiscal_year, kind = excluded.kind, bpa = excluded.bpa, currency = excluded.currency, as_of = excluded.as_of, note = excluded.note;
  select id into cid from public.warren_companies where owner_id = owner and ticker = 'JD';
  insert into public.warren_financial_years (company_id, fiscal_label, fiscal_year, kind, bpa, currency, source, as_of, note)
  values (cid, '2023', 2023, 'historico', 15.23, 'RMB', 'Excel', date '2026-10-25', 'Excel · pestaña BPA · [H] 20-F · [E] modelo Warren. RMB por ADS (BPA diluido). No convierte a USD.')
  on conflict (company_id, fiscal_label, source) do update set fiscal_year = excluded.fiscal_year, kind = excluded.kind, bpa = excluded.bpa, currency = excluded.currency, as_of = excluded.as_of, note = excluded.note;
  select id into cid from public.warren_companies where owner_id = owner and ticker = 'JD';
  insert into public.warren_financial_years (company_id, fiscal_label, fiscal_year, kind, bpa, currency, source, as_of, note)
  values (cid, '2024', 2024, 'historico', 26.86, 'RMB', 'Excel', date '2026-10-25', 'Excel · pestaña BPA · [H] 20-F · [E] modelo Warren. RMB por ADS (BPA diluido). No convierte a USD.')
  on conflict (company_id, fiscal_label, source) do update set fiscal_year = excluded.fiscal_year, kind = excluded.kind, bpa = excluded.bpa, currency = excluded.currency, as_of = excluded.as_of, note = excluded.note;
  select id into cid from public.warren_companies where owner_id = owner and ticker = 'JD';
  insert into public.warren_financial_years (company_id, fiscal_label, fiscal_year, kind, bpa, currency, source, as_of, note)
  values (cid, '2025', 2025, 'historico', 12.9, 'RMB', 'Excel', date '2026-10-25', 'Excel · pestaña BPA · [H] 20-F · [E] modelo Warren. RMB por ADS (BPA diluido). No convierte a USD.')
  on conflict (company_id, fiscal_label, source) do update set fiscal_year = excluded.fiscal_year, kind = excluded.kind, bpa = excluded.bpa, currency = excluded.currency, as_of = excluded.as_of, note = excluded.note;
  select id into cid from public.warren_companies where owner_id = owner and ticker = 'JD';
  insert into public.warren_financial_years (company_id, fiscal_label, fiscal_year, kind, bpa, currency, source, as_of, note)
  values (cid, '2026e', 2026, 'estimado', 14.81, 'RMB', 'Excel', date '2026-10-25', 'Excel · pestaña BPA · [H] 20-F · [E] modelo Warren. RMB por ADS (BPA diluido). No convierte a USD.')
  on conflict (company_id, fiscal_label, source) do update set fiscal_year = excluded.fiscal_year, kind = excluded.kind, bpa = excluded.bpa, currency = excluded.currency, as_of = excluded.as_of, note = excluded.note;
  select id into cid from public.warren_companies where owner_id = owner and ticker = 'JD';
  insert into public.warren_financial_years (company_id, fiscal_label, fiscal_year, kind, bpa, currency, source, as_of, note)
  values (cid, '2027e', 2027, 'estimado', 26.25, 'RMB', 'Excel', date '2026-10-25', 'Excel · pestaña BPA · [H] 20-F · [E] modelo Warren. RMB por ADS (BPA diluido). No convierte a USD.')
  on conflict (company_id, fiscal_label, source) do update set fiscal_year = excluded.fiscal_year, kind = excluded.kind, bpa = excluded.bpa, currency = excluded.currency, as_of = excluded.as_of, note = excluded.note;
  select id into cid from public.warren_companies where owner_id = owner and ticker = 'JD';
  insert into public.warren_financial_years (company_id, fiscal_label, fiscal_year, kind, bpa, currency, source, as_of, note)
  values (cid, '2028e', 2028, 'estimado', 33.24, 'RMB', 'Excel', date '2026-10-25', 'Excel · pestaña BPA · [H] 20-F · [E] modelo Warren. RMB por ADS (BPA diluido). No convierte a USD.')
  on conflict (company_id, fiscal_label, source) do update set fiscal_year = excluded.fiscal_year, kind = excluded.kind, bpa = excluded.bpa, currency = excluded.currency, as_of = excluded.as_of, note = excluded.note;
  select id into cid from public.warren_companies where owner_id = owner and ticker = 'JD';
  insert into public.warren_financial_years (company_id, fiscal_label, fiscal_year, kind, bpa, currency, source, as_of, note)
  values (cid, '2029e', 2029, 'estimado', 38.03, 'RMB', 'Excel', date '2026-10-25', 'Excel · pestaña BPA · [H] 20-F · [E] modelo Warren. RMB por ADS (BPA diluido). No convierte a USD.')
  on conflict (company_id, fiscal_label, source) do update set fiscal_year = excluded.fiscal_year, kind = excluded.kind, bpa = excluded.bpa, currency = excluded.currency, as_of = excluded.as_of, note = excluded.note;
  select id into cid from public.warren_companies where owner_id = owner and ticker = 'JD';
  insert into public.warren_financial_years (company_id, fiscal_label, fiscal_year, kind, bpa, currency, source, as_of, note)
  values (cid, '2030e', 2030, 'estimado', 41.9, 'RMB', 'Excel', date '2026-10-25', 'Excel · pestaña BPA · [H] 20-F · [E] modelo Warren. RMB por ADS (BPA diluido). No convierte a USD.')
  on conflict (company_id, fiscal_label, source) do update set fiscal_year = excluded.fiscal_year, kind = excluded.kind, bpa = excluded.bpa, currency = excluded.currency, as_of = excluded.as_of, note = excluded.note;
  select id into cid from public.warren_companies where owner_id = owner and ticker = 'ZEG';
  insert into public.warren_financial_years (company_id, fiscal_label, fiscal_year, kind, bpa, currency, source, as_of, note)
  values (cid, 'FY25', null, 'historico', -0.51, 'GBP', 'Excel', date '2026-10-26', 'Excel · pestaña BPA · ejercicio a 31/03. No es la base de la valoración (P/FCFE).')
  on conflict (company_id, fiscal_label, source) do update set fiscal_year = excluded.fiscal_year, kind = excluded.kind, bpa = excluded.bpa, currency = excluded.currency, as_of = excluded.as_of, note = excluded.note;
  select id into cid from public.warren_companies where owner_id = owner and ticker = 'ZEG';
  insert into public.warren_financial_years (company_id, fiscal_label, fiscal_year, kind, bpa, currency, source, as_of, note)
  values (cid, 'FY26', null, 'historico', -0.25, 'GBP', 'Excel', date '2026-10-26', 'Excel · pestaña BPA · ejercicio a 31/03. No es la base de la valoración (P/FCFE).')
  on conflict (company_id, fiscal_label, source) do update set fiscal_year = excluded.fiscal_year, kind = excluded.kind, bpa = excluded.bpa, currency = excluded.currency, as_of = excluded.as_of, note = excluded.note;
  select id into cid from public.warren_companies where owner_id = owner and ticker = 'ZEG';
  insert into public.warren_financial_years (company_id, fiscal_label, fiscal_year, kind, bpa, currency, source, as_of, note)
  values (cid, 'FY27e', null, 'estimado', 0.52, 'GBP', 'Excel', date '2026-10-26', 'Excel · pestaña BPA · ejercicio a 31/03. No es la base de la valoración (P/FCFE).')
  on conflict (company_id, fiscal_label, source) do update set fiscal_year = excluded.fiscal_year, kind = excluded.kind, bpa = excluded.bpa, currency = excluded.currency, as_of = excluded.as_of, note = excluded.note;
  select id into cid from public.warren_companies where owner_id = owner and ticker = 'ZEG';
  insert into public.warren_financial_years (company_id, fiscal_label, fiscal_year, kind, bpa, currency, source, as_of, note)
  values (cid, 'FY28e', null, 'estimado', 0.68, 'GBP', 'Excel', date '2026-10-26', 'Excel · pestaña BPA · ejercicio a 31/03. No es la base de la valoración (P/FCFE).')
  on conflict (company_id, fiscal_label, source) do update set fiscal_year = excluded.fiscal_year, kind = excluded.kind, bpa = excluded.bpa, currency = excluded.currency, as_of = excluded.as_of, note = excluded.note;
  select id into cid from public.warren_companies where owner_id = owner and ticker = 'ZEG';
  insert into public.warren_financial_years (company_id, fiscal_label, fiscal_year, kind, bpa, currency, source, as_of, note)
  values (cid, 'FY29e', null, 'estimado', 0.8, 'GBP', 'Excel', date '2026-10-26', 'Excel · pestaña BPA · ejercicio a 31/03. No es la base de la valoración (P/FCFE).')
  on conflict (company_id, fiscal_label, source) do update set fiscal_year = excluded.fiscal_year, kind = excluded.kind, bpa = excluded.bpa, currency = excluded.currency, as_of = excluded.as_of, note = excluded.note;
  select id into cid from public.warren_companies where owner_id = owner and ticker = 'ZEG';
  insert into public.warren_financial_years (company_id, fiscal_label, fiscal_year, kind, bpa, currency, source, as_of, note)
  values (cid, 'FY30e', null, 'estimado', 0.81, 'GBP', 'Excel', date '2026-10-26', 'Excel · pestaña BPA · ejercicio a 31/03. No es la base de la valoración (P/FCFE).')
  on conflict (company_id, fiscal_label, source) do update set fiscal_year = excluded.fiscal_year, kind = excluded.kind, bpa = excluded.bpa, currency = excluded.currency, as_of = excluded.as_of, note = excluded.note;
end
$seed$;
