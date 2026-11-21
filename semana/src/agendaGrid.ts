/** Columns of Tu semana. Days are the rows. Cultura is kept in storage but not listed here. */
export const AGENDA_FILAS = [
  { id: "deporte", icono: "🏃", nombre: "Deporte" },
  { id: "ingles", icono: "🎓", nombre: "Inglés" },
  { id: "cocina", icono: "🍳", nombre: "Cocina" },
  { id: "otros", icono: "📝", nombre: "Otros" },
] as const;

export type FilaId = (typeof AGENDA_FILAS)[number]["id"];

export const LABORABLES = [
  { id: "lunes", label: "Lunes" },
  { id: "martes", label: "Martes" },
  { id: "miercoles", label: "Miércoles" },
  { id: "jueves", label: "Jueves" },
  { id: "viernes", label: "Viernes" },
  { id: "sabado", label: "Sábado" },
  { id: "domingo", label: "Domingo" },
] as const;

export type DiaId = (typeof LABORABLES)[number]["id"];

export type WeekGrid = Record<string, Partial<Record<DiaId, string>>>;

/** Old columns stay in the saved object so a later edit does not wipe them. */
const FILA_IDS = new Set<string>(AGENDA_FILAS.map((fila) => fila.id));
const STORED_FILA_IDS = new Set<string>([...FILA_IDS, "gimnasio", "run", "cultura"]);
const DIA_IDS = new Set<string>(LABORABLES.map((dia) => dia.id));

function joinDeporte(gimnasio: string | undefined, run: string | undefined): string | undefined {
  const parts: string[] = [];
  for (const part of [gimnasio, run]) {
    const text = part?.trim();
    if (!text || parts.includes(text)) continue;
    parts.push(text);
  }
  return parts.length ? parts.join(" · ") : undefined;
}

/** ISO week of a calendar day, for example 2026-11-09 → 2026-W46. */
export function isoWeekId(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const target = new Date(date.getTime());
  const dayNr = (date.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const thursday = target.getTime();
  target.setUTCMonth(0, 1);
  if (target.getUTCDay() !== 4) target.setUTCMonth(0, 1 + ((4 - target.getUTCDay()) + 7) % 7);
  const week = 1 + Math.ceil((thursday - target.getTime()) / 604800000);
  const year = new Date(thursday).getUTCFullYear();
  return year + "-W" + String(week).padStart(2, "0");
}

export function weekStorageKey(monday: string): string {
  return "agenda-semana-" + isoWeekId(monday);
}

export function parseWeekGrid(value: unknown): WeekGrid {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const grid: WeekGrid = {};
  for (const [fila, row] of Object.entries(value as Record<string, unknown>)) {
    if (!STORED_FILA_IDS.has(fila) || !row || typeof row !== "object" || Array.isArray(row)) continue;
    const cells: Partial<Record<DiaId, string>> = {};
    for (const [dia, text] of Object.entries(row as Record<string, unknown>)) {
      if (!DIA_IDS.has(dia) || typeof text !== "string") continue;
      cells[dia as DiaId] = text;
    }
    if (Object.keys(cells).length) grid[fila] = cells;
  }
  const deporte: Partial<Record<DiaId, string>> = { ...grid.deporte };
  let migrated = false;
  for (const dia of LABORABLES) {
    if (Object.prototype.hasOwnProperty.call(deporte, dia.id)) continue;
    const joined = joinDeporte(grid.gimnasio?.[dia.id], grid.run?.[dia.id]);
    if (joined === undefined) continue;
    deporte[dia.id] = joined;
    migrated = true;
  }
  if (migrated || Object.keys(deporte).length) grid.deporte = deporte;
  return grid;
}

/** Undefined when Alberto has not written that cell. An empty string is his text and blocks the plan. */
export function textoUsuario(grid: WeekGrid, fila: string, dia: DiaId): string | undefined {
  const row = grid[fila];
  if (!row || !Object.prototype.hasOwnProperty.call(row, dia)) return undefined;
  return row[dia] ?? "";
}

export function textoVisible(grid: WeekGrid, fila: string, dia: DiaId, sugerido: string): string {
  const propio = textoUsuario(grid, fila, dia);
  return propio === undefined ? sugerido : propio;
}

export function conCelda(grid: WeekGrid, fila: string, dia: DiaId, texto: string): WeekGrid {
  return { ...grid, [fila]: { ...grid[fila], [dia]: texto } };
}

export type HechoMap = Partial<Record<FilaId, Partial<Record<DiaId, true>>>>;

export function parseHecho(value: unknown): HechoMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const raw = (value as { hecho?: unknown }).hecho;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const hecho: HechoMap = {};
  for (const [fila, row] of Object.entries(raw as Record<string, unknown>)) {
    if (!FILA_IDS.has(fila) || !row || typeof row !== "object" || Array.isArray(row)) continue;
    const days: Partial<Record<DiaId, true>> = {};
    for (const [dia, flag] of Object.entries(row as Record<string, unknown>)) {
      if (!DIA_IDS.has(dia) || flag !== true) continue;
      days[dia as DiaId] = true;
    }
    if (Object.keys(days).length) hecho[fila as FilaId] = days;
  }
  return hecho;
}

export function conHecho(hecho: HechoMap, fila: FilaId, dia: DiaId, on: boolean): HechoMap {
  const row = { ...hecho[fila] };
  if (on) row[dia] = true;
  else delete row[dia];
  const next: HechoMap = { ...hecho, [fila]: row };
  if (!Object.keys(row).length) delete next[fila];
  return next;
}

export function estaHecho(hecho: HechoMap, fila: FilaId, dia: DiaId): boolean {
  return hecho[fila]?.[dia] === true;
}

/** Text cells plus the done ticks, ready to store as one week in app_state. */
export function semanaGuardada(grid: WeekGrid, hecho: HechoMap): Record<string, unknown> {
  const saved: Record<string, unknown> = { ...grid };
  if (Object.keys(hecho).length) saved.hecho = hecho;
  return saved;
}

/** Cultura is recognised so a plan item is not dropped into Otro, but the grid does not show that column. */
export function filaDe(tipo: string): FilaId | "cultura" {
  const text = tipo.toLowerCase();
  if (text.includes("gimnas") || text.includes("run") || text.includes("deporte") || text.includes("correr")) return "deporte";
  if (text.includes("ingles") || text.includes("inglés")) return "ingles";
  if (text.includes("cultur") || text.includes("teatro") || text.includes("pelíc") || text.includes("pelic") || text.includes("expos")) return "cultura";
  if (text.includes("cocin") || text.includes("chef") || text.includes("comida") || text.includes("restaur")) return "cocina";
  return "otros";
}

export type PlanItem = { fecha: string; fila: FilaId; texto: string };

export function sugerido(items: PlanItem[], fecha: string, fila: FilaId): string {
  const lines = items.filter((item) => item.fecha === fecha && item.fila === fila && item.texto.trim()).map((item) => item.texto.trim());
  return [...new Set(lines)].join("\n");
}
