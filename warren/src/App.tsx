import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent, ReactNode } from "react";
import { loadIsOwner, loadPhase2, loadSyncRuns, loadWarren, probeSchema, redirectTo, runPriceSync, runSecFundamentals, saveEstimate, saveManualPrice, savePosition, saveYearBpa, supabase, watchPhase2, watchWarren } from "./db";
import { fecha, fechaHoraMadrid, fmt, fmtCompact, madridToday, parseInput, pct } from "./format";
import { failureReason, latestPriceUpdate, staleTickerReason } from "./stale";
import { mixto, type SourceMode } from "./math";
import { BenchmarkCard, IbkrImport, Intelligence, Radar, VirtualBook } from "./phase2";
import { EMPTY, EMPTY_PHASE2, type Bundle, type Company, type Estimate, type Phase2, type SyncRun } from "./types";
import { companyView, type CompanyView } from "./view";
import { seriesYears, type PeriodFilter } from "./years";

const NAVY = "#0D1933";
const PANEL = "#14284B";
const BLUE = "#479AFF";
const CYAN = "#56D3EC";
const INK = "#FFFFFF";
const INK3 = "#8FA6CF";
const LINE = "rgba(130,170,230,0.18)";
const GREEN = "#3DDC97";
const AMBER = "#FFB547";

const card: CSSProperties = { background: PANEL, border: "1px solid " + LINE, borderRadius: 16, padding: 16 };
const inputS: CSSProperties = { background: NAVY, color: INK, border: "1px solid " + LINE, borderRadius: 10, padding: "10px 12px", width: "100%", boxSizing: "border-box" };
const btn = (on: boolean): CSSProperties => ({ cursor: "pointer", minHeight: 44, padding: "8px 14px", borderRadius: 999, border: "1px solid " + (on ? BLUE : LINE), background: on ? BLUE : "transparent", color: on ? NAVY : INK, fontWeight: 700 });

type Screen = "resumen" | "cartera" | "ficha" | "intelligence" | "virtual" | "radar";
type SortKey = "cagr" | "ticker" | "hoy";

function money(value: number | null, currency: string): string {
  if (value === null) return "N/D";
  return fmt(value) + " " + currency;
}

function tone(value: number | null, kind: "blue" | "green" | "plain"): string {
  if (value === null) return "nd";
  if (value < 0) return "neg";
  if (kind === "blue") return "col-blue";
  if (kind === "green") return "col-green";
  return "pos";
}

function Stamp(props: { source: string | null; date: string | null; old: boolean }) {
  return <span className="stamp">{props.source ?? "Fuente"} · {fecha(props.date)}{props.old ? " · Dato antiguo" : ""}{props.date ? "" : ""}</span>;
}

function Banner(props: { children: ReactNode }) {
  return <div style={{ ...card, borderColor: AMBER, color: INK, marginBottom: 12 }}>{props.children}</div>;
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [schema, setSchema] = useState<"missing" | "ready" | "error" | "unknown">("unknown");

  useEffect(() => {
    let live = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!live) return;
      setSessionEmail(data.session?.user.email ?? null);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionEmail(session?.user.email ?? null);
      setReady(true);
    });
    void probeSchema().then((state) => { if (live) setSchema(state); });
    return () => { live = false; data.subscription.unsubscribe(); };
  }, []);

  if (!ready) return <Frame email={null}><p style={{ color: INK3 }}>Cargando…</p></Frame>;
  if (!sessionEmail) return <Login missing={schema === "missing"} />;
  return <Desk email={sessionEmail} schemaMissing={schema === "missing"} />;
}

function Frame(props: { email: string | null; onExit?: () => void; children: ReactNode }) {
  return (
    <div style={{ background: NAVY, color: INK, minHeight: "100vh", padding: "16px 14px 48px", boxSizing: "border-box", fontFamily: "Inter, -apple-system, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 18 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg," + BLUE + "," + CYAN + ")", color: NAVY, fontWeight: 900, display: "grid", placeItems: "center" }}>W</div>
            <div>
              <div style={{ fontWeight: 900, letterSpacing: "0.14em" }}>WARREN</div>
              <div style={{ fontSize: 10, letterSpacing: "0.16em", color: INK3 }}>INVESTMENT INTELLIGENCE</div>
            </div>
          </div>
          {props.email ? <button type="button" style={btn(false)} onClick={props.onExit}>Salir</button> : null}
        </header>
        {props.children}
      </div>
    </div>
  );
}

function Login(props: { missing: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(action: "in" | "up" | "link") {
    setBusy(true);
    setMsg("");
    const to = redirectTo();
    const result = action === "in"
      ? await supabase.auth.signInWithPassword({ email, password })
      : action === "up"
        ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: to } })
        : await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: to } });
    setBusy(false);
    if (result.error) {
      const text = result.error.message;
      setMsg(/invalid login/i.test(text) ? "Correo o contraseña incorrectos." : text);
      return;
    }
    if (action === "link") setMsg("Si el correo está permitido, llegará un enlace de acceso.");
    else if (action === "up" && !result.data.session) setMsg("Cuenta creada. Revisa el correo para confirmarla, o entra si la confirmación está desactivada.");
  }

  return (
    <Frame email={null}>
      <h1 style={{ fontSize: 28, margin: "8px 0 4px" }}>Acceso de Alberto</h1>
      <p style={{ color: INK3, marginTop: 0 }}>Una sola cuenta. La cartera no se muestra sin sesión.</p>
      {props.missing ? <Banner>La base de datos de Warren todavía no está creada. La página de acceso funciona; las cifras aparecerán cuando se ejecute la migración. Mientras, no hay datos.</Banner> : null}
      <form style={{ ...card, display: "grid", gap: 12, maxWidth: 460 }} onSubmit={(event: FormEvent) => { event.preventDefault(); void run("in"); }}>
        <label>Correo<input style={inputS} type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label>Contraseña<input style={inputS} type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        <button type="submit" style={btn(true)} disabled={busy}>Entrar</button>
        <button type="button" style={btn(false)} disabled={busy || password.length < 6} onClick={() => void run("up")}>Crear la cuenta (solo la primera)</button>
        <button type="button" style={btn(false)} disabled={busy || !email} onClick={() => void run("link")}>Enviar enlace mágico</button>
        {msg ? <p style={{ color: CYAN, margin: 0 }}>{msg}</p> : null}
      </form>
    </Frame>
  );
}

