import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent, ReactNode } from "react";
import { loadIsOwner, loadOpsDashboard, loadPhase2, loadSyncRuns, loadWarren, probeSchema, redirectTo, runHealthCheck, runSecFundamentals, saveEstimate, saveManualPrice, savePosition, saveYearBpa, supabase, watchPhase2, watchWarren } from "./db";
import { eur, fecha, fechaDiaMes, fmt, fmtCompact, madridToday, parseInput, pct } from "./format";
import { failureReason, latestPriceUpdate, staleTickerReason } from "./stale";
import { positionValueEur, type SourceMode } from "./math";
import { AnalysisReader } from "./markdown";
import { BenchmarkCard, IbkrImport, Intelligence, Radar, VirtualBook } from "./phase2";
import { EntradaMark, SourceCompare, Seguimiento, Stars, Calendario, Tikr3A, TIKR_3A_NOTE } from "./panels";
import { EMPTY, EMPTY_PHASE2, type Bundle, type Company, type Estimate, type OpsDashboard, type Phase2, type RadarItem, type SyncRun } from "./types";
import { earningsOf, ProximosResultados } from "./earnings";
import { clearRememberedOpportunity, opportunityHash, opportunityTickerFromHash, opportunityTickerNow, rememberedOpportunity, rememberOpportunityFromLocation } from "./opportunity";
import { companyView, type CompanyView } from "./view";
import { seriesYears, type PeriodFilter } from "./years";

function radarFor(rows: RadarItem[], companyId: string, ticker: string): RadarItem | null {
  return rows.find((row) => row.company_id === companyId) ?? rows.find((row) => row.ticker.toUpperCase() === ticker.toUpperCase()) ?? null;
}

function radarTarget3Of(rows: RadarItem[], companyId: string, ticker: string): number | null {
  return radarFor(rows, companyId, ticker)?.target_3a ?? null;
}

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

type Screen = "resumen" | "cartera" | "ficha" | "intelligence" | "virtual" | "radar" | "calendario";
type SortKey = "cagr" | "ticker" | "hoy";

