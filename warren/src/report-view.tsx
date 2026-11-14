import type { ReactNode } from "react";
import { PENDIENTE, formatEs, type ReportJson, type ReportTable } from "./report";

const NAVY = "#173D69";
const BLUE = "#2D6597";
const BLUE_BG = "#EAF3FB";
const GREEN_BG = "#DFF3E9";
const AMBER_BG = "#FFF0D0";
const GREY = "#F1F4F7";
const INK = "#173D69";
const MUTED = "#5C6B7A";
const BAJ = "#D86A69";
const BASE = "#3975B1";
const ALC = "#3C9B6F";
const GOLD = "#C4A35A";

const TONES = [BAJ, BASE, ALC];

function Pendiente() {
  return <span style={{ color: MUTED, fontStyle: "italic" }}>{PENDIENTE}</span>;
}

function text(value: string | null | undefined): ReactNode {
  const clean = value?.trim();
  return clean ? clean : <Pendiente />;
}

function money(value: number | null | undefined, digits = 0): ReactNode {
  return typeof value === "number" && Number.isFinite(value) ? formatEs(value, digits) : <Pendiente />;
}

function Page(props: { n: number; total: number; kicker: string; title: string; ticker: string; date: string; children: ReactNode }) {
  return (
    <article style={{ background: "#FFFFFF", color: INK, borderRadius: 12, marginTop: 12, overflow: "hidden", boxShadow: "0 8px 22px rgba(23,61,105,0.12)" }}>
      <header style={{ background: NAVY, color: "#FFFFFF", padding: "12px 14px" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.12em", fontWeight: 700 }}>WARREN · {props.ticker}{props.date ? " · " + props.date : ""}</div>
        <h2 style={{ fontSize: 18, lineHeight: 1.25, margin: "4px 0 0" }}>{props.kicker ? props.kicker + " " : ""}{props.title}</h2>
      </header>
      <div style={{ padding: 12 }}>{props.children}</div>
      <footer style={{ background: GREY, color: MUTED, fontSize: 11, padding: "8px 14px" }}>Warren · {props.ticker} · pág. {props.n}/{props.total}</footer>
    </article>
  );
}

function TableBlock(props: { table: ReportTable | null | undefined }) {
  const columns = props.table?.columnas?.filter((cell): cell is string => Boolean(cell?.trim())) ?? [];
  const rows = props.table?.filas?.filter((row): row is (string | number | null)[] => Array.isArray(row)) ?? [];
  if (columns.length === 0 && rows.length === 0) return <Pendiente />;
  return (
    <div style={{ marginTop: 10 }}>
      {props.table?.titulo ? <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>{props.table.titulo}</div> : null}
      <div style={{ overflowX: "auto", maxWidth: "100%", border: "1px solid #D5E2EE", borderRadius: 8 }}>
        <table style={{ borderCollapse: "collapse", width: "max-content", minWidth: "100%", fontSize: 13 }}>
          {columns.length > 0 ? (
            <thead>
              <tr>{columns.map((cell, index) => <th key={index} style={{ textAlign: index === 0 ? "left" : "right", padding: "8px 10px", background: BLUE_BG, color: BLUE, whiteSpace: "nowrap" }}>{cell}</th>)}</tr>
            </thead>
          ) : null}
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} style={{ textAlign: cellIndex === 0 ? "left" : "right", padding: "8px 10px", borderTop: "1px solid #E4EDF5", whiteSpace: "nowrap" }}>
                    {cell === null || cell === "" ? "—" : typeof cell === "number" ? formatEs(cell, Number.isInteger(cell) ? 0 : 1) : cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ScenarioBars(props: { items: { nombre?: string | null; precio?: number | null }[]; reference?: number | null; referenceLabel?: string | null }) {
  const items = props.items.filter((item) => typeof item.precio === "number" && item.precio > 0);
  if (items.length === 0) return <Pendiente />;
  const max = Math.max(...items.map((item) => item.precio as number), props.reference ?? 0, 1);
  const line = props.reference && props.reference > 0 ? (props.reference / max) * 100 : null;
  return (
    <div style={{ position: "relative", marginTop: 8 }}>
      {items.map((item, index) => (
        <div key={index} style={{ display: "grid", gridTemplateColumns: "72px 1fr 64px", gap: 8, alignItems: "center", marginTop: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700 }}>{item.nombre || "Escenario"}</span>
          <span style={{ position: "relative", height: 18, background: GREY, borderRadius: 9 }}>
            <span style={{ display: "block", width: ((item.precio as number) / max) * 100 + "%", height: "100%", borderRadius: 9, background: TONES[index % TONES.length] }} />
            {line !== null ? <span style={{ position: "absolute", left: line + "%", top: -6, bottom: -6, borderLeft: "2px dashed " + GOLD }} /> : null}
          </span>
          <b style={{ fontSize: 12, textAlign: "right" }}>{formatEs(item.precio as number, 0)}</b>
        </div>
      ))}
      {line !== null ? <p style={{ color: MUTED, fontSize: 11, margin: "8px 0 0" }}>{props.referenceLabel || "Precio de referencia"} {formatEs(props.reference as number, 2)} · línea dorada</p> : null}
    </div>
  );
}

function GroupedBars(props: { years: string[]; reported: (number | null)[]; adjusted: (number | null)[]; unit?: string | null }) {
  if (props.years.length === 0) return <Pendiente />;
  const values = [...props.reported, ...props.adjusted].filter((value): value is number => typeof value === "number");
  const max = Math.max(...values, 1);
  const width = 340;
  const height = 170;
  const slot = width / props.years.length;
  return (
    <div>
      <svg viewBox={"0 0 " + width + " " + height} width="100%" role="img" aria-label="FCF reportado y FCF tras SBC">
        {props.years.map((year, index) => {
          const reported = props.reported[index];
          const adjusted = props.adjusted[index];
          const h1 = typeof reported === "number" ? (reported / max) * 120 : 0;
          const h2 = typeof adjusted === "number" ? (adjusted / max) * 120 : 0;
          const x = index * slot + 8;
          return (
            <g key={year + index}>
              <rect x={x} y={132 - h1} width={14} height={h1} fill={BASE} rx={2} />
              <rect x={x + 16} y={132 - h2} width={14} height={h2} fill={ALC} rx={2} />
              <text x={x + 14} y={150} textAnchor="middle" fontSize={10} fill={MUTED}>{year}</text>
            </g>
          );
        })}
      </svg>
      <p style={{ fontSize: 11, color: MUTED, margin: "4px 0 0" }}><span style={{ color: BASE }}>■</span> FCF reportado <span style={{ color: ALC }}>■</span> FCF tras SBC{props.unit ? " · " + props.unit : ""}</p>
    </div>
  );
}

function HorizontalBars(props: { items: { etiqueta?: string | null; valor?: number | null }[] }) {
  const items = props.items.filter((item) => item.etiqueta || typeof item.valor === "number");
  if (items.length === 0) return <Pendiente />;
  const max = Math.max(...items.map((item) => (typeof item.valor === "number" ? item.valor : 0)), 1);
  return (
    <div>
      {items.map((item, index) => (
        <div key={index} style={{ marginTop: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}><span>{item.etiqueta || "—"}</span><b>{typeof item.valor === "number" ? formatEs(item.valor, 1) + " %" : "—"}</b></div>
          <div style={{ height: 12, background: GREY, borderRadius: 6, marginTop: 4 }}>
            <div style={{ width: (typeof item.valor === "number" ? Math.max(0, item.valor) / max : 0) * 100 + "%", height: "100%", borderRadius: 6, background: BLUE }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ListBlock(props: { items: (string | null)[] | null | undefined }) {
  const items = props.items?.map((item) => item?.trim()).filter((item): item is string => Boolean(item)) ?? [];
  if (items.length === 0) return <Pendiente />;
  return <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>{items.map((item, index) => <li key={index} style={{ margin: "4px 0" }}>{item}</li>)}</ul>;
}

const PROFILE = [
  ["Empresa", "empresa"],
  ["Ticker", "ticker"],
  ["Precio", "precio"],
  ["Capitalización", "capitalizacion"],
  ["Actividad", "actividad"],
] as const;

export function ReportDocument(props: { doc: ReportJson; ticker: string; name?: string | null; date?: string | null }) {
  const doc = props.doc;
  const ticker = props.ticker;
  const date = doc.fecha?.trim() || props.date || "";
  const total = 7;
  const veredicto = doc.dashboard?.veredicto;
  const tone = (veredicto?.tono || "").toLowerCase();
  const veredictoBg = tone.includes("roj") ? "#FCE8E6" : tone.includes("amb") || tone.includes("ambar") ? AMBER_BG : tone.includes("verd") ? GREEN_BG : BLUE_BG;
  const kpis = doc.dashboard?.kpis ?? [];
  const tesis = doc.dashboard?.tesis ?? [];
  const escenarios = doc.dashboard?.escenarios ?? [];
  const valor = doc.valoracion?.escenarios ?? [];
  return (
    <div style={{ fontSize: 15, lineHeight: 1.45 }}>
      <Page n={1} total={total} kicker="" title="Perfil de compañía" ticker={ticker} date={date}>
        <div style={{ display: "grid", gap: 8 }}>
          {PROFILE.map(([label, key]) => (
            <div key={key} style={{ background: BLUE_BG, borderRadius: 12, padding: "12px 14px", minHeight: 72 }}>
              <div style={{ fontSize: 11, letterSpacing: "0.08em", color: BLUE, fontWeight: 800 }}>{label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>{text(doc.perfil?.[key])}</div>
            </div>
          ))}
        </div>
      </Page>
      <Page n={2} total={total} kicker="" title="Dashboard ejecutivo" ticker={ticker} date={date}>
        <div style={{ background: veredictoBg, borderRadius: 10, padding: "10px 12px", fontWeight: 800 }}>{text(veredicto?.texto)}</div>
        <div style={{ overflowX: "auto", maxWidth: "100%", marginTop: 10 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <tbody>
              {Array.from({ length: 6 }, (_, index) => kpis[index]).map((kpi, index) => (
                <tr key={index}>
                  <td style={{ padding: "8px 4px", borderBottom: "1px solid #E4EDF5", color: MUTED }}>{kpi?.etiqueta?.trim() || <Pendiente />}</td>
                  <td style={{ padding: "8px 4px", borderBottom: "1px solid #E4EDF5", textAlign: "right", fontWeight: 800 }}>{kpi?.valor?.trim() || <Pendiente />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginTop: 12 }}>
          {Array.from({ length: 3 }, (_, index) => tesis[index]).map((item, index) => (
            <div key={index} style={{ background: GREY, borderRadius: 10, padding: 8, minHeight: 96 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: BLUE }}>{item?.titulo?.trim() || <Pendiente />}</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>{item?.texto?.trim() || <Pendiente />}</div>
            </div>
          ))}
        </div>
        <ScenarioBars items={escenarios} reference={doc.dashboard?.precio_referencia} referenceLabel={doc.dashboard?.precio_referencia_etiqueta} />
      </Page>
      <Page n={3} total={total} kicker="01" title="Negocio y moat" ticker={ticker} date={date}>
        {(doc.negocio?.parrafos ?? []).length === 0 ? <Pendiente /> : doc.negocio?.parrafos?.map((paragraph, index) => <p key={index} style={{ margin: "8px 0" }}>{paragraph?.trim() || <Pendiente />}</p>)}
        <ListBlock items={doc.negocio?.puntos} />
      </Page>
      <Page n={4} total={total} kicker="02" title="Calidad financiera y caja" ticker={ticker} date={date}>
        <GroupedBars years={(doc.caja?.anios ?? []).filter((year): year is string => Boolean(year))} reported={doc.caja?.fcf_reportado ?? []} adjusted={doc.caja?.fcf_sbc ?? []} unit={doc.caja?.unidad} />
        {(doc.caja?.tablas ?? []).length === 0 ? <div style={{ marginTop: 8 }}><Pendiente /></div> : doc.caja?.tablas?.map((table, index) => <TableBlock key={index} table={table} />)}
      </Page>
      <Page n={5} total={total} kicker="03" title="Márgenes, balance y múltiplos" ticker={ticker} date={date}>
        <HorizontalBars items={doc.margenes?.barras ?? []} />
        {(doc.margenes?.tablas ?? []).length === 0 ? <div style={{ marginTop: 8 }}><Pendiente /></div> : doc.margenes?.tablas?.map((table, index) => <TableBlock key={index} table={table} />)}
      </Page>
      <Page n={6} total={total} kicker="04" title="Valoración por escenarios" ticker={ticker} date={date}>
        {valor.length === 0 ? <Pendiente /> : (
          <div style={{ overflowX: "auto", maxWidth: "100%" }}>
            <table style={{ borderCollapse: "collapse", width: "max-content", minWidth: "100%", fontSize: 13 }}>
              <thead>
                <tr>{["Escenario", "Precio", "Retorno 1A", "CAGR 3A"].map((label) => <th key={label} style={{ textAlign: "left", padding: "8px 10px", background: GREY }}>{label}</th>)}</tr>
              </thead>
              <tbody>
                {valor.map((row, index) => (
                  <tr key={index} style={{ background: (row.tono || "").includes("baj") ? "#FCE8E6" : (row.tono || "").includes("alc") ? GREEN_BG : BLUE_BG }}>
                    <td style={{ padding: "8px 10px", fontWeight: 800 }}>{text(row.nombre)}</td>
                    <td style={{ padding: "8px 10px" }}>{money(row.precio, 0)}</td>
                    <td style={{ padding: "8px 10px" }}>{text(row.retorno_1a)}</td>
                    <td style={{ padding: "8px 10px" }}>{text(row.cagr_3a)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <ScenarioBars items={valor.map((row) => ({ nombre: row.nombre, precio: row.precio }))} reference={doc.dashboard?.precio_referencia} referenceLabel={doc.dashboard?.precio_referencia_etiqueta} />
        <TableBlock table={doc.valoracion?.crecimiento} />
        <div style={{ background: AMBER_BG, borderRadius: 12, padding: 12, marginTop: 12 }}>
          <div style={{ fontSize: 12, letterSpacing: "0.08em", fontWeight: 800 }}>ENTRADA 15 %</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>{text(doc.valoracion?.entrada_15?.precio)}</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>{text(doc.valoracion?.entrada_15?.nota)}</div>
        </div>
      </Page>
      <Page n={7} total={total} kicker="05" title="Riesgos, abogado del diablo y catalizadores" ticker={ticker} date={date}>
        <h3 style={{ fontSize: 14, margin: "4px 0" }}>Riesgos</h3>
        <ListBlock items={doc.cierre?.riesgos} />
        <h3 style={{ fontSize: 14, margin: "12px 0 4px" }}>Abogado del diablo</h3>
        <ListBlock items={doc.cierre?.abogado} />
        <h3 style={{ fontSize: 14, margin: "12px 0 4px" }}>Catalizadores</h3>
        <ListBlock items={doc.cierre?.catalizadores} />
        <div style={{ background: GREEN_BG, borderRadius: 12, padding: 12, marginTop: 12 }}>
          <div style={{ fontSize: 12, letterSpacing: "0.08em", fontWeight: 800 }}>DECISIÓN DE WARREN</div>
          <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>{text(doc.cierre?.decision?.titulo)}</div>
          <div style={{ marginTop: 4 }}>{text(doc.cierre?.decision?.texto)}</div>
        </div>
      </Page>
    </div>
  );
}