function Desk(props: { email: string; schemaMissing: boolean }) {
  const [bundle, setBundle] = useState<Bundle>(EMPTY);
  const [phase2, setPhase2] = useState<Phase2>({ ...EMPTY_PHASE2, missing: true });
  const [missing, setMissing] = useState(props.schemaMissing);
  const [error, setError] = useState<string | null>(null);
  const [owner, setOwner] = useState(false);
  const [runs, setRuns] = useState<SyncRun[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>("resumen");
  const [ticker, setTicker] = useState<string | null>(null);
  const [tab, setTab] = useState<"evo" | "val" | "rent">("rent");
  const [mode, setMode] = useState<SourceMode>("mixto");
  const [q, setQ] = useState("");
  const [cartera, setCartera] = useState<"todas" | "si" | "no">("todas");
  const [cagrMin, setCagrMin] = useState<number | null>(null);
  const [sort, setSort] = useState<SortKey>("cagr");
  const today = madridToday();

  async function reload() {
    const loaded = await loadWarren();
    if (loaded.missing) { setMissing(true); setBundle(EMPTY); setPhase2({ ...EMPTY_PHASE2, missing: true }); setError(null); return; }
    if (loaded.error) { setError(loaded.error); return; }
    setMissing(false);
    setBundle(loaded.bundle ?? EMPTY);
    const extra = await loadPhase2();
    setPhase2(extra.phase2);
    setError(extra.error);
    setOwner(await loadIsOwner());
    setRuns(await loadSyncRuns());
  }

  async function actualizarPrecios() {
    setSyncing(true);
    setToast(null);
    const result = await runPriceSync();
    setSyncing(false);
    setToast(result.error ? result.error : `Precios ok ${result.ok ?? "N/D"} · fallos ${result.fail ?? "N/D"} · FX ${result.fx === null ? "N/D" : result.fx ? "ok" : "no"}`);
    await reload();
  }

  useEffect(() => { void reload(); return watchWarren(() => { void reload(); }); }, []);
  useEffect(() => { if (missing || phase2.missing) return; return watchPhase2(() => { void reload(); }); }, [missing, phase2.missing]);

  const company = bundle.companies.find((row) => row.ticker === ticker) ?? null;
  const view = company ? companyView(bundle, company.id, mode, today) : null;

  function open(next: string) {
    setTicker(next);
    setTab("rent");
    setScreen("ficha");
  }

  const nav: { id: Screen; label: string }[] = [
    { id: "resumen", label: "Resumen" },
    { id: "intelligence", label: "Intelligence" },
    { id: "cartera", label: "Mi cartera" },
    { id: "virtual", label: "Cartera virtual" },
    { id: "radar", label: "Radar" },
  ];

  return (
    <Frame email={props.email} onExit={() => void supabase.auth.signOut()}>
      <nav style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        {nav.map((item) => (
          <button key={item.id} type="button" style={btn(screen === item.id)} onClick={() => setScreen(item.id)}>
            {item.label}
          </button>
        ))}
      </nav>
      {missing ? <Banner>Migración pendiente. No hay tablas de Warren todavía, así que todo sale en N/D y no se guarda nada. Ejecuta <b>supabase/warren_phase1.sql</b> y luego <b>supabase/warren_phase2.sql</b>.</Banner> : null}
      {!missing && phase2.missing ? <Banner>La fase 2 aún no está en la base de datos. Radar, Intelligence, la cartera virtual y el índice quedan vacíos hasta ejecutar <b>supabase/warren_phase2.sql</b>.</Banner> : null}
      {error ? <Banner>No se han podido leer los datos: {error}</Banner> : null}
      {screen === "resumen" || screen === "cartera" || screen === "ficha" ? <Mode mode={mode} onChange={setMode} /> : null}
      {screen === "resumen" ? <Resumen bundle={bundle} phase2={phase2} mode={mode} today={today} q={q} setQ={setQ} cartera={cartera} setCartera={setCartera} cagrMin={cagrMin} setCagrMin={setCagrMin} sort={sort} setSort={setSort} onOpen={open} owner={owner} runs={runs} syncing={syncing} toast={toast} onSync={() => void actualizarPrecios()} /> : null}
      {screen === "cartera" ? <Cartera bundle={bundle} mode={mode} today={today} missing={missing || phase2.missing} runs={runs} onOpen={open} onSaved={() => void reload()} /> : null}
      {screen === "ficha" && company && view ? <Ficha companyName={company.name} ticker={company.ticker} currency={company.currency} notes={company.notes} verdict={company.verdict} view={view} mode={mode} bundle={bundle} companyId={company.id} tab={tab} setTab={setTab} today={today} missing={missing} owner={owner} onBack={() => setScreen("resumen")} onSaved={() => void reload()} /> : null}
      {screen === "ficha" && !company ? <p style={{ color: INK3 }}>Elige una empresa en Resumen.</p> : null}
      {screen === "intelligence" ? <Intelligence phase2={phase2} onSaved={() => void reload()} /> : null}
      {screen === "virtual" ? <VirtualBook bundle={bundle} phase2={phase2} onSaved={() => void reload()} /> : null}
      {screen === "radar" ? <Radar bundle={bundle} phase2={phase2} mode={mode} today={today} onSaved={() => void reload()} /> : null}
      <p style={{ color: INK3, fontSize: 12, marginTop: 22 }}>Cierres diarios, sin dividendos. Mixto = 50 % TIKR + 50 % Warren, y solo si los dos existen. Horizonte máximo: 3 años.</p>
      <button type="button" style={{ ...btn(false), marginTop: 8 }} onClick={() => download(bundle)}>Exportar copia JSON</button>
    </Frame>
  );
}

function download(bundle: Bundle) {
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "warren-backup.json";
  link.click();
  URL.revokeObjectURL(link.href);
}

function Mode(props: { mode: SourceMode; onChange: (mode: SourceMode) => void }) {
  const items: { id: SourceMode; label: string }[] = [
    { id: "warren", label: "Warren" },
    { id: "tikr", label: "TIKR" },
    { id: "mixto", label: "Mixto 50/50" },
  ];
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
      {items.map((item) => <button key={item.id} type="button" style={btn(props.mode === item.id)} onClick={() => props.onChange(item.id)}>{item.label}</button>)}
    </div>
  );
}

