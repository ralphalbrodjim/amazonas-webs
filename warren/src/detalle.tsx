import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { loadCompanyNotes, saveCompanyNote, watchCompanyNotes } from "./db";
import { earningsOf } from "./earnings";
import { fecha, pct } from "./format";
import { cagr3, priceReturn } from "./math";
import { AnalysisReader } from "./markdown";
import { ValueChip } from "./panels";
import { cagrTone, compareListado, resultadoDe, storedReports, trackedCompanies, warrenUpdateIso, type ListSortKey, type Listed, type Resultado, type SortDir } from "./detalle-model";
import type { Bundle, Company, RadarItem } from "./types";
import { companyView } from "./view";

const NAVY = "#0D1933";
const PANEL = "#2C446C";
const BLUE = "#479AFF";
const INK = "#FFFFFF";
const LINE = "rgba(130,170,230,0.18)";
const INK3 = "#8FA6CF";
const btn = (on: boolean): CSSProperties => ({ cursor: "pointer", minHeight: 44, padding: "8px 12px", borderRadius: 999, border: "1px solid " + (on ? BLUE : LINE), background: on ? BLUE : "transparent", color: on ? NAVY : INK, fontWeight: 700, flex: "1 1 0" });

type Pane = "listado" | "notas" | "informes";

export function Detalle(props: { bundle: Bundle; radar: RadarItem[]; today: string; onOpen: (ticker: string) => void }) {
  const [pane, setPane] = useState<Pane>("listado");
  const rows = useMemo(() => trackedCompanies(props.bundle.companies, props.radar), [props.bundle.companies, props.radar]);
  const reports = useMemo(() => storedReports(props.bundle.companies), [props.bundle.companies]);
  const panes: { id: Pane; label: string }[] = [
    { id: "listado", label: "Listado" },
    { id: "notas", label: "Notas" },
    { id: "informes", label: "Informes" },
  ];
  return (
    <section>
      <div role="tablist" aria-label="Detalle" style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {panes.map((item) => (
          <button key={item.id} type="button" role="tab" aria-selected={pane === item.id} style={btn(pane === item.id)} onClick={() => setPane(item.id)}>{item.label}</button>
        ))}
      </div>
      {pane === "listado" ? <Listado bundle={props.bundle} radar={props.radar} today={props.today} onOpen={props.onOpen} /> : null}
      {pane === "notas" ? <Notas rows={rows} /> : null}
      {pane === "informes" ? <Informes reports={reports} /> : null}
    </section>
  );
}

const HEADS: { id: ListSortKey; lines: string[]; title: string }[] = [
  { id: "empresa", lines: ["Empresa"], title: "Empresa" },
  { id: "cagr3", lines: ["CAGR", "3 años"], title: "CAGR 3 años" },
  { id: "cagr1", lines: ["CAGR", "1 año"], title: "CAGR 1 año" },
  { id: "resultados", lines: ["Fecha", "resultados"], title: "Fecha resultados" },
  { id: "warren", lines: ["Fecha act.", "Warren"], title: "Fecha actualización Warren" },
];

function radarOf(rows: RadarItem[], companyId: string | null, ticker: string): RadarItem | null {
  return (companyId ? rows.find((row) => row.company_id === companyId) : undefined) ?? rows.find((row) => row.ticker.toUpperCase() === ticker.toUpperCase()) ?? null;
}

type ListLine = Listed & { cagr3: number | null; cagr1: number | null; resultado: Resultado | null; warren: string | null };

function listLines(bundle: Bundle, radar: RadarItem[], today: string): ListLine[] {
  return trackedCompanies(bundle.companies, radar).map((row) => {
    const item = radarOf(radar, row.company?.id ?? null, row.ticker);
    let cagr3y: number | null = null;
    let cagr1y: number | null = null;
    if (row.company) {
      const view = companyView(bundle, row.company.id, "warren", today, item?.target_3a ?? null, item?.target_1a ?? null);
      cagr3y = view.cagr;
      cagr1y = view.rent1;
    } else if (item) {
      const price = typeof item.price === "number" ? item.price : null;
      cagr3y = cagr3(item.target_3a ?? null, price);
      cagr1y = priceReturn(item.target_1a ?? null, price);
    }
    const earned = row.company ? earningsOf(bundle.earnings, row.company.id) : null;
    const dates = row.company
      ? bundle.estimates.filter((estimate) => estimate.company_id === row.company!.id && estimate.source === "warren").map((estimate) => estimate.as_of)
      : [];
    return {
      ...row,
      cagr3: cagr3y,
      cagr1: cagr1y,
      resultado: resultadoDe(earned?.next_date, today, earned?.certainty),
      warren: warrenUpdateIso([...dates, item?.computed_at]),
    };
  });
}

