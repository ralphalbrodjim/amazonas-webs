import { useEffect, useState } from "react";
import { importIbkr, runNewsDetect, runRadarSync } from "./db";
import { AnalysisReader } from "./markdown";
import { clearRememberedOpportunity, opportunityHash, opportunityTickerFromHash, opportunityTickerNow } from "./opportunity";
import { EntradaMark, SourceCompare, StarLegend, Stars, VirtualTable } from "./panels";
import { compareRadar, inCartera, passesFloor, readChoice, shownReturn, writeChoice, type CarteraFilter, type RadarSort } from "./pendientes";
import { earningsOf, ProximosResultados } from "./earnings";
import { eur, fecha, fechaCorta, fechaDiaMes, fmt, pct } from "./format";
import { newsGroups, newsVisible, type NewsFilter } from "./news";
import { parseIbkrCsv, type IbkrRow } from "./ibkr";
import { priceReturn } from "./math";
import type { BenchmarkLevel, Bundle, Company, NewsItem, Phase2, RadarItem, VirtualEntry } from "./types";
import { portfolioEurOn } from "./view";
import type { SourceMode } from "./math";

const NAVY = "#0D1933";
const PANEL = "#14284B";
const BLUE = "#479AFF";
const INK = "#FFFFFF";
const INK3 = "#8FA6CF";
const LINE = "rgba(130,170,230,0.18)";
const AMBER = "#FFB547";
const card = { background: PANEL, border: "1px solid " + LINE, borderRadius: 16, padding: 16 } as const;
const inputS = { background: NAVY, color: INK, border: "1px solid " + LINE, borderRadius: 10, padding: "10px 12px", width: "100%", boxSizing: "border-box" as const };
const btn = (on: boolean) => ({ cursor: "pointer", minHeight: 44, padding: "8px 14px", borderRadius: 999, border: "1px solid " + (on ? BLUE : LINE), background: on ? BLUE : "transparent", color: on ? NAVY : INK, fontWeight: 700 as const });

function companyFor(bundle: Bundle, ticker: string, companyId: string | null) {
  return bundle.companies.find((row) => row.id === companyId) ?? bundle.companies.find((row) => row.ticker.toUpperCase() === ticker.toUpperCase()) ?? null;
}

