export type PeriodFilter = "anual" | "trimestre";

const RANK: Record<string, number> = { SEC: 0, TIKR: 1, EXCEL: 2 };

export function isQuarter(label: string): boolean {
  return /Q\d/i.test(label);
}

/** One row per fiscal label: SEC, then TIKR, then Excel. Anything else is left out. */
export function seriesYears<T extends { source: string; fiscal_label: string; filed_on?: string | null }>(years: T[], period: PeriodFilter): T[] {
  const chosen = new Map<string, T>();
  for (const row of years) {
    if (RANK[row.source.toUpperCase()] === undefined) continue;
    const quarter = isQuarter(row.fiscal_label);
    if (period === "trimestre" ? !quarter : quarter) continue;
    const current = chosen.get(row.fiscal_label);
    if (!current || prefer(row, current)) chosen.set(row.fiscal_label, row);
  }
  return [...chosen.values()].sort((a, b) => a.fiscal_label.localeCompare(b.fiscal_label, "es", { numeric: true }));
}

function prefer(next: { source: string; filed_on?: string | null }, current: { source: string; filed_on?: string | null }): boolean {
  const gap = RANK[next.source.toUpperCase()] - RANK[current.source.toUpperCase()];
  if (gap !== 0) return gap < 0;
  return (next.filed_on ?? "") > (current.filed_on ?? "");
}
