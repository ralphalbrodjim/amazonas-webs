import type { Company, EarningsRow, RadarItem, VirtualEntry } from "./types";

function priceReturn(target: number | null, price: number | null): number | null {
  if (target === null || price === null || !(price > 0)) return null;
  return target / price - 1;
}

function cagr3(target: number | null, price: number | null): number | null {
  if (target === null || price === null || !(price > 0) || !(target > 0)) return null;
  return (target / price) ** (1 / 3) - 1;
}

function pct(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "N/D";
  const text = (value * 100).toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return (value > 0 ? "+" : "") + text + " %";
}

export const STAR_LEGEND = [
  [1, "Poco atractiva"],
  [2, "Débil"],
  [3, "Normal / vigilar"],
  [4, "Atractiva"],
  [5, "Excepcional"],
] as const;

export type RadarSort = "cagr1" | "cagr3" | "stars";
export type CarteraFilter = "todas" | "si" | "no";

export function finite(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** Same rule as the radar cards: no target and a live price is 0, marked sin objetivo. */
export function shownReturn(target: number | null, price: number | null, years: 1 | 3): { text: string; sin: boolean } {
  const spot = finite(price);
  const goal = finite(target);
  if (spot === null || !(spot > 0)) return { text: "Pendiente", sin: false };
  if (goal === null) return { text: pct(0), sin: true };
  const value = years === 1 ? priceReturn(goal, spot) : cagr3(goal, spot);
  if (value === null) return { text: "Pendiente", sin: false };
  return { text: pct(value), sin: false };
}

export function radarScore(item: RadarItem, company: Company | null, sort: RadarSort): number | null {
  if (sort === "cagr1") return finite(item.potencial_1a);
  if (sort === "cagr3") return finite(item.cagr_3a);
  return finite(company?.opportunity_stars);
}

/** Descending score. Missing scores stay after every number. A tie follows the ticker. */
export function compareRadar(a: RadarItem, b: RadarItem, sort: RadarSort, companyOf: (item: RadarItem) => Company | null): number {
  const av = radarScore(a, companyOf(a), sort);
  const bv = radarScore(b, companyOf(b), sort);
  if (av === null && bv === null) return a.ticker.localeCompare(b.ticker);
  if (av === null) return 1;
  if (bv === null) return -1;
  if (av !== bv) return bv - av;
  return a.ticker.localeCompare(b.ticker);
}

export function passesFloor(value: number | null, floor: number | null): boolean {
  if (floor === null) return true;
  if (value === null) return false;
  return value >= floor - 1e-9;
}

export function inCartera(company: Company | null, filter: CarteraFilter): boolean {
  const held = company?.in_portfolio === true;
  if (filter === "si") return held;
  if (filter === "no") return !held;
  return true;
}

export type Entrada = { price: number | null; note: string | null; source: "warren" | "radar" | null };

/** Warren's own entry price wins. Otherwise the radar figure target_3a / 1.15³. Never a third formula. */
export function entrada15(company: Company | null, radar: RadarItem | null): Entrada {
  const given = finite(company?.entry_price_15);
  if (given !== null) return { price: given, note: company?.entry_price_15_note?.trim() || null, source: "warren" };
  const calc = finite(radar?.max_price_15);
  if (calc !== null) return { price: calc, note: null, source: "radar" };
  return { price: null, note: null, source: null };
}

export function entradaHit(price: number | null, entrada: number | null): boolean {
  return finite(price) !== null && finite(entrada) !== null && (price as number) <= (entrada as number);
}

export type CalendarRow = {
  companyId: string;
  ticker: string;
  name: string;
  inPortfolio: boolean;
  nextDate: string | null;
  certainty: string | null;
  timeOfDay: string | null;
  estimateEps: number | null;
  estimateCurrency: string | null;
  sourceUrl: string | null;
  pendingReason: string | null;
};

const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const WEEKDAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export function weekday(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  return WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()] ?? "";
}

export function monthLabel(iso: string): string {
  const [year, month] = iso.slice(0, 10).split("-");
  return (MONTHS[Number(month) - 1] ?? month) + " " + year;
}

export function daysAfter(today: string, date: string): number {
  const start = Date.parse(today.slice(0, 10) + "T00:00:00Z");
  const end = Date.parse(date.slice(0, 10) + "T00:00:00Z");
  return Math.round((end - start) / 86400000);
}

export function isSoon(today: string, date: string): boolean {
  const gap = daysAfter(today, date);
  return gap >= 0 && gap <= 7;
}

