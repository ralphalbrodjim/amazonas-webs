import type { SyncRun, SyncTicker } from "./types";

/** Newest finished price run that stored at least one close. Quote capture time is the fallback. */
export function latestPriceUpdate(runs: { status: string; finished_at?: string | null; prices_ok?: number | null }[], quotes: { fetched_at?: string | null }[]): string | null {
  const success = runs.find((run) => run.status.toLowerCase() === "ok" && Boolean(run.finished_at) && (run.prices_ok ?? 1) > 0);
  if (success?.finished_at) return success.finished_at;
  return quotes.map((row) => row.fetched_at).filter((value): value is string => Boolean(value)).sort().at(-1) ?? null;
}

type Clock = { iso: string; minutes: number; weekday: string };

const MARKETS: Record<string, { timeZone: string; closeMinutes: number }> = {
  CAD: { timeZone: "America/Toronto", closeMinutes: 16 * 60 },
  EUR: { timeZone: "Europe/Paris", closeMinutes: 17 * 60 + 30 },
  GBP: { timeZone: "Europe/London", closeMinutes: 16 * 60 + 30 },
  USD: { timeZone: "America/New_York", closeMinutes: 16 * 60 },
};

/** Session that should already have a close. Weekends roll back to Friday; holidays are not guessed. */
export function expectedCloseDate(exchange: string | null, currency: string, now: Date): string {
  const market = marketFor(exchange, currency);
  const local = zonedClock(now, market.timeZone);
  const closedToday = local.weekday !== "Sat" && local.weekday !== "Sun" && local.minutes >= market.closeMinutes;
  return closedToday ? local.iso : previousWeekday(local.iso);
}

export function staleTickerReason(
  company: { ticker: string; api_symbol?: string | null; exchange: string | null; currency: string },
  priceDate: string | null,
  latest: SyncRun | null,
  now: Date,
): string | null {
  const failed = (latest?.detail?.tickers ?? []).find((item) => matches(item, company) && (item.ok === false || item.kept_last === true));
  if (failed) return failureReason(failed);
  const expected = expectedCloseDate(company.exchange, company.currency, now);
  const actual = priceDate?.slice(0, 10) ?? "";
  if (actual && actual < expected) return `Cierre ${corta(actual)}, anterior al último cierre esperado (${corta(expected)}).`;
  if (!actual) return "Sin fecha de cierre.";
  return null;
}

export function failureReason(item: SyncTicker): string {
  const error = item.error ?? "";
  const kept = item.kept_last ? " Se mantuvo el cierre anterior." : "";
  if (/25 requests per day|standard API rate limit/i.test(error)) return "Límite diario de Alpha Vantage." + kept;
  if (/1 request per second|spreading out your free API/i.test(error)) return "Alpha Vantage pidió espaciar las peticiones." + kept;
  if (error && !/api key|apikey|token|secret|bearer/i.test(error)) return error.split(/(?<=\.)\s/)[0].slice(0, 140) + kept;
  if (item.kept_last) return "Se mantuvo el cierre anterior.";
  return "No se actualizó en la última sincronización.";
}

function marketFor(exchange: string | null, currency: string): { timeZone: string; closeMinutes: number } {
  const code = (exchange ?? "").toUpperCase();
  if (code === "TSX" || code === "TSXV") return MARKETS.CAD;
  if (code === "EPA" || code === "AMS" || code === "PAR" || code === "XPAR" || code === "XAMS") return MARKETS.EUR;
  if (code === "LON" || code === "LSE" || code === "XLON") return MARKETS.GBP;
  return MARKETS[currency.toUpperCase()] ?? MARKETS.USD;
}

function zonedClock(now: Date, timeZone: string): Clock {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23", weekday: "short",
  }).formatToParts(now).map((part) => [part.type, part.value]));
  const hour = parts.hour === "24" ? 0 : Number(parts.hour);
  return { iso: `${parts.year}-${parts.month}-${parts.day}`, minutes: hour * 60 + Number(parts.minute), weekday: parts.weekday };
}

function previousWeekday(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  do date.setUTCDate(date.getUTCDate() - 1);
  while (date.getUTCDay() === 0 || date.getUTCDay() === 6);
  return date.toISOString().slice(0, 10);
}

function corta(iso: string): string {
  const [, month, day] = iso.slice(0, 10).split("-");
  return day && month ? `${day}/${month}` : iso;
}

function matches(item: SyncTicker, company: { ticker: string; api_symbol?: string | null }): boolean {
  const keys = [item.ticker, item.symbol].filter((value): value is string => Boolean(value)).map((value) => value.toUpperCase());
  const wanted = [company.ticker, company.api_symbol].filter((value): value is string => Boolean(value)).map((value) => value.toUpperCase());
  return keys.some((key) => wanted.includes(key));
}