function Listado(props: { bundle: Bundle; radar: RadarItem[]; today: string; onOpen: (ticker: string) => void }) {
  const [sort, setSort] = useState<ListSortKey>("empresa");
  const [dir, setDir] = useState<SortDir>("asc");
  const lines = useMemo(() => {
    const rows = listLines(props.bundle, props.radar, props.today);
    return rows.slice().sort((a, b) => compareListado(
      { ticker: a.ticker, cagr3: a.cagr3, cagr1: a.cagr1, resultados: a.resultado?.iso ?? null, warren: a.warren },
      { ticker: b.ticker, cagr3: b.cagr3, cagr1: b.cagr1, resultados: b.resultado?.iso ?? null, warren: b.warren },
      sort,
      dir,
    ));
  }, [props.bundle, props.radar, props.today, sort, dir]);
  if (lines.length === 0) return <p style={{ color: INK3 }}>No hay empresas en cartera ni en seguimiento.</p>;
  function tap(key: ListSortKey) {
    if (sort === key) setDir(dir === "desc" ? "asc" : "desc");
    else { setSort(key); setDir("desc"); }
  }
  return (
    <table className="detalle-list">
      <thead>
        <tr>
          {HEADS.map((head) => {
            const active = sort === head.id;
            const aria = active ? (dir === "desc" ? "descending" : "ascending") : "none";
            return (
              <th key={head.id} scope="col" aria-sort={aria}>
                <button type="button" title={head.title} aria-label={head.title} onClick={() => tap(head.id)}>
                  {head.lines.map((line) => <span key={line} style={{ display: "block" }}>{line}</span>)}
                  {active ? <span aria-hidden="true">{dir === "desc" ? "↓" : "↑"}</span> : null}
                </button>
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {lines.map((row) => (
          <tr key={row.where + row.ticker} onClick={() => { if (row.company) props.onOpen(row.company.ticker); }} style={{ cursor: row.company ? "pointer" : "default" }}>
            <td>
              <span className="emp" title={row.name}>
                <b>{row.ticker}</b>
                <span>{row.name}</span>
              </span>
            </td>
            <td style={{ textAlign: "right" }}>{row.cagr3 === null ? "—" : <ValueChip tone={cagrTone(row.cagr3)}>{pct(row.cagr3)}</ValueChip>}</td>
            <td style={{ textAlign: "right" }}>{row.cagr1 === null ? "—" : <ValueChip tone={cagrTone(row.cagr1)}>{pct(row.cagr1)}</ValueChip>}</td>
            <td style={{ textAlign: "right" }}><ResultadoCell value={row.resultado} /></td>
            <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>{row.warren ? fecha(row.warren) : "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ResultadoCell(props: { value: Resultado | null }) {
  const value = props.value;
  if (!value) return <>—</>;
  const text = fecha(value.iso);
  if (value.kind === "known") return <span style={{ whiteSpace: "nowrap" }}>{text}</span>;
  return <span className="chip" title={value.approx ? "Estimado: fecha anterior más 3 meses" : "Fecha estimada"}>{value.approx ? "≈ " : ""}{text} <span className="stamp">est.</span></span>;
}

function Notas(props: { rows: Listed[] }) {
  const companies = props.rows.filter((row) => row.company);
  const [picked, setPicked] = useState(companies[0]?.company?.id ?? "");
  const [text, setText] = useState("");
  const [remote, setRemote] = useState<Record<string, string>>({});
  const [missing, setMissing] = useState(false);
  const [msg, setMsg] = useState("");
  const dirty = useRef(false);
  const pickedRef = useRef(picked);
  const textRef = useRef(text);
  const remoteRef = useRef(remote);
  pickedRef.current = picked;
  textRef.current = text;
  remoteRef.current = remote;

  useEffect(() => {
    let cancel = false;
    let stop = () => {};
    async function pull() {
      const result = await loadCompanyNotes();
      if (cancel) return;
      setMissing(result.missing);
      setMsg(result.error ?? "");
      const id = pickedRef.current || props.rows.find((row) => row.company)?.company?.id || "";
      if (!pickedRef.current && id) {
        pickedRef.current = id;
        setPicked(id);
      }
      if (!dirty.current && id) {
        const next = result.notes[id] ?? "";
        const prev = remoteRef.current[id] ?? "";
        if (textRef.current === prev || textRef.current === next) setText(next);
      }
      remoteRef.current = result.notes;
      setRemote(result.notes);
      return result;
    }
    void pull().then((result) => {
      if (cancel || !result || result.missing) return;
      stop = watchCompanyNotes(() => { void pull(); });
    });
    return () => { cancel = true; stop(); };
  }, [props.rows]);

  useEffect(() => {
    if (!picked || !dirty.current || missing) return;
    const body = text;
    const companyId = picked;
    const timer = window.setTimeout(() => {
      void saveCompanyNote(companyId, body).then((error) => {
        if (pickedRef.current === companyId && textRef.current === body) {
          dirty.current = false;
          setMsg(error ?? "");
          if (!error) setRemote((prev) => ({ ...prev, [companyId]: body }));
        }
      });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [text, picked, missing]);

  if (companies.length === 0) return <p style={{ color: INK3 }}>No hay empresas para anotar.</p>;
  function choose(id: string) {
    if (picked && dirty.current && !missing) void saveCompanyNote(picked, textRef.current);
    dirty.current = false;
    setPicked(id);
    setText(remote[id] ?? "");
  }
  return (
    <div>
      {missing ? <p style={{ color: INK3 }}>Las notas se guardan cuando exista la tabla warren_company_notes. Aplica supabase/migrations/20261122010000_warren_company_notes.sql.</p> : null}
      <label style={{ display: "block", marginBottom: 8 }}>
        <span style={{ color: INK3, fontSize: 13 }}>Empresa</span>
        <select aria-label="Empresa" value={picked} onChange={(event) => choose(event.target.value)} style={{ display: "block", width: "100%", marginTop: 4, background: PANEL, color: INK, border: "1px solid rgba(190, 210, 235, 0.4)", borderRadius: 10, padding: "10px 12px" }}>
          {companies.map((row) => <option key={row.company!.id} value={row.company!.id}>{row.ticker} · {row.name}</option>)}
        </select>
      </label>
      <textarea aria-label={"Notas de " + (companies.find((row) => row.company?.id === picked)?.ticker ?? "la empresa")} value={text} disabled={missing} placeholder="" onChange={(event) => { dirty.current = true; setText(event.target.value); }} style={{ width: "100%", minHeight: 180, boxSizing: "border-box", background: PANEL, color: INK, border: "1px solid rgba(190, 210, 235, 0.4)", borderRadius: 12, padding: 12 }} />
      {msg ? <p style={{ color: INK3 }}>{msg}</p> : null}
    </div>
  );
}

function Informes(props: { reports: Company[] }) {
  const [open, setOpen] = useState<Company | null>(null);
  if (props.reports.length === 0) return <p style={{ color: INK3 }}>No hay informes guardados.</p>;
  return (
    <>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
        {props.reports.map((company) => {
          const sent = company.report_sent_on ? fecha(company.report_sent_on.slice(0, 10)) : "";
          const dated = sent && sent !== "N/D" ? sent : "Sin fecha";
          return (
            <li key={company.id}>
              <button type="button" onClick={() => setOpen(company)} style={{ width: "100%", textAlign: "left", background: PANEL, color: INK, border: "1px solid rgba(190, 210, 235, 0.4)", borderRadius: 12, padding: "8px 10px", display: "flex", gap: 8, alignItems: "baseline" }}>
                <b style={{ minWidth: 64 }}>{company.ticker}</b>
                <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{company.name}</span>
                <span style={{ color: INK3, fontSize: 13 }}>{dated}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {open ? <AnalysisReader ticker={open.ticker} name={open.name} sentOn={open.report_sent_on} source={open.report_md ?? ""} reportJson={open.report_json} onClose={() => setOpen(null)} /> : null}
    </>
  );
}
