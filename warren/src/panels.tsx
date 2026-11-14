import type { CSSProperties } from "react";
import { ProximosResultados } from "./earnings";
import { fecha, fmt, pct } from "./format";
import { safeHttpUrl } from "./markdown-parse";
import { cagr3, priceReturn } from "./math";
import { calendarModel, calendarRows, certaintyLabel, entrada15, entradaHit, isSoon, meanRent, sessionLabel, shownReturn, STAR_LEGEND, virtualLines, weekday, type CalendarRow } from "./pendientes";
import type { Company, EarningsRow, RadarItem, VirtualEntry } from "./types";

const PANEL = "#14284B";
const INK3 = "#8FA6CF";
const YELLOW = "#FFE14A";
const GREEN = "#3DDC97";
const LINE = "rgba(130,170,230,0.18)";

function dash(title: string) {
  return <span title={title}>—</span>;
}

export function Stars(props: { stars: number | null | undefined; note?: string | null; at?: string | null; emphasize?: boolean }) {
  const value = typeof props.stars === "number" && props.stars >= 1 && props.stars <= 5 ? Math.round(props.stars) : null;
  const note = props.note?.trim() || null;
  if (value === null) return <span style={{ color: INK3 }} title={note || undefined}>☆ sin valorar</span>;
  const when = props.at ? fecha(props.at.slice(0, 10)) : null;
  const title = [note, when && when !== "N/D" ? "valorado " + when.slice(0, 5) : null].filter(Boolean).join(" · ");
  return (
    <span title={title || undefined} style={{ color: YELLOW, fontSize: props.emphasize ? 22 : 16, letterSpacing: 1 }}>
      {"★".repeat(value)}<span style={{ opacity: 0.45 }}>{"☆".repeat(5 - value)}</span>
      <span style={{ color: INK3, fontSize: 12, marginLeft: 6 }}>{STAR_LEGEND[value - 1][1]}</span>
      {note ? <span style={{ display: "block", color: INK3, fontSize: 12, letterSpacing: 0, marginTop: 2 }}>{note}{when && when !== "N/D" ? " · valorado " + when.slice(0, 5) : ""}</span> : null}
    </span>
  );
}

export function StarLegend() {
  return <p className="stamp" style={{ color: INK3, fontWeight: 500 }}>{STAR_LEGEND.map(([n, label]) => n + " " + label).join(" · ")}</p>;
}

export function EntradaMark(props: { company: Company | null; radar: RadarItem | null; spot: number | null }) {
  const entrada = entrada15(props.company, props.radar);
  if (entrada.price === null) return dash(entrada.note || "Sin precio de entrada");
  const hit = entradaHit(props.spot, entrada.price);
  const currency = props.radar?.price_currency || props.company?.currency || "";
  return <span title={entrada.note || (entrada.source === "radar" ? "target 3A / 1,15³" : undefined)} style={{ color: hit ? GREEN : "inherit", fontWeight: hit ? 800 : 600 }}>{fmt(entrada.price)}{currency ? " " + currency : ""}</span>;
}

function oneCell(target: number | null, price: number | null, pending: string) {
  if (target === null) return dash(pending);
  const rent = price !== null && price > 0 ? priceReturn(target, price) : null;
  return <span>{fmt(target)}{rent === null ? "" : " · " + pct(rent)}</span>;
}

function threeCell(target: number | null, price: number | null, pending: string) {
  if (target === null) return dash(pending);
  const rate = price !== null && price > 0 ? cagr3(target, price) : null;
  return <span>{fmt(target)}{rate === null ? "" : <> · <span style={{ color: YELLOW, fontWeight: 800 }}>CAGR {pct(rate)}</span></>}</span>;
}

