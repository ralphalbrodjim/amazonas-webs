import { fechaDiaMes } from "./format";
import type { EarningsRow } from "./types";

export function earningsOf(rows: EarningsRow[] | undefined, companyId: string | null | undefined): EarningsRow | null {
  if (!companyId || !rows?.length) return null;
  const found = rows.filter((row) => row.company_id === companyId);
  if (found.length === 0) return null;
  return [...found].sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? ""))[0];
}

export function ProximosResultados(props: { row: EarningsRow | null }) {
  const row = props.row;
  if (!row?.next_date) return <span className="nd" title={row?.pending_reason || undefined}>Pendiente</span>;
  const label = fechaDiaMes(row.next_date);
  if (!label) return <span className="nd" title={row.pending_reason || undefined}>Pendiente</span>;
  const title = [row.source, row.time_of_day].filter(Boolean).join(" · ") || undefined;
  return <span title={title} style={{ whiteSpace: "nowrap" }}>{label}{row.certainty === "estimated" ? <span className="stamp"> est.</span> : null}</span>;
}