function money(value: number | null, currency: string): string {
  if (value === null) return "N/D";
  if (currency === "EUR") return eur(value, 2);
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

  useEffect(() => { rememberOpportunityFromLocation(); }, []);

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
  const [screen, setScreen] = useState<Screen>(opportunityTickerNow() ? "radar" : "resumen");
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

  useEffect(() => { void reload(); return watchWarren(() => { void reload(); }); }, []);
  useEffect(() => {
    function openLinkedReport() {
      if (opportunityTickerFromHash(window.location.hash)) {
        clearRememberedOpportunity();
        setScreen("radar");
        return;
      }
      const saved = rememberedOpportunity();
      if (!saved) return;
      clearRememberedOpportunity();
      window.location.hash = opportunityHash(saved);
    }
    openLinkedReport();
    window.addEventListener("hashchange", openLinkedReport);
    return () => window.removeEventListener("hashchange", openLinkedReport);
  }, []);

  function go(next: Screen) {
    if (next !== "radar") {
      clearRememberedOpportunity();
      if (opportunityTickerFromHash(window.location.hash)) {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    }
    setScreen(next);
  }
  useEffect(() => { if (missing || phase2.missing) return; return watchPhase2(() => { void reload(); }); }, [missing, phase2.missing]);

  const company = bundle.companies.find((row) => row.ticker === ticker) ?? null;
  const view = company ? companyView(bundle, company.id, mode, today, radarTarget3Of(phase2.radar, company.id, company.ticker)) : null;

  const [sheetFrom, setSheetFrom] = useState<Screen>("resumen");

  function open(next: string, origin: Screen = "resumen") {
    setTicker(next);
    setTab("rent");
    setSheetFrom(origin);
    setScreen("ficha");
  }

  const nav: { id: Screen; label: string }[] = [
    { id: "resumen", label: "Resumen" },
    { id: "intelligence", label: "Intelligence" },
    { id: "cartera", label: "Mi cartera" },
    { id: "virtual", label: "Cartera virtual" },
    { id: "radar", label: "Radar" },
    { id: "calendario", label: "Calendario" },
  ];

  return (
    <Frame email={props.email} onExit={() => void supabase.auth.signOut()}>
      <nav style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        {nav.map((item) => (
          <button key={item.id} type="button" style={btn(screen === item.id)} onClick={() => go(item.id)}>
            {item.label}
          </button>
        ))}
      </nav>
      {missing ? <Banner>Migración pendiente. No hay tablas de Warren todavía, así que todo sale en N/D y no se guarda nada. Ejecuta <b>supabase/warren_phase1.sql</b> y luego <b>supabase/warren_phase2.sql</b>.</Banner> : null}
      {!missing && phase2.missing ? <Banner>La fase 2 aún no está en la base de datos. Radar, Intelligence, la cartera virtual y el índice quedan vacíos hasta ejecutar <b>supabase/warren_phase2.sql</b>.</Banner> : null}
      {error ? <Banner>No se han podido leer los datos: {error}</Banner> : null}
      {screen === "resumen" || screen === "cartera" || screen === "ficha" || screen === "radar" ? <Mode mode={mode} onChange={setMode} /> : null}
      {screen === "resumen" ? <Resumen bundle={bundle} phase2={phase2} mode={mode} today={today} q={q} setQ={setQ} cartera={cartera} setCartera={setCartera} cagrMin={cagrMin} setCagrMin={setCagrMin} sort={sort} setSort={setSort} onOpen={open} owner={owner} runs={runs} /> : null}
      {screen === "cartera" ? <Cartera bundle={bundle} radar={phase2.radar} mode={mode} today={today} missing={missing || phase2.missing} runs={runs} onOpen={open} onSaved={() => void reload()} /> : null}
      {screen === "ficha" && company && view ? <Ficha company={company} companyName={company.name} ticker={company.ticker} currency={company.currency} notes={company.notes} verdict={company.verdict} view={view} mode={mode} bundle={bundle} companyId={company.id} radar={phase2.radar.find((row) => row.company_id === company.id) ?? phase2.radar.find((row) => row.ticker.toUpperCase() === company.ticker.toUpperCase()) ?? null} tab={tab} setTab={setTab} today={today} missing={missing} owner={owner} backLabel={sheetFrom === "radar" ? "← Radar" : sheetFrom === "calendario" ? "← Calendario" : sheetFrom === "virtual" ? "← Cartera virtual" : "← Resumen"} onBack={() => setScreen(sheetFrom)} onSaved={() => void reload()} /> : null}
      {screen === "ficha" && !company ? <p style={{ color: INK3 }}>Elige una empresa en Resumen.</p> : null}
      {screen === "intelligence" ? <Intelligence phase2={phase2} owner={owner} onSaved={() => void reload()} /> : null}
      {screen === "virtual" ? <VirtualBook bundle={bundle} phase2={phase2} onOpen={(ticker) => open(ticker, "virtual")} onSaved={() => void reload()} /> : null}
      {screen === "radar" ? <Radar bundle={bundle} phase2={phase2} mode={mode} today={today} owner={owner} onOpen={(ticker) => open(ticker, "radar")} onSaved={() => void reload()} /> : null}
      {screen === "calendario" ? <Calendario companies={bundle.companies} earnings={bundle.earnings} today={today} onOpen={(ticker) => open(ticker, "calendario")} /> : null}
      <p style={{ color: INK3, fontSize: 12, marginTop: 22 }}>Cierres diarios, sin dividendos. A 1 año, Mixto = 50 % TIKR + 50 % Warren, y solo si los dos existen. El objetivo a 3 años es siempre el de Warren.</p>
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
  return fechaDiaMes(latestPriceUpdate(runs, quotes)) ?? "N/D";
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

function euros(value: number | null | undefined): string {
  return eur(value);
}

function shortOpsError(error: string | null | undefined): string | null {
  if (!error) return null;
  if (/api key|apikey|token|secret|bearer/i.test(error)) return "Error del proveedor";
  return error.length > 140 ? error.slice(0, 140) + "…" : error;
}

function SyncLog(props: { runs: SyncRun[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const [kind, setKind] = useState<"todos" | "prices" | "news" | "radar">("todos");
  const [ops, setOps] = useState<OpsDashboard | null>(null);
  const [opsError, setOpsError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const shown = props.runs.filter((run) => kind === "todos" || run.kind === kind);
  const filters: { id: typeof kind; label: string }[] = [
    { id: "todos", label: "Todos" },
    { id: "prices", label: "Precios" },
    { id: "news", label: "Noticias" },
    { id: "radar", label: "Radar" },
  ];

  async function openOps() {
    if (ops || checking) return;
    setChecking(true);
    const loaded = await loadOpsDashboard();
    setChecking(false);
    setOps(loaded.ops);
    setOpsError(loaded.error);
  }

  return (
    <details style={{ ...card, marginBottom: 12, padding: "10px 14px" }} onToggle={(event) => {
      if (event.currentTarget !== event.target) return;
      if (event.currentTarget.open) void openOps();
    }}>
      <summary style={{ cursor: "pointer", fontWeight: 700 }}>Sincronización · últimas {props.runs.length}</summary>
      {ops?.cost ? <p style={{ margin: "8px 0", fontSize: 13 }}>Presupuesto {euros(ops.cost.budget_eur)} · gastado {euros(ops.cost.spent_eur)} · tokens {ops.cost.tokens ?? 0} · {fecha(ops.cost.month_start)}</p> : null}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
        {filters.map((item) => <button key={item.id} type="button" style={{ ...btn(kind === item.id), minHeight: 36 }} onClick={() => setKind(item.id)}>{item.label}</button>)}
        <button type="button" style={{ ...btn(false), minHeight: 36 }} disabled={checking} onClick={() => void (async () => {
          setChecking(true);
          if (!ops) {
            const loaded = await loadOpsDashboard();
            setOps(loaded.ops);
            setOpsError(loaded.error);
          } else {
            const result = await runHealthCheck();
            if (result.error) setOpsError(result.error);
            else if (result.health) setOps({ ...ops, health: result.health });
          }
          setChecking(false);
        })()}>{checking ? "Comprobando…" : "Comprobar salud"}</button>
      </div>
      {opsError ? <p className="stamp">{opsError}</p> : null}
      {shown.length === 0 ? <p style={{ color: INK3 }}>Sin registros.</p> : shown.map((run) => {
        const fallos = (run.detail?.tickers ?? []).filter((item) => item.ok === false);
        const problem = shortOpsError(run.error);
        return (
          <div key={run.id} style={{ borderTop: "1px solid " + LINE, paddingTop: 8, marginTop: 8, fontSize: 13 }}>
            <div>{horaMadrid(run.started_at)} · {run.kind || "N/D"} · {run.trigger} · {run.status}</div>
            <div style={{ color: INK3 }}>ok {run.prices_ok ?? "N/D"} · fallos {run.prices_fail ?? "N/D"} · {euros(run.cost_eur)} · tokens {run.tokens_in ?? 0}/{run.tokens_out ?? 0}</div>
            {problem ? <div className="stamp">{problem}</div> : null}
            {run.next_hint ? <div style={{ color: INK3 }}>{run.next_hint}</div> : null}
            {fallos.length > 0 ? <button type="button" style={{ ...btn(false), minHeight: 32, marginTop: 6 }} onClick={() => setOpen(open === run.id ? null : run.id)}>{open === run.id ? "Ocultar" : "Ver símbolos"}</button> : null}
            {open === run.id ? <ul style={{ margin: "6px 0", paddingLeft: 18 }}>{fallos.map((item, index) => <li key={(item.ticker || item.symbol || "x") + index}>{item.ticker || item.symbol || "N/D"} · {failureReason(item)}</li>)}</ul> : null}
          </div>
        );
      })}
      {ops ? (
        <>
          <h3 style={{ fontSize: 15, margin: "14px 0 6px" }}>Próximas tareas</h3>
          {ops.next_tasks?.map((task) => <p key={task.when + task.what} style={{ margin: "4px 0", fontSize: 13 }}>{task.when} · {task.what}</p>)}
          <h3 style={{ fontSize: 15, margin: "14px 0 6px" }}>Salud · {ops.health?.pass ?? "N/D"} ok · {ops.health?.warn ?? 0} avisos · {ops.health?.fail ?? 0} fallos</h3>
          {ops.health?.checks?.map((check) => <p key={check.id} style={{ margin: "4px 0", fontSize: 13, color: check.level === "fail" ? "#FF6B6B" : check.level === "warn" ? AMBER : "#3DDC97" }}>{check.msg}</p>)}
          {ops.radar_pending?.length ? <h3 style={{ fontSize: 15, margin: "14px 0 6px" }}>Pendientes Radar</h3> : null}
          {ops.radar_pending?.map((item) => <p key={item.ticker} style={{ margin: "4px 0", fontSize: 13 }}>{item.ticker} · {item.reason}</p>)}
          <details>
            <summary style={{ cursor: "pointer", fontWeight: 700, marginTop: 10 }}>Rollback · solo lectura</summary>
            {ops.rollback_recipes?.map((recipe) => (
              <article key={recipe.id} style={{ marginTop: 8 }}>
                <div style={{ fontSize: 13 }}>{recipe.title}</div>
                <pre style={{ whiteSpace: "pre-wrap", overflow: "auto", fontSize: 12, margin: "4px 0" }}>{recipe.sql_text}</pre>
              </article>
            ))}
          </details>
        </>
      ) : null}
    </details>
  );
}

function Resumen(props: {
  bundle: Bundle; phase2: Phase2; mode: SourceMode; today: string; q: string; setQ: (q: string) => void;
  cartera: "todas" | "si" | "no"; setCartera: (v: "todas" | "si" | "no") => void;
  cagrMin: number | null; setCagrMin: (v: number | null) => void; sort: SortKey; setSort: (v: SortKey) => void;
  onOpen: (ticker: string) => void;
  owner: boolean; runs: SyncRun[];
}) {
  const rows = useMemo(() => {
    const needle = props.q.trim().toLowerCase();
    const list = props.bundle.companies.filter((company) => {
      if (needle && !`${company.ticker} ${company.name}`.toLowerCase().includes(needle)) return false;
      if (props.cartera === "si" && !company.in_portfolio) return false;
      if (props.cartera === "no" && company.in_portfolio) return false;
      const view = companyView(props.bundle, company.id, props.mode, props.today, radarTarget3Of(props.phase2.radar, company.id, company.ticker));
      if (props.cagrMin !== null && (view.cagr === null || view.cagr < props.cagrMin)) return false;
      return true;
    });
    list.sort((a, b) => {
      const va = companyView(props.bundle, a.id, props.mode, props.today, radarTarget3Of(props.phase2.radar, a.id, a.ticker));
      const vb = companyView(props.bundle, b.id, props.mode, props.today, radarTarget3Of(props.phase2.radar, b.id, b.ticker));
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
      {props.mode === "mixto" ? <p className="stamp">Si falta TIKR, Mixto se queda en N/D. No se rellena con el objetivo de Warren.</p> : null}
      <BenchmarkCard bundle={props.bundle} levels={props.phase2.benchmarks} />
      {props.owner ? <SyncLog runs={props.runs} /> : null}
      {props.cartera !== "no" ? <h2 style={{ fontSize: 22, marginBottom: 8 }}>Mi cartera</h2> : null}
      {props.cartera !== "no" ? <div className="w-scroll">
        <table className="w-table">
          <thead>
            <tr>
              {["Empresa", "Cart.", "P. medio", "P. hoy", "Rent. hoy", "Obj 1A", "Rent 1A", "Obj 3A", "Rent 3A", "CAGR 3A", "TIKR 3A (implícita)", "Próx. resultados"].map((label, index) => (
                <th key={label} className={index === 0 ? "sticky" : ""} title={label.startsWith("TIKR 3A") ? TIKR_3A_NOTE : undefined}>
                  {label}
                  {label === "P. hoy" ? <span className="stamp">{updatedLabel(props.runs, props.bundle.quotes)}</span> : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.filter((company) => company.in_portfolio).length === 0 ? <tr><td className="sticky">Sin empresas</td><td colSpan={11} className="nd">N/D</td></tr> : null}
            {rows.filter((company) => company.in_portfolio).map((company) => {
              const view = companyView(props.bundle, company.id, props.mode, props.today, radarTarget3Of(props.phase2.radar, company.id, company.ticker));
              return (
                <tr key={company.id} className="hit" onClick={() => props.onOpen(company.ticker)}>
                  <td className="sticky"><TickerName company={company} priceDate={view.priceDate} runs={props.runs} name={company.name} /></td>
                  <td>{company.in_portfolio ? "Sí" : "No"}</td>
                  <td>{fmt(view.avg)}</td>
                  <td>{view.price === null ? <span className="nd">Pendiente</span> : fmt(view.price)}</td>
                  <td className={tone(view.rentHoy, "plain")}>{pct(view.rentHoy)}</td>
                  <td>{fmt(view.target1)}{marcaUnAnio(view.target1From, props.mode) ? <span className="stamp"> {marcaUnAnio(view.target1From, props.mode)}</span> : null}</td>
                  <td className={tone(view.rent1, "blue")}>{pct(view.rent1)}{marcaUnAnio(view.target1From, props.mode) ? <span className="stamp"> {marcaUnAnio(view.target1From, props.mode)}</span> : null}</td>
                  <td>{fmt(view.target3)}</td>
                  <td className={tone(view.rent3, "plain")}>{pct(view.rent3)}</td>
                  <td className={tone(view.cagr, "green")}>{pct(view.cagr)}</td>
                  <td><Tikr3A value={radarFor(props.phase2.radar, company.id, company.ticker)?.target_3a_tikr} /></td>
                  <td><ProximosResultados row={earningsOf(props.bundle.earnings, company.id)} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div> : null}
      {props.cartera !== "si" ? <Seguimiento companies={rows.filter((company) => !company.in_portfolio)} radar={props.phase2.radar} earnings={props.bundle.earnings} onOpen={props.onOpen} /> : null}
    </section>
  );
}

type Horizon = { pnl: number | null; value: number | null; kind: "target" | "hoy" | "pending" };

function horizonOf(view: CompanyView, target: number | null): Horizon {
  const units = view.priceCurrency === "EUR" ? null : view.fx?.units_per_eur ?? null;
  if (target !== null) {
    const value = positionValueEur(view.shares, target, view.priceCurrency, units);
    if (view.valueEur === null || value === null) return { pnl: null, value: null, kind: "pending" };
    return { pnl: value - view.valueEur, value, kind: "target" };
  }
  if (view.price === null || view.valueEur === null) return { pnl: null, value: null, kind: "pending" };
  return { pnl: 0, value: view.valueEur, kind: "hoy" };
}

function sumHorizon(rows: Horizon[]) {
  const known = rows.filter((row) => row.kind !== "pending");
  const text: string[] = [];
  const hoy = rows.filter((row) => row.kind === "hoy").length;
  const pending = rows.filter((row) => row.kind === "pending").length;
  if (hoy > 0) text.push(hoy + " sin objetivo (= P. hoy)");
  if (pending > 0) text.push(pending + " Pendiente");
  return {
    pnl: known.length === 0 ? null : known.reduce((sum, row) => sum + (row.pnl ?? 0), 0),
    value: known.length === 0 ? null : known.reduce((sum, row) => sum + (row.value ?? 0), 0),
    note: text.length ? text.join(" · ") : null,
  };
}

function Cartera(props: { bundle: Bundle; radar: RadarItem[]; mode: SourceMode; today: string; missing: boolean; runs: SyncRun[]; onOpen: (ticker: string) => void; onSaved: () => void }) {
  const rows = props.bundle.companies.filter((company) => company.in_portfolio);
  const views = rows.map((company) => ({ company, view: companyView(props.bundle, company.id, props.mode, props.today, radarTarget3Of(props.radar, company.id, company.ticker)) }));
  const fxDates = views.map((row) => row.view.fx?.rate_date).filter((value): value is string => Boolean(value));
  const part = (pick: (view: CompanyView) => number | null) => {
    const known = views.map((row) => pick(row.view)).filter((value): value is number => value !== null);
    return { sum: known.length === 0 ? null : known.reduce((total, value) => total + value, 0), pending: views.length - known.length };
  };
  const valueNow = part((view) => view.valueEur);
  const pnlNow = part((view) => view.pnlNowEur);
  const oneYear = views.map(({ view }) => horizonOf(view, view.target1));
  const threeYear = views.map(({ view }) => horizonOf(view, view.target3));
  const h1 = sumHorizon(oneYear);
  const h3 = sumHorizon(threeYear);
  return (
    <section>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>Mi cartera real</h1>
      <p style={{ color: INK3, marginTop: 0 }}>Precio contra precio medio. Los euros salen solo con número de acciones y tipo BCE. El peso es el del Excel, no un cálculo nuevo.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8, marginBottom: 12 }}>
        <Kpi label="Valor actual" value={eur(valueNow.sum)} mark={valueNow.pending > 0 ? valueNow.pending + " Pendiente" : null} />
        <Kpi label="Plusvalía actual" value={eur(pnlNow.sum)} mark={pnlNow.pending > 0 ? pnlNow.pending + " Pendiente" : null} detail={"Valor: " + eur(valueNow.sum)} />
        <Kpi label="Plusvalía 1 año" value={eur(h1.pnl)} mark={h1.note} detail={"Valor: " + eur(h1.value)} />
        <Kpi label="Plusvalía 3 años" value={eur(h3.pnl)} mark={h3.note} detail={"Valor: " + eur(h3.value)} />
      </div>
      <p className="stamp">FX BCE: {fxDates.length ? fecha(fxDates.sort().at(-1) ?? null) : "N/D"}{views.some((row) => row.company.currency !== "EUR" && !row.view.fx) ? " · falta el cambio de alguna divisa" : ""}</p>
      <IbkrImport disabled={props.missing} onSaved={props.onSaved} />
      <div className="w-scroll">
        <table className="w-table">
          <thead>
            <tr>{["Empresa", "P. medio", "P. hoy", "Plusv. hoy", "Peso Excel", "Precio 1A", "Plusv. 1A EUR", "Precio 3A", "Plusv. 3A EUR", "CAGR 3A", "TIKR 3A (implícita)", "Próx. resultados"].map((label, index) => (
              <th key={label} className={index === 0 ? "sticky" : ""} title={label.startsWith("TIKR 3A") ? TIKR_3A_NOTE : undefined}>
                {label}
                {label === "P. hoy" ? <span className="stamp">{updatedLabel(props.runs, props.bundle.quotes)}</span> : null}
              </th>
            ))}</tr>
          </thead>
          <tbody>
            {views.length === 0 ? <tr><td className="sticky">Sin posiciones</td><td colSpan={11} className="nd">N/D</td></tr> : null}
            {views.map(({ company, view }, index) => {
              const one = oneYear[index];
              const three = threeYear[index];
              const oneMark = one.kind === "hoy" ? "sin objetivo" : marcaUnAnio(view.target1From, props.mode);
              return (
              <tr key={company.id} className="hit" onClick={() => props.onOpen(company.ticker)}>
                <td className="sticky"><TickerName company={company} priceDate={view.priceDate} runs={props.runs} /></td>
                <td>{fmt(view.avg)}</td>
                <td>{view.price === null ? <span className="nd">Pendiente</span> : fmt(view.price)}</td>
                <td className={view.price === null ? "nd" : tone(view.rentHoy, "plain")}>{view.price === null ? "Pendiente" : pct(view.rentHoy) + (view.pnlNowEur === null ? "" : " · " + eur(view.pnlNowEur))}</td>
                <td>{view.weightPct === null ? "N/D" : fmt(view.weightPct, 2) + " %"}</td>
                <td className={one.kind === "pending" ? "nd" : undefined}>{one.kind === "pending" ? "Pendiente" : rentYPrecio(one.kind === "hoy" ? view.price : view.target1, view.price)}{oneMark ? <span className="stamp"> {oneMark}</span> : null}</td>
                <td className={one.kind === "target" ? tone(one.pnl, "blue") : one.kind === "pending" ? "nd" : undefined}>{one.kind === "pending" ? "Pendiente" : eur(one.pnl)}{oneMark ? <span className="stamp"> {oneMark}</span> : null}</td>
                <td className={three.kind === "pending" ? "nd" : undefined}>{three.kind === "pending" ? "Pendiente" : fmt(three.kind === "hoy" ? view.price : view.target3)}{three.kind === "hoy" ? <span className="stamp"> sin objetivo</span> : null}</td>
                <td className={three.kind === "target" ? tone(three.pnl, "plain") : three.kind === "pending" ? "nd" : undefined}>{three.kind === "pending" ? "Pendiente" : eur(three.pnl)}{three.kind === "hoy" ? <span className="stamp"> sin objetivo</span> : null}</td>
                <td className={tone(view.cagr, "green")}>{pct(view.cagr)}</td>
                <td><Tikr3A value={radarFor(props.radar, company.id, company.ticker)?.target_3a_tikr} /></td>
                <td><ProximosResultados row={earningsOf(props.bundle.earnings, company.id)} /></td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <SharesEditor rows={rows.map((company) => ({ id: company.id, ticker: company.ticker, currency: company.currency, position: props.bundle.positions.find((row) => row.company_id === company.id) }))} disabled={props.missing} onSaved={props.onSaved} />
    </section>
  );
}

function Kpi(props: { label: string; value: string; mark?: string | null; detail?: string | null }) {
  return <div style={card}><div style={{ color: INK3, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>{props.label}</div><div style={{ fontSize: 26, fontWeight: 800, color: CYAN, marginTop: 6 }}>{props.value}{props.mark ? <span className="stamp"> {props.mark}</span> : null}</div>{props.detail ? <div style={{ color: INK3, fontSize: 12, marginTop: 4 }}>{props.detail}</div> : null}</div>;
}

function rentYPrecio(target: number | null, price: number | null): string {
  if (target === null || price === null || !(price > 0)) return "Pendiente";
  const rent = (target - price) / price;
  const text = (rent * 100).toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return (rent > 0 ? "+" : "") + text + "% – " + fmt(target);
}

function marcaUnAnio(from: CompanyView["target1From"], mode: SourceMode): string | null {
  if (from === "tikr") return "TIKR";
  if (from === "warren" && mode === "mixto") return "solo Warren";
  return null;
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
  company: Company; companyName: string; ticker: string; currency: string; notes: string | null; verdict: string | null;
  view: CompanyView; mode: SourceMode; bundle: Bundle; companyId: string; radar: RadarItem | null;
  tab: "evo" | "val" | "rent"; setTab: (tab: "evo" | "val" | "rent") => void;
  today: string; missing: boolean; owner: boolean; backLabel?: string; onBack: () => void; onSaved: () => void;
}) {
  const [report, setReport] = useState(false);
  const tabs = [{ id: "evo" as const, label: "Evolución financiera" }, { id: "val" as const, label: "Valoración" }, { id: "rent" as const, label: "Rentabilidad" }];
  const extras = props.bundle.estimates.filter((row) => row.company_id === props.companyId && (row.source === "excel_bajista" || row.source === "excel_optimista") && row.horizon_years === 3);
  const analysis = props.company.report_md?.trim() ?? "";
  return (
    <section>
      <button type="button" style={btn(false)} onClick={props.onBack}>{props.backLabel ?? "← Resumen"}</button>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>{props.ticker} · {props.companyName}</h1>
      <p style={{ marginTop: 0 }}><Stars stars={props.company.opportunity_stars} note={props.company.opportunity_stars_note} at={props.company.opportunity_stars_at} emphasize={!props.company.in_portfolio} /></p>
      {props.company.origin === "warren_proposal" ? <p className="stamp">Propuesta Warren</p> : null}
      {analysis ? <button type="button" style={{ ...btn(false), width: "100%", minHeight: 52, marginBottom: 12 }} onClick={() => setReport(true)}>Ver análisis</button> : null}
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
      {props.tab === "val" ? <Valoracion view={props.view} mode={props.mode} companyId={props.companyId} currency={props.currency} today={props.today} missing={props.missing} radar={props.radar} onSaved={props.onSaved} /> : null}
      {props.tab === "rent" ? <Rentabilidad view={props.view} mode={props.mode} currency={props.currency} companyId={props.companyId} today={props.today} missing={props.missing} company={props.company} radar={props.radar} onSaved={props.onSaved} /> : null}
      {report ? <AnalysisReader ticker={props.ticker} name={props.companyName} sentOn={props.company.report_sent_on} source={analysis} onClose={() => setReport(false)} /> : null}
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
];

const COMPACT = new Set<keyof CompanyView["years"][number]>(["sales", "ebitda", "ebit", "gross_debt", "cash", "net_debt", "cfo", "capex", "fcf"]);

function Evolucion(props: { view: CompanyView; missing: boolean; owner: boolean; onSaved: () => void }) {
  const [period, setPeriod] = useState<PeriodFilter>("anual");
  const [soloTikr, setSoloTikr] = useState(false);
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  const [syncing, setSyncing] = useState(false);
  const years = seriesYears(soloTikr ? props.view.years.filter((year) => year.source.toUpperCase() === "TIKR") : props.view.years, period);
  const cuts: { id: PeriodFilter; label: string }[] = [{ id: "anual", label: "Anual" }, { id: "trimestre", label: "Trimestral" }];
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        {cuts.map((item) => <button key={item.id} type="button" style={btn(period === item.id)} onClick={() => setPeriod(item.id)}>{item.label}</button>)}
        <button type="button" style={btn(soloTikr)} onClick={() => setSoloTikr((value) => !value)}>TIKR</button>
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
      {soloTikr && years.length === 0 ? <p className="stamp">TIKR: Pendiente.</p> : null}
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

function Valoracion(props: { view: CompanyView; mode: SourceMode; companyId: string; currency: string; today: string; missing: boolean; radar: RadarItem | null; onSaved: () => void }) {
  const warren = props.view.warren3;
  const methods = warren.methods;
  const multiple = warren.row?.per ?? null;
  const rows: { label: string; multiple: string; y1: number | null; y2: number | null; y3: number | null }[] = [
    { label: "PER", multiple: multiple === null ? "N/D" : fmt(multiple, 1) + "x", y1: null, y2: null, y3: methods?.per ?? null },
    { label: "EV / FCF", multiple: "N/D", y1: null, y2: null, y3: methods?.evFcf ?? null },
    { label: "EV / EBITDA", multiple: "N/D", y1: null, y2: null, y3: methods?.evEbitda ?? null },
    { label: "EV / EBIT", multiple: "N/D", y1: null, y2: null, y3: methods?.evEbit ?? null },
    { label: "Promedio de métodos", multiple: "—", y1: null, y2: null, y3: methods?.average ?? null },
    { label: "Objetivo", multiple: "—", y1: props.view.tikr1.price, y2: null, y3: props.view.target3 },
  ];
  return (
    <div>
      <h2 style={{ fontSize: 18, margin: "0 0 4px" }}>TIKR y Warren</h2>
      <SourceCompare price={props.radar?.price ?? props.view.price} tikr1={props.radar?.target_1a_tikr ?? props.view.tikr1.price} warren1={props.radar?.target_1a_warren ?? null} tikr3={props.radar?.target_3a_tikr ?? null} warren3={props.view.target3} />
      <p style={{ color: INK3 }}>El objetivo a 3 años es el de Warren en todas las pestañas. No se promedia con TIKR.</p>
      <div className="w-scroll">
        <table className="w-table">
          <thead><tr>{["Método", "Múltiplo", "Año 1", "Año 2", "Año 3"].map((label, index) => <th key={label} className={index === 0 ? "sticky" : index === 1 ? "col-blue" : ""}>{label}</th>)}</tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <td className="sticky">{row.label}</td>
                <td>{row.multiple}</td>
                <td>{fmt(row.y1)}{row.label === "Objetivo" && row.y1 !== null ? <span className="stamp"> TIKR</span> : null}</td>
                <td>{fmt(row.y2)}</td>
                <td>{fmt(row.y3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ color: INK3 }}>Año 1 es el Street Target TIKR cuando está guardado. Año 2 sigue en N/D. El año 3 es el de Warren. <span title={TIKR_3A_NOTE}>TIKR 3A (implícita) <Tikr3A value={props.radar?.target_3a_tikr} /></span> · Street {money(props.view.tikr1.price, props.view.tikr1.row?.target_currency ?? props.currency)}</p>
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

function Rentabilidad(props: { view: CompanyView; mode: SourceMode; currency: string; companyId: string; today: string; missing: boolean; company: Company; radar: RadarItem | null; onSaved: () => void }) {
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
        {cards.map(([label, value]) => <Kpi key={label} label={label} value={value} mark={label === "Objetivo 1A" || label === "Rentabilidad 1A" ? marcaUnAnio(props.view.target1From, props.mode) : null} />)}
      </div>
      <p title={TIKR_3A_NOTE} style={{ color: INK3 }}>TIKR 3A (implícita): <Tikr3A value={props.radar?.target_3a_tikr} />. {TIKR_3A_NOTE}</p>
      <div style={{ ...card, marginTop: 12, background: "#1F7A5A" }}>
        <div style={{ letterSpacing: "0.06em", fontSize: 13 }}>ENTRADA 15 %</div>
        <div style={{ fontSize: 32, fontWeight: 800, marginTop: 6 }}><EntradaMark company={props.company} radar={props.radar} spot={props.radar?.price ?? props.view.price} /></div>
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