export function sessionLabel(value: string | null): string | null {
  if (!value?.trim()) return null;
  const text = value.toLowerCase();
  if (/pre-market|premarket|before|bmo|apertura/.test(text)) return "antes de la apertura";
  if (/post-market|postmarket|after|amc|cierre/.test(text)) return "después del cierre";
  return value.trim();
}

export function certaintyLabel(value: string | null): string | null {
  if (value === "confirmed") return "confirmado";
  if (value === "estimated") return "estimado";
  return null;
}

export function calendarRows(companies: Company[], earnings: EarningsRow[]): CalendarRow[] {
  return companies.map((company) => {
    const row = earnings.filter((item) => item.company_id === company.id).sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? ""))[0] ?? null;
    return {
      companyId: company.id,
      ticker: company.ticker,
      name: company.name,
      inPortfolio: company.in_portfolio === true,
      nextDate: row?.next_date ?? null,
      certainty: row?.certainty ?? null,
      timeOfDay: row?.time_of_day ?? null,
      estimateEps: finite(row?.estimate_eps),
      estimateCurrency: row?.estimate_currency ?? null,
      sourceUrl: row?.source_url ?? null,
      pendingReason: row?.pending_reason ?? null,
    };
  });
}

export type CalendarMonth = { key: string; label: string; rows: CalendarRow[] };

export function calendarModel(rows: CalendarRow[], today: string): { months: CalendarMonth[]; undated: CalendarRow[] } {
  const dated = rows.filter((row) => row.nextDate).sort((a, b) => (a.nextDate ?? "").localeCompare(b.nextDate ?? "") || a.ticker.localeCompare(b.ticker));
  const undated = rows.filter((row) => !row.nextDate).sort((a, b) => a.ticker.localeCompare(b.ticker));
  const months: CalendarMonth[] = [];
  for (const row of dated) {
    const key = (row.nextDate ?? "").slice(0, 7);
    const last = months[months.length - 1];
    if (!last || last.key !== key) months.push({ key, label: monthLabel(row.nextDate ?? ""), rows: [row] });
    else last.rows.push(row);
  }
  return { months, undated };
}

export type VirtualLine = {
  companyId: string;
  ticker: string;
  name: string;
  enteredOn: string | null;
  entryPrice: number | null;
  currency: string | null;
  price: number | null;
  priceCurrency: string | null;
  rent: number | null;
  target1: number | null;
  target3: number | null;
  entrada: number | null;
  entradaNote: string | null;
  pendingBuy: boolean;
};

export function virtualLines(companies: Company[], radar: RadarItem[], virtuals: VirtualEntry[]): VirtualLine[] {
  const lines: VirtualLine[] = [];
  for (const item of radar) {
    const company = companies.find((row) => row.id === item.company_id) ?? companies.find((row) => row.ticker.toUpperCase() === item.ticker.toUpperCase()) ?? null;
    if (!company || company.in_portfolio) continue;
    const entry = virtuals.find((row) => row.company_id === company.id) ?? virtuals.find((row) => row.ticker.toUpperCase() === company.ticker.toUpperCase()) ?? null;
    const price = finite(item.price);
    const buy = finite(entry?.entry_price);
    const sameCurrency = !entry?.currency || !item.price_currency || entry.currency === item.price_currency;
    const entrada = entrada15(company, item);
    lines.push({
      companyId: company.id,
      ticker: company.ticker,
      name: company.name,
      enteredOn: entry?.entered_on ?? null,
      entryPrice: buy,
      currency: entry?.currency ?? item.price_currency ?? company.currency,
      price,
      priceCurrency: item.price_currency ?? null,
      rent: buy !== null && price !== null && buy > 0 && sameCurrency ? price / buy - 1 : null,
      target1: finite(item.target_1a),
      target3: finite(item.target_3a),
      entrada: entrada.price,
      entradaNote: entrada.note,
      pendingBuy: buy === null,
    });
  }
  lines.sort((a, b) => {
    if (a.enteredOn && b.enteredOn && a.enteredOn !== b.enteredOn) return b.enteredOn.localeCompare(a.enteredOn);
    if (a.enteredOn && !b.enteredOn) return -1;
    if (!a.enteredOn && b.enteredOn) return 1;
    return a.ticker.localeCompare(b.ticker);
  });
  return lines;
}

export function readChoice<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return (allowed as readonly string[]).includes(value ?? "") ? value as T : fallback;
  } catch {
    return fallback;
  }
}

export function writeChoice(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* private mode */ }
}

export function meanRent(lines: VirtualLine[]): number | null {
  const known = lines.map((line) => line.rent).filter((value): value is number => value !== null);
  if (known.length === 0) return null;
  return known.reduce((sum, value) => sum + value, 0) / known.length;
}
