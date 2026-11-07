import { isOld, methodPrices, pickTarget, positionReturn, positionValueEur, priceReturn, cagr3, maxPriceForCagr, futurePnlEur, type MethodPrices, type SourceMode } from "./math";
import type { Bundle, Estimate, FxRate, Position, Quote, YearRow } from "./types";

const REQUIRED = 0.15;

export function latestQuote(bundle: Bundle, companyId: string): Quote | null {
  const rows = bundle.quotes.filter((row) => row.company_id === companyId && row.price !== null);
  rows.sort((a, b) => (a.price_date < b.price_date ? 1 : a.price_date > b.price_date ? -1 : a.fetched_at < b.fetched_at ? 1 : -1));
  return rows[0] ?? null;
}

export function fxFor(bundle: Bundle, currency: string): FxRate | null {
  if (currency === "EUR") return null;
  const rows = bundle.fx.filter((row) => row.quote === currency && row.units_per_eur !== null);
  rows.sort((a, b) => (a.rate_date < b.rate_date ? 1 : -1));
  return rows[0] ?? null;
}

export function estimateRow(bundle: Bundle, companyId: string, source: "warren" | "tikr", horizon: number): Estimate | null {
  const rows = bundle.estimates.filter((row) => row.company_id === companyId && row.source === source && row.horizon_years === horizon);
  rows.sort((a, b) => (a.as_of ?? "").localeCompare(b.as_of ?? ""));
  return rows[rows.length - 1] ?? null;
}

export function sideTarget(bundle: Bundle, companyId: string, source: "warren" | "tikr", horizon: number): { price: number | null; methods: MethodPrices | null; row: Estimate | null } {
  const row = estimateRow(bundle, companyId, source, horizon);
  if (!row) return { price: null, methods: null, row: null };
  const methods = methodPrices(row);
  return { price: methods.target, methods, row };
}

export type CompanyView = {
  price: number | null;
  priceCurrency: string;
  priceDate: string | null;
  priceSource: string | null;
  priceManual: boolean;
  priceOld: boolean;
  avg: number | null;
  shares: number | null;
  weightPct: number | null;
  weightDate: string | null;
  weightSource: string | null;
  rentHoy: number | null;
  target1: number | null;
  target3: number | null;
  rent1: number | null;
  rent3: number | null;
  cagr: number | null;
  maxPrice: number | null;
  valueEur: number | null;
  pnlNowEur: number | null;
  pnl1Eur: number | null;
  pnl3Eur: number | null;
  fx: FxRate | null;
  fxOld: boolean;
  financeAsOf: string | null;
  financeOld: boolean;
  warren3: ReturnType<typeof sideTarget>;
  tikr3: ReturnType<typeof sideTarget>;
  years: YearRow[];
};

export function companyView(bundle: Bundle, companyId: string, mode: SourceMode, today: string): CompanyView {
  const company = bundle.companies.find((row) => row.id === companyId);
  const quote = latestQuote(bundle, companyId);
  const position: Position | undefined = bundle.positions.find((row) => row.company_id === companyId);
  const currency = quote?.currency || company?.currency || "USD";
  const fx = fxFor(bundle, currency);
  const price = quote?.price ?? null;
  const warren1 = sideTarget(bundle, companyId, "warren", 1);
  const tikr1 = sideTarget(bundle, companyId, "tikr", 1);
  const warren3 = sideTarget(bundle, companyId, "warren", 3);
  const tikr3 = sideTarget(bundle, companyId, "tikr", 3);
  const target1 = pickTarget(mode, warren1.price, tikr1.price);
  const target3 = pickTarget(mode, warren3.price, tikr3.price);
  const years = bundle.years.filter((row) => row.company_id === companyId).sort((a, b) => a.fiscal_label.localeCompare(b.fiscal_label, "es", { numeric: true }));
  const financeDates = years.map((row) => row.as_of).filter((value): value is string => Boolean(value)).sort();
  const financeAsOf = financeDates[financeDates.length - 1] ?? null;
  const units = currency === "EUR" ? null : fx?.units_per_eur ?? null;
  const avg = position?.avg_price ?? null;
  const shares = position?.shares ?? null;
  return {
    price,
    priceCurrency: currency,
    priceDate: quote?.price_date ?? null,
    priceSource: quote?.source ?? null,
    priceManual: Boolean(quote?.manual),
    priceOld: isOld(quote?.price_date ?? null, today),
    avg,
    shares,
    weightPct: position?.reported_weight_pct ?? null,
    weightDate: position?.weight_as_of ?? null,
    weightSource: position?.weight_source ?? null,
    rentHoy: company?.in_portfolio ? positionReturn(price, avg) : null,
    target1,
    target3,
    rent1: priceReturn(target1, price),
    rent3: priceReturn(target3, price),
    cagr: cagr3(target3, price),
    maxPrice: maxPriceForCagr(target3, REQUIRED),
    valueEur: positionValueEur(shares, price, currency, units),
    pnlNowEur: futurePnlEur(shares, price, avg, currency, units),
    pnl1Eur: futurePnlEur(shares, target1, avg, currency, units),
    pnl3Eur: futurePnlEur(shares, target3, avg, currency, units),
    fx,
    fxOld: fx ? isOld(fx.rate_date, today) : false,
    financeAsOf,
    financeOld: isOld(financeAsOf, today),
    warren3,
    tikr3,
    years,
  };
}
