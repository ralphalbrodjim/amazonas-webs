export type NewsFilter = "todos" | "filing" | "press" | "x_post";

const RANK: Record<string, number> = { filing: 0, press: 1, x_post: 2, noticia: 3, comentario: 4, idea: 5 };

export function newsDay(item: { published_at?: string | null; published_on: string }): string {
  if (item.published_at) {
    const date = new Date(item.published_at);
    if (Number.isFinite(date.getTime())) {
      return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
    }
  }
  return item.published_on.slice(0, 10);
}

export function newsVisible<T extends { hidden?: boolean | null; active?: boolean | null }>(items: T[]): T[] {
  return items.filter((item) => item.hidden !== true && item.active !== false);
}

export function newsGroups<T extends { published_at?: string | null; published_on: string; kind: string; ticker?: string | null; hidden?: boolean | null; active?: boolean | null }>(
  items: T[],
  ticker: string,
  kind: NewsFilter,
): { day: string; items: T[] }[] {
  const wanted = ticker.trim().toUpperCase();
  const rows = newsVisible(items).filter((item) => {
    if (kind !== "todos" && item.kind !== kind) return false;
    if (wanted && (item.ticker ?? "").toUpperCase() !== wanted) return false;
    return true;
  });
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const day = newsDay(row);
    groups.set(day, [...(groups.get(day) ?? []), row]);
  }
  return [...groups.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([day, list]) => ({
    day,
    items: list.sort((a, b) => (RANK[a.kind] ?? 9) - (RANK[b.kind] ?? 9) || (b.published_at ?? b.published_on).localeCompare(a.published_at ?? a.published_on)),
  }));
}
