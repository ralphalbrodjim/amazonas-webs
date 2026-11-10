const REMEMBERED = "warren-oportunidad";

/** `#oportunidad/BKNG` → `BKNG`. Anything else, including an auth hash, is ignored. */
export function opportunityTickerFromHash(hash: string): string | null {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null;
  }
  const match = decoded.match(/^oportunidad\/([A-Za-z0-9][A-Za-z0-9.-]{0,20})$/);
  return match ? match[1].toUpperCase() : null;
}

export function opportunityHash(ticker: string): string {
  return "#oportunidad/" + ticker.toUpperCase();
}

export function rememberOpportunityFromLocation(): void {
  const ticker = opportunityTickerFromHash(window.location.hash);
  if (!ticker) return;
  try {
    sessionStorage.setItem(REMEMBERED, ticker);
  } catch {
    /* Private mode can refuse storage. The hash still works for a password login. */
  }
}

export function rememberedOpportunity(): string | null {
  try {
    const value = sessionStorage.getItem(REMEMBERED);
    if (!value || !/^[A-Z0-9][A-Z0-9.-]{0,20}$/.test(value)) return null;
    return value;
  } catch {
    return null;
  }
}

export function clearRememberedOpportunity(): void {
  try {
    sessionStorage.removeItem(REMEMBERED);
  } catch {
    /* ignore */
  }
}

export function opportunityTickerNow(): string | null {
  return opportunityTickerFromHash(window.location.hash) ?? rememberedOpportunity();
}
