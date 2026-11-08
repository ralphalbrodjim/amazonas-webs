# Warren Phase 1

Private tables for `/warren/`. They are not `app_state` or `content`, and chef/semana do not read them.

Anon has no privileges. Row Level Security is forced. A logged-in session can read and write only rows owned by `auth.uid()`. The SQL editor (and the service role) bypasses RLS, which is how Warren and Ralph insert rows later. Never put the service role key in the website.

## What Alberto runs

1. Supabase → SQL editor → run `supabase/warren_phase1.sql` once.
2. Authentication → URL configuration.
   - Site URL: `https://ralphalbrodjim.github.io/amazonas-webs/warren/`
   - Redirect URL: the same address.
3. Authentication → Providers → Email, enabled. For the first access, turn off “Confirm email” or open the confirmation message.
4. Open the Warren site and create the account (password, at least 6 characters, or a magic link). That first user becomes the only owner. The database rejects every later signup.
5. Optional: run `supabase/warren_seed.sql`. It loads the seven companies, closes, BPA series, Warren/bajista/alcista targets and Excel weights that were already on the site. It does not invent TIKR, share counts or ECB rates. Run it only after the account exists.

There are currently no auth users, so the first signup is the one that should succeed.

## Tables

| table | what an agent inserts |
| --- | --- |
| `warren_profile` | Created by the signup trigger. Do not insert a second owner. |
| `warren_companies` | One row per ticker. `owner_id` is the profile’s `user_id`. |
| `warren_quotes` | A daily close or a manual price. `price_date` is the session date. `fetched_at` is when it was stored. |
| `warren_fx_rates` | ECB daily reference. `units_per_eur` is how many units of `quote` equal 1 EUR. |
| `warren_financial_years` | One fiscal label per source. Null means the figure was not in the source. |
| `warren_estimates` | Warren or TIKR assumptions for a 1, 2 or 3 year horizon. |
| `warren_positions` | Real portfolio: shares and average price. `reported_weight_pct` is the Excel weight, not a recomputed weight. |
| `warren_audit` | Written by triggers. `actor` is null when the SQL editor writes. |

`warren_estimates.source` is `warren`, `tikr`, `excel_bajista` or `excel_optimista`. The screen selector uses Warren, TIKR and Mixto. Bajista and alcista stay visible as Excel footnotes.

## How to add a close

```sql
insert into public.warren_quotes (company_id, price, currency, price_date, source, manual, note)
select id, 623.21, 'USD', date '2026-10-23', 'Excel', false, 'Excel · 23/10/2026'
from public.warren_companies
where ticker = 'META'
on conflict (company_id, price_date, source) do update
set price = excluded.price, note = excluded.note;
```

That row is the close already stored for Meta. A new day needs its own real close and its own `price_date`. Do not invent one.

## How to add a financial year

Leave unknown lines null. `kind` is `historico` or `estimado`. CAPEX is a positive outflow. Do not also subtract the change in working capital from FCF: `fcf = cfo - capex`.

```sql
insert into public.warren_financial_years
  (company_id, fiscal_label, fiscal_year, kind, sales, ebitda, ebit, bpa, currency, source, as_of, note)
select id, '2024', 2024, 'historico', null, null, null, 23.86, 'USD', 'Excel', date '2026-10-26',
  'Excel · pestaña BPA · USD por acción (pre-split).'
from public.warren_companies where ticker = 'META'
on conflict (company_id, fiscal_label, source) do update
set bpa = excluded.bpa, as_of = excluded.as_of, note = excluded.note;
```

`23.86` is the 2024 EPS already in the Excel BPA tab. Sales, EBITDA and EBIT stay null until a filing actually contains them.

## How to add a TIKR or Warren estimate

Horizon is 1, 2 or 3 years. `target_price` wins when it is filled. When it is null, the site computes:

- PER price = BPA × PER, or BPA base × (1 + growth)³ × PER for a three-year path
- EV price = (metric × multiple − net debt + equity adjustments) / diluted shares
- Mixto = 50% Warren + 50% TIKR, and only when both targets exist

```sql
insert into public.warren_estimates
  (company_id, source, horizon_years, fiscal_label, bpa, per, target_price, target_currency, as_of, note)
select id, 'tikr', 3, '2029', null, null, null, 'USD', date '2026-11-07', 'pegar aquí la exportación TIKR; null hasta entonces'
from public.warren_companies where ticker = 'META'
on conflict (company_id, source, horizon_years, fiscal_label) do update
set bpa = excluded.bpa, per = excluded.per, target_price = excluded.target_price, as_of = excluded.as_of, note = excluded.note, updated_at = now();
```

