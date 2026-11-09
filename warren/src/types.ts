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
  trigger: string;
  status: string;
  prices_ok: number | null;
  prices_fail: number | null;
  fx_ok: boolean | null;
  detail: { tickers?: SyncTicker[] } | null;
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
export type NewsKind = "noticia" | "comentario" | "idea";

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
};

export type NewsItem = {
  id: string;
  owner_id: string;
  company_id: string | null;
  ticker: string;
  published_on: string;
  kind: NewsKind;
  title: string;
  url: string;
  source: string;
  summary: string;
  created_at: string;
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
