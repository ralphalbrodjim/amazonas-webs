export function num(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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

export function madridToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export function parseInput(value: string): number | null {
  const parsed = Number(value.replace(",", ".").trim());
  return Number.isFinite(parsed) ? parsed : null;
}