Replace the nulls with figures copied from a TIKR export Alberto opened himself. TIKR has no API and must not be scraped. A missing input stays null. Never store zero in its place. The Warren path already seeded for Meta is BPA base `28.40`, growth `0.187`, PER `20`, fiscal label `2029`.

## How to add an ECB rate

```sql
insert into public.warren_fx_rates (owner_id, rate_date, quote, units_per_eur, source)
select user_id, date 'YYYY-MM-DD', 'USD', null, 'ECB'
from public.warren_profile;
```

`units_per_eur` cannot be null in the table: put the ECB reference for that day (foreign units per 1 EUR) in place of the insert, or skip the insert until the rate is known. No rate is seeded.

EUR value = foreign amount / `units_per_eur`. A GBP quote that arrives in pence (GBX) is divided by 100 before that. ZEG is already stored in pounds.

## Returns

Price only. Dividends are not added.

- Return from today = target / price − 1
- CAGR 3 years = (target 3y / price) ^ (1/3) − 1
- Max price for 15% a year = target 3y / 1.15³
- Position return = price / average cost − 1
- Future P/L in EUR = shares × (target − average cost), converted with the ECB rate
- Portfolio totals are N/D if any required position is missing a share count, a price, a target or an FX rate

The site shows the date of the price, the financial `as_of` and the FX date. A date more than five calendar days before today in Europe/Madrid is marked “Dato antiguo”. A missing date is N/D, which is not the same warning and not zero.

## Phase 2

Run `supabase/warren_phase2.sql` after phase 1. It adds four tables and does not insert any rows. X and Telegram are not connected.

| table | what an agent inserts |
| --- | --- |
| `warren_radar` | One candidate. `status` is `vigilar`, `en_analisis`, or `descartada`. `company_id` may be null. Price and CAGR stay N/D until that ticker exists in `warren_companies` with a close. |
| `warren_news` | One note. `kind` is `noticia`, `comentario`, or `idea`. `published_on` is the day of the item. The site lists the newest day first. A comentario is not a fact. |
| `warren_virtual_entries` | One simulated entry: `ticker`, `entered_on`, `entry_price`, `currency`, `price_source`. No share count. Return is the latest close in that same currency divided by `entry_price`, minus 1. A different currency is N/D. |
| `warren_benchmark_levels` | One index level per symbol and date. Two dates are required. Index return = last level / first level − 1. The real portfolio return over those same dates is N/D until every holding has a share count, a close on each date, and an ECB rate when the price is not in euros. |

```sql
insert into public.warren_benchmark_levels (owner_id, symbol, name, price_date, level, source)
select user_id, 'SYMBOL', 'Nombre del índice', date 'YYYY-MM-DD', 1000, 'cierre diario'
from public.warren_profile;
```

Replace `SYMBOL`, the date, and `1000` with a real close. Do not invent the level.

### TIKR financials, up to three years

Use the existing `warren_financial_years` table. One row per fiscal year, `source = 'TIKR'`, `kind = 'estimado'`. Load at most the next three years. Leave every unknown line null. The company sheet shows TIKR as N/D until these rows exist. Mixto stays N/D until a `warren_estimates` row with `source = 'tikr'` has a target.

```sql
insert into public.warren_financial_years
  (company_id, fiscal_label, fiscal_year, kind, sales, ebitda, ebit, net_income, bpa, shares_diluted, cash, gross_debt, net_debt, cfo, capex, fcf, currency, source, as_of, note)
select id, '2027e', 2027, 'estimado', null, null, null, null, null, null, null, null, null, null, null, null, 'USD', 'TIKR', date 'YYYY-MM-DD', 'exportación TIKR abierta a mano'
from public.warren_companies where ticker = 'META'
on conflict (company_id, fiscal_label, source) do update
set sales = excluded.sales, ebitda = excluded.ebitda, ebit = excluded.ebit, net_income = excluded.net_income,
    bpa = excluded.bpa, shares_diluted = excluded.shares_diluted, cash = excluded.cash, gross_debt = excluded.gross_debt,
    net_debt = excluded.net_debt, cfo = excluded.cfo, capex = excluded.capex, fcf = excluded.fcf,
    as_of = excluded.as_of, note = excluded.note, updated_at = now();
```

Repeat for the two following years only when the export contains them. `fcf` must already be CFO minus positive CAPEX.

### IBKR

The Cartera screen accepts a positions or activity CSV. There is no IBKR API key. A row is stored only when it has a ticker and a share count. A mark price is stored only when the file also has its date. Missing cells stay null.
