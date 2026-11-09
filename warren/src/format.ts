export function num(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Statement figures are stored in currency units. Billions stay readable in the year table; BPA does not use this. */
export function fmtCompact(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "N/D";
  const abs = Math.abs(value);
  const scale = abs >= 1_000_000_000 ? 1_000_000_000 : abs >= 1_000_000 ? 1_000_000 : null;
  if (scale === null) return fmt(value);
  const text = (abs / scale).toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return (value < 0 ? "-" : "") + text + (scale === 1_000_000_000 ? " B" : " M");
}

export function fmt(value: number | null, digits = 2): string {
  if (value === null || !Number.isFinite(value)) return "N/D";
  return value.toLocaleString("es-ES", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function pct(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "N/D";
  const text = (value * 100).toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return (value > 0 ? "+" : "") + text + " %";
}

export function fecha(iso: string | null): string {
  if (!iso) return "N/D";
  const [year, month, day] = iso.slice(0, 10).split("-");
  if (!year || !month || !day) return "N/D";
  return `${day}/${month}/${year}`;
}

export function fechaCorta(iso: string | null): string {
  if (!iso) return "N/D";
  const [, month, day] = iso.slice(0, 10).split("-");
  if (!month || !day) return "N/D";
  return `${day}/${month}`;
}

/** The date that appears most often. Undefined when the list is empty; null when the usual value is a missing date. Ties keep the first date in the list. */
export function mostCommonDate(dates: (string | null)[]): string | null | undefined {
  if (dates.length === 0) return undefined;
  const counts = new Map<string, number>();
  for (const date of dates) counts.set(date ?? "", (counts.get(date ?? "") ?? 0) + 1);
  let best = "";
  let bestCount = 0;
  for (const date of dates) {
    const key = date ?? "";
    const count = counts.get(key) ?? 0;
    if (count > bestCount) { best = key; bestCount = count; }
  }
  return best === "" ? null : best;
}

export function madridToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export function parseInput(value: string): number | null {
  const parsed = Number(value.replace(",", ".").trim());
  return Number.isFinite(parsed) ? parsed : null;
}