export function BenchmarkCard(props: { bundle: Bundle; levels: BenchmarkLevel[] }) {
  const symbols = [...new Set(props.levels.map((row) => row.symbol))];
  const symbol = symbols.sort((a, b) => props.levels.filter((row) => row.symbol === b).length - props.levels.filter((row) => row.symbol === a).length)[0] ?? null;
  const points = props.levels.filter((row) => row.symbol === symbol && row.level !== null).sort((a, b) => a.price_date.localeCompare(b.price_date));
  const first = points[0] ?? null;
  const last = points.length > 1 ? points[points.length - 1] : null;
  const indexReturn = first && last ? priceReturn(last.level, first.level) : null;
  const portfolio = first && last ? (() => {
    const start = portfolioEurOn(props.bundle, first.price_date);
    const end = portfolioEurOn(props.bundle, last.price_date);
    return priceReturn(end, start);
  })() : null;
  return (
    <article style={{ ...card, margin: "12px 0" }}>
      <div style={{ color: INK3, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>Índice · solo precio</div>
      {points.length < 2 ? <p style={{ color: INK3 }}>N/D. Hacen falta dos cierres del índice en warren_benchmark_levels. No hay ninguno cargado.</p> : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
          <div><div style={{ color: INK3, fontSize: 12 }}>{symbol} {fechaCorta(first?.price_date ?? null)}–{fechaCorta(last?.price_date ?? null)}</div><div style={{ fontSize: 22, fontWeight: 800 }}>{pct(indexReturn)}</div></div>
          <div><div style={{ color: INK3, fontSize: 12 }}>Cartera real</div><div style={{ fontSize: 22, fontWeight: 800 }}>{pct(portfolio)}</div></div>
        </div>
      )}
      {points.length >= 2 && portfolio === null ? <p className="stamp">La cartera queda en N/D: falta el número de acciones, un cierre en esas fechas, o el cambio BCE.</p> : null}
    </article>
  );
}

function radarValue(value: number | null | undefined, text: string): string {
  return value === null || value === undefined || !Number.isFinite(value) ? "Pendiente" : text;
}

const CAGR_YELLOW = "#FFE14A";
const SORTS = ["cagr3", "cagr1", "stars"] as const;
const FLOORS = ["", "0", "0.1", "0.15", "0.2"] as const;
const STAR_FLOORS = ["", "1", "2", "3", "4", "5"] as const;

function hasReport(company: Company | null): boolean {
  return Boolean(company?.report_md && company.report_md.trim());
}

export function Radar(props: { bundle: Bundle; phase2: Phase2; mode: SourceMode; today: string; owner: boolean; onOpen: (ticker: string) => void; onSaved: () => void }) {
  const linked = opportunityTickerNow();
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [cartera, setCartera] = useState<CarteraFilter>(() => readChoice("warren.radar.cartera", ["todas", "si", "no"] as const, "todas"));
  const [sort, setSort] = useState<RadarSort>(() => readChoice("warren.radar.sort", SORTS, "cagr3"));
  const [min1, setMin1] = useState(() => readChoice("warren.radar.min1", FLOORS, ""));
  const [min3, setMin3] = useState(() => readChoice("warren.radar.min3", FLOORS, ""));
  const [minStars, setMinStars] = useState(() => readChoice("warren.radar.stars", STAR_FLOORS, ""));
  const [reportTicker, setReportTicker] = useState<string | null>(linked);

  useEffect(() => {
    function sync() {
      const ticker = opportunityTickerFromHash(window.location.hash);
      if (ticker) {
        setReportTicker(ticker);
        clearRememberedOpportunity();
        return;
      }
      setReportTicker(null);
    }
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  function openReport(ticker: string) {
    const next = opportunityHash(ticker);
    setReportTicker(ticker.toUpperCase());
    if (window.location.hash !== next) window.location.hash = next;
  }

  function closeReport() {
    setReportTicker(null);
    clearRememberedOpportunity();
    if (opportunityTickerFromHash(window.location.hash)) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }
  const labels: Record<RadarItem["status"], string> = { vigilar: "Vigilar", en_analisis: "En análisis", descartada: "Descartada" };
  const floor1 = min1 === "" ? null : Number(min1);
  const floor3 = min3 === "" ? null : Number(min3);
  const floorStars = minStars === "" ? null : Number(minStars);
  const companyOf = (item: RadarItem) => companyFor(props.bundle, item.ticker, item.company_id);
  const items = [...props.phase2.radar].filter((item) => {
    const company = companyOf(item);
    if (!inCartera(company, cartera)) return false;
    if (!passesFloor(item.potencial_1a ?? null, floor1)) return false;
    if (!passesFloor(item.cagr_3a ?? null, floor3)) return false;
    if (!passesFloor(company?.opportunity_stars ?? null, floorStars)) return false;
    return true;
  }).sort((a, b) => compareRadar(a, b, sort, companyOf));
  const computed = props.phase2.radar.map((item) => item.computed_at).filter((value): value is string => Boolean(value)).sort().at(-1) ?? null;
  const openCompany = reportTicker ? props.bundle.companies.find((row) => row.ticker.toUpperCase() === reportTicker) ?? null : null;
  function choose<T extends string>(key: string, value: T, set: (value: T) => void) {
    set(value);
    writeChoice(key, value);
  }
  return (
    <section>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>Radar</h1>
      <p className="stamp">Radar · domingo 19:00 Madrid · {computed ? fechaDiaMes(computed) : "Pendiente"}</p>
      {props.owner ? <button type="button" style={{ ...btn(true), minHeight: 52, marginBottom: 12 }} disabled={props.phase2.missing || busy} onClick={() => void (async () => {
        setBusy(true);
        setMsg("");
        const error = await runRadarSync();
        setBusy(false);
        if (error) { setMsg(error); return; }
        props.onSaved();
      })()}>{busy ? "Recalculando…" : "Recalcular Radar"}</button> : null}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        {([["todas", "Todas"], ["si", "En cartera"], ["no", "No en cartera"]] as const).map(([id, label]) => (
          <button key={id} type="button" style={{ ...btn(cartera === id), minHeight: 52, fontSize: 16, padding: "12px 16px" }} onClick={() => choose("warren.radar.cartera", id, setCartera)}>{label}</button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8, marginBottom: 8 }}>
        <label>Ordenar por<select aria-label="Ordenar por" style={inputS} value={sort} onChange={(event) => choose("warren.radar.sort", event.target.value as RadarSort, setSort)}><option value="cagr3">CAGR 3A</option><option value="cagr1">CAGR 1A</option><option value="stars">Estrellas Warren</option></select></label>
        <label>CAGR 1A ≥<select aria-label="CAGR 1A mínimo" style={inputS} value={min1} onChange={(event) => choose("warren.radar.min1", event.target.value as typeof min1, setMin1)}><option value="">Sin mínimo</option><option value="0">0 %</option><option value="0.1">10 %</option><option value="0.15">15 %</option><option value="0.2">20 %</option></select></label>
        <label>CAGR 3A ≥<select aria-label="CAGR 3A mínimo" style={inputS} value={min3} onChange={(event) => choose("warren.radar.min3", event.target.value as typeof min3, setMin3)}><option value="">Sin mínimo</option><option value="0">0 %</option><option value="0.1">10 %</option><option value="0.15">15 %</option><option value="0.2">20 %</option></select></label>
        <label>Estrellas ≥<select aria-label="Estrellas mínimas" style={inputS} value={minStars} onChange={(event) => choose("warren.radar.stars", event.target.value as typeof minStars, setMinStars)}><option value="">Sin mínimo</option>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={String(n)}>{n}</option>)}</select></label>
      </div>
      <StarLegend />
      <p style={{ color: INK3 }}>Obj. 1A y Obj. 3A salen del radar guardado. Si falta un objetivo, el CAGR usa el precio de hoy y marca «sin objetivo».</p>
      {props.phase2.missing ? <p className="stamp">Falta supabase/warren_phase2.sql. La lista está vacía y no se guarda nada.</p> : null}
      {items.length === 0 ? <p style={{ color: INK3 }}>{props.phase2.radar.length === 0 ? "Sin candidatas." : "Ninguna con este filtro."}</p> : items.map((item) => {
        const company = companyOf(item);
        const price = item.price ?? null;
        const target1 = item.target_1a ?? null;
        const target3 = item.target_3a ?? null;
        const cagr1 = shownReturn(target1, price, 1);
        const cagr3y = shownReturn(target3, price, 3);
        const priceDate = item.price_date ? fechaDiaMes(item.price_date) : null;
        return (
          <article key={item.id} style={{ ...card, marginTop: 8, outline: company && !company.in_portfolio ? "1px solid " + CAGR_YELLOW : undefined }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              {company ? <button type="button" className="hit" onClick={() => props.onOpen(company.ticker)} style={{ background: "none", border: 0, color: "inherit", font: "inherit", fontWeight: 700, padding: 0, cursor: "pointer", textDecoration: "underline", textAlign: "left", minHeight: 44 }}>{item.ticker}</button> : <b>{item.ticker}</b>}
              <span className="stamp">{labels[item.status] ?? item.status}{item.changed ? " · Cambió" : ""}</span>
            </div>
            <div style={{ color: INK3 }}>{item.name || company?.name || "Sin nombre"}{company?.origin === "warren_proposal" ? <span className="stamp"> · Propuesta Warren</span> : null}</div>
            <div style={{ marginTop: 8 }}><Stars stars={company?.opportunity_stars} note={company?.opportunity_stars_note} at={company?.opportunity_stars_at} emphasize={company ? !company.in_portfolio : false} /></div>
            {hasReport(company) ? <button type="button" style={{ ...btn(false), width: "100%", minHeight: 52, fontSize: 17, marginTop: 8 }} onClick={() => openReport(item.ticker)}>Ver análisis</button> : null}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
              {[{ label: "CAGR 1A", item: cagr1 }, { label: "CAGR 3A", item: cagr3y }].map((block) => (
                <div key={block.label}>
                  <div style={{ color: CAGR_YELLOW, fontSize: 13, fontWeight: 700 }}>{block.label}</div>
                  <div style={{ color: CAGR_YELLOW, fontSize: 32, fontWeight: 800, lineHeight: 1.1 }}>{block.item.text}</div>
                  {block.item.sin ? <div className="stamp">sin objetivo</div> : null}
                </div>
              ))}
            </div>
            <SourceCompare price={price} tikr1={item.target_1a_tikr ?? null} warren1={item.target_1a_warren ?? null} tikr3={item.target_3a_tikr ?? null} warren3={item.target_3a_warren ?? null} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
              <span>Precio {radarValue(item.price, item.price_currency === "EUR" ? eur(item.price, 2) : fmt(item.price ?? null) + (item.price_currency ? " " + item.price_currency : ""))}{priceDate ? " · " + priceDate : ""}</span>
              <span>Entrada 15 % <EntradaMark company={company} radar={item} spot={price} /></span>
              <span>Escenario {item.scenario || "pendiente"}</span>
              <span>Obj. 1A {radarValue(target1, fmt(target1))}</span>
              <span>Obj. 3A {radarValue(target3, fmt(target3))}</span>
            </div>
            <div style={{ marginTop: 8 }}>Próx. resultados <ProximosResultados row={earningsOf(props.bundle.earnings, company?.id ?? item.company_id)} /></div>
            {item.changed && item.change_note ? <p className="stamp">{item.change_note}</p> : null}
            {item.pending_reason ? <p className="stamp">{item.pending_reason}</p> : null}
            {item.target_bajista != null || item.target_optimista != null ? <p className="stamp">{item.target_bajista != null ? "Bajista " + fmt(item.target_bajista) : ""}{item.target_bajista != null && item.target_optimista != null ? " · " : ""}{item.target_optimista != null ? "Optimista " + fmt(item.target_optimista) : ""}</p> : null}
            {item.thesis ? <p>{item.thesis}</p> : null}
            {item.as_of ? <p className="stamp">Apuntada el {fecha(item.as_of)}</p> : null}
          </article>
        );
      })}
      {msg ? <p style={{ color: AMBER }}>{msg}</p> : null}
      {reportTicker ? <AnalysisReader ticker={reportTicker} name={openCompany?.name ?? props.phase2.radar.find((row) => row.ticker.toUpperCase() === reportTicker)?.name} sentOn={openCompany?.report_sent_on} source={props.bundle.companies.length === 0 ? null : (openCompany?.report_md ?? "")} onClose={closeReport} /> : null}
    </section>
  );
}

const newsLabel: Record<string, string> = { filing: "Informe oficial", press: "Prensa", x_post: "X", noticia: "Noticia", comentario: "Comentario", idea: "Idea" };
const impactColor: Record<string, string> = { positivo: "#3DDC97", neutral: "#8FA6CF", negativo: "#FF6B6B" };

function safeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : null;
  } catch {
    return null;
  }
}

function NewsCard(props: { item: NewsItem }) {
  const item = props.item;
  const href = safeUrl(item.url);
  const summary = item.analyzed_at && item.summary?.trim() ? item.summary.trim() : "";
  const color = item.impact ? impactColor[item.impact] : null;
  return (
    <article style={{ ...card, marginTop: 8, borderLeft: "4px solid " + (color ?? LINE), opacity: color ? 1 : 0.72 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <b>{item.title}</b>
        <span className="stamp">{newsLabel[item.kind] ?? item.kind}{item.materiality ? " · " + item.materiality : ""}</span>
      </div>
      <p className="stamp">{item.ticker ? item.ticker + " · " : ""}{item.source || newsLabel[item.kind]}{item.impact ? " · " + item.impact : ""}</p>
      {summary ? <p style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{summary}</p> : null}
      {href ? <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: BLUE }}>{item.kind === "x_post" ? "Ver en X" : "Fuente"}</a> : null}
    </article>
  );
}

function XCard(props: { item: NewsItem }) {
  const item = props.item;
  const href = safeUrl(item.url);
  const handle = item.author?.replace(/^@/, "").trim();
  const color = item.impact ? impactColor[item.impact] : null;
  return (
    <article style={{ ...card, marginTop: 8, borderLeft: "4px solid " + (color ?? LINE), opacity: color ? 1 : 0.72 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><b>{handle ? "@" + handle : "En X"}</b>{item.ticker ? <span className="stamp">{item.ticker}</span> : null}</div>
      <p style={{ margin: "8px 0" }}>{item.title}</p>
      {item.materiality ? <p className="stamp">{item.materiality}</p> : null}
      {href ? <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: BLUE }}>Ver en X</a> : null}
    </article>
  );
}

export function Intelligence(props: { phase2: Phase2; owner: boolean; onSaved: () => void }) {
  const [msg, setMsg] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [company, setCompany] = useState("");
  const [filter, setFilter] = useState<NewsFilter>("todos");
  const visible = newsVisible(props.phase2.news);
  const tickers = [...new Set(visible.map((item) => item.ticker).filter((value): value is string => Boolean(value)))].sort();
  const groups = newsGroups(visible, company, filter);
  const filters: { id: NewsFilter; label: string }[] = [
    { id: "todos", label: "Todos" },
    { id: "filing", label: "Informe oficial" },
    { id: "press", label: "Prensa" },
    { id: "x_post", label: "X" },
  ];
  return (
    <section>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>Warren Intelligence</h1>
      <p style={{ color: INK3 }}>Informes oficiales, prensa y publicaciones ya guardadas, por día de Madrid. El resumen solo se muestra si ya viene analizado.</p>
      {props.phase2.missing ? <p className="stamp">Falta supabase/warren_phase2.sql.</p> : null}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <label style={{ ...card, padding: 8 }}>Empresa
          <select style={inputS} value={company} onChange={(event) => setCompany(event.target.value)}>
            <option value="">Todas</option>
            {tickers.map((ticker) => <option key={ticker} value={ticker}>{ticker}</option>)}
          </select>
        </label>
        {filters.map((item) => <button key={item.id} type="button" style={btn(filter === item.id)} onClick={() => setFilter(item.id)}>{item.label}</button>)}
        {props.owner ? <button type="button" style={btn(true)} disabled={props.phase2.missing || detecting} onClick={() => void (async () => {
          setDetecting(true);
          setMsg("");
          const error = await runNewsDetect();
          setDetecting(false);
          if (error) { setMsg(error); return; }
          props.onSaved();
        })()}>{detecting ? "Detectando…" : "Detectar noticias SEC"}</button> : null}
      </div>
      {groups.length === 0 ? <p style={{ color: INK3 }}>Sin noticias.</p> : groups.map((group) => {
        const posts = group.items.filter((item) => item.kind === "x_post");
        const rest = group.items.filter((item) => item.kind !== "x_post");
        return (
          <section key={group.day}>
            <h2 style={{ fontSize: 18, margin: "16px 0 8px" }}>{fecha(group.day)}</h2>
            {rest.map((item) => <NewsCard key={item.id} item={item} />)}
            {posts.length > 0 ? <h3 style={{ fontSize: 16, margin: "14px 0 0" }}>En X</h3> : null}
            {posts.map((item) => <XCard key={item.id} item={item} />)}
          </section>
        );
      })}
      {msg ? <p style={{ color: AMBER }}>{msg}</p> : null}
    </section>
  );
}

export function VirtualBook(props: { bundle: Bundle; phase2: Phase2; onOpen: (ticker: string) => void; onSaved: () => void }) {
  return (
    <>
      {props.phase2.missing ? <p className="stamp">Falta supabase/warren_phase2.sql.</p> : null}
      <VirtualTable companies={props.bundle.companies} radar={props.phase2.radar} virtuals={props.phase2.virtuals} earnings={props.bundle.earnings} onOpen={props.onOpen} />
    </>
  );
}

export function IbkrImport(props: { disabled: boolean; onSaved: () => void }) {
  const [rows, setRows] = useState<IbkrRow[]>([]);
  const [msg, setMsg] = useState("");
  return (
    <section style={{ ...card, marginTop: 12 }}>
      <h2 style={{ marginTop: 0, fontSize: 18 }}>Importar IBKR</h2>
      <p style={{ color: INK3 }}>CSV de posiciones o de actividad. No hay conexión con IBKR. Si falta la cantidad, la fecha del cierre o la divisa, esa celda queda en N/D y no se inventa.</p>
      <input type="file" accept=".csv,text/csv" disabled={props.disabled} onChange={(event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        void file.text().then((text) => {
          const parsed = parseIbkrCsv(text);
          setRows(parsed.rows);
          setMsg(parsed.error ?? parsed.rows.length + " filas leídas. Revisa antes de guardar.");
        });
      }} />
      {rows.length > 0 ? (
        <div className="w-scroll" style={{ marginTop: 8 }}>
          <table className="w-table">
            <thead><tr>{["Ticker", "Acc.", "P. medio", "Divisa", "Cierre", "Fecha"].map((label) => <th key={label}>{label}</th>)}</tr></thead>
            <tbody>{rows.map((row) => <tr key={row.ticker + (row.priceDate ?? "")}><td>{row.ticker}</td><td>{row.shares === null ? "N/D" : fmt(row.shares, 4)}</td><td>{fmt(row.avgPrice)}</td><td>{row.currency ?? "N/D"}</td><td>{fmt(row.markPrice)}</td><td>{row.priceDate ? fecha(row.priceDate) : "N/D"}</td></tr>)}</tbody>
          </table>
        </div>
      ) : null}
      <button type="button" style={{ ...btn(true), marginTop: 8 }} disabled={props.disabled || rows.length === 0} onClick={() => void (async () => {
        const error = await importIbkr(rows);
        setMsg(error ?? "Importadas las filas que tenían cantidad.");
        if (!error) props.onSaved();
      })()}>Guardar en la cartera real</button>
      {msg ? <p style={{ color: AMBER }}>{msg}</p> : null}
    </section>
  );
}