export function SourceCompare(props: { price: number | null; tikr1: number | null; warren1: number | null; tikr3: number | null; warren3: number | null }) {
  const head: CSSProperties = { textAlign: "left", color: INK3, fontSize: 12, padding: "8px 10px" };
  const cell: CSSProperties = { padding: "8px 10px", whiteSpace: "nowrap", borderTop: "1px solid " + LINE };
  return (
    <div style={{ overflowX: "auto", maxWidth: "100%", marginTop: 8, border: "1px solid " + LINE, borderRadius: 12 }}>
      <table style={{ borderCollapse: "collapse", width: "max-content", minWidth: "100%", fontSize: 14 }}>
        <thead>
          <tr>
            <th style={head} />
            <th style={head}>1 año</th>
            <th style={head}>3 años</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th style={{ ...cell, textAlign: "left" }}>TIKR (consenso)</th>
            <td style={cell}>{oneCell(props.tikr1, props.price, "TIKR pendiente")}</td>
            <td style={cell}>{threeCell(props.tikr3, props.price, "TIKR pendiente")}</td>
          </tr>
          <tr>
            <th style={{ ...cell, textAlign: "left" }}>Warren (hijo de Buffett)</th>
            <td style={cell}>{oneCell(props.warren1, props.price, "Warren pendiente")}</td>
            <td style={cell}>{threeCell(props.warren3, props.price, "Warren pendiente")}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function Seguimiento(props: { companies: Company[]; radar: RadarItem[]; earnings: EarningsRow[]; onOpen: (ticker: string) => void }) {
  const rows = props.companies.filter((company) => !company.in_portfolio);
  return (
    <section style={{ marginTop: 18 }}>
      <h2 style={{ fontSize: 22, marginBottom: 4 }}>Seguimiento (no en cartera)</h2>
      <p style={{ color: INK3, marginTop: 0 }}>Sin acciones y sin plusvalías en euros. No entra en los totales de Mi cartera.</p>
      <div className="w-scroll">
        <table className="w-table">
          <thead>
            <tr>{["Empresa", "P. hoy", "Obj. 1A", "Obj. 3A", "CAGR 1A", "CAGR 3A", "Entrada 15 %", "Warren", "Próx. resultados"].map((label, index) => <th key={label} className={index === 0 ? "sticky" : ""}>{label}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length === 0 ? <tr><td className="sticky">Sin seguimiento</td><td colSpan={8}>—</td></tr> : rows.map((company) => {
              const radar = props.radar.find((item) => item.company_id === company.id) ?? props.radar.find((item) => item.ticker.toUpperCase() === company.ticker.toUpperCase()) ?? null;
              const price = radar?.price ?? null;
              const cagr1 = shownReturn(radar?.target_1a ?? null, price, 1);
              const cagr3y = shownReturn(radar?.target_3a ?? null, price, 3);
              return (
                <tr key={company.id} className="hit" onClick={() => props.onOpen(company.ticker)}>
                  <td className="sticky"><b>{company.ticker}</b><div style={{ color: INK3, fontSize: 12 }}>{company.name}</div>{company.origin === "warren_proposal" ? <div className="stamp">Propuesta Warren</div> : null}</td>
                  <td>{price === null ? "—" : fmt(price) + (radar?.price_currency ? " " + radar.price_currency : "")}</td>
                  <td>{radar?.target_1a == null ? "—" : fmt(radar.target_1a)}</td>
                  <td>{radar?.target_3a == null ? "—" : fmt(radar.target_3a)}</td>
                  <td style={{ color: YELLOW, fontWeight: 800 }}>{cagr1.text}{cagr1.sin ? <span className="stamp"> sin objetivo</span> : null}</td>
                  <td style={{ color: YELLOW, fontWeight: 800 }}>{cagr3y.text}{cagr3y.sin ? <span className="stamp"> sin objetivo</span> : null}</td>
                  <td><EntradaMark company={company} radar={radar} spot={price} /></td>
                  <td><Stars stars={company.opportunity_stars} note={company.opportunity_stars_note} at={company.opportunity_stars_at} emphasize /></td>
                  <td><ProximosResultados row={props.earnings.find((row) => row.company_id === company.id) ?? null} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CalendarCard(props: { row: CalendarRow; today: string; onOpen: (ticker: string) => void }) {
  const row = props.row;
  const soon = row.nextDate ? isSoon(props.today, row.nextDate) : false;
  const href = safeHttpUrl(row.sourceUrl ?? "");
  const when = sessionLabel(row.timeOfDay);
  const certainty = certaintyLabel(row.certainty);
  return (
    <article style={{ background: PANEL, border: "1px solid " + (soon ? YELLOW : LINE), borderRadius: 16, padding: 14, marginTop: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <button type="button" onClick={() => props.onOpen(row.ticker)} style={{ background: "none", border: 0, color: "inherit", font: "inherit", fontWeight: 800, padding: 0, textAlign: "left", minHeight: 44, cursor: "pointer", textDecoration: "underline" }}>{row.inPortfolio ? "💼 " : ""}{row.ticker}</button>
        {row.nextDate ? <b>{fecha(row.nextDate)} · {weekday(row.nextDate)}</b> : <span style={{ color: INK3 }}>Sin fecha</span>}
      </div>
      <div style={{ color: INK3 }}>{row.name}</div>
      <p style={{ margin: "8px 0" }}>{[when, certainty].filter(Boolean).join(" · ") || "—"}{row.estimateEps !== null ? " · BPA " + fmt(row.estimateEps) + (row.estimateCurrency ? " " + row.estimateCurrency : "") : ""}</p>
      {soon ? <p className="stamp">Próximos 7 días</p> : null}
      {href ? <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "#56D3EC" }}>Fuente</a> : null}
    </article>
  );
}

export function Calendario(props: { companies: Company[]; earnings: EarningsRow[]; today: string; onOpen: (ticker: string) => void }) {
  const model = calendarModel(calendarRows(props.companies, props.earnings), props.today);
  return (
    <section>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>Calendario</h1>
      <p style={{ color: INK3, marginTop: 0 }}>Próximos resultados. 💼 está en la cartera real. Solo lectura.</p>
      {model.months.map((month) => (
        <section key={month.key}>
          <h2 style={{ fontSize: 18, margin: "16px 0 4px", textTransform: "capitalize" }}>{month.label}</h2>
          {month.rows.map((row) => <CalendarCard key={row.companyId} row={row} today={props.today} onOpen={props.onOpen} />)}
        </section>
      ))}
      <h2 style={{ fontSize: 18, margin: "16px 0 4px" }}>Sin fecha todavía</h2>
      {model.undated.length === 0 ? <p style={{ color: INK3 }}>Todas tienen fecha.</p> : model.undated.map((row) => (
        <article key={row.companyId} style={{ background: PANEL, border: "1px solid " + LINE, borderRadius: 16, padding: 14, marginTop: 8 }}>
          <button type="button" onClick={() => props.onOpen(row.ticker)} style={{ background: "none", border: 0, color: "inherit", font: "inherit", fontWeight: 800, padding: 0, minHeight: 44, cursor: "pointer", textDecoration: "underline" }}>{row.inPortfolio ? "💼 " : ""}{row.ticker}</button>
          <div style={{ color: INK3 }}>{row.name}</div>
          <p style={{ color: INK3 }}>{row.pendingReason || "—"}</p>
        </article>
      ))}
    </section>
  );
}

export function VirtualTable(props: { companies: Company[]; radar: RadarItem[]; virtuals: VirtualEntry[]; earnings: EarningsRow[]; onOpen: (ticker: string) => void }) {
  const lines = virtualLines(props.companies, props.radar, props.virtuals);
  const average = meanRent(lines);
  return (
    <section>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>Cartera virtual</h1>
      <p style={{ color: INK3, marginTop: 0 }}>Empresas del radar que no están en la cartera real. Sin importe por posición: la media es la rentabilidad simple de las que tienen precio de compra y precio de hoy.</p>
      <p style={{ fontSize: 22, fontWeight: 800, color: YELLOW }}>{average === null ? "—" : pct(average)}</p>
      <div className="w-scroll">
        <table className="w-table">
          <thead>
            <tr>{["Empresa", "Fecha análisis", "Precio compra", "P. hoy", "Rentabilidad", "Precio 1A", "Precio 3A", "Entrada 15 %", "Próx. resultados"].map((label, index) => <th key={label} className={index === 0 ? "sticky" : ""}>{label}</th>)}</tr>
          </thead>
          <tbody>
            {lines.length === 0 ? <tr><td className="sticky">Sin empresas</td><td colSpan={8}>—</td></tr> : lines.map((line) => {
              const company = props.companies.find((row) => row.id === line.companyId) ?? null;
              const radar = props.radar.find((row) => row.company_id === line.companyId) ?? null;
              return (
                <tr key={line.companyId} className="hit" onClick={() => props.onOpen(line.ticker)}>
                  <td className="sticky"><b>{line.ticker}</b><div style={{ color: INK3, fontSize: 12 }}>{line.name}</div></td>
                  <td>{line.enteredOn ? fecha(line.enteredOn) : "—"}</td>
                  <td>{line.pendingBuy ? <span className="stamp">pendiente</span> : fmt(line.entryPrice) + (line.currency ? " " + line.currency : "")}</td>
                  <td>{line.price === null ? "—" : fmt(line.price) + (line.priceCurrency ? " " + line.priceCurrency : "")}</td>
                  <td style={{ color: YELLOW, fontWeight: 800 }}>{line.rent === null ? "—" : pct(line.rent)}</td>
                  <td>{line.target1 === null ? "—" : fmt(line.target1)}</td>
                  <td>{line.target3 === null ? "—" : fmt(line.target3)}</td>
                  <td><EntradaMark company={company} radar={radar} spot={line.price} /></td>
                  <td><ProximosResultados row={props.earnings.find((row) => row.company_id === line.companyId) ?? null} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
