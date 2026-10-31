import { useState, useEffect, useMemo } from "react";
import type { ChangeEvent, CSSProperties, ReactNode } from "react";

type Src = "Excel" | "TIKR" | "Manual" | "Pendiente";
type Sc = { bpa: number | null; g: number | null; per: number | null; manual: number | null; src: Src; note: string };
type ScKey = "baj" | "tikr" | "war" | "opt";
type Co = {
  t: string; name: string; cur: string; bloque: string; grupo: string; stars: number | null;
  avg: number | null; shares: number | null; price: number | null; priceNote: string;
  div: number | null; peso: string; veredicto: string; notes: string; sc: Record<ScKey, Sc>;
};
type BpaRow = { y: string; v: number; e: boolean };

const NAVY = "#0D1933", PANEL = "#14284B", PANEL2 = "#1B3360", BLUE = "#479AFF", CYAN = "#56D3EC";
const INK = "#FFFFFF", INK2 = "#C9D6F0", INK3 = "#8FA6CF", LINE = "rgba(130,170,230,0.18)";
const GREEN = "#3DDC97", AMBER = "#FFB547", RED = "#FF6B6B";

const P = (src: Src, note: string): Sc => ({ bpa: null, g: null, per: null, manual: null, src, note });
const pend = (): Record<ScKey, Sc> => ({
  baj: P("Pendiente", "Sin valoración en el Excel"),
  tikr: P("Pendiente", "Falta exportación de TIKR"),
  war: P("Pendiente", "Sin plantilla CCB"),
  opt: P("Pendiente", "Sin valoración en el Excel"),
});

const INITIAL: Co[] = [
  { t: "META", name: "Meta Platforms", cur: "USD", bloque: "Pendiente", grupo: "Cartera", stars: 5, avg: 615.89, shares: null, price: 623.21, priceNote: "Excel · 23/10/2026", div: null, peso: "25,67 %", veredicto: "Ni fu ni fa: a vigilar", notes: "Cifras previas al split 2×1 por dividendo en acciones Clase C (19/01/2027).",
    sc: { baj: { bpa: null, g: null, per: null, manual: 316.73, src: "Excel", note: "Valor bajista CCB v1.2 (PER 16x)" }, tikr: P("Pendiente", "Falta exportación de TIKR"), war: { bpa: 28.40, g: 0.187, per: 20, manual: null, src: "Excel", note: "BPA FY2026e 28,40 → FY2029e 47,51 · PER base 20x" }, opt: { bpa: null, g: null, per: null, manual: 1319.75, src: "Excel", note: "Valor alcista CCB v1.2 (PER 25x)" } } },
  { t: "ZEG", name: "Zegona Communications", cur: "GBP", bloque: "Pendiente", grupo: "Cartera", stars: null, avg: 13.93, shares: null, price: 16.96, priceNote: "Excel · 23/10/2026 (1.696 GBX ÷ 100)", div: null, peso: "23,29 %", veredicto: "Ni fu ni fa: a vigilar", notes: "Valoración por P/FCFE, no PER (BPA distorsionado por PPA). Objetivo 3 años = FY2030.",
    sc: { baj: { bpa: null, g: null, per: null, manual: 6.30, src: "Excel", note: "Valor bajista CCB v1.2 (P/FCFE 7x)" }, tikr: P("Pendiente", "Falta exportación de TIKR"), war: { bpa: null, g: null, per: null, manual: 20.79, src: "Excel", note: "Objetivo base 3 años FY2030 (P/FCFE 9x)" }, opt: { bpa: null, g: null, per: null, manual: 27.67, src: "Excel", note: "Valor alcista CCB v1.2 (P/FCFE 11x)" } } },
  { t: "MSFT", name: "Microsoft", cur: "USD", bloque: "Pendiente", grupo: "Cartera", stars: null, avg: 403.60, shares: null, price: 524.51, priceNote: "Excel · 23/10/2026", div: null, peso: "15,12 %", veredicto: "Pendiente de análisis", notes: "", sc: pend() },
  { t: "GOOGL", name: "Alphabet (clase A)", cur: "USD", bloque: "Pendiente", grupo: "Cartera", stars: null, avg: 170.13, shares: null, price: 320.21, priceNote: "Excel · 23/10/2026", div: null, peso: "7,45 %", veredicto: "Pendiente de análisis", notes: "", sc: pend() },
  { t: "JD", name: "JD.com (ADR Nasdaq)", cur: "USD", bloque: "Pendiente", grupo: "Cartera", stars: null, avg: 28.85, shares: null, price: 25.36, priceNote: "Excel · 23/10/2026 (USD por ADS)", div: null, peso: "3,65 %", veredicto: "Esto es un caramelito", notes: "Modelo Warren 25/10/2026, pendiente de plantilla CCB. PER 11x sobre BPA operativo + caja.",
    sc: { baj: { bpa: null, g: null, per: null, manual: 23.10, src: "Excel", note: "Valor conservador del modelo Warren (PER 8x)" }, tikr: P("Pendiente", "Falta exportación de TIKR"), war: { bpa: null, g: null, per: null, manual: 68.80, src: "Excel", note: "Objetivo base 3 años 2029 (modelo Warren)" }, opt: { bpa: null, g: null, per: null, manual: 105.10, src: "Excel", note: "Valor optimista del modelo Warren (PER 14x)" } } },
  { t: "AMZN", name: "Amazon", cur: "USD", bloque: "Pendiente", grupo: "Cartera", stars: null, avg: 217.09, shares: null, price: 248.00, priceNote: "Excel · 23/10/2026", div: null, peso: "3,51 %", veredicto: "Pendiente de análisis", notes: "", sc: pend() },
  { t: "WKL", name: "Wolters Kluwer", cur: "EUR", bloque: "Pendiente", grupo: "Cartera", stars: null, avg: 106.60, shares: null, price: 88.18, priceNote: "Excel · 23/10/2026", div: null, peso: "1,42 %", veredicto: "Pendiente de análisis", notes: "", sc: pend() },
];

const BPA: Record<string, { unit: string; rows: BpaRow[]; note: string }> = {
  META: { unit: "USD por acción (pre-split)", note: "Excel · pestaña BPA · [H] SEC 10-K · [E] escenario Base", rows: [["2016", 3.49], ["2017", 5.39], ["2018", 7.57], ["2019", 6.43], ["2020", 10.09], ["2021", 13.77], ["2022", 8.59], ["2023", 14.87], ["2024", 23.86], ["2025", 23.49], ["2026e", 28.40], ["2027e", 35.11], ["2028e", 41.13], ["2029e", 47.51], ["2030e", 53.80]].map((r: (string | number)[]) => ({ y: r[0] as string, v: r[1] as number, e: (r[0] as string).endsWith("e") })) },
  JD: { unit: "RMB por ADS (BPA diluido)", note: "Excel · pestaña BPA · [H] 20-F · [E] modelo Warren", rows: [["2023", 15.23], ["2024", 26.86], ["2025", 12.90], ["2026e", 14.81], ["2027e", 26.25], ["2028e", 33.24], ["2029e", 38.03], ["2030e", 41.90]].map((r: (string | number)[]) => ({ y: r[0] as string, v: r[1] as number, e: (r[0] as string).endsWith("e") })) },
  ZEG: { unit: "GBP por acción (ejercicio a 31/03)", note: "Excel · pestaña BPA · no es la base de la valoración (P/FCFE)", rows: [["FY25", -0.51], ["FY26", -0.25], ["FY27e", 0.52], ["FY28e", 0.68], ["FY29e", 0.80], ["FY30e", 0.81]].map((r: (string | number)[]) => ({ y: r[0] as string, v: r[1] as number, e: (r[0] as string).endsWith("e") })) },
};

