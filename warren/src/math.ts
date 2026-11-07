/** Price-only maths. Dividends are never added. Missing inputs stay null, never zero. */

export function priceReturn(target: number | null, price: number | null): number | null {
  if (target === null || price === null || !(price > 0)) return null;
  return target / price - 1;
}

export function cagr3(target: number | null, price: number | null): number | null {
  if (target === null || price === null || !(price > 0) || !(target > 0)) return null;
  return (target / price) ** (1 / 3) - 1;
}

/** Maximum price today that still earns `annual` for three years, price only. */
export function maxPriceForCagr(target: number | null, annual: number): number | null {
  if (target === null || !(target > 0) || !(annual > -1)) return null;
  return target / (1 + annual) ** 3;
}

/** 50% TIKR + 50% Warren. If either side is missing, Mixto is missing. */
export function mixto(warren: number | null, tikr: number | null): number | null {
  if (warren === null || tikr === null) return null;
  return warren * 0.5 + tikr * 0.5;
}

export type SourceMode = "warren" | "tikr" | "mixto";

export function pickTarget(mode: SourceMode, warren: number | null, tikr: number | null): number | null {
  if (mode === "warren") return warren;
  if (mode === "tikr") return tikr;
  return mixto(warren, tikr);
}

/** Fair price = estimated EPS × target PER. Non-positive EPS does not produce a price. */
export function perTarget(bpa: number | null, per: number | null): number | null {
  if (bpa === null || per === null || !(bpa > 0) || !(per > 0)) return null;
  return bpa * per;
}

/** Three-year PER target from a base EPS grown for three years. */
export function perTargetGrown(bpaBase: number | null, growth: number | null, per: number | null): number | null {
  if (bpaBase === null || growth === null || per === null) return null;
  if (!(bpaBase > 0) || !(per > 0) || !(growth > -1)) return null;
  return bpaBase * (1 + growth) ** 3 * per;
}

/**
 * Equity from an EV multiple, then price per share.
 * equity = metric × multiple − net debt + adjustments.
 * FCF must already be CFO − CAPEX. Net debt is subtracted once.
 */
export function evPrice(
  metric: number | null,
  multiple: number | null,
  netDebt: number | null,
  adjustments: number | null,
  dilutedShares: number | null,
): number | null {
  if (metric === null || multiple === null || netDebt === null || dilutedShares === null) return null;
  if (!(dilutedShares > 0)) return null;
  const equity = metric * multiple - netDebt + (adjustments ?? 0);
  return equity / dilutedShares;
}

/** CAPEX is a positive outflow. Working capital is not subtracted again. */
export function fcf(cfo: number | null, capexPositive: number | null): number | null {
  if (cfo === null || capexPositive === null) return null;
  return cfo - capexPositive;
}

export function positionReturn(price: number | null, avg: number | null): number | null {
  if (price === null || avg === null || !(avg > 0)) return null;
  return price / avg - 1;
}

/** ECB reference: units of foreign currency for 1 EUR. EUR amount = foreign / units. */
export function toEur(amount: number | null, currency: string, unitsPerEur: number | null): number | null {
  if (amount === null) return null;
  if (currency === "EUR") return amount;
  if (unitsPerEur === null || !(unitsPerEur > 0)) return null;
  return amount / unitsPerEur;
}

export function futurePnlEur(
  shares: number | null,
  target: number | null,
  avg: number | null,
  currency: string,
  unitsPerEur: number | null,
): number | null {
  if (shares === null || target === null || avg === null) return null;
  return toEur(shares * (target - avg), currency, unitsPerEur);
}

export function positionValueEur(
  shares: number | null,
  price: number | null,
  currency: string,
  unitsPerEur: number | null,
): number | null {
  if (shares === null || price === null) return null;
  return toEur(shares * price, currency, unitsPerEur);
}

/** London pence quotes become pounds. Other currencies pass through. */
export function toMajor(price: number | null, currency: string): { price: number | null; currency: string } {
  if (currency === "GBX") return { price: price === null ? null : price / 100, currency: "GBP" };
  return { price, currency };
}

/** Portfolio CAGR needs every position. One gap makes the total N/D. */
export function portfolioCagr(rows: { valueNow: number | null; valueFuture: number | null }[]): number | null {
  if (rows.length === 0) return null;
  let now = 0;
  let future = 0;
  for (const row of rows) {
    if (row.valueNow === null || row.valueFuture === null) return null;
    now += row.valueNow;
    future += row.valueFuture;
  }
  if (!(now > 0) || !(future > 0)) return null;
  return (future / now) ** (1 / 3) - 1;
}

/** Average of the method prices that exist. An empty set is N/D, not zero. */
export function averagePresent(values: (number | null)[]): number | null {
  const present = values.filter((value): value is number => value !== null && Number.isFinite(value));
  if (present.length === 0) return null;
  return present.reduce((sum, value) => sum + value, 0) / present.length;
}

export function isOld(isoDate: string | null, todayIso: string, maxAgeDays = 5): boolean {
  if (!isoDate) return false;
  const a = Date.parse(isoDate.slice(0, 10) + "T00:00:00Z");
  const b = Date.parse(todayIso.slice(0, 10) + "T00:00:00Z");
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  return (b - a) / 86_400_000 > maxAgeDays;
}

export type EstimateInputs = {
  target_price: number | null;
  bpa: number | null;
  per: number | null;
  bpa_base: number | null;
  growth: number | null;
  ev_fcf: number | null;
  ev_ebitda: number | null;
  ev_ebit: number | null;
  fcf: number | null;
  ebitda: number | null;
  ebit: number | null;
  net_debt: number | null;
  equity_adjustments: number | null;
  diluted_shares: number | null;
};

export type MethodPrices = {
  per: number | null;
  evFcf: number | null;
  evEbitda: number | null;
  evEbit: number | null;
  average: number | null;
  target: number | null;
};

/** Direct target_price wins. Otherwise the average of the methods that can be computed. */
export function methodPrices(input: EstimateInputs): MethodPrices {
  const per = input.target_price === null
    ? (perTarget(input.bpa, input.per) ?? perTargetGrown(input.bpa_base, input.growth, input.per))
    : null;
  const evFcf = evPrice(input.fcf, input.ev_fcf, input.net_debt, input.equity_adjustments, input.diluted_shares);
  const evEbitda = evPrice(input.ebitda, input.ev_ebitda, input.net_debt, input.equity_adjustments, input.diluted_shares);
  const evEbit = evPrice(input.ebit, input.ev_ebit, input.net_debt, input.equity_adjustments, input.diluted_shares);
  const average = averagePresent([per, evFcf, evEbitda, evEbit]);
  const target = input.target_price ?? average;
  return { per, evFcf, evEbitda, evEbit, average, target };
}
