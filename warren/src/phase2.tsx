import { useState } from "react";
import type { FormEvent } from "react";
import { importIbkr, runNewsDetect, saveNews, saveRadar, saveVirtual } from "./db";
import { fecha, fechaCorta, fmt, parseInput, pct } from "./format";
import { newsGroups, type NewsFilter } from "./news";
import { parseIbkrCsv, type IbkrRow } from "./ibkr";
import { priceReturn } from "./math";
import type { BenchmarkLevel, Bundle, NewsItem, Phase2, RadarItem, VirtualEntry } from "./types";
import { companyView, latestQuote, portfolioEurOn } from "./view";
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

export function Radar(props: { bundle: Bundle; phase2: Phase2; mode: SourceMode; today: string; onSaved: () => void }) {
  const [ticker, setTicker] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<RadarItem["status"]>("vigilar");
  const [thesis, setThesis] = useState("");
  const [asOf, setAsOf] = useState("");
  const [msg, setMsg] = useState("");
  const labels: Record<RadarItem["status"], string> = { vigilar: "Vigilar", en_analisis: "En análisis", descartada: "Descartada" };
  return (
    <section>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>Radar de oportunidades</h1>
      <p style={{ color: INK3 }}>Candidatas. El precio y el CAGR salen de la ficha si el ticker ya existe. Si no hay cierre, es N/D.</p>
      {props.phase2.missing ? <p className="stamp">Falta supabase/warren_phase2.sql. La lista está vacía y no se guarda nada.</p> : null}
      {props.phase2.radar.length === 0 ? <p style={{ color: INK3 }}>Sin candidatas.</p> : props.phase2.radar.map((item) => {
        const company = companyFor(props.bundle, item.ticker, item.company_id);
        const view = company ? companyView(props.bundle, company.id, props.mode, props.today) : null;
        return (
          <article key={item.id} style={{ ...card, marginTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><b>{item.ticker}</b><span className="stamp">{labels[item.status] ?? item.status}</span></div>
            <div style={{ color: INK3 }}>{item.name || company?.name || "Sin nombre"}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
              <span>Precio {view ? fmt(view.price) : "N/D"}</span>
              <span>Fecha {view?.priceDate ? fecha(view.priceDate) : "N/D"}{view?.priceOld ? " · antiguo" : ""}</span>
              <span>Obj. 3A {view ? fmt(view.target3) : "N/D"}</span>
              <span>CAGR {view ? pct(view.cagr) : "N/D"}</span>
            </div>
            {item.thesis ? <p>{item.thesis}</p> : null}
            {item.as_of ? <p className="stamp">Apuntada el {fecha(item.as_of)}</p> : null}
          </article>
        );
      })}
      <form style={{ ...card, marginTop: 12, display: "grid", gap: 8 }} onSubmit={(event: FormEvent) => {
        event.preventDefault();
        void (async () => {
          if (!ticker.trim()) { setMsg("Falta el ticker."); return; }
          const error = await saveRadar({ ticker, name, status, thesis, as_of: asOf || null });
          setMsg(error ?? "Guardada.");
          if (!error) props.onSaved();
        })();
      }}>
        <b>Añadir candidata</b>
        <input style={inputS} placeholder="Ticker" value={ticker} onChange={(event) => setTicker(event.target.value)} disabled={props.phase2.missing} />
        <input style={inputS} placeholder="Nombre" value={name} onChange={(event) => setName(event.target.value)} disabled={props.phase2.missing} />
        <select style={inputS} value={status} onChange={(event) => setStatus(event.target.value as RadarItem["status"])} disabled={props.phase2.missing}>
          <option value="vigilar">Vigilar</option>
          <option value="en_analisis">En análisis</option>
          <option value="descartada">Descartada</option>
        </select>
        <input style={inputS} placeholder="Tesis corta" value={thesis} onChange={(event) => setThesis(event.target.value)} disabled={props.phase2.missing} />
        <input style={inputS} type="date" value={asOf} onChange={(event) => setAsOf(event.target.value)} disabled={props.phase2.missing} />
        <button type="submit" style={btn(true)} disabled={props.phase2.missing}>Guardar</button>
        {msg ? <p style={{ color: AMBER }}>{msg}</p> : null}
      </form>
    </section>
  );
}

const newsLabel: Record<string, string> = { filing: "Filing", press: "Prensa", x_post: "X", noticia: "Noticia", comentario: "Comentario", idea: "Idea" };
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
  const [published, setPublished] = useState("");
  const [noteTicker, setNoteTicker] = useState("");
  const [noteKind, setNoteKind] = useState<NewsItem["kind"]>("noticia");
  const [title, setTitle] = useState("");
  const [source, setSource] = useState("");
  const [url, setUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [msg, setMsg] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [company, setCompany] = useState("");
  const [filter, setFilter] = useState<NewsFilter>("todos");
  const tickers = [...new Set(props.phase2.news.map((item) => item.ticker).filter((value): value is string => Boolean(value)))].sort();
  const groups = newsGroups(props.phase2.news, company, filter);
  const filters: { id: NewsFilter; label: string }[] = [
    { id: "todos", label: "Todos" },
    { id: "filing", label: "Filing" },
    { id: "press", label: "Prensa" },
    { id: "x_post", label: "X" },
  ];
  return (
    <section>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>Warren Intelligence</h1>
      <p style={{ color: INK3 }}>Filings, prensa y publicaciones ya guardadas, por día de Madrid. El resumen solo se muestra si ya viene analizado.</p>
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
          setMsg("Detección hecha.");
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
      <form style={{ ...card, marginTop: 12, display: "grid", gap: 8 }} onSubmit={(event: FormEvent) => {
        event.preventDefault();
        void (async () => {
          if (!published || !title.trim()) { setMsg("Hacen falta fecha y título."); return; }
          const error = await saveNews({ ticker: noteTicker, published_on: published, kind: noteKind, title, url, source, summary });
          setMsg(error ?? "Guardada.");
          if (!error) props.onSaved();
        })();
      }}>
        <b>Añadir nota</b>
        <input style={inputS} type="date" value={published} onChange={(event) => setPublished(event.target.value)} disabled={props.phase2.missing} />
        <input style={inputS} placeholder="Ticker" value={noteTicker} onChange={(event) => setNoteTicker(event.target.value)} disabled={props.phase2.missing} />
        <select style={inputS} value={noteKind} onChange={(event) => setNoteKind(event.target.value as NewsItem["kind"])} disabled={props.phase2.missing}>
          <option value="noticia">Noticia</option>
          <option value="comentario">Comentario</option>
          <option value="idea">Idea</option>
        </select>
        <input style={inputS} placeholder="Título" value={title} onChange={(event) => setTitle(event.target.value)} disabled={props.phase2.missing} />
        <input style={inputS} placeholder="Fuente" value={source} onChange={(event) => setSource(event.target.value)} disabled={props.phase2.missing} />
        <input style={inputS} placeholder="Enlace" value={url} onChange={(event) => setUrl(event.target.value)} disabled={props.phase2.missing} />
        <textarea style={inputS} placeholder="Resumen" value={summary} onChange={(event) => setSummary(event.target.value)} disabled={props.phase2.missing} />
        <button type="submit" style={btn(true)} disabled={props.phase2.missing}>Guardar</button>
      </form>
    </section>
  );
}

function virtualReturn(bundle: Bundle, entry: VirtualEntry): number | null {
  const company = companyFor(bundle, entry.ticker, entry.company_id);
  if (!company || entry.entry_price === null) return null;
  const quote = latestQuote(bundle, company.id);
  if (!quote || quote.price === null || quote.currency !== entry.currency) return null;
  return priceReturn(quote.price, entry.entry_price);
}

export function VirtualBook(props: { bundle: Bundle; phase2: Phase2; onSaved: () => void }) {
  const [ticker, setTicker] = useState("");
  const [entered, setEntered] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [source, setSource] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");
  return (
    <section>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>Cartera virtual</h1>
      <p style={{ color: INK3 }}>Sin acciones y sin euros. Rentabilidad = precio de hoy / precio de entrada − 1, en la misma divisa.</p>
      {props.phase2.missing ? <p className="stamp">Falta supabase/warren_phase2.sql.</p> : null}
      {props.phase2.virtuals.length === 0 ? <p style={{ color: INK3 }}>Sin entradas.</p> : props.phase2.virtuals.map((entry) => {
        const result = virtualReturn(props.bundle, entry);
        return (
          <article key={entry.id} style={{ ...card, marginTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}><b>{entry.ticker}</b><span>{pct(result)}</span></div>
            <p className="stamp">{fecha(entry.entered_on)} · entrada {fmt(entry.entry_price)} {entry.currency} · {entry.price_source}</p>
            {result === null ? <p style={{ color: INK3 }}>N/D. No hay un cierre de hoy en {entry.currency}.</p> : null}
            {entry.note ? <p>{entry.note}</p> : null}
          </article>
        );
      })}
      <form style={{ ...card, marginTop: 12, display: "grid", gap: 8 }} onSubmit={(event: FormEvent) => {
        event.preventDefault();
        void (async () => {
          const entryPrice = parseInput(price);
          if (!ticker.trim() || !entered || entryPrice === null || !(entryPrice > 0) || !source.trim() || !currency.trim()) {
            setMsg("Hacen falta ticker, fecha, precio, divisa y de dónde sale el precio.");
            return;
          }
          const company = companyFor(props.bundle, ticker, null);
          const error = await saveVirtual({ ticker, entered_on: entered, entry_price: entryPrice, currency: currency.toUpperCase(), price_source: source, note, company_id: company?.id ?? null });
          setMsg(error ?? "Guardada.");
          if (!error) props.onSaved();
        })();
      }}>
        <b>Nueva entrada</b>
        <input style={inputS} placeholder="Ticker" value={ticker} onChange={(event) => setTicker(event.target.value)} disabled={props.phase2.missing} />
        <input style={inputS} type="date" value={entered} onChange={(event) => setEntered(event.target.value)} disabled={props.phase2.missing} />
        <input style={inputS} placeholder="Precio de entrada" value={price} onChange={(event) => setPrice(event.target.value)} disabled={props.phase2.missing} />
        <input style={inputS} placeholder="Divisa" value={currency} onChange={(event) => setCurrency(event.target.value)} disabled={props.phase2.missing} />
        <input style={inputS} placeholder="Origen del precio" value={source} onChange={(event) => setSource(event.target.value)} disabled={props.phase2.missing} />
        <input style={inputS} placeholder="Nota" value={note} onChange={(event) => setNote(event.target.value)} disabled={props.phase2.missing} />
        <button type="submit" style={btn(true)} disabled={props.phase2.missing}>Guardar</button>
        {msg ? <p style={{ color: AMBER }}>{msg}</p> : null}
      </form>
    </section>
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