const KEY = "warren-ii-v1";
const SCN: { k: ScKey; l: string }[] = [{ k: "baj", l: "Bajista" }, { k: "tikr", l: "Consenso TIKR" }, { k: "war", l: "Warren" }, { k: "opt", l: "Optimista" }];

const fmt = (v: number | null, d = 2) => v === null || !isFinite(v) ? "N/D" : v.toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d });
const pct = (v: number | null) => v === null || !isFinite(v) ? "N/D" : (v >= 0 ? "+" : "") + (v * 100).toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " %";
const num = (s: string): number | null => { const x = parseFloat(s.replace(",", ".")); return isFinite(x) ? x : null; };

function target(s: Sc): number | null {
  if (s.manual !== null) return s.manual;
  if (s.bpa === null || s.g === null || s.per === null) return null;
  if (s.bpa <= 0) return null;
  return s.bpa * Math.pow(1 + s.g, 3) * s.per;
}
function calc(c: Co, req: number) {
  const tk = target(c.sc.tikr), wa = target(c.sc.war);
  const media = tk !== null && wa !== null ? (tk + wa) / 2 : null;
  const d = c.div ?? 0;
  const p = c.price;
  const pot = (x: number | null) => x === null || p === null || p <= 0 ? null : (x + d - p) / p;
  const cagr = (x: number | null) => x === null || p === null || p <= 0 ? null : Math.pow((x + d) / p, 1 / 3) - 1;
  const maxP = (x: number | null) => x === null ? null : (x + d) / Math.pow(1 + req, 3);
  const mos = (x: number | null) => x === null || p === null || x <= 0 ? null : (x - p) / x;
  const pl = c.avg !== null && c.shares !== null && p !== null ? (p - c.avg) * c.shares : null;
  const histo = c.avg !== null && p !== null ? p / c.avg - 1 : null;
  return { tk, wa, media, pot, cagr, maxP, mos, pl, histo, mediaCagr: cagr(media), warCagr: cagr(wa) };
}
function estado(c: Co, req: number): { l: string; col: string } {
  const ref = calc(c, req).mediaCagr;
  if (ref === null) return { l: "REVISAR", col: INK3 };
  return ref >= req ? { l: "COMPRAR", col: GREEN } : { l: "ESPERAR", col: AMBER };
}
const starTxt = (n: number | null) => n === null ? "☆☆☆☆☆" : "★".repeat(n) + "☆".repeat(5 - n);
const srcCol = (s: Src) => s === "Excel" ? CYAN : s === "TIKR" ? BLUE : s === "Manual" ? AMBER : INK3;

const card: CSSProperties = { background: PANEL, border: "1px solid " + LINE, borderRadius: 18, padding: 18, boxSizing: "border-box", minWidth: 0 };
const eyebrow: CSSProperties = { fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: CYAN, fontWeight: 700 };
const h2: CSSProperties = { fontSize: 22, fontWeight: 700, color: INK, margin: "4px 0 2px" };
const sub: CSSProperties = { fontSize: 13, color: INK3 };
const grid = (min: number): CSSProperties => ({ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(" + min + "px, 1fr))", gap: 12 });
const inputS: CSSProperties = { background: NAVY, color: INK, border: "1px solid " + LINE, borderRadius: 10, padding: "8px 10px", fontSize: 14, width: "100%", boxSizing: "border-box" };

function Pill(props: { text: string; col: string; solid?: boolean }) {
  return <span style={{ display: "inline-block", padding: "3px 9px", borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: props.solid ? NAVY : props.col, background: props.solid ? props.col : "transparent", border: "1px solid " + props.col, whiteSpace: "nowrap" }}>{props.text}</span>;
}
function Btn(props: { label: string; onClick: () => void; primary?: boolean }) {
  return <button onClick={props.onClick} style={{ cursor: "pointer", padding: "9px 14px", borderRadius: 999, fontSize: 13, fontWeight: 700, border: "1px solid " + (props.primary ? BLUE : LINE), background: props.primary ? BLUE : "transparent", color: props.primary ? NAVY : INK }}>{props.label}</button>;
}
function Field(props: { label: string; children: ReactNode }) {
  return <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11, color: INK3, letterSpacing: "0.08em", textTransform: "uppercase", minWidth: 130, flex: "1 1 130px" }}>{props.label}{props.children}</label>;
}
function Kpi(props: { label: string; value: string; detail: string; accent?: string }) {
  return (
    <div style={card}>
      <div style={{ ...eyebrow, color: INK3 }}>{props.label}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color: props.accent ?? INK, margin: "6px 0 2px" }}>{props.value}</div>
      <div style={sub}>{props.detail}</div>
    </div>
  );
}
function Hbars(props: { items: { l: string; v: number; d: string }[] }) {
  const max = Math.max(...props.items.map((i: { v: number }) => i.v), 0.01);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {props.items.map((i: { l: string; v: number; d: string }, n: number) => (
        <div key={i.l} style={{ display: "grid", gridTemplateColumns: "58px 1fr 62px", alignItems: "center", gap: 10 }}>
          <span style={{ fontWeight: 700, color: INK, fontSize: 13 }}>{i.l}</span>
          <div style={{ height: 12, background: NAVY, borderRadius: 6, overflow: "hidden" }}>
            <div style={{ width: Math.max(2, (Math.max(i.v, 0) / max) * 100) + "%", height: "100%", borderRadius: 6, background: n === 0 ? "linear-gradient(90deg," + BLUE + "," + CYAN + ")" : BLUE, opacity: n === 0 ? 1 : 0.75 }} />
          </div>
          <span style={{ textAlign: "right", color: n === 0 ? CYAN : INK2, fontWeight: 700, fontSize: 13 }}>{i.d}</span>
        </div>
      ))}
    </div>
  );
}
function BpaChart(props: { rows: BpaRow[] }) {
  const W = 640, H = 220, pad = 28;
  const vals = props.rows.map((r: BpaRow) => r.v);
  const mx = Math.max(...vals, 0), mn = Math.min(...vals, 0);
  const y = (v: number) => pad + (mx - v) / (mx - mn || 1) * (H - pad * 2);
  const bw = (W - pad * 2) / props.rows.length;
  const step = Math.ceil(props.rows.length / 6);
  return (
    <svg viewBox={"0 0 " + W + " " + H} width="100%" style={{ display: "block" }}>
      <line x1={pad} x2={W - pad} y1={y(0)} y2={y(0)} stroke={LINE} />
      {props.rows.map((r: BpaRow, i: number) => (
        <g key={r.y}>
          <rect x={pad + i * bw + bw * 0.18} width={bw * 0.64} y={Math.min(y(r.v), y(0))} height={Math.max(1, Math.abs(y(r.v) - y(0)))} rx={3} fill={r.e ? CYAN : BLUE} opacity={r.e ? 0.9 : 1} />
          {(i % step === 0 || i === props.rows.length - 1) ? <text x={pad + i * bw + bw / 2} y={H - 6} fontSize={11} fill={INK3} textAnchor="middle">{r.y}</text> : null}
          {(i % step === 0 || i === props.rows.length - 1) ? <text x={pad + i * bw + bw / 2} y={Math.min(y(r.v), y(0)) - 5} fontSize={11} fill={INK2} textAnchor="middle">{fmt(r.v)}</text> : null}
        </g>
      ))}
    </svg>
  );
}

