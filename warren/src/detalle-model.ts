import type { Company, RadarItem } from "./types";

function hasStoredReport(company: Company): boolean {
  if (company.report_md?.trim()) return true;
  let value: unknown = company.report_json;
  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return false;
    try { value = JSON.parse(text) as unknown; } catch { return false; }
  }
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export type Listed = { ticker: string; name: string; where: "Cartera" | "Seguimiento" | "Radar"; company: Company | null };

export function trackedCompanies(companies: Company[], radar: RadarItem[]): Listed[] {
  const byTicker = new Set(companies.map((company) => company.ticker.toUpperCase()));
  const byId = new Set(companies.map((company) => company.id));
  const rows: Listed[] = companies.map((company) => ({
    ticker: company.ticker,
    name: company.name,
    where: company.in_portfolio ? "Cartera" : "Seguimiento",
    company,
  }));
  for (const item of radar) {
    if (byTicker.has(item.ticker.toUpperCase())) continue;
    if (item.company_id && byId.has(item.company_id)) continue;
    rows.push({ ticker: item.ticker, name: item.name, where: "Radar", company: null });
  }
  rows.sort((a, b) => a.ticker.localeCompare(b.ticker));
  return rows;
}

/** Same hurdle as the Resumen filter «CAGR · 15 %». */
export const CAGR_FUERTE = 0.15;

export type CagrTone = "gold" | "red" | "neutral";

export function cagrTone(value: number): CagrTone {
  if (!Number.isFinite(value)) return "neutral";
  if (value < 0) return "red";
  if (value + 1e-12 >= CAGR_FUERTE) return "gold";
  return "neutral";
}

export function addMonths(iso: string, months: number): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!month || !day) return null;
  const index = month - 1 + months;
  const last = new Date(Date.UTC(year, index + 1, 0)).getUTCDate();
  const out = new Date(Date.UTC(year, index, Math.min(day, last)));
  const y = out.getUTCFullYear();
  const m = String(out.getUTCMonth() + 1).padStart(2, "0");
  const d = String(out.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export type Resultado = { kind: "known" | "estimated"; iso: string; approx: boolean };

/** Next earnings date. A past date is the previous announcement: plus three months, marked estimated. */
export function resultadoDe(nextDate: string | null | undefined, today: string, certainty?: string | null): Resultado | null {
  const iso = nextDate?.slice(0, 10) ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const day = today.slice(0, 10);
  if (iso >= day) return { kind: certainty === "estimated" ? "estimated" : "known", iso, approx: false };
  const estimated = addMonths(iso, 3);
  return estimated ? { kind: "estimated", iso: estimated, approx: true } : null;
}

/** Latest Warren valuation or target date already stored. Empty when none of them exist. */
export function warrenUpdateIso(dates: (string | null | undefined)[]): string | null {
  const clean = dates
    .map((value) => value?.slice(0, 10) ?? "")
    .filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value));
  if (clean.length === 0) return null;
  return clean.sort().at(-1) ?? null;
}

export type ListSortKey = "empresa" | "cagr3" | "cagr1" | "resultados" | "warren";
export type SortDir = "desc" | "asc";

export type SortableListRow = {
  ticker: string;
  cagr3: number | null;
  cagr1: number | null;
  resultados: string | null;
  warren: string | null;
};

function cmpValue(a: number | string | null, b: number | string | null, dir: SortDir): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  const diff = a < b ? -1 : a > b ? 1 : 0;
  return dir === "desc" ? -diff : diff;
}

/** Missing numbers and dates stay at the bottom in both directions. */
export function compareListado(a: SortableListRow, b: SortableListRow, key: ListSortKey, dir: SortDir): number {
  const cmp = key === "empresa"
    ? cmpValue(a.ticker.toUpperCase(), b.ticker.toUpperCase(), dir)
    : key === "cagr3"
      ? cmpValue(a.cagr3, b.cagr3, dir)
      : key === "cagr1"
        ? cmpValue(a.cagr1, b.cagr1, dir)
        : key === "resultados"
          ? cmpValue(a.resultados, b.resultados, dir)
          : cmpValue(a.warren, b.warren, dir);
  if (cmp !== 0) return cmp;
  return a.ticker.localeCompare(b.ticker);
}

export function storedReports(companies: Company[]): Company[] {
  return companies
    .filter(hasStoredReport)
    .slice()
    .sort((a, b) => {
      const left = a.report_sent_on ?? "";
      const right = b.report_sent_on ?? "";
      if (left !== right) return right.localeCompare(left);
      return a.ticker.localeCompare(b.ticker);
    });
}
