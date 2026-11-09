export type Company = {
  id: string;
  owner_id: string;
  ticker: string;
  name: string;
  exchange: string | null;
  currency: string;
  in_portfolio: boolean;
  classification: string | null;
  quality_stars: number | null;
  verdict: string | null;
  notes: string | null;
  sort: number;
  api_symbol?: string | null;
  quote_unit?: string | null;
  price_note?: string | null;
};

export type SyncTicker = {
  ok?: boolean;
  ticker?: string;
  symbol?: string;
  error?: string;
  kept_last?: boolean;
  price_date?: string;
};

export type SyncRun = {
  id: number;
  started_at: string;
  finished_at?: string | null;
  trigger: string;
  status: string;
  prices_ok: number | null;
  prices_fail: number | null;
  fx_ok: boolean | null;
  kind?: string | null;
  tokens_in?: number | null;
  tokens_out?: number | null;
  cost_eur?: number | null;
  next_hint?: string | null;
  error?: string | null;
  detail: { tickers?: SyncTicker[] } | null;
};

export type OpsCost = {
  month_start: string;
  budget_eur: number;
  spent_eur: number;
  tokens: number;
  remaining_eur: number;
  note?: string;
};

export type OpsCheck = { id: string; ok: boolean; level: string; msg: string };

export type OpsHealth = { pass: number; fail: number; warn: number; checks: OpsCheck[]; at?: string };

export type OpsDashboard = {
  cost: OpsCost;
  next_tasks: { when: string; what: string }[];
  health: OpsHealth;
  rollback_recipes: { id: string; title: string; kind: string; sql_text: string; sort: number }[];
  radar_pending: { ticker: string; reason: string }[];
};

export type Quote = {
  id: string;
  company_id: string;
  price: number | null;
  currency: string;
  price_date: string;
  fetched_at: string;
  source: string;
  manual: boolean;
  note: string | null;
};

export type YearRow = {
  id: string;
  company_id: string;
  fiscal_label: string;
  fiscal_year: number | null;
  kind: "historico" | "estimado";
  sales: number | null;
  ebitda: number | null;
  ebit: number | null;
  net_income: number | null;
  bpa: number | null;
  shares_diluted: number | null;
  cash: number | null;
  gross_debt: number | null;
  net_debt: number | null;
  cfo: number | null;
  capex: number | null;
  fcf: number | null;
  currency: string | null;
  source: string;
  as_of: string | null;
  note: string | null;
  source_url?: string | null;
  filed_on?: string | null;
  captured_at?: string | null;
  data_type?: string | null;
  period_end?: string | null;
  form?: string | null;
};

export type EstimateSource = "warren" | "tikr" | "excel_bajista" | "excel_optimista";

export type Estimate = {
  id: string;
  company_id: string;
  source: EstimateSource;
  horizon_years: number;
  fiscal_label: string;
  bpa: number | null;
  bpa_base: number | null;
  growth: number | null;
  per: number | null;
  ev_fcf: number | null;
  ev_ebitda: number | null;
  ev_ebit: number | null;
  fcf: number | null;
  ebitda: number | null;
  ebit: number | null;
  net_debt: number | null;
  equity_adjustments: number | null;
  diluted_shares: number | null;
  target_price: number | null;
  target_currency: string | null;
  as_of: string | null;
  note: string | null;
};

export type Position = {
  company_id: string;
  shares: number | null;
  avg_price: number | null;
  currency: string | null;
  reported_weight_pct: number | null;
  weight_as_of: string | null;
  weight_source: string | null;
  note: string | null;
};

export type FxRate = {
  id: string;
  owner_id: string;
  rate_date: string;
  quote: string;
  units_per_eur: number | null;
  source: string;
  fetched_at: string;
};

export type RadarStatus = "vigilar" | "en_analisis" | "descartada";
export type NewsKind = "filing" | "press" | "x_post" | "noticia" | "comentario" | "idea";
export type NewsImpact = "positivo" | "neutral" | "negativo";
export type NewsMateriality = "alta" | "media" | "baja";

export type RadarItem = {
  id: string;
  owner_id: string;
  company_id: string | null;
  ticker: string;
  name: string;
  status: RadarStatus;
  thesis: string;
  as_of: string | null;
  note: string | null;
  sort: number;
  price?: number | null;
  price_date?: string | null;
  price_currency?: string | null;
  target_1a?: number | null;
  target_3a?: number | null;
  potencial_1a?: number | null;
  rent_3a?: number | null;
  cagr_3a?: number | null;
  max_price_15?: number | null;
  scenario?: string | null;
  target_bajista?: number | null;
  target_optimista?: number | null;
  computed_at?: string | null;
  data_hash?: string | null;
  changed?: boolean | null;
  change_note?: string | null;
  pending_reason?: string | null;
};

export type NewsItem = {
  id: string;
  owner_id: string;
  company_id: string | null;
  ticker: string | null;
  published_on: string;
  kind: NewsKind;
  title: string;
  url: string;
  source: string;
  summary: string | null;
  created_at: string;
  published_at?: string | null;
  captured_at?: string | null;
  content_hash?: string | null;
  author?: string | null;
  materiality?: NewsMateriality | null;
  impact?: NewsImpact | null;
  analyzed_at?: string | null;
  external_id?: string | null;
  meta?: Record<string, unknown> | null;
  hidden?: boolean | null;
  active?: boolean | null;
};

export type VirtualEntry = {
  id: string;
  owner_id: string;
  company_id: string | null;
  ticker: string;
  entered_on: string;
  entry_price: number | null;
  currency: string;
  price_source: string;
  note: string;
};

export type BenchmarkLevel = {
  id: string;
  owner_id: string;
  symbol: string;
  name: string;
  price_date: string;
  level: number | null;
  source: string;
};

export type Phase2 = {
  radar: RadarItem[];
  news: NewsItem[];
  virtuals: VirtualEntry[];
  benchmarks: BenchmarkLevel[];
  missing: boolean;
};

export const EMPTY_PHASE2: Phase2 = { radar: [], news: [], virtuals: [], benchmarks: [], missing: false };

export type Bundle = {
  companies: Company[];
  quotes: Quote[];
  years: YearRow[];
  estimates: Estimate[];
  positions: Position[];
  fx: FxRate[];
};

export const EMPTY: Bundle = { companies: [], quotes: [], years: [], estimates: [], positions: [], fx: [] };