function horaMadrid(iso: string): string {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return "N/D";
  return new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(date);
}

function updatedLabel(runs: SyncRun[], quotes: Bundle["quotes"]): string {
  return "Updated " + (fechaHoraMadrid(latestPriceUpdate(runs, quotes)) ?? "N/D");
}

function TickerName(props: { company: Company; priceDate: string | null; runs: SyncRun[]; name?: string }) {
  const reason = staleTickerReason(props.company, props.priceDate, props.runs[0] ?? null, new Date());
  return (
    <>
      <b className={reason ? "neg" : undefined} title={reason ?? undefined}>{props.company.ticker}</b>
      {props.name ? <div style={{ color: INK3, fontWeight: 500 }}>{props.name}</div> : null}
    </>
  );
}

function SyncLog(props: { runs: SyncRun[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <details style={{ ...card, marginBottom: 12 }}>
      <summary style={{ cursor: "pointer", fontWeight: 700 }}>Sincronización · últimas {props.runs.length}</summary>
      {props.runs.length === 0 ? <p style={{ color: INK3 }}>Sin registros.</p> : props.runs.map((run) => {
        const fallos = (run.detail?.tickers ?? []).filter((item) => item.ok === false);
        return (
          <div key={run.id} style={{ borderTop: "1px solid " + LINE, paddingTop: 8, marginTop: 8, fontSize: 13 }}>
            <div>{horaMadrid(run.started_at)} · {run.trigger} · {run.status}</div>
            <div style={{ color: INK3 }}>ok {run.prices_ok ?? "N/D"} · fallos {run.prices_fail ?? "N/D"} · FX {run.fx_ok === null ? "N/D" : run.fx_ok ? "ok" : "no"}</div>
            {fallos.length > 0 ? <button type="button" style={{ ...btn(false), minHeight: 32, marginTop: 6 }} onClick={() => setOpen(open === run.id ? null : run.id)}>{open === run.id ? "Ocultar" : "Ver símbolos"}</button> : null}
            {open === run.id ? <ul style={{ margin: "6px 0", paddingLeft: 18 }}>{fallos.map((item, index) => <li key={(item.ticker || item.symbol || "x") + index}>{item.ticker || item.symbol || "N/D"} · {failureReason(item)}</li>)}</ul> : null}
          </div>
        );
      })}
    </details>
  );
}

function Resumen(props: {
  bundle: Bundle; phase2: Phase2; mode: SourceMode; today: string; q: string; setQ: (q: string) => void;
  cartera: "todas" | "si" | "no"; setCartera: (v: "todas" | "si" | "no") => void;
  cagrMin: number | null; setCagrMin: (v: number | null) => void; sort: SortKey; setSort: (v: SortKey) => void;
  onOpen: (ticker: string) => void;
  owner: boolean; runs: SyncRun[]; syncing: boolean; toast: string | null; onSync: () => void;
}) {
  const rows = useMemo(() => {
    const needle = props.q.trim().toLowerCase();
    const list = props.bundle.companies.filter((company) => {
      if (needle && !`${company.ticker} ${company.name}`.toLowerCase().includes(needle)) return false;
      if (props.cartera === "si" && !company.in_portfolio) return false;
      if (props.cartera === "no" && company.in_portfolio) return false;
      const view = companyView(props.bundle, company.id, props.mode, props.today);
      if (props.cagrMin !== null && (view.cagr === null || view.cagr < props.cagrMin)) return false;
      return true;
    });
    list.sort((a, b) => {
      const va = companyView(props.bundle, a.id, props.mode, props.today);
      const vb = companyView(props.bundle, b.id, props.mode, props.today);
      if (props.sort === "ticker") return a.ticker.localeCompare(b.ticker);
      if (props.sort === "hoy") return (vb.rentHoy ?? -999) - (va.rentHoy ?? -999);
      return (vb.cagr ?? -999) - (va.cagr ?? -999);
    });
    return list;
  }, [props]);
  return (
    <section>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>Resumen de inversiones</h1>
      <p style={{ color: INK3, marginTop: 0 }}>Ranking compacto · rentabilidad de precio, sin dividendos · {props.mode === "mixto" ? "Mixto solo con TIKR y Warren" : props.mode === "warren" ? "Escenario Warren" : "Consenso TIKR"}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8, marginBottom: 12 }}>
        <label style={card}>Buscar<input style={inputS} placeholder="Ticker o nombre" value={props.q} onChange={(event) => props.setQ(event.target.value)} /></label>
        <label style={card}>Cartera<select style={inputS} value={props.cartera} onChange={(event) => props.setCartera(event.target.value as "todas" | "si" | "no")}><option value="todas">Todas</option><option value="si">Sí</option><option value="no">No</option></select></label>
        <label style={card}>CAGR mínimo<select style={inputS} value={props.cagrMin === null ? "" : String(props.cagrMin)} onChange={(event) => props.setCagrMin(event.target.value === "" ? null : Number(event.target.value))}><option value="">Sin límite</option><option value="0.15">15 %</option><option value="0.2">20 %</option></select></label>
        <label style={card}>Orden<select style={inputS} value={props.sort} onChange={(event) => props.setSort(event.target.value as SortKey)}><option value="cagr">CAGR 3A desc.</option><option value="hoy">Rent. hoy desc.</option><option value="ticker">Ticker</option></select></label>
      </div>
      {props.owner ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
          <button type="button" style={btn(true)} disabled={props.syncing} onClick={props.onSync}>{props.syncing ? "Actualizando…" : "Actualizar precios"}</button>
          {props.toast ? <span className="stamp" role="status">{props.toast}</span> : null}
        </div>
      ) : null}
      {props.owner ? <SyncLog runs={props.runs} /> : null}
      {props.mode === "mixto" ? <p className="stamp">Si falta TIKR, Mixto se queda en N/D. No se rellena con el objetivo de Warren.</p> : null}
      <BenchmarkCard bundle={props.bundle} levels={props.phase2.benchmarks} />
      <div className="w-scroll">
        <table className="w-table">
          <thead>
            <tr>
              {["Empresa", "Cart.", "P. medio", "P. hoy", "Rent. hoy", "Obj 1A", "Rent 1A", "Obj 3A", "Rent 3A", "CAGR 3A"].map((label, index) => (
                <th key={label} className={index === 0 ? "sticky" : ""}>
                  {label}
                  {label === "P. hoy" ? <span className="stamp">{updatedLabel(props.runs, props.bundle.quotes)}</span> : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? <tr><td className="sticky">Sin empresas</td><td colSpan={9} className="nd">N/D</td></tr> : null}
            {rows.map((company) => {
              const view = companyView(props.bundle, company.id, props.mode, props.today);
              return (
                <tr key={company.id} className="hit" onClick={() => props.onOpen(company.ticker)}>
                  <td className="sticky"><TickerName company={company} priceDate={view.priceDate} runs={props.runs} name={company.name} /></td>
                  <td>{company.in_portfolio ? "Sí" : "No"}</td>
                  <td>{fmt(view.avg)}</td>
                  <td>{fmt(view.price)}</td>
                  <td className={tone(view.rentHoy, "plain")}>{pct(view.rentHoy)}</td>
                  <td>{fmt(view.target1)}</td>
                  <td className={tone(view.rent1, "blue")}>{pct(view.rent1)}</td>
                  <td>{fmt(view.target3)}</td>
                  <td className={tone(view.rent3, "plain")}>{pct(view.rent3)}</td>
                  <td className={tone(view.cagr, "green")}>{pct(view.cagr)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Cartera(props: { bundle: Bundle; mode: SourceMode; today: string; missing: boolean; runs: SyncRun[]; onOpen: (ticker: string) => void; onSaved: () => void }) {
  const rows = props.bundle.companies.filter((company) => company.in_portfolio);
  const views = rows.map((company) => ({ company, view: companyView(props.bundle, company.id, props.mode, props.today) }));
  const total = (pick: (view: CompanyView) => number | null) => {
    if (views.length === 0) return null;
    let sum = 0;
    for (const row of views) {
      const value = pick(row.view);
      if (value === null) return null;
      sum += value;
    }
    return sum;
  };
  const fxDates = views.map((row) => row.view.fx?.rate_date).filter((value): value is string => Boolean(value));
  return (
    <section>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>Mi cartera real</h1>
      <p style={{ color: INK3, marginTop: 0 }}>Precio contra precio medio. Los euros salen solo con número de acciones y tipo BCE. El peso es el del Excel, no un cálculo nuevo.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8, marginBottom: 12 }}>
        <Kpi label="Valor actual" value={money(total((view) => view.valueEur), "EUR")} />
        <Kpi label="Plusvalía actual" value={money(total((view) => view.pnlNowEur), "EUR")} />
        <Kpi label="Plusvalía 1 año" value={money(total((view) => view.pnl1Eur), "EUR")} />
        <Kpi label="Plusvalía 3 años" value={money(total((view) => view.pnl3Eur), "EUR")} />
      </div>
      <p className="stamp">FX BCE: {fxDates.length ? fecha(fxDates.sort().at(-1) ?? null) : "N/D"}{views.some((row) => row.company.currency !== "EUR" && !row.view.fx) ? " · falta el cambio de alguna divisa" : ""}</p>
      <IbkrImport disabled={props.missing} onSaved={props.onSaved} />
      <div className="w-scroll">
        <table className="w-table">
          <thead>
            <tr>{["Empresa", "Acc.", "P. medio", "P. hoy", "Peso Excel", "Precio 1A", "Plusv. 1A EUR", "Precio 3A", "Plusv. 3A EUR", "CAGR 3A"].map((label, index) => (
              <th key={label} className={index === 0 ? "sticky" : ""}>
                {label}
                {label === "P. hoy" ? <span className="stamp">{updatedLabel(props.runs, props.bundle.quotes)}</span> : null}
              </th>
            ))}</tr>
          </thead>
          <tbody>
            {views.length === 0 ? <tr><td className="sticky">Sin posiciones</td><td colSpan={9} className="nd">N/D</td></tr> : null}
            {views.map(({ company, view }) => (
              <tr key={company.id} className="hit" onClick={() => props.onOpen(company.ticker)}>
                <td className="sticky"><TickerName company={company} priceDate={view.priceDate} runs={props.runs} /></td>
                <td className={view.shares === null ? "nd" : ""}>{view.shares === null ? "N/D" : fmt(view.shares, 4)}</td>
                <td>{fmt(view.avg)}</td>
                <td>{fmt(view.price)}</td>
                <td>{view.weightPct === null ? "N/D" : fmt(view.weightPct, 2) + " %"}</td>
                <td>{fmt(view.target1)}</td>
                <td className={tone(view.pnl1Eur, "blue")}>{money(view.pnl1Eur, "EUR")}</td>
                <td>{fmt(view.target3)}</td>
                <td className={tone(view.pnl3Eur, "plain")}>{money(view.pnl3Eur, "EUR")}</td>
                <td className={tone(view.cagr, "green")}>{pct(view.cagr)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <SharesEditor rows={rows.map((company) => ({ id: company.id, ticker: company.ticker, currency: company.currency, position: props.bundle.positions.find((row) => row.company_id === company.id) }))} disabled={props.missing} onSaved={props.onSaved} />
    </section>
  );
}

function Kpi(props: { label: string; value: string }) {
  return <div style={card}><div style={{ color: INK3, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>{props.label}</div><div style={{ fontSize: 26, fontWeight: 800, color: CYAN, marginTop: 6 }}>{props.value}</div></div>;
}

function SharesEditor(props: { rows: { id: string; ticker: string; currency: string; position: Bundle["positions"][number] | undefined }[]; disabled: boolean; onSaved: () => void }) {
  const [draft, setDraft] = useState<Record<string, { shares: string; avg: string }>>({});
  const [msg, setMsg] = useState("");
  if (props.rows.length === 0) return null;
  return (
    <form style={{ ...card, marginTop: 12 }} onSubmit={(event) => {
      event.preventDefault();
      void (async () => {
        for (const row of props.rows) {
          const value = draft[row.id];
          if (!value) continue;
          const shares = value.shares.trim() === "" ? null : parseInput(value.shares);
          const avg = value.avg.trim() === "" ? row.position?.avg_price ?? null : parseInput(value.avg);
          if (value.shares.trim() !== "" && shares === null) { setMsg("El número de acciones de " + row.ticker + " no es un número."); return; }
          const error = await savePosition(row.id, shares, avg, row.currency);
          if (error) { setMsg(error); return; }
        }
        setMsg("Guardado.");
        props.onSaved();
      })();
    }}>
      <h2 style={{ marginTop: 0, fontSize: 18 }}>Acciones y precio medio</h2>
      <p style={{ color: INK3 }}>Vacío significa N/D. No se rellena con un cero.</p>
      {props.rows.map((row) => {
        const value = draft[row.id] ?? { shares: row.position?.shares === null || row.position?.shares === undefined ? "" : String(row.position.shares), avg: row.position?.avg_price === null || row.position?.avg_price === undefined ? "" : String(row.position.avg_price) };
        return (
          <div key={row.id} style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr", gap: 8, marginBottom: 8, alignItems: "center" }}>
            <b>{row.ticker}</b>
            <input aria-label={"Acciones " + row.ticker} style={inputS} inputMode="decimal" placeholder="Acciones" disabled={props.disabled} value={value.shares} onChange={(event) => setDraft({ ...draft, [row.id]: { ...value, shares: event.target.value } })} />
            <input aria-label={"Precio medio " + row.ticker} style={inputS} inputMode="decimal" placeholder="Precio medio" disabled={props.disabled} value={value.avg} onChange={(event) => setDraft({ ...draft, [row.id]: { ...value, avg: event.target.value } })} />
          </div>
        );
      })}
      <button type="submit" style={btn(true)} disabled={props.disabled}>Guardar</button>
      {msg ? <p style={{ color: CYAN }}>{msg}</p> : null}
    </form>
  );
}

function Ficha(props: {
  companyName: string; ticker: string; currency: string; notes: string | null; verdict: string | null;
  view: CompanyView; mode: SourceMode; bundle: Bundle; companyId: string;
  tab: "evo" | "val" | "rent"; setTab: (tab: "evo" | "val" | "rent") => void;
  today: string; missing: boolean; owner: boolean; onBack: () => void; onSaved: () => void;
}) {
  const tabs = [{ id: "evo" as const, label: "Evolución financiera" }, { id: "val" as const, label: "Valoración" }, { id: "rent" as const, label: "Rentabilidad" }];
  const extras = props.bundle.estimates.filter((row) => row.company_id === props.companyId && (row.source === "excel_bajista" || row.source === "excel_optimista") && row.horizon_years === 3);
  return (
    <section>
      <button type="button" style={btn(false)} onClick={props.onBack}>← Resumen</button>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>{props.ticker} · {props.companyName}</h1>
      <p style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <Stamp source={props.view.priceManual ? "Manual" : props.view.priceSource} date={props.view.priceDate} old={props.view.priceOld} />
        <Stamp source="Estados financieros" date={props.view.financeAsOf} old={props.view.financeOld} />
        <Stamp source={props.view.fx?.source ?? "ECB"} date={props.view.fx?.rate_date ?? null} old={props.view.fxOld} />
      </p>
      {props.verdict ? <p style={{ color: INK3 }}>{props.verdict}</p> : null}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {tabs.map((item) => <button key={item.id} type="button" style={btn(props.tab === item.id)} onClick={() => props.setTab(item.id)}>{item.label}</button>)}
      </div>
      {props.tab === "evo" ? <Evolucion view={props.view} missing={props.missing} owner={props.owner} onSaved={props.onSaved} /> : null}
      {props.tab === "val" ? <Valoracion view={props.view} mode={props.mode} companyId={props.companyId} currency={props.currency} today={props.today} missing={props.missing} onSaved={props.onSaved} /> : null}
      {props.tab === "rent" ? <Rentabilidad view={props.view} currency={props.currency} companyId={props.companyId} today={props.today} missing={props.missing} onSaved={props.onSaved} /> : null}
      {props.notes ? <p style={{ color: INK3 }}>{props.notes}</p> : null}
      {extras.length > 0 ? (
        <div style={card}>
          <h2 style={{ fontSize: 16, marginTop: 0 }}>También en el Excel, fuera del selector</h2>
          {extras.map((row) => <p key={row.id} style={{ margin: "6px 0" }}>{row.source === "excel_bajista" ? "Bajista" : "Alcista"} · {money(row.target_price, row.target_currency ?? props.currency)} · {fecha(row.as_of)} · {row.note}</p>)}
        </div>
      ) : null}
    </section>
  );
}

const LINES: { key: keyof CompanyView["years"][number]; label: string }[] = [
  { key: "sales", label: "Ventas" },
  { key: "ebitda", label: "EBITDA" },
  { key: "ebit", label: "EBIT" },
  { key: "bpa", label: "BPA" },
  { key: "gross_debt", label: "Deuda bruta" },
  { key: "cash", label: "Caja" },
  { key: "net_debt", label: "Deuda neta" },
  { key: "cfo", label: "CFO" },
  { key: "capex", label: "CAPEX" },
  { key: "fcf", label: "FCF" },
  { key: "shares_diluted", label: "Acciones" },
];

const COMPACT = new Set<keyof CompanyView["years"][number]>(["sales", "ebitda", "ebit", "gross_debt", "cash", "net_debt", "cfo", "capex", "fcf"]);

function Evolucion(props: { view: CompanyView; missing: boolean; owner: boolean; onSaved: () => void }) {
  const [period, setPeriod] = useState<PeriodFilter>("anual");
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  const [syncing, setSyncing] = useState(false);
  const years = seriesYears(props.view.years, period);
  const cuts: { id: PeriodFilter; label: string }[] = [{ id: "anual", label: "Anual" }, { id: "trimestre", label: "Trimestral" }];
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        {cuts.map((item) => <button key={item.id} type="button" style={btn(period === item.id)} onClick={() => setPeriod(item.id)}>{item.label}</button>)}
        {props.owner ? <button type="button" style={btn(true)} disabled={props.missing || syncing} onClick={() => void (async () => {
          setSyncing(true);
          setMsg("");
          const error = await runSecFundamentals();
          setSyncing(false);
          if (error) { setMsg(error); return; }
          setMsg("Fundamentales SEC actualizados.");
          props.onSaved();
        })()}>{syncing ? "Actualizando…" : "Actualizar fundamentales SEC"}</button> : null}
      </div>
      <p style={{ color: AMBER }}>Editable solo el BPA estimado (amarillo). Histórico bloqueado. Lo que no está en la fuente sigue en N/D.</p>
      {props.view.years.some((year) => year.source.toLowerCase() === "tikr") ? null : <p className="stamp">TIKR: N/D. Los ejercicios de TIKR se cargan a mano, como máximo tres, y todavía no hay ninguno.</p>}
      {years.length === 0 ? <p>Pendiente.</p> : (
      <div className="w-scroll">
        <table className="w-table">
          <thead>
            <tr>
              <th className="sticky">Concepto</th>
              {years.map((year) => <th key={year.id} className={year.kind === "estimado" ? "col-blue" : ""}>{year.fiscal_label}<span className="stamp">{year.source}</span></th>)}
            </tr>
          </thead>
          <tbody>
            {LINES.map((line) => (
              <tr key={line.key}>
                <td className="sticky">{line.label}</td>
                {years.map((year) => {
                  const value = year[line.key];
                  const number = typeof value === "number" || value === null ? value : null;
                  const editable = edit && line.key === "bpa" && year.kind === "estimado";
                  const text = number === null ? null : COMPACT.has(line.key) ? fmtCompact(number) : fmt(number);
                  return <td key={year.id}>{editable ? <input aria-label={year.fiscal_label + " BPA"} style={{ ...inputS, width: 90 }} value={draft[year.id] ?? (number === null ? "" : String(number))} onChange={(event) => setDraft({ ...draft, [year.id]: event.target.value })} /> : text === null ? <span className="nd">N/D</span> : text}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        {edit ? <button type="button" style={btn(true)} onClick={() => void (async () => {
          for (const year of years.filter((row) => row.kind === "estimado")) {
            if (!(year.id in draft)) continue;
            const next = draft[year.id].trim() === "" ? null : parseInput(draft[year.id]);
            if (draft[year.id].trim() !== "" && next === null) { setMsg("BPA no numérico en " + year.fiscal_label); return; }
            const error = await saveYearBpa(year.id, next);
            if (error) { setMsg(error); return; }
          }
          setEdit(false);
          setMsg("Guardado.");
          props.onSaved();
        })()}>Guardar</button> : <button type="button" style={btn(true)} disabled={props.missing} onClick={() => { setDraft({}); setEdit(true); }}>Modificar</button>}
        {edit ? <button type="button" style={btn(false)} onClick={() => { setEdit(false); setDraft({}); }}>Cancelar</button> : null}
      </div>
      {msg ? <p style={{ color: CYAN }}>{msg}</p> : null}
    </div>
  );
}

function Valoracion(props: { view: CompanyView; mode: SourceMode; companyId: string; currency: string; today: string; missing: boolean; onSaved: () => void }) {
  const warren = props.view.warren3;
  const tikr = props.view.tikr3;
  const methods = props.mode === "warren" ? warren.methods : props.mode === "tikr" ? tikr.methods : (warren.methods && tikr.methods && warren.price !== null && tikr.price !== null ? {
    per: mixto(warren.methods.per, tikr.methods.per),
    evFcf: mixto(warren.methods.evFcf, tikr.methods.evFcf),
    evEbitda: mixto(warren.methods.evEbitda, tikr.methods.evEbitda),
    evEbit: mixto(warren.methods.evEbit, tikr.methods.evEbit),
    average: mixto(warren.methods.average, tikr.methods.average),
    target: mixto(warren.price, tikr.price),
  } : null);
  const multiple = props.mode === "mixto" ? null : (props.mode === "warren" ? warren.row?.per ?? null : tikr.row?.per ?? null);
  const rows: { label: string; multiple: string; y1: number | null; y2: number | null; y3: number | null }[] = [
    { label: "PER", multiple: multiple === null ? "N/D" : fmt(multiple, 1) + "x", y1: null, y2: null, y3: methods?.per ?? null },
    { label: "EV / FCF", multiple: "N/D", y1: null, y2: null, y3: methods?.evFcf ?? null },
    { label: "EV / EBITDA", multiple: "N/D", y1: null, y2: null, y3: methods?.evEbitda ?? null },
    { label: "EV / EBIT", multiple: "N/D", y1: null, y2: null, y3: methods?.evEbit ?? null },
    { label: "Promedio de métodos", multiple: "—", y1: null, y2: null, y3: methods?.average ?? null },
    { label: "Objetivo", multiple: "—", y1: null, y2: null, y3: methods?.target ?? null },
  ];
  return (
    <div>
      {props.mode === "mixto" && methods === null ? <p className="stamp">Mixto N/D: falta TIKR o falta Warren. No se calcula la media a medias.</p> : null}
      <div className="w-scroll">
        <table className="w-table">
          <thead><tr>{["Método", "Múltiplo", "Año 1", "Año 2", "Año 3"].map((label, index) => <th key={label} className={index === 0 ? "sticky" : index === 1 ? "col-blue" : ""}>{label}</th>)}</tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <td className="sticky">{row.label}</td>
                <td>{row.multiple}</td>
                <td>{fmt(row.y1)}</td>
                <td>{fmt(row.y2)}</td>
                <td>{fmt(row.y3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ color: INK3 }}>Año 1 y año 2 están en N/D porque la fuente solo trae objetivo a 3 años. Warren {money(warren.price, props.currency)} · TIKR {money(tikr.price, props.currency)} · {fecha(warren.row?.as_of ?? tikr.row?.as_of ?? null)}</p>
      {props.mode === "warren" && warren.row ? <EstimateEditor row={warren.row} disabled={props.missing} onSaved={props.onSaved} /> : null}
      <TikrForm companyId={props.companyId} currency={props.currency} disabled={props.missing} onSaved={props.onSaved} />
    </div>
  );
}

function EstimateEditor(props: { row: Estimate; disabled: boolean; onSaved: () => void }) {
  const [edit, setEdit] = useState(false);
  const [per, setPer] = useState(props.row.per === null ? "" : String(props.row.per));
  const [base, setBase] = useState(props.row.bpa_base === null ? "" : String(props.row.bpa_base));
  const [growth, setGrowth] = useState(props.row.growth === null ? "" : String(props.row.growth));
  const [target, setTarget] = useState(props.row.target_price === null ? "" : String(props.row.target_price));
  const [msg, setMsg] = useState("");
  function blank(value: string): number | null | "bad" {
    if (value.trim() === "") return null;
    const parsed = parseInput(value);
    return parsed === null ? "bad" : parsed;
  }
  return (
    <div style={{ ...card, marginTop: 12 }}>
      <h2 style={{ fontSize: 16, marginTop: 0 }}>Supuestos Warren · {props.row.fiscal_label}</h2>
      {edit ? (
        <div style={{ display: "grid", gap: 8 }}>
          <label>PER<input style={inputS} value={per} onChange={(event) => setPer(event.target.value)} /></label>
          <label>BPA base<input style={inputS} value={base} onChange={(event) => setBase(event.target.value)} /></label>
          <label>Crecimiento anual (0,187 = 18,7 %)<input style={inputS} value={growth} onChange={(event) => setGrowth(event.target.value)} /></label>
          <label>Objetivo directo (vacío = se calcula)<input style={inputS} value={target} onChange={(event) => setTarget(event.target.value)} /></label>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" style={btn(true)} onClick={() => void (async () => {
              const fields = { per: blank(per), bpa_base: blank(base), growth: blank(growth), target_price: blank(target) };
              if (Object.values(fields).includes("bad")) { setMsg("Hay un número mal escrito."); return; }
              const error = await saveEstimate({ ...props.row, per: fields.per as number | null, bpa_base: fields.bpa_base as number | null, growth: fields.growth as number | null, target_price: fields.target_price as number | null });
              if (error) { setMsg(error); return; }
              setEdit(false);
              props.onSaved();
            })()}>Guardar</button>
            <button type="button" style={btn(false)} onClick={() => setEdit(false)}>Cancelar</button>
          </div>
        </div>
      ) : <button type="button" style={btn(true)} disabled={props.disabled} onClick={() => setEdit(true)}>Modificar</button>}
      {msg ? <p style={{ color: CYAN }}>{msg}</p> : null}
    </div>
  );
}

function TikrForm(props: { companyId: string; currency: string; disabled: boolean; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [asOf, setAsOf] = useState("");
  const [bpa, setBpa] = useState("");
  const [per, setPer] = useState("");
  const [target, setTarget] = useState("");
  const [msg, setMsg] = useState("");
  if (!open) return <button type="button" style={{ ...btn(false), marginTop: 12 }} disabled={props.disabled} onClick={() => setOpen(true)}>Cargar dato TIKR a mano</button>;
  return (
    <form style={{ ...card, marginTop: 12 }} onSubmit={(event) => {
      event.preventDefault();
      void (async () => {
        if (!label.trim() || !asOf) { setMsg("Hacen falta el ejercicio y la fecha del dato TIKR."); return; }
        const fields = [bpa, per, target].map((value) => value.trim() === "" ? null : parseInput(value));
        if (fields.includes(null) && [bpa, per, target].some((value) => value.trim() !== "" && parseInput(value) === null)) { setMsg("Hay un número mal escrito."); return; }
        const error = await saveEstimate({
          company_id: props.companyId, source: "tikr", horizon_years: 3, fiscal_label: label.trim(),
          bpa: bpa.trim() === "" ? null : parseInput(bpa), per: per.trim() === "" ? null : parseInput(per),
          target_price: target.trim() === "" ? null : parseInput(target), target_currency: props.currency, as_of: asOf,
          note: "Cargado a mano. TIKR no tiene API.",
        });
        if (error) { setMsg(error); return; }
        setMsg("TIKR guardado.");
        props.onSaved();
      })();
    }}>
      <h2 style={{ fontSize: 16, marginTop: 0 }}>Consenso TIKR · a mano</h2>
      <p style={{ color: INK3 }}>Pega solo lo que salga de una exportación que tú abras. Los campos vacíos se quedan vacíos.</p>
      <div style={{ display: "grid", gap: 8 }}>
        <label>Ejercicio del objetivo<input style={inputS} value={label} onChange={(event) => setLabel(event.target.value)} placeholder="2029" /></label>
        <label>Fecha del dato<input style={inputS} type="date" value={asOf} onChange={(event) => setAsOf(event.target.value)} /></label>
        <label>BPA<input style={inputS} value={bpa} onChange={(event) => setBpa(event.target.value)} /></label>
        <label>PER<input style={inputS} value={per} onChange={(event) => setPer(event.target.value)} /></label>
        <label>Precio objetivo<input style={inputS} value={target} onChange={(event) => setTarget(event.target.value)} /></label>
        <button type="submit" style={btn(true)}>Guardar TIKR</button>
        {msg ? <p style={{ color: CYAN }}>{msg}</p> : null}
      </div>
    </form>
  );
}

function Rentabilidad(props: { view: CompanyView; currency: string; companyId: string; today: string; missing: boolean; onSaved: () => void }) {
  const [edit, setEdit] = useState(false);
  const [price, setPrice] = useState("");
  const [date, setDate] = useState(props.today);
  const [msg, setMsg] = useState("");
  const cards = [
    ["Precio actual", money(props.view.price, props.view.priceCurrency)],
    ["Objetivo 1A", money(props.view.target1, props.currency)],
    ["Objetivo 3A", money(props.view.target3, props.currency)],
    ["Rentabilidad 1A", pct(props.view.rent1)],
    ["Rentabilidad 3A", pct(props.view.rent3)],
    ["CAGR 3A", pct(props.view.cagr)],
  ];
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8 }}>
        {cards.map(([label, value]) => <Kpi key={label} label={label} value={value} />)}
      </div>
      <div style={{ ...card, marginTop: 12, background: "#1F7A5A" }}>
        <div style={{ letterSpacing: "0.06em", fontSize: 13 }}>PRECIO MÁXIMO PARA EXIGIR 15 % ANUAL · horizonte 3 años</div>
        <div style={{ fontSize: 32, fontWeight: 800, marginTop: 6 }}>{money(props.view.maxPrice, props.currency)}</div>
      </div>
      <p>Plusvalía desde el precio medio, separada del potencial: {pct(props.view.rentHoy)}. Es solo precio. Los dividendos no entran.</p>
      {edit ? (
        <div style={{ display: "grid", gap: 8, maxWidth: 360 }}>
          <label>Precio manual<input style={inputS} inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} /></label>
          <label>Fecha de ese precio<input style={inputS} type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" style={btn(true)} onClick={() => void (async () => {
              const value = parseInput(price);
              if (value === null || !date) { setMsg("Hacen falta precio y fecha."); return; }
              const error = await saveManualPrice(props.companyId, value, props.currency, date);
              if (error) { setMsg(error); return; }
              setEdit(false);
              props.onSaved();
            })()}>Guardar</button>
            <button type="button" style={btn(false)} onClick={() => setEdit(false)}>Cancelar</button>
          </div>
        </div>
      ) : <button type="button" style={btn(true)} disabled={props.missing} onClick={() => { setPrice(""); setDate(props.today); setEdit(true); }}>Modificar precio</button>}
      {msg ? <p style={{ color: CYAN }}>{msg}</p> : null}
    </div>
  );
}
