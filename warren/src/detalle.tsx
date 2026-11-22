import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { loadCompanyNotes, saveCompanyNote, watchCompanyNotes } from "./db";
import { fecha } from "./format";
import { AnalysisReader } from "./markdown";
import { storedReports, trackedCompanies, type Listed } from "./detalle-model";
import type { Bundle, Company, RadarItem } from "./types";

const NAVY = "#0D1933";
const PANEL = "#14284B";
const BLUE = "#479AFF";
const INK = "#FFFFFF";
const LINE = "rgba(130,170,230,0.18)";
const INK3 = "#8FA6CF";
const btn = (on: boolean): CSSProperties => ({ cursor: "pointer", minHeight: 44, padding: "8px 12px", borderRadius: 999, border: "1px solid " + (on ? BLUE : LINE), background: on ? BLUE : "transparent", color: on ? NAVY : INK, fontWeight: 700, flex: "1 1 0" });

type Pane = "listado" | "notas" | "informes";

export function Detalle(props: { bundle: Bundle; radar: RadarItem[]; onOpen: (ticker: string) => void }) {
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
      {pane === "listado" ? <Listado rows={rows} onOpen={props.onOpen} /> : null}
      {pane === "notas" ? <Notas rows={rows} /> : null}
      {pane === "informes" ? <Informes reports={reports} /> : null}
    </section>
  );
}

function Listado(props: { rows: Listed[]; onOpen: (ticker: string) => void }) {
  if (props.rows.length === 0) return <p style={{ color: INK3 }}>No hay empresas en cartera ni en seguimiento.</p>;
  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
      {props.rows.map((row) => {
        const openable = Boolean(row.company);
        return (
          <li key={row.where + row.ticker}>
            <button
              type="button"
              disabled={!openable}
              onClick={() => { if (row.company) props.onOpen(row.company.ticker); }}
              style={{ width: "100%", textAlign: "left", background: PANEL, color: INK, border: "1px solid " + LINE, borderRadius: 12, padding: "8px 10px", display: "flex", gap: 8, alignItems: "baseline", cursor: openable ? "pointer" : "default" }}
            >
              <b style={{ minWidth: 64 }}>{row.ticker}</b>
              <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.name}</span>
              <span style={{ color: INK3, fontSize: 13 }}>{row.where}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
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
        <select aria-label="Empresa" value={picked} onChange={(event) => choose(event.target.value)} style={{ display: "block", width: "100%", marginTop: 4, background: NAVY, color: INK, border: "1px solid " + LINE, borderRadius: 10, padding: "10px 12px" }}>
          {companies.map((row) => <option key={row.company!.id} value={row.company!.id}>{row.ticker} · {row.name}</option>)}
        </select>
      </label>
      <textarea aria-label={"Notas de " + (companies.find((row) => row.company?.id === picked)?.ticker ?? "la empresa")} value={text} disabled={missing} placeholder="" onChange={(event) => { dirty.current = true; setText(event.target.value); }} style={{ width: "100%", minHeight: 180, boxSizing: "border-box", background: NAVY, color: INK, border: "1px solid " + LINE, borderRadius: 12, padding: 12 }} />
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
              <button type="button" onClick={() => setOpen(company)} style={{ width: "100%", textAlign: "left", background: PANEL, color: INK, border: "1px solid " + LINE, borderRadius: 12, padding: "8px 10px", display: "flex", gap: 8, alignItems: "baseline" }}>
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
