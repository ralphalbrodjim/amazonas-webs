export const AGENDA_KEY = "semana-agenda-v1";
export const DEPORTE_KEY = "semana-deporte-v1";

export type Franja = "manana" | "tarde" | "noche" | "hora";
export type CatId = "ingles" | "gimnasio" | "running" | "hogar" | "otro";

export type Entry = {
  id: string;
  fecha: string;
  franja: Franja;
  inicio: string | null;
  fin: string | null;
  categoria: CatId | null;
  texto: string;
  hecho: boolean;
  origen: string | null;
  km: number | null;
  duracion: string | null;
};

export type MesRun = { km: number; salidas: number };
export type AgendaBag = { entradas: Entry[]; ocultas: string[]; kmMes: Record<string, MesRun>; runsMigrated: boolean };

export const SALIDAS: { fecha: string; km: number; duracion: string }[] = [
  { fecha: "2026-10-22", km: 3.06, duracion: "20:46" },
  { fecha: "2026-10-25", km: 10.35, duracion: "1:02:10" },
  { fecha: "2026-10-31", km: 2.1, duracion: "14:30" },
  { fecha: "2026-11-01", km: 3.33, duracion: "25:28" },
  { fecha: "2026-11-02", km: 4.01, duracion: "29:09" },
  { fecha: "2026-11-07", km: 5, duracion: "39:38" },
];

const CATS: CatId[] = ["ingles", "gimnasio", "running", "hogar", "otro"];

function uid(): string {
  return "run-" + Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export function normalizeEntry(item: unknown): Entry {
  if (!item || typeof item !== "object") throw new Error("entrada");
  const row = item as Partial<Entry>;
  if (typeof row.fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(row.fecha)) throw new Error("fecha");
  if (row.franja !== "manana" && row.franja !== "tarde" && row.franja !== "noche" && row.franja !== "hora") throw new Error("franja");
  const categoria = CATS.includes(row.categoria as CatId) ? row.categoria as CatId : null;
  const km = typeof row.km === "number" && Number.isFinite(row.km) ? row.km : null;
  return {
    id: typeof row.id === "string" ? row.id : uid(),
    fecha: row.fecha,
    franja: row.franja,
    inicio: typeof row.inicio === "string" ? row.inicio : null,
    fin: typeof row.fin === "string" ? row.fin : null,
    categoria,
    texto: typeof row.texto === "string" ? row.texto : "",
    hecho: row.hecho === true,
    origen: typeof row.origen === "string" ? row.origen : null,
    km,
    duracion: typeof row.duracion === "string" && row.duracion.trim() ? row.duracion.trim() : null,
  };
}

export function parseBag(value: unknown): AgendaBag {
  const row = value && typeof value === "object" ? value as { entradas?: unknown; ocultas?: unknown; kmMes?: unknown; runsMigrated?: unknown } : {};
  const entradas = Array.isArray(row.entradas) ? row.entradas.map(normalizeEntry) : [];
  const ocultas = Array.isArray(row.ocultas) ? row.ocultas.filter((item): item is string => typeof item === "string") : [];
  const kmMes: Record<string, MesRun> = {};
  if (row.kmMes && typeof row.kmMes === "object") {
    for (const [key, item] of Object.entries(row.kmMes as Record<string, unknown>)) {
      if (!/^\d{4}-\d{2}$/.test(key) || !item || typeof item !== "object") continue;
      const mes = item as { km?: unknown; salidas?: unknown };
      if (typeof mes.km !== "number" || !Number.isFinite(mes.km)) continue;
      kmMes[key] = { km: mes.km, salidas: typeof mes.salidas === "number" && Number.isFinite(mes.salidas) ? mes.salidas : 0 };
    }
  }
  return { entradas, ocultas, kmMes, runsMigrated: row.runsMigrated === true };
}

function runningOn(entradas: Entry[], fecha: string): Entry | undefined {
  return entradas.find((item) => item.fecha === fecha && item.categoria === "running" && item.origen === "run:" + fecha)
    ?? entradas.find((item) => item.fecha === fecha && item.categoria === "running");
}

function nuevaSalida(fecha: string, km: number | null, duracion: string | null): Entry {
  return {
    id: "run-" + fecha,
    fecha,
    franja: "manana",
    inicio: null,
    fin: null,
    categoria: "running",
    texto: "Running",
    hecho: true,
    origen: "run:" + fecha,
    km,
    duracion,
  };
}

export function mergeAgenda(bag: AgendaBag, extraDates: string[]): { bag: AgendaBag; changed: boolean } {
  const entradas = bag.entradas.map((item) => ({ ...item }));
  let changed = false;
  const first = bag.runsMigrated !== true;
  const touch = (fecha: string, km: number | null, duracion: string | null) => {
    const found = runningOn(entradas, fecha);
    if (!found) {
      entradas.push(nuevaSalida(fecha, km, duracion));
      changed = true;
      return;
    }
    if (first && !found.hecho) { found.hecho = true; changed = true; }
    if (km !== null && found.km === null) { found.km = km; changed = true; }
    if (duracion && !found.duracion) { found.duracion = duracion; changed = true; }
    if (!found.origen) { found.origen = "run:" + fecha; changed = true; }
  };
  for (const salida of SALIDAS) touch(salida.fecha, salida.km, salida.duracion);
  for (const fecha of extraDates) if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) touch(fecha, null, null);
  const kmMes = { ...bag.kmMes };
  if (!kmMes["2026-10"]) {
    kmMes["2026-10"] = { km: 35.86, salidas: 10 };
    changed = true;
  }
  const runsMigrated = true;
  if (!bag.runsMigrated) changed = true;
  return { bag: { entradas, ocultas: bag.ocultas, kmMes, runsMigrated }, changed };
}

export function deporteDates(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item !== "string") return [];
    const match = item.match(/^run:(\d{4}-\d{2}-\d{2})$/);
    return match ? [match[1]] : [];
  });
}

export function salidasHechas(entradas: Entry[]): Entry[] {
  return entradas.filter((item) => item.categoria === "running" && item.hecho && item.km !== null).sort((a, b) => a.fecha.localeCompare(b.fecha));
}

export function kmDelMes(bag: AgendaBag, mes: string): { km: number; salidas: number; override: boolean } {
  const propias = salidasHechas(bag.entradas).filter((item) => item.fecha.slice(0, 7) === mes);
  const suma = propias.reduce((total, item) => total + (item.km ?? 0), 0);
  const fijo = bag.kmMes[mes];
  if (fijo) return { km: fijo.km, salidas: fijo.salidas, override: true };
  return { km: suma, salidas: propias.length, override: false };
}

export function gimnasioHecho(entradas: Entry[], fecha: string): boolean {
  return entradas.some((item) => item.fecha === fecha && item.categoria === "gimnasio" && item.hecho);
}
