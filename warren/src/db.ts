import { createClient, type Session } from "@supabase/supabase-js";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "../../shared/supabase.config";
import { num } from "./format";
import type { Bundle, Company, Estimate, FxRate, Position, Quote, YearRow } from "./types";

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

export function watchWarren(onChange: () => void): () => void {
  const channel = supabase.channel("warren-phase1");
  for (const table of ["warren_companies", "warren_quotes", "warren_fx_rates", "warren_financial_years", "warren_estimates", "warren_positions"]) {
    channel.on("postgres_changes", { event: "*", schema: "public", table }, () => onChange());
  }
  channel.subscribe();
  return () => { void supabase.removeChannel(channel); };
}

export type { Session };
