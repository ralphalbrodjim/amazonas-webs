/** Structured Warren report. Missing pieces stay visible as «Pendiente de verificación». */

export const PENDIENTE = "Pendiente de verificación";

export type ReportTable = {
  titulo?: string | null;
  columnas?: (string | null)[] | null;
  filas?: ((string | number | null)[] | null)[] | null;
};

export type ReportJson = {
  fecha?: string | null;
  perfil?: {
    empresa?: string | null;
    ticker?: string | null;
    precio?: string | null;
    capitalizacion?: string | null;
    actividad?: string | null;
  } | null;
  dashboard?: {
    veredicto?: { texto?: string | null; tono?: string | null } | null;
    kpis?: { etiqueta?: string | null; valor?: string | null }[] | null;
    tesis?: { titulo?: string | null; texto?: string | null }[] | null;
    escenarios?: { nombre?: string | null; precio?: number | null }[] | null;
    precio_referencia?: number | null;
    precio_referencia_etiqueta?: string | null;
  } | null;
  negocio?: { parrafos?: (string | null)[] | null; puntos?: (string | null)[] | null } | null;
  caja?: {
    anios?: (string | null)[] | null;
    fcf_reportado?: (number | null)[] | null;
    fcf_sbc?: (number | null)[] | null;
    unidad?: string | null;
    tablas?: ReportTable[] | null;
  } | null;
  margenes?: {
    barras?: { etiqueta?: string | null; valor?: number | null }[] | null;
    tablas?: ReportTable[] | null;
  } | null;
  valoracion?: {
    escenarios?: {
      nombre?: string | null;
      precio?: number | null;
      retorno_1a?: string | null;
      cagr_3a?: string | null;
      hipotesis?: string | null;
      tono?: string | null;
    }[] | null;
    crecimiento?: ReportTable | null;
    entrada_15?: { precio?: string | null; nota?: string | null } | null;
  } | null;
  cierre?: {
    riesgos?: (string | null)[] | null;
    abogado?: (string | null)[] | null;
    catalizadores?: (string | null)[] | null;
    decision?: { titulo?: string | null; texto?: string | null } | null;
  } | null;
};

export function asReport(value: unknown): ReportJson | null {
  let parsed = value;
  if (typeof parsed === "string") {
    const text = parsed.trim();
    if (!text) return null;
    try { parsed = JSON.parse(text) as unknown; } catch { return null; }
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  return parsed as ReportJson;
}

export function formatEs(value: number, digits = 0): string {
  const negative = value < 0;
  const [whole, frac] = Math.abs(value).toFixed(digits).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return (negative ? "-" : "") + grouped + (frac ? "," + frac : "");
}
