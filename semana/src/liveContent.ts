import agendaBundled from "../data/agenda.json";
import culturaBundled from "../data/cultura.json";
import deporteBundled from "../data/deporte.json";
import inglesBundled from "../data/ingles.json";
import type { ContentRow } from "../../shared/content";

export type AgendaData = typeof agendaBundled;
export type DeporteData = typeof deporteBundled;
export type InglesData = typeof inglesBundled;
export type CulturaItem = (typeof culturaBundled)[number];

let agendaLive: AgendaData = agendaBundled;
let deporteLive: DeporteData = deporteBundled;
let inglesLive: InglesData = inglesBundled;
let culturaLive: CulturaItem[] = culturaBundled;

export type OrganizacionItem = {
  id: string;
  titulo: string;
  icono: string;
  descripcion: string;
  frecuencia: string;
  automatico: boolean;
  coste: string;
  nota: string;
};

export type CulturaSeccion = { titulo: string; texto: string; imagen: string; enlace: string };
export type CulturaPropuestaDia = {
  titulo: string;
  tipo: string;
  lugar: string;
  horario: string;
  precio: string;
  enlace: string;
  historia: string;
  descripcion: string;
};
export type CulturaDia = {
  id: string;
  fecha: string;
  titulo: string;
  intro: string;
  secciones: CulturaSeccion[];
  propuestas: CulturaPropuestaDia[];
};

let organizacionLive: OrganizacionItem[] = [];
let culturaDiasLive: CulturaDia[] = [];

export function getAgenda(): AgendaData { return agendaLive; }
export function getDeporte(): DeporteData { return deporteLive; }
export function getIngles(): InglesData { return inglesLive; }
export function getCultura(): CulturaItem[] { return culturaLive; }
export function getOrganizacion(): OrganizacionItem[] { return organizacionLive; }
export function getCulturaDias(): CulturaDia[] { return culturaDiasLive; }

function texto(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function organizacionDe(rows: ContentRow[]): OrganizacionItem[] {
  return rowsOf(rows, "organizacion").flatMap((row) => {
    if (!row.data || typeof row.data !== "object") return [];
    const data = row.data as Record<string, unknown>;
    const titulo = texto(data.titulo);
    if (!titulo) return [];
    return [{
      id: row.id,
      titulo,
      icono: texto(data.icono),
      descripcion: texto(data.descripcion),
      frecuencia: texto(data.frecuencia),
      automatico: data.automatico === true,
      coste: texto(data.coste),
      nota: texto(data.nota),
    }];
  });
}

function listaDe(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object");
}

function culturaDiasDe(rows: ContentRow[]): CulturaDia[] {
  return rowsOf(rows, "cultura_dia").flatMap((row) => {
    if (!row.data || typeof row.data !== "object") return [];
    const data = row.data as Record<string, unknown>;
    const fecha = texto(data.fecha ?? data.date).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return [];
    return [{
      id: row.id,
      fecha,
      titulo: texto(data.titulo),
      intro: texto(data.intro),
      secciones: listaDe(data.secciones).map((item) => ({
        titulo: texto(item.titulo),
        texto: texto(item.texto),
        imagen: texto(item.imagen),
        enlace: texto(item.enlace ?? item.url),
      })).filter((item) => item.titulo || item.texto || item.imagen),
      propuestas: listaDe(data.propuestas).map((item) => ({
        titulo: texto(item.titulo),
        tipo: texto(item.tipo),
        lugar: texto(item.lugar),
        horario: texto(item.horario),
        precio: texto(item.precio),
        enlace: texto(item.enlace ?? item.url),
        historia: texto(item.historia),
        descripcion: texto(item.descripcion ?? item.detalle),
      })).filter((item) => item.titulo),
    }];
  });
}

function rowsOf(rows: ContentRow[], kind: string): ContentRow[] {
  return rows.filter((row) => row.kind === kind).sort((a, b) => a.sort - b.sort || a.id.localeCompare(b.id));
}

export function applySemanaContent(rows: ContentRow[] | null) {
  if (!rows) {
    agendaLive = agendaBundled;
    deporteLive = deporteBundled;
    inglesLive = inglesBundled;
    culturaLive = culturaBundled;
    organizacionLive = [];
    culturaDiasLive = [];
    return;
  }

  const runMeta = rowsOf(rows, "run_plan").find((row) => row.id === "meta");
  const octubre = rowsOf(rows, "run_plan").find((row) => row.id === "octubre");
  const noviembre = rowsOf(rows, "run_plan").find((row) => row.id === "noviembre");
  const gym = rowsOf(rows, "gym_plan").find((row) => row.id === "main");
  const weight = rowsOf(rows, "weight").find((row) => row.id === "main");
  if (runMeta || octubre || noviembre || gym || weight) {
    const meta = (runMeta?.data ?? {}) as { actualizado?: string; fuente?: string };
    deporteLive = {
      ...deporteBundled,
      actualizado: meta.actualizado ?? deporteBundled.actualizado,
      fuente: meta.fuente ?? deporteBundled.fuente,
      running: {
        octubre_2026: (octubre?.data as DeporteData["running"]["octubre_2026"]) ?? deporteBundled.running.octubre_2026,
        noviembre_2026: (noviembre?.data as DeporteData["running"]["noviembre_2026"]) ?? deporteBundled.running.noviembre_2026,
      },
      gimnasio: (gym?.data as DeporteData["gimnasio"]) ?? deporteBundled.gimnasio,
      peso: (weight?.data as DeporteData["peso"]) ?? deporteBundled.peso,
    };
  } else {
    deporteLive = deporteBundled;
  }

  const profile = rowsOf(rows, "english_profile").find((row) => row.id === "main");
  const classes = rowsOf(rows, "english_class");
  const tasks = rowsOf(rows, "english_task");
  if (profile || classes.length || tasks.length) {
    const base = (profile?.data as Partial<InglesData>) ?? {};
    inglesLive = {
      ...inglesBundled,
      ...base,
      clases_programadas: classes.length ? classes.map((row) => row.data as InglesData["clases_programadas"][number]) : inglesBundled.clases_programadas,
      deberes_pendientes: tasks.length ? tasks.map((row) => row.data as InglesData["deberes_pendientes"][number]) : inglesBundled.deberes_pendientes,
    };
  } else {
    inglesLive = inglesBundled;
  }

  const agendaMeta = rowsOf(rows, "agenda_meta").find((row) => row.id === "main");
  const citas = rowsOf(rows, "agenda");
  if (agendaMeta || citas.length) {
    const meta = (agendaMeta?.data as Partial<AgendaData>) ?? {};
    agendaLive = {
      ...agendaBundled,
      ...meta,
      citas: citas.length ? citas.map((row) => row.data as AgendaData["citas"][number]) : agendaBundled.citas,
    };
  } else {
    agendaLive = agendaBundled;
  }

  const cultura = rowsOf(rows, "cultura");
  culturaLive = cultura.length ? cultura.map((row) => row.data as CulturaItem) : culturaBundled;
  organizacionLive = organizacionDe(rows);
  culturaDiasLive = culturaDiasDe(rows);
}
