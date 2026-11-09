import { createClient, type Session } from "@supabase/supabase-js";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "../../shared/supabase.config";
import { num } from "./format";
import type { BenchmarkLevel, Bundle, Company, Estimate, FxRate, NewsItem, Phase2, Position, Quote, RadarItem, SyncRun, VirtualEntry, YearRow } from "./types";
import type { IbkrRow } from "./ibkr";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

export function redirectTo(): string {
  return new URL(import.meta.env.BASE_URL, window.location.origin).href;
}

export function migrationMissing(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  const text = `${error.code ?? ""} ${error.message ?? ""}`;
  return /PGRST205|42P01|does not exist|schema cache|Could not find the table/i.test(text);
}

function rowNum<T>(row: T, keys: (keyof T)[]): T {
  const copy = { ...row };
  for (const key of keys) (copy as Record<string, unknown>)[key as string] = num((row as Record<string, unknown>)[key as string]);
  return copy;
}

export async function probeSchema(): Promise<"missing" | "ready" | "error"> {
  const { error } = await supabase.from("warren_companies").select("id").limit(1);
  if (!error) return "ready";
  if (migrationMissing(error)) return "missing";
  return "error";
}

export async function loadIsOwner(): Promise<boolean> {
  const { data: session } = await supabase.auth.getSession();
  const id = session.session?.user.id;
  if (!id) return false;
  const { data } = await supabase.from("warren_profile").select("role").eq("user_id", id).maybeSingle();
  return data?.role === "owner";
}

export async function loadSyncRuns(): Promise<SyncRun[]> {
  const { data, error } = await supabase.from("warren_sync_runs").select("id,started_at,finished_at,trigger,status,prices_ok,prices_fail,fx_ok,detail").order("started_at", { ascending: false }).limit(10);
  if (error || !data) return [];
  return data as SyncRun[];
}

export async function runNewsDetect(): Promise<string | null> {
  const { error } = await supabase.rpc("warren_run_news_detect", { p_trigger: "manual" });
  return error ? error.message : null;
}

export async function runSecFundamentals(): Promise<string | null> {
  const { error } = await supabase.functions.invoke("warren-sync-fundamentals");
  return error ? error.message : null;
}

export async function runPriceSync(): Promise<{ ok: number | null; fail: number | null; fx: boolean | null; error: string | null }> {
  const { data, error } = await supabase.rpc("warren_run_price_sync", { p_trigger: "manual" });
  if (error) return { ok: null, fail: null, fx: null, error: error.message };
  const row = data && typeof data === "object" ? data as Record<string, unknown> : {};
  return {
    ok: typeof row.prices_ok === "number" ? row.prices_ok : null,
    fail: typeof row.prices_fail === "number" ? row.prices_fail : null,
    fx: typeof row.fx_ok === "boolean" ? row.fx_ok : null,
    error: null,
  };
}

export async function loadWarren(): Promise<{ bundle: Bundle | null; missing: boolean; error: string | null }> {
  const [companies, quotes, years, estimates, positions, fx] = await Promise.all([
    supabase.from("warren_companies").select("*").order("sort"),
    supabase.from("warren_quotes").select("*"),
    supabase.from("warren_financial_years").select("*"),
    supabase.from("warren_estimates").select("*"),
    supabase.from("warren_positions").select("*"),
    supabase.from("warren_fx_rates").select("*"),
  ]);
  const failed = [companies, quotes, years, estimates, positions, fx].find((result) => result.error);
  if (failed?.error) {
    if (migrationMissing(failed.error)) return { bundle: null, missing: true, error: null };
    return { bundle: null, missing: false, error: failed.error.message };
  }
  const bundle: Bundle = {
    companies: (companies.data ?? []) as Company[],
    quotes: ((quotes.data ?? []) as Quote[]).map((row) => rowNum(row, ["price"])),
    years: ((years.data ?? []) as YearRow[]).map((row) => rowNum(row, ["sales", "ebitda", "ebit", "net_income", "bpa", "shares_diluted", "cash", "gross_debt", "net_debt", "cfo", "capex", "fcf"])),
    estimates: ((estimates.data ?? []) as Estimate[]).map((row) => rowNum(row, ["bpa", "bpa_base", "growth", "per", "ev_fcf", "ev_ebitda", "ev_ebit", "fcf", "ebitda", "ebit", "net_debt", "equity_adjustments", "diluted_shares", "target_price"])),
    positions: ((positions.data ?? []) as Position[]).map((row) => rowNum(row, ["shares", "avg_price", "reported_weight_pct"])),
    fx: ((fx.data ?? []) as FxRate[]).map((row) => rowNum(row, ["units_per_eur"])),
  };
  return { bundle, missing: false, error: null };
}

export async function saveManualPrice(companyId: string, price: number, currency: string, priceDate: string): Promise<string | null> {
  const { error } = await supabase.from("warren_quotes").upsert({
    company_id: companyId,
    price,
    currency,
    price_date: priceDate,
    source: "Manual",
    manual: true,
    note: "Precio escrito a mano",
  }, { onConflict: "company_id,price_date,source" });
  return error ? error.message : null;
}

export async function savePosition(companyId: string, shares: number | null, avgPrice: number | null, currency: string): Promise<string | null> {
  const { error } = await supabase.from("warren_positions").upsert({
    company_id: companyId,
    shares,
    avg_price: avgPrice,
    currency,
  }, { onConflict: "company_id" });
  return error ? error.message : null;
}

export async function saveEstimate(row: Pick<Estimate, "company_id" | "source" | "horizon_years" | "fiscal_label"> & Partial<Estimate>): Promise<string | null> {
  const { error } = await supabase.from("warren_estimates").upsert(row, { onConflict: "company_id,source,horizon_years,fiscal_label" });
  return error ? error.message : null;
}

