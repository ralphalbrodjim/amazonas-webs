export const DIAS = [
  { id: "lunes", label: "Lunes" },
  { id: "martes", label: "Martes" },
  { id: "miercoles", label: "Miércoles" },
  { id: "jueves", label: "Jueves" },
  { id: "viernes", label: "Viernes" },
  { id: "sabado", label: "Sábado" },
  { id: "domingo", label: "Domingo" },
] as const;

export type DiaId = (typeof DIAS)[number]["id"];

export const JEFES = [
  { id: "ralph", icono: "🏛️", nombre: "Ralph", area: "Dirección" },
  { id: "lola", icono: "📅", nombre: "Lola", area: "Agenda" },
  { id: "warren", icono: "💼", nombre: "Warren", area: "Inversión" },
  { id: "martinez", icono: "🐔", nombre: "Señorita Martínez", area: "Pollos Hermanos" },
  { id: "chef", icono: "🍳", nombre: "El Chef de Antracita", area: "Cocina" },
  { id: "ateneo", icono: "🎭", nombre: "Don Ateneo", area: "Cultura" },
  { id: "rocky", icono: "🏃", nombre: "Rocky", area: "Running/Gym" },
  { id: "edward", icono: "🎓", nombre: "Sir Edward", area: "Inglés · Cambridge House" },
  { id: "vito", icono: "🏛️", nombre: "Don Vito", area: "Eficiencia" },
] as const;

export type JefeId = (typeof JEFES)[number]["id"];

export type OrganizacionCelda = {
  id: string;
  jefe: JefeId;
  dia: DiaId;
  texto: string;
};

const JEFE_IDS = new Set<string>(JEFES.map((jefe) => jefe.id));
const DIA_IDS = new Set<string>(DIAS.map((dia) => dia.id));

function texto(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Cells of kind organizacion_semana. Unknown jefes, including Kaito, are ignored. */
export function celdasOrganizacion(rows: { kind: string; id: string; data: unknown; sort?: number }[]): OrganizacionCelda[] {
  return rows
    .filter((row) => row.kind === "organizacion_semana")
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0) || a.id.localeCompare(b.id))
    .flatMap((row) => {
      if (!row.data || typeof row.data !== "object") return [];
      const data = row.data as Record<string, unknown>;
      const jefe = texto(data.jefe);
      const dia = texto(data.dia);
      if (!JEFE_IDS.has(jefe) || !DIA_IDS.has(dia)) return [];
      return [{ id: row.id, jefe: jefe as JefeId, dia: dia as DiaId, texto: texto(data.texto) }];
    });
}

export function textoCelda(celdas: OrganizacionCelda[], jefe: JefeId, dia: DiaId): string {
  const found = celdas.filter((celda) => celda.jefe === jefe && celda.dia === dia);
  return found.length ? found[found.length - 1].texto : "";
}