export default function App() {
  const [cos, setCos] = useState<Co[]>(INITIAL);
  const [view, setView] = useState<string>("resumen");
  const irA = (v: string) => {
    setView(v);
    const run = (tries: number) => {
      const el = document.getElementById("sec-" + v);
      if (!el) { if (tries > 0) window.setTimeout(() => run(tries - 1), 40); return; }
      const nav = document.getElementById("warren-nav");
      const alto = nav ? nav.getBoundingClientRect().height : 0;
      const y = el.getBoundingClientRect().top + window.scrollY - alto - 8;
      window.scrollTo(0, Math.max(0, y));
    };
    window.setTimeout(() => run(8), 0);
  };
  const [sel, setSel] = useState<string>("META");
  const [scK, setScK] = useState<ScKey>("war");
  const [req, setReq] = useState<number>(0.15);
  const [fGrupo, setFGrupo] = useState<string>("Todas");
  const [fBloque, setFBloque] = useState<string>("Todos");
  const [json, setJson] = useState<string>("");
  const [msg, setMsg] = useState<string>("");
  const [saved, setSaved] = useState<boolean>(false);
  const [newT, setNewT] = useState<string>("");
  const [wide, setWide] = useState<boolean>(true);
  const [showF, setShowF] = useState<boolean>(false);

  useEffect(() => {
    try { const raw = window.localStorage.getItem(KEY); if (raw) { const o = JSON.parse(raw); if (Array.isArray(o.cos)) setCos(o.cos); if (typeof o.req === "number") setReq(o.req); } setSaved(true); } catch { setSaved(false); }
    const on = () => setWide(window.innerWidth >= 760);
    on(); window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  useEffect(() => { try { window.localStorage.setItem(KEY, JSON.stringify({ cos, req })); } catch { /* sin almacenamiento */ } }, [cos, req]);

  const c = cos.find((x: Co) => x.t === sel) ?? cos[0];
  const upd = (patch: Partial<Co>) => setCos(cos.map((x: Co) => x.t === c.t ? { ...x, ...patch } : x));
  const updSc = (patch: Partial<Sc>) => upd({ sc: { ...c.sc, [scK]: { ...c.sc[scK], ...patch, src: scK === "tikr" ? "TIKR" : "Manual" } } });

  const filtered = cos.filter((x: Co) => (fGrupo === "Todas" || x.grupo === fGrupo) && (fBloque === "Todos" || x.bloque === fBloque));
  const ranked = useMemo(() => [...filtered].sort((a: Co, b: Co) => {
    const ka = calc(a, req), kb = calc(b, req);
    const va = ka.mediaCagr ?? (ka.warCagr !== null ? ka.warCagr - 10 : -99), vb = kb.mediaCagr ?? (kb.warCagr !== null ? kb.warCagr - 10 : -99);
    return vb - va;
  }), [filtered, req]);

  const r = calc(c, req);
  const sc = c.sc[scK];
  const cartera = cos.filter((x: Co) => x.grupo === "Cartera");
  const watch = cos.filter((x: Co) => x.grupo === "Watchlist");
  const withMedia = cos.filter((x: Co) => calc(x, req).media !== null).length;
  const warItems = ranked.filter((x: Co) => calc(x, req).warCagr !== null).map((x: Co) => { const v = calc(x, req).warCagr as number; return { l: x.t, v: v * 100, d: pct(v) }; }).sort((a: { v: number }, b: { v: number }) => b.v - a.v);
  const best = warItems[0];
  const pMax = c.price ? Math.max(c.price * 3, 10) : 1000;

  const slider = (label: string, val: number | null, min: number, max: number, step: number, show: string, src: Src, on: (v: number) => void) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6, alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: INK2 }}>{label} <Pill text={src} col={srcCol(src)} /></span>
        <span style={{ fontSize: 15, fontWeight: 800, color: INK }}>{show}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={val ?? min} style={{ width: "100%", accentColor: BLUE }}
        onChange={(e: ChangeEvent<HTMLInputElement>) => on(parseFloat(e.target.value))} />
    </div>
  );

  // Sensitivity: PER × crecimiento for the selected scenario when PER-based
  const sens = (() => {
    if (sc.manual !== null || sc.bpa === null || sc.bpa <= 0 || sc.g === null || sc.per === null || c.price === null) return null;
    const pers = [-4, -2, 0, 2, 4].map((d: number) => Math.max(1, sc.per as number + d));
    const gs = [-0.04, -0.02, 0, 0.02, 0.04].map((d: number) => (sc.g as number) + d);
    return { pers, gs, val: (pe: number, g: number) => { const t = (sc.bpa as number) * Math.pow(1 + g, 3) * pe; return Math.pow((t + (c.div ?? 0)) / (c.price as number), 1 / 3) - 1; } };
  })();
  const heat = (v: number) => v >= req ? "rgba(86,211,236," + Math.min(0.9, 0.35 + (v - req) * 3) + ")" : v >= 0 ? "rgba(71,154,255," + (0.18 + Math.max(0, v) * 2) + ")" : "rgba(255,107,107,0.35)";

  const navItems = [{ v: "resumen", n: "00", l: "Resumen" }, { v: "radar", n: "01", l: "Radar" }, { v: "cartera", n: "02", l: "Mi cartera" }, { v: "watch", n: "03", l: "Watchlist" }];

  const companyCard = (x: Co) => {
    const k = calc(x, req); const e = estado(x, req);
    return (
      <div key={x.t} onClick={() => setSel(x.t)} style={{ ...card, cursor: "pointer", borderColor: x.t === c.t ? BLUE : LINE }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div><span style={{ fontSize: 20, fontWeight: 800, color: INK }}>{x.t}</span> <span style={{ ...sub, marginLeft: 4 }}>{x.cur}</span></div>
          <Pill text={e.l} col={e.col} />
        </div>
        <div style={{ ...sub, marginTop: 2 }}>{x.name} · {x.grupo} · {x.bloque}</div>
        <div style={{ color: AMBER, fontSize: 14, marginTop: 6, letterSpacing: 2, opacity: x.stars === null ? 0.35 : 1 }}>{starTxt(x.stars)}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
          <div><div style={{ ...eyebrow, color: INK3, fontSize: 10 }}>Media T+W</div><div style={{ fontSize: 20, fontWeight: 800, color: k.media === null ? INK3 : INK }}>{fmt(k.media)}</div><div style={{ ...sub, fontSize: 12 }}>CAGR {pct(k.mediaCagr)}</div></div>
          <div><div style={{ ...eyebrow, color: INK3, fontSize: 10 }}>Warren (ref.)</div><div style={{ fontSize: 20, fontWeight: 800, color: k.wa === null ? INK3 : BLUE }}>{pct(k.warCagr)}</div><div style={{ ...sub, fontSize: 12 }}>obj. {fmt(k.wa)}</div></div>
        </div>
        <div style={{ borderTop: "1px solid " + LINE, marginTop: 12, paddingTop: 10, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6, fontSize: 12, color: INK2 }}>
          <span>Precio {fmt(x.price)}</span><span>M. seg. {pct(k.mos(k.media))}</span><span style={{ color: INK3 }}>{x.veredicto}</span>
        </div>
      </div>
    );
  };

  const th: CSSProperties = { textAlign: "right", padding: "10px 12px", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: INK3, fontWeight: 700, borderBottom: "1px solid " + LINE, whiteSpace: "nowrap" };
  const td: CSSProperties = { textAlign: "right", padding: "12px", fontSize: 14, color: INK2, borderBottom: "1px solid " + LINE, whiteSpace: "nowrap" };
  const table = (cols: string[], rows: ReactNode[][]) => (
    <div style={{ ...card, padding: 0, overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead><tr>{cols.map((h: string, i: number) => <th key={h} style={{ ...th, textAlign: i === 0 ? "left" : "right" }}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((row: ReactNode[], j: number) => <tr key={j}>{row.map((v: ReactNode, i: number) => <td key={i} style={{ ...td, textAlign: i === 0 ? "left" : "right", color: i === 0 ? INK : INK2, fontWeight: i === 0 ? 800 : 400 }}>{v}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );

  const sectionHead = (eb: string, title: string, s: string) => (
    <div style={{ margin: "28px 0 12px" }}><div style={eyebrow}>{eb}</div><div style={h2}>{title}</div><div style={sub}>{s}</div></div>
  );

  return (
    <div style={{ background: NAVY, color: INK, minHeight: "100vh", padding: wide ? "28px 32px 60px" : "18px 14px 60px", boxSizing: "border-box", fontFamily: "Inter, -apple-system, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        {/* Header */}
        <div id="warren-nav" style={{ position: "sticky", top: 0, zIndex: 20, background: NAVY, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, padding: "10px 0 12px", marginLeft: wide ? -32 : -14, marginRight: wide ? -32 : -14, paddingLeft: wide ? 32 : 14, paddingRight: wide ? 32 : 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg," + BLUE + "," + CYAN + ")", color: NAVY, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>W</div>
            <div><div style={{ fontWeight: 900, letterSpacing: "0.18em", fontSize: 15 }}>WARREN</div><div style={{ fontSize: 10, letterSpacing: "0.2em", color: INK3 }}>INVESTMENT INTELLIGENCE</div></div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {navItems.map((n: { v: string; n: string; l: string }) => (
              <button type="button" key={n.v} onClick={() => irA(n.v)} style={{ cursor: "pointer", minHeight: 44, padding: "8px 14px", borderRadius: 999, border: "1px solid " + (view === n.v ? BLUE : LINE), background: view === n.v ? BLUE : PANEL, color: view === n.v ? NAVY : INK2, fontWeight: 700, fontSize: 15 }}>
                <span style={{ opacity: 0.6, marginRight: 6 }}>{n.n}</span> {n.l}
              </button>
            ))}
          </div>
        </div>

        {/* Hero */}
        <div style={{ ...card, marginTop: 18, padding: wide ? 32 : 22, background: "radial-gradient(120% 140% at 100% 0%, rgba(86,211,236,0.22) 0%, rgba(71,154,255,0.10) 35%, " + PANEL + " 70%)" }}>
          <div style={eyebrow}>Tu centro de decisiones · Horizonte 2029</div>
          <div style={{ fontSize: wide ? 44 : 30, fontWeight: 900, lineHeight: 1.08, margin: "10px 0" }}>Invierte con criterio.<br /><span style={{ color: CYAN }}>Decide con claridad.</span></div>
          <div style={{ color: INK2, fontSize: 15, maxWidth: 620 }}>No es una pantalla de precios. Es el lugar donde descubres qué negocio merece tu capital y por qué.</div>
          <div style={{ ...grid(wide ? 200 : 140), marginTop: 22 }}>
            <div style={{ background: "rgba(13,25,51,0.6)", borderRadius: 14, padding: 14, border: "1px solid " + LINE }}><div style={{ ...eyebrow, fontSize: 10 }}>Media TIKR + Warren</div><div style={{ fontSize: 24, fontWeight: 900, marginTop: 4 }}>{withMedia === 0 ? "N/D" : withMedia + " empresas"}</div><div style={sub}>Valor razonable central a 2029</div></div>
            <div style={{ background: "rgba(13,25,51,0.6)", borderRadius: 14, padding: 14, border: "1px solid " + LINE }}><div style={{ ...eyebrow, fontSize: 10 }}>CAGR estimado</div><div style={{ fontSize: 24, fontWeight: 900, marginTop: 4, color: BLUE }}>{best ? best.d : "N/D"}</div><div style={sub}>{best ? "Mejor Warren: " + best.l : "Potencial anual"}</div></div>
            <div style={{ background: "rgba(13,25,51,0.6)", borderRadius: 14, padding: 14, border: "1px solid " + LINE }}><div style={{ ...eyebrow, fontSize: 10 }}>Rentabilidad exigida</div><div style={{ fontSize: 24, fontWeight: 900, marginTop: 4, color: CYAN }}>{pct(req).replace("+", "")}</div><div style={sub}>Precio vs. valor</div></div>
          </div>
        </div>

        {/* Qué mirar ahora */}
        <div style={{ ...card, marginTop: 12, borderColor: "rgba(86,211,236,0.45)", display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ width: 8, alignSelf: "stretch", borderRadius: 4, background: CYAN, flexShrink: 0 }} />
          <div><div style={{ fontWeight: 800 }}>Qué mirar ahora: falta el consenso TIKR</div><div style={{ ...sub, color: INK2, marginTop: 4 }}>La Media TIKR + Warren está en N/D en las 7 empresas. Mete el BPA y el PER de TIKR en el editor (escenario «Consenso TIKR») y la media, su CAGR y el ranking se calculan al momento. Mientras, el CAGR de Warren sale como referencia.</div></div>
        </div>

        {/* Filters */}
        <div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <Btn label={showF ? "Ocultar filtros ▴" : "Filtros ▾"} onClick={() => setShowF(!showF)} />
            {fGrupo !== "Todas" ? <span onClick={() => setFGrupo("Todas")} style={{ cursor: "pointer" }}><Pill text={fGrupo + " ✕"} col={BLUE} /></span> : null}
            {fBloque !== "Todos" ? <span onClick={() => setFBloque("Todos")} style={{ cursor: "pointer" }}><Pill text={fBloque + " ✕"} col={BLUE} /></span> : null}
          </div>
          {showF ? (
            <div style={{ ...card, marginTop: 10, display: "flex", flexWrap: "wrap", gap: 12 }}>
              <Field label="Tipo"><select style={inputS} value={fGrupo} onChange={(e: ChangeEvent<HTMLSelectElement>) => setFGrupo(e.target.value)}>{["Todas", "Cartera", "Watchlist"].map((o: string) => <option key={o}>{o}</option>)}</select></Field>
              <Field label="Bloque"><select style={inputS} value={fBloque} onChange={(e: ChangeEvent<HTMLSelectElement>) => setFBloque(e.target.value)}>{["Todos", "Pilares", "Situaciones especiales", "Pendiente"].map((o: string) => <option key={o}>{o}</option>)}</select></Field>
              <Field label="Rentabilidad exigida (% anual)"><input style={inputS} type="number" value={String(Math.round(req * 1000) / 10)} onChange={(e: ChangeEvent<HTMLInputElement>) => { const n = num(e.target.value); if (n !== null) setReq(n / 100); }} /></Field>
            </div>
          ) : null}
        </div>

        {view === "resumen" ? (
          <div id="sec-resumen">
            {sectionHead("00 · Resumen general", "Resumen ejecutivo", "Todas mis empresas · calidad, valoración y oportunidades en una sola vista")}
            <div style={grid(wide ? 220 : 150)}>
              <Kpi label="Empresas analizadas" value={String(cos.length)} detail="Universo editable" />
              <Kpi label="Calidad alta" value={String(cos.filter((x: Co) => (x.stars ?? 0) >= 4).length)} detail="4-5 estrellas" accent={AMBER} />
              <Kpi label="Media TIKR + Warren" value={withMedia === 0 ? "N/D" : String(withMedia)} detail="Falta consenso TIKR" accent={CYAN} />
              <Kpi label="Por revisar" value={String(cos.filter((x: Co) => estado(x, req).l === "REVISAR").length)} detail="Datos pendientes" accent={BLUE} />
            </div>
            {sectionHead("Mapa de todas mis inversiones", "Clasificadas por oportunidad", "Orden: CAGR de la media; sin media, CAGR Warren (referencia). Moneda local de cada empresa.")}
            {wide ? table(["Ticker", "Bloque", "Calidad", "Media T+W", "CAGR 3a", "M. seguridad", "Warren (ref.)", "Estado"], ranked.map((x: Co) => { const k = calc(x, req); const e = estado(x, req); return [<span onClick={() => setSel(x.t)} style={{ cursor: "pointer" }}>{x.t}</span>, x.bloque, <span style={{ color: AMBER, opacity: x.stars === null ? 0.35 : 1 }}>{starTxt(x.stars)}</span>, fmt(k.media), pct(k.mediaCagr), pct(k.mos(k.media)), <span style={{ color: k.warCagr === null ? INK3 : BLUE, fontWeight: 700 }}>{pct(k.warCagr)}</span>, <Pill text={e.l} col={e.col} />]; })) : null}
            <div style={{ ...grid(wide ? 300 : 260), marginTop: 12 }}>{ranked.map((x: Co) => companyCard(x))}</div>
          </div>
        ) : null}

        {view === "radar" ? (
          <div id="sec-radar">
            {sectionHead("01 · Radar de oportunidades", "Dónde puede estar la mejor inversión a 3 años", "Bajista, TIKR, Warren y Media lado a lado. Bajista y Optimista del Excel son valores razonables CCB.")}
            <div style={grid(wide ? 220 : 150)}>
              <Kpi label="CAGR más alto (Warren)" value={best ? best.d : "N/D"} detail={best ? best.l + " · sin TIKR" : "Sin datos"} accent={CYAN} />
              <Kpi label="Objetivo anual" value={pct(req).replace("+", "")} detail="Rentabilidad exigida" />
              <Kpi label="Empresas" value={String(cos.length)} detail="Universo de análisis" />
              <Kpi label="Con valoración" value={String(warItems.length)} detail="Escenario Warren" accent={BLUE} />
            </div>
            <div style={{ height: 12 }} />
            {wide ? table(["Ticker", "Bajista", "TIKR", "Warren", "Optimista", "Media", "CAGR media", "CAGR Warren"], ranked.map((x: Co) => { const k = calc(x, req); return [x.t, fmt(target(x.sc.baj)), fmt(k.tk), fmt(k.wa), fmt(target(x.sc.opt)), fmt(k.media), pct(k.mediaCagr), <span style={{ color: k.warCagr === null ? INK3 : BLUE, fontWeight: 700 }}>{pct(k.warCagr)}</span>]; })) : (
              <div style={grid(260)}>{ranked.map((x: Co) => { const k = calc(x, req); return (
                <div key={x.t} style={card} onClick={() => setSel(x.t)}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><b style={{ fontSize: 18 }}>{x.t}</b><span style={{ color: BLUE, fontWeight: 800 }}>{pct(k.warCagr)}</span></div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10, fontSize: 13, color: INK2 }}>
                    <span>Bajista {fmt(target(x.sc.baj))}</span><span>TIKR {fmt(k.tk)}</span><span>Warren {fmt(k.wa)}</span><span>Optimista {fmt(target(x.sc.opt))}</span><span style={{ color: INK }}>Media {fmt(k.media)}</span><span style={{ color: INK }}>CAGR {pct(k.mediaCagr)}</span>
                  </div>
                </div>); })}</div>
            )}
            {warItems.length > 0 ? (
              <div style={{ ...card, marginTop: 12 }}>
                <div style={eyebrow}>Rentabilidad anual esperada (CAGR)</div>
                <div style={{ ...sub, margin: "4px 0 14px" }}>Escenario Warren hasta que haya consenso TIKR · línea de objetivo {pct(req).replace("+", "")}</div>
                <Hbars items={warItems} />
              </div>
            ) : null}
          </div>
        ) : null}

        {view === "cartera" ? (
          <div id="sec-cartera">
            {sectionHead("02 · Mi cartera", "Qué tengo, cuánto he ganado y qué potencial queda", "Según el Excel («En cartera»). P/L = (precio − precio medio) × acciones, antes de costes e impuestos.")}
            <div style={grid(wide ? 220 : 150)}>
              <Kpi label="Posiciones" value={String(cartera.length)} detail="En cartera según el Excel" />
              <Kpi label="Plusvalía latente" value="N/D" detail="Falta nº de acciones" accent={INK3} />
              <Kpi label="CAGR esperado" value="N/D" detail="Falta media TIKR + Warren" accent={INK3} />
              <Kpi label="Mayor peso" value="META" detail="25,67 % (Excel, 26/10)" accent={CYAN} />
            </div>
            <div style={{ height: 12 }} />
            {wide ? table(["Empresa", "Precio medio", "Precio", "Acciones", "P/L", "Rent. histórica", "Peso", "CAGR media 3a"], cartera.map((x: Co) => { const k = calc(x, req); return [x.t + " · " + x.cur, fmt(x.avg), fmt(x.price), x.shares === null ? <span style={{ color: INK3 }}>Pendiente</span> : fmt(x.shares, 0), fmt(k.pl), <span style={{ color: k.histo !== null && k.histo < 0 ? RED : GREEN, fontWeight: 700 }}>{pct(k.histo)}</span>, x.peso, pct(k.mediaCagr)]; })) : (
              <div style={grid(260)}>{cartera.map((x: Co) => { const k = calc(x, req); return (
                <div key={x.t} style={card}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><b style={{ fontSize: 18 }}>{x.t} <span style={sub}>{x.cur}</span></b><span style={{ color: k.histo !== null && k.histo < 0 ? RED : GREEN, fontWeight: 800 }}>{pct(k.histo)}</span></div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10, fontSize: 13, color: INK2 }}>
                    <span>Medio {fmt(x.avg)}</span><span>Precio {fmt(x.price)}</span><span>Peso {x.peso}</span><span>Acciones {x.shares === null ? "Pendiente" : fmt(x.shares, 0)}</span>
                  </div>
                </div>); })}</div>
            )}
            <div style={{ ...card, marginTop: 12 }}>
              <div style={eyebrow}>Peso en cartera</div>
              <div style={{ ...sub, margin: "4px 0 14px" }}>Estimado en el Excel · base bróker 26/10/2026</div>
              <Hbars items={cartera.filter((x: Co) => x.peso.includes("%")).map((x: Co) => ({ l: x.t, v: parseFloat(x.peso.replace(",", ".")), d: x.peso })).sort((a: { v: number }, b: { v: number }) => b.v - a.v)} />
            </div>
            <div style={{ ...card, marginTop: 12 }}><div style={eyebrow}>Mi tesis</div><div style={{ fontSize: 18, fontWeight: 800, marginTop: 6 }}>Negocio de calidad <span style={{ color: CYAN }}>+ crecimiento sostenible de BPA</span></div><div style={{ fontSize: 18, fontWeight: 800 }}>Comprar con margen <span style={{ color: CYAN }}>+ valoración razonable</span></div></div>
          </div>
        ) : null}

        {view === "watch" ? (
          <div id="sec-watch">
            {sectionHead("03 · Watchlist", "Futuras compras", "Precio máximo para ganar " + pct(req).replace("+", "") + " anual a 3 años sobre la media TIKR + Warren.")}
            {watch.length > 0 ? table(["Ticker", "Precio", "P. máx. (media)", "P. máx. (Warren)", "Descuento", "Estado"], watch.map((x: Co) => { const k = calc(x, req); const mm = k.maxP(k.media); return [x.t, fmt(x.price), fmt(mm), fmt(k.maxP(k.wa)), mm !== null && x.price ? pct((mm - x.price) / mm) : "N/D", <Pill text={estado(x, req).l} col={estado(x, req).col} />]; })) : (
              <div style={{ ...card, color: INK2 }}>Las 7 empresas del PDF están en cartera según el Excel. Pasa una a Watchlist en el editor (campo «Tipo») o añade un ticker nuevo.</div>
            )}
            <div style={{ ...card, marginTop: 12, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end" }}>
              <Field label="+ Empresa (ticker)"><input style={inputS} value={newT} placeholder="p. ej. MC" onChange={(e: ChangeEvent<HTMLInputElement>) => setNewT(e.target.value.toUpperCase())} /></Field>
              <Btn primary label="+ Empresa" onClick={() => { const t = newT.trim(); if (!t || cos.some((x: Co) => x.t === t)) return; setCos([...cos, { t, name: t, cur: "USD", bloque: "Pendiente", grupo: "Watchlist", stars: null, avg: null, shares: null, price: null, priceNote: "Manual", div: null, peso: "—", veredicto: "Pendiente de análisis", notes: "", sc: pend() }]); setSel(t); setNewT(""); }} />
            </div>
            <div style={{ ...grid(200), marginTop: 12 }}>
              {[{ l: "COMPRAR", d: "El CAGR de la media supera tu objetivo", c: GREEN }, { l: "ESPERAR", d: "Empresa buena, precio alto", c: AMBER }, { l: "REVISAR", d: "Datos o tesis incompletos (media N/D)", c: INK3 }].map((x: { l: string; d: string; c: string }) => (
                <div key={x.l} style={{ ...card, borderLeft: "4px solid " + x.c }}><Pill text={x.l} col={x.c} solid /><div style={{ ...sub, color: INK2, marginTop: 8 }}>{x.d}</div></div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Editor */}
        {sectionHead("Editor lateral · " + c.t, c.name, "Los cambios se recalculan al instante. Lo que toques pasa a origen «Manual» (o «TIKR» en su escenario).")}
        <div style={{ display: "grid", gridTemplateColumns: wide ? "minmax(0,1.1fr) minmax(0,1fr)" : "1fr", gap: 12 }}>
          <div style={card}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <Field label="Empresa"><select style={inputS} value={c.t} onChange={(e: ChangeEvent<HTMLSelectElement>) => setSel(e.target.value)}>{cos.map((x: Co) => <option key={x.t}>{x.t}</option>)}</select></Field>
              <Field label="Tipo"><select style={inputS} value={c.grupo} onChange={(e: ChangeEvent<HTMLSelectElement>) => upd({ grupo: e.target.value })}>{["Cartera", "Watchlist"].map((o: string) => <option key={o}>{o}</option>)}</select></Field>
              <Field label="Bloque"><select style={inputS} value={c.bloque} onChange={(e: ChangeEvent<HTMLSelectElement>) => upd({ bloque: e.target.value })}>{["Pilares", "Situaciones especiales", "Pendiente"].map((o: string) => <option key={o}>{o}</option>)}</select></Field>
              <Field label="Estrellas"><select style={inputS} value={c.stars === null ? "—" : String(c.stars)} onChange={(e: ChangeEvent<HTMLSelectElement>) => upd({ stars: e.target.value === "—" ? null : parseInt(e.target.value) })}>{["—", "1", "2", "3", "4", "5"].map((o: string) => <option key={o}>{o}</option>)}</select></Field>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "16px 0" }}>
              {SCN.map((s: { k: ScKey; l: string }) => { const on = s.k === scK; const src = c.sc[s.k].src; return (
                <button key={s.k} onClick={() => setScK(s.k)} style={{ cursor: "pointer", padding: "8px 12px", borderRadius: 12, border: "1px solid " + (on ? BLUE : LINE), background: on ? "rgba(71,154,255,0.18)" : NAVY, color: INK, fontSize: 13, fontWeight: 700, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
                  {s.l}<span style={{ fontSize: 10, fontWeight: 700, color: srcCol(src), letterSpacing: "0.08em" }}>● {src.toUpperCase()}</span>
                </button>); })}
            </div>
            <div style={{ ...sub, marginBottom: 14 }}>{sc.note}</div>
            {slider("BPA base", sc.bpa, -5, Math.max(10, (sc.bpa ?? 10) * 3), 0.01, fmt(sc.bpa), sc.src, (v: number) => updSc({ bpa: v, manual: null }))}
            {slider("Crecimiento anual del BPA", sc.g, -0.2, 0.5, 0.005, pct(sc.g), sc.src, (v: number) => updSc({ g: v, manual: null }))}
            {slider("PER terminal", sc.per, 3, 60, 0.5, sc.per === null ? "N/D" : fmt(sc.per, 1) + "x", sc.src, (v: number) => updSc({ per: v, manual: null }))}
            {slider("Precio de compra (" + c.cur + ")", c.price, 0, pMax, pMax / 1000, fmt(c.price), c.priceNote === "Manual" ? "Manual" : "Excel", (v: number) => upd({ price: v, priceNote: "Manual" }))}
            {slider("Dividendos acumulados 3 años", c.div, 0, Math.max(1, (c.price ?? 100) * 0.3), 0.01, c.div === null ? "Pendiente" : fmt(c.div), c.div === null ? "Pendiente" : "Manual", (v: number) => upd({ div: v }))}
            {sc.bpa !== null && sc.bpa <= 0 && sc.manual === null ? <div style={{ color: AMBER, fontSize: 13, marginBottom: 10 }}>BPA nulo o negativo: el PER no aplica. Usa el objetivo manual o por FCF.</div> : null}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end" }}>
              <Field label="Objetivo manual / FCF"><input style={inputS} type="number" placeholder="vacío = PER" value={sc.manual === null ? "" : String(sc.manual)} onChange={(e: ChangeEvent<HTMLInputElement>) => updSc({ manual: num(e.target.value) })} /></Field>
              <Field label="Acciones"><input style={inputS} type="number" placeholder="Pendiente" value={c.shares === null ? "" : String(c.shares)} onChange={(e: ChangeEvent<HTMLInputElement>) => upd({ shares: num(e.target.value) })} /></Field>
              <Field label="Precio medio"><input style={inputS} type="number" value={c.avg === null ? "" : String(c.avg)} onChange={(e: ChangeEvent<HTMLInputElement>) => upd({ avg: num(e.target.value) })} /></Field>
            </div>
            <div style={{ marginTop: 12 }}><Btn label="↺ Restablecer empresa" onClick={() => { const o = INITIAL.find((x: Co) => x.t === c.t); if (o) setCos(cos.map((x: Co) => x.t === c.t ? o : x)); }} /></div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ ...card, background: "linear-gradient(160deg, " + PANEL2 + " 0%, " + PANEL + " 100%)", borderColor: "rgba(71,154,255,0.5)" }}>
              <div style={eyebrow}>El indicador que importa · Media TIKR + Warren</div>
              <div style={{ fontSize: wide ? 52 : 40, fontWeight: 900, lineHeight: 1.05, margin: "10px 0 4px", color: r.media === null ? INK3 : INK }}>{fmt(r.media)} <span style={{ fontSize: 18, color: INK3 }}>{r.media !== null ? c.cur : ""}</span></div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 6 }}>
                <div><div style={{ ...sub, fontSize: 11 }}>CAGR 3 AÑOS</div><div style={{ fontSize: 22, fontWeight: 800, color: BLUE }}>{pct(r.mediaCagr)}</div></div>
                <div><div style={{ ...sub, fontSize: 11 }}>POTENCIAL</div><div style={{ fontSize: 22, fontWeight: 800, color: CYAN }}>{pct(r.pot(r.media))}</div></div>
                <div><div style={{ ...sub, fontSize: 11 }}>P. MÁX. {pct(req).replace("+", "")}</div><div style={{ fontSize: 22, fontWeight: 800 }}>{fmt(r.maxP(r.media))}</div></div>
              </div>
            </div>
            <div style={card}>
              {[
                ["Objetivo " + (SCN.find((s: { k: ScKey }) => s.k === scK)?.l ?? ""), fmt(target(sc)) + " · CAGR " + pct(r.cagr(target(sc)))],
                ["BPA 2029 (escenario)", sc.manual !== null ? "N/D (objetivo directo)" : fmt(sc.bpa !== null && sc.g !== null ? sc.bpa * Math.pow(1 + sc.g, 3) : null)],
                ["Objetivo TIKR / Warren", fmt(r.tk) + " / " + fmt(r.wa)],
                ["Precio máx. (solo Warren, ref.)", fmt(r.maxP(r.wa))],
                ["Margen de seguridad (media)", pct(r.mos(r.media))],
                ["Margen de seguridad (Warren, ref.)", pct(r.mos(r.wa))],
                ["Bajista: caída posible", pct(r.pot(target(c.sc.baj)))],
                ["Precio actual", fmt(c.price) + " " + c.cur + " · " + c.priceNote],
                ["Dividendos", c.div === null ? "Pendiente (cálculo sin dividendos)" : fmt(c.div)],
                ["Veredicto Excel", c.veredicto],
              ].map((row: string[], i: number) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, padding: "9px 0", borderBottom: i < 9 ? "1px solid " + LINE : "none", fontSize: 13 }}>
                  <span style={{ color: INK3 }}>{row[0]}</span><span style={{ color: INK, fontWeight: 600, textAlign: "right" }}>{row[1]}</span>
                </div>
              ))}
              {c.notes ? <div style={{ ...sub, marginTop: 10 }}>{c.notes}</div> : null}
            </div>
          </div>
        </div>

        {/* Sensitivity + BPA */}
        <div style={{ display: "grid", gridTemplateColumns: wide ? "minmax(0,1fr) minmax(0,1fr)" : "1fr", gap: 12, marginTop: 12 }}>
          <div style={card}>
            <div style={eyebrow}>Sensibilidad · {SCN.find((s: { k: ScKey }) => s.k === scK)?.l} · {c.t}</div>
            <div style={{ ...sub, margin: "4px 0 12px" }}>CAGR 3 años según PER terminal (filas) y crecimiento del BPA (columnas). Turquesa = supera tu {pct(req).replace("+", "")}.</div>
            {sens ? (
              <div style={{ overflowX: "auto" }}>
                <table style={{ borderCollapse: "separate", borderSpacing: 4, width: "100%" }}>
                  <thead><tr><th style={{ fontSize: 11, color: INK3, textAlign: "left" }}>PER \ g</th>{sens.gs.map((g: number) => <th key={g} style={{ fontSize: 11, color: INK3, fontWeight: 700 }}>{pct(g)}</th>)}</tr></thead>
                  <tbody>{sens.pers.map((pe: number) => <tr key={pe}><td style={{ fontSize: 12, color: INK2, fontWeight: 700 }}>{fmt(pe, 1)}x</td>{sens.gs.map((g: number) => { const v = sens.val(pe, g); const center = pe === sc.per && g === sc.g; return <td key={g} style={{ background: heat(v), borderRadius: 8, textAlign: "center", padding: "8px 2px", fontSize: 12, fontWeight: center ? 900 : 600, color: INK, outline: center ? "2px solid " + INK : "none" }}>{pct(v)}</td>; })}</tr>)}</tbody>
                </table>
              </div>
            ) : (
              <div style={{ color: INK2, fontSize: 13 }}>Este escenario usa un objetivo directo ({c.sc[scK].manual !== null ? "manual/FCF" : "sin datos"}), no BPA × PER, así que no hay tabla PER × crecimiento. Elige un escenario con BPA y PER (p. ej. Warren en META) o introduce BPA, crecimiento y PER.</div>
            )}
          </div>
          <div style={card}>
            <div style={eyebrow}>BPA año a año · {c.t}</div>
            {BPA[c.t] ? (
              <div>
                <div style={{ ...sub, margin: "4px 0 10px" }}>{BPA[c.t].unit} · <span style={{ color: BLUE }}>■</span> histórico <span style={{ color: CYAN }}>■</span> estimado Base</div>
                <BpaChart rows={BPA[c.t].rows} />
                <div style={{ ...sub, fontSize: 11, marginTop: 6 }}>{BPA[c.t].note}</div>
              </div>
            ) : <div style={{ color: INK2, fontSize: 13, marginTop: 8 }}>Pendiente: el Excel no tiene BPA por años de {c.t}. Disponible para META, JD y ZEG.</div>}
          </div>
        </div>

        {/* Formulas */}
        {sectionHead("Motor matemático", "Fórmulas (sección 5 del PDF)", "CAGR aproximado, sin reinversión de dividendos. Si falta TIKR o Warren, la media es N/D, nunca cero.")}
        <div style={grid(wide ? 260 : 220)}>
          {[["Media", "(Objetivo TIKR + Objetivo Warren) / 2"], ["BPA 2029", "BPA base × (1 + g)³"], ["Objetivo", "BPA 2029 × PER terminal"], ["CAGR", "((Objetivo + Div.) / Precio)^(1/3) − 1"], ["Precio máx.", "(Objetivo + Div.) / (1 + r)³"], ["Margen de seguridad", "(Valor razonable − Precio) / Valor razonable"]].map((f: string[]) => (
            <div key={f[0]} style={card}><div style={{ ...eyebrow, fontSize: 10 }}>{f[0]}</div><div style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 13, color: INK, marginTop: 8 }}>{f[1]}</div></div>
          ))}
        </div>

        {/* Origen + export + pendiente */}
        {sectionHead("Fuentes y confianza", "De dónde sale cada dato", "Excel «00 · Cuadro de mando» · Google Drive, carpeta Broker SA · actualizado 26/10/2026")}
        <div style={grid(wide ? 260 : 220)}>
          {[["Excel", CYAN, "Precios del 23/10/2026, precios medios, pesos, veredictos y valores bajista/base/alcista de META, ZEG y JD. BPA por años de META, JD y ZEG."], ["Warren · META", BLUE, "BPA FY2026e 28,40 → FY2029e 47,51 (18,7 % anual implícito) × PER 20x = 949,95 (Excel: 950,21; diferencia por redondeo)."], ["TIKR", BLUE, "Pendiente en todas. Sin exportación autorizada no se inventa consenso."], ["Manual", AMBER, "Acciones, dividendos, bloque y estrellas (salvo META 5★, del PDF) pendientes."]].map((s: string[]) => (
            <div key={s[0]} style={card}><Pill text={s[0]} col={s[1]} /><div style={{ color: INK2, fontSize: 13, marginTop: 10 }}>{s[2]}</div></div>
          ))}
        </div>

        <div style={{ ...card, marginTop: 12 }}>
          <div style={eyebrow}>Guardar · Exportar · Importar</div>
          <div style={{ ...sub, color: INK2, margin: "6px 0 12px" }}>{saved ? "Los cambios se guardan en este navegador si la Page lo permite; para no perder nada, exporta el JSON." : "Esta Page no guarda cambios entre sesiones: exporta el JSON y vuelve a importarlo."}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <Btn primary label="Exportar JSON" onClick={() => { setJson(JSON.stringify({ cos, req }, null, 1)); setMsg("JSON generado: cópialo y guárdalo."); }} />
            <Btn label="Importar JSON" onClick={() => { try { const o = JSON.parse(json); if (!Array.isArray(o.cos)) throw new Error(); setCos(o.cos); if (typeof o.req === "number") setReq(o.req); setMsg("Importado."); } catch { setMsg("JSON no válido."); } }} />
            <Btn label="↺ Restablecer todo" onClick={() => { setCos(INITIAL); setReq(0.15); setMsg("Datos iniciales restaurados."); }} />
          </div>
          {msg ? <div style={{ color: CYAN, fontSize: 13, marginTop: 8 }}>{msg}</div> : null}
          <textarea value={json} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setJson(e.target.value)} rows={5} style={{ ...inputS, marginTop: 10, fontFamily: "ui-monospace, Menlo, monospace", fontSize: 12 }} />
        </div>

        <div style={{ ...card, marginTop: 12 }}>
          <div style={eyebrow}>Pendiente para la web privada real</div>
          <div style={{ color: INK2, fontSize: 13, marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
            <span>• Alojamiento HTTPS y despliegue privado (React + TypeScript + Vite).</span>
            <span>• Autenticación de una sola cuenta y base de datos por usuario (p. ej. Supabase Auth + PostgreSQL con RLS), sincronizada PC/iPhone.</span>
            <span>• Sincronización automática Excel → Web: el Excel está en Google Drive, no en SharePoint/OneDrive; haría falta la API de Google Drive/Sheets o mover el libro a Microsoft 365 para usar Graph.</span>
            <span>• Panel de sincronización (última fecha, versión, estado, «Comprobar ahora»), columnas propias y vistas guardadas.</span>
            <span>• Importación de TIKR desde una exportación permitida.</span>
          </div>
        </div>

        <div style={{ textAlign: "center", fontSize: 10, letterSpacing: "0.2em", color: INK3, marginTop: 28 }}>BLUE EDITION · EXPERIENCIA PRIVADA · ANÁLISIS EDUCATIVO · LA DECISIÓN ES DE ALBERTO</div>
      </div>
    </div>
  );
}