export async function saveYearBpa(id: string, bpa: number | null): Promise<string | null> {
  const { error } = await supabase.from("warren_financial_years").update({ bpa }).eq("id", id);
  return error ? error.message : null;
}

export async function loadPhase2(): Promise<{ phase2: Phase2; error: string | null }> {
  const [radar, news, virtuals, benchmarks] = await Promise.all([
    supabase.from("warren_radar").select("*").order("sort"),
    supabase.from("warren_news").select("*").order("published_on", { ascending: false }),
    supabase.from("warren_virtual_entries").select("*").order("entered_on", { ascending: false }),
    supabase.from("warren_benchmark_levels").select("*").order("price_date"),
  ]);
  const failed = [radar, news, virtuals, benchmarks].find((result) => result.error);
  if (failed?.error) {
    if (migrationMissing(failed.error)) return { phase2: { radar: [], news: [], virtuals: [], benchmarks: [], missing: true }, error: null };
    return { phase2: { radar: [], news: [], virtuals: [], benchmarks: [], missing: false }, error: failed.error.message };
  }
  const phase2: Phase2 = {
    radar: (radar.data ?? []) as RadarItem[],
    news: (news.data ?? []) as NewsItem[],
    virtuals: ((virtuals.data ?? []) as VirtualEntry[]).map((row) => rowNum(row, ["entry_price"])),
    benchmarks: ((benchmarks.data ?? []) as BenchmarkLevel[]).map((row) => rowNum(row, ["level"])),
    missing: false,
  };
  return { phase2, error: null };
}

async function ownerId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

export async function saveRadar(row: { ticker: string; name: string; status: RadarItem["status"]; thesis: string; as_of: string | null }): Promise<string | null> {
  const owner = await ownerId();
  if (!owner) return "Sin sesión";
  const { error } = await supabase.from("warren_radar").insert({ ...row, owner_id: owner, ticker: row.ticker.toUpperCase() });
  return error ? error.message : null;
}

export async function saveNews(row: { ticker: string; published_on: string; kind: NewsItem["kind"]; title: string; url: string; source: string; summary: string }): Promise<string | null> {
  const owner = await ownerId();
  if (!owner) return "Sin sesión";
  const { error } = await supabase.from("warren_news").insert({ ...row, owner_id: owner, ticker: row.ticker.toUpperCase() });
  return error ? error.message : null;
}

export async function saveVirtual(row: { ticker: string; entered_on: string; entry_price: number; currency: string; price_source: string; note: string; company_id?: string | null }): Promise<string | null> {
  const owner = await ownerId();
  if (!owner) return "Sin sesión";
  const { error } = await supabase.from("warren_virtual_entries").insert({ ...row, owner_id: owner, ticker: row.ticker.toUpperCase() });
  return error ? error.message : null;
}

export async function importIbkr(rows: IbkrRow[]): Promise<string | null> {
  const owner = await ownerId();
  if (!owner) return "Sin sesión";
  const { data: companies, error: readError } = await supabase.from("warren_companies").select("id,ticker,currency");
  if (readError) return readError.message;
  const byTicker = new Map((companies ?? []).map((row) => [String(row.ticker).toUpperCase(), row as { id: string; ticker: string; currency: string }]));
  for (const row of rows) {
    if (row.shares === null) continue;
    let company = byTicker.get(row.ticker);
    if (!company) {
      if (!row.currency) return row.ticker + " no tiene divisa, no se crea la empresa.";
      const { data, error } = await supabase.from("warren_companies").insert({ owner_id: owner, ticker: row.ticker, name: row.ticker, currency: row.currency, in_portfolio: true }).select("id,ticker,currency").single();
      if (error || !data) return error?.message ?? "No se pudo crear " + row.ticker;
      company = data as { id: string; ticker: string; currency: string };
      byTicker.set(row.ticker, company);
    }
    const position: { company_id: string; shares: number; currency: string; avg_price?: number } = { company_id: company.id, shares: row.shares, currency: row.currency ?? company.currency };
    if (row.avgPrice !== null) position.avg_price = row.avgPrice;
    const { error } = await supabase.from("warren_positions").upsert(position, { onConflict: "company_id" });
    if (error) return error.message;
    if (row.markPrice !== null && row.priceDate) {
      const { error: quoteError } = await supabase.from("warren_quotes").upsert({
        company_id: company.id, price: row.markPrice, currency: row.currency ?? company.currency, price_date: row.priceDate, source: "IBKR", manual: false, note: "CSV de IBKR",
      }, { onConflict: "company_id,price_date,source" });
      if (quoteError) return quoteError.message;
    }
  }
  return null;
}

export function watchWarren(onChange: () => void): () => void {
  const channel = supabase.channel("warren-phase1");
  for (const table of ["warren_companies", "warren_quotes", "warren_fx_rates", "warren_financial_years", "warren_estimates", "warren_positions"]) {
    channel.on("postgres_changes", { event: "*", schema: "public", table }, () => onChange());
  }
  channel.subscribe();
  return () => { void supabase.removeChannel(channel); };
}

export function watchPhase2(onChange: () => void): () => void {
  const channel = supabase.channel("warren-phase2");
  for (const table of ["warren_radar", "warren_news", "warren_virtual_entries", "warren_benchmark_levels"]) {
    channel.on("postgres_changes", { event: "*", schema: "public", table }, () => onChange());
  }
  channel.subscribe();
  return () => { void supabase.removeChannel(channel); };
}

export type { Session };
