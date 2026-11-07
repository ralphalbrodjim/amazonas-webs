import { useEffect, useState } from "react";
import type { AgendaData } from "./liveContent";
import { getAgenda, getDeporte } from "./liveContent";
import { formatDay, shiftDay, shortDay, weekStart } from "./dates";
import { useSync } from "./cloud";
import { loadInglesHechos, resumenIngles } from "./inglesChecks";

const KEY = "semana-agenda-v1";

type Franja = "manana" | "tarde" | "noche" | "hora";
type CatId = "ingles" | "gimnasio" | "running" | "hogar" | "otro";
type SlotValue = "" | "ingles" | "gimnasio" | "running" | "hogar" | "texto";

export type Entry = {
  id: string;
  fecha: string;
  franja: Franja;
  inicio: string | null;
  fin: string | null;
  categoria: CatId | null;
  texto: string;
  hecho: boolean;
  origen: string | null;
};

type Cita = AgendaData["citas"][number];

const CATS: { id: Exclude<CatId, "otro">; label: string; emoji: string }[] = [
  { id: "ingles", label: "Inglés", emoji: "🇬🇧" },
  { id: "gimnasio", label: "Gimnasio", emoji: "💪" },
  { id: "running", label: "Running", emoji: "🏃" },
  { id: "hogar", label: "Hogar", emoji: "🏠" },
];
const ICONO_TEXTO = "📌";

const FRANJAS: { id: Exclude<Franja, "hora">; label: string; short: string }[] = [
  { id: "manana", label: "Mañana", short: "Mañ" },
  { id: "tarde", label: "Tarde", short: "Tar" },
  { id: "noche", label: "Noche", short: "Noc" },
];

function viaje() { return getDeporte().gimnasio.planificadas_noviembre.parada; }

function uid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `e-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalize(value: unknown): Entry[] {
  if (!Array.isArray(value)) throw new Error("sin entradas");
  return value.map((item) => {
    if (!item || typeof item !== "object") throw new Error("entrada");
    const row = item as Partial<Entry>;
    if (typeof row.fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(row.fecha)) throw new Error("fecha");
    if (row.franja !== "manana" && row.franja !== "tarde" && row.franja !== "noche" && row.franja !== "hora") throw new Error("franja");
    const categoria = CATS.some((cat) => cat.id === row.categoria) || row.categoria === "otro" ? row.categoria as CatId : null;
    return {
      id: typeof row.id === "string" ? row.id : uid(),
      fecha: row.fecha,
      franja: row.franja,
      inicio: typeof row.inicio === "string" ? row.inicio : null,
      fin: typeof row.fin === "string" ? row.fin : null,
      categoria,
      texto: typeof row.texto === "string" ? row.texto : "",
      hecho: row.hecho === true,
      origen: typeof row.origen === "string" ? row.origen : null,
    };
  });
}

function citaId(cita: { fecha: string; titulo: string; hora: string | null }): string {
  return cita.fecha + "|" + cita.titulo + "|" + (cita.hora ?? "");
}

function catDeTipo(tipo: string): CatId {
  if (tipo === "ingles") return "ingles";
  if (tipo === "deporte") return "running";
  if (tipo === "tarea") return "hogar";
  return "otro";
}

function loadBag(): { entradas: Entry[]; ocultas: string[] } {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { entradas: [], ocultas: [] };
    const parsed = JSON.parse(raw) as { entradas?: unknown; ocultas?: unknown };
    return {
      entradas: normalize(Array.isArray(parsed.entradas) ? parsed.entradas : []),
      ocultas: Array.isArray(parsed.ocultas) ? parsed.ocultas.filter((item): item is string => typeof item === "string") : [],
    };
  } catch {
    return { entradas: [], ocultas: [] };
  }
}

function franjaDe(hora: string | null): Exclude<Franja, "hora"> | "sin-hora" {
  if (!hora) return "sin-hora";
  const text = hora.toLowerCase();
  if (text.includes("mañana") || text.includes("manana")) return "manana";
  if (text.includes("tarde")) return "tarde";
  if (text.includes("noche")) return "noche";
  const match = text.match(/(\d{1,2})[:.](\d{2})/);
  if (!match) return "sin-hora";
  const hour = Number(match[1]);
  if (hour < 14) return "manana";
  if (hour < 21) return "tarde";
  return "noche";
}

function enViaje(fecha: string): boolean {
  const parada = viaje();
  return fecha >= parada.desde && fecha <= parada.hasta;
}

function catMeta(id: CatId | null) {
  return CATS.find((cat) => cat.id === id) ?? null;
}

function slotValue(entry: Entry | null, cita: Cita | null): SlotValue {
  const cat = entry?.categoria ?? (cita ? catDeTipo(cita.tipo) : null);
  const texto = entry?.texto || cita?.titulo || "";
  if (!entry && !cita) return "";
  if (cat === "ingles" || cat === "gimnasio" || cat === "running" || cat === "hogar") return cat;
  if (cat === "otro" || texto) return "texto";
  return "";
}

function diaMini(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const wd = new Intl.DateTimeFormat("es-ES", { timeZone: "UTC", weekday: "narrow" }).format(new Date(Date.UTC(y, m - 1, d)));
  return `${wd.toUpperCase()} ${d}`;
}

type Fila = {
  key: string;
  entry: Entry | null;
  cita: Cita | null;
  value: SlotValue;
  texto: string;
  hecho: boolean;
  caption: string;
};

export function Planner(props: { hoy: string }) {
  const [dia, setDia] = useState(props.hoy);
  const bag = loadBag();
  const sync = useSync();
  const [entradas, setEntradas] = useState<Entry[]>(bag.entradas);
  const [ocultas, setOcultas] = useState<string[]>(bag.ocultas);
  const [io, setIo] = useState("");
  const [ioMsg, setIoMsg] = useState("");
  const [aviso, setAviso] = useState("");
  const [focusId, setFocusId] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<string | null>(null);

  useEffect(() => {
    const value = { entradas, ocultas };
    try {
      localStorage.setItem(KEY, JSON.stringify(value));
    } catch {
      setAviso("Este navegador no guarda los cambios. Exporta el JSON antes de salir.");
    }
    sync.push(KEY, value);
  }, [entradas, ocultas, sync]);
  useEffect(() => sync.onKey(KEY, (value) => {
    if (!value || typeof value !== "object") return;
    const row = value as { entradas?: unknown; ocultas?: unknown };
    try { setEntradas(normalize(Array.isArray(row.entradas) ? row.entradas : [])); } catch { /* remoto ilegible */ }
    setOcultas(Array.isArray(row.ocultas) ? row.ocultas.filter((item): item is string => typeof item === "string") : []);
  }), [sync]);

  const diasSemana = Array.from({ length: 7 }, (_, i) => shiftDay(weekStart(dia), i));

  function visibleCitas(fecha: string): Cita[] {
    return getAgenda().citas.filter((cita) => cita.fecha === fecha && !ocultas.includes(citaId(cita)) && !entradas.some((item) => item.origen === citaId(cita)));
  }

  function poner(opts: { fecha: string; franja: Franja; entry: Entry | null; origen: string | null; value: SlotValue; texto: string; hecho: boolean; focus?: boolean }) {
    if (opts.value === "") {
      if (opts.entry) setEntradas((list) => list.filter((item) => item.id !== opts.entry!.id));
      if (opts.origen) setOcultas((list) => list.includes(opts.origen as string) ? list : [...list, opts.origen as string]);
      return;
    }
    const id = opts.entry?.id ?? uid();
    const next: Entry = {
      id,
      fecha: opts.fecha,
      franja: opts.franja,
      inicio: opts.entry?.inicio ?? null,
      fin: opts.entry?.fin ?? null,
      categoria: opts.value === "texto" ? "otro" : opts.value,
      texto: opts.texto,
      hecho: opts.hecho,
      origen: opts.origen,
    };
    setEntradas((list) => list.some((item) => item.id === id) ? list.map((item) => item.id === id ? next : item) : [...list, next]);
    if (opts.focus) setFocusId(id);
  }

  function filas(fecha: string, franja: Franja): Fila[] {
    const propias = entradas.filter((item) => item.fecha === fecha && item.franja === franja);
    const deCitas: Fila[] = (franja === "hora" ? [] : visibleCitas(fecha).filter((cita) => {
      const slot = franjaDe(cita.hora);
      if (franja === "manana") return slot === "manana" || slot === "sin-hora";
      return slot === franja;
    })).map((cita) => ({
      key: citaId(cita),
      entry: null,
      cita,
      value: slotValue(null, cita),
      texto: cita.titulo,
      hecho: false,
      caption: cita.titulo,
    }));
    const deEntradas: Fila[] = propias.map((entry) => ({
      key: entry.id,
      entry,
      cita: null,
      value: slotValue(entry, null),
      texto: entry.texto,
      hecho: entry.hecho,
      caption: entry.origen ? entry.texto : "",
    }));
    return [...deCitas, ...deEntradas];
  }

  function actividades() {
    const out: { fecha: string; franja: Franja | "sin-hora"; value: SlotValue; texto: string; hecho: boolean }[] = [];
    for (const fecha of diasSemana) {
      for (const franja of FRANJAS) {
        for (const fila of filas(fecha, franja.id)) {
          if (fila.value) out.push({ fecha, franja: franja.id, value: fila.value, texto: fila.texto, hecho: fila.hecho });
        }
      }
      for (const fila of filas(fecha, "hora")) {
        if (fila.value) out.push({ fecha, franja: "hora", value: fila.value, texto: fila.texto, hecho: fila.hecho });
      }
    }
    return out;
  }

  function exportar() {
    setIo(JSON.stringify({ entradas, ocultas }, null, 1));
    setIoMsg("JSON listo: cópialo para llevarlo a otro dispositivo.");
  }

  function importar() {
    try {
      const parsed = JSON.parse(io) as { entradas?: unknown; ocultas?: unknown };
      const list = normalize(Array.isArray(parsed) ? parsed : parsed.entradas);
      const hidden = !Array.isArray(parsed) && Array.isArray(parsed.ocultas) ? parsed.ocultas.filter((item): item is string => typeof item === "string") : [];
      setEntradas(list);
      setOcultas(hidden);
      setIoMsg("Entradas importadas.");
    } catch {
      setIoMsg("El texto no es un JSON válido de esta agenda.");
    }
  }

  useEffect(() => {
    if (!focusId) return;
    document.getElementById("texto-" + focusId)?.focus();
    setFocusId(null);
  }, [focusId]);

  const hechos = actividades();

  return (
    <section>
      <div className="kicker">Agenda</div>
      <h2>Tu semana</h2>
      <p className="lead">En cada tramo elige Inglés, Gimnasio, Running, Hogar o un texto libre. Se guarda al cambiar. Márcalo cuando lo hayas hecho. Las citas que ya estaban se pueden cambiar o dejar en blanco.</p>
      {aviso ? <p className="callout">{aviso}</p> : null}
      <div className="nav">
        <button className="tap" type="button" onClick={() => setDia(shiftDay(weekStart(dia), -7))} aria-label="Semana anterior">‹</button>
        <div className="grow">Semana del {formatDay(diasSemana[0], false)}</div>
        <button className="tap" type="button" onClick={() => setDia(shiftDay(weekStart(dia), 7))} aria-label="Semana siguiente">›</button>
      </div>
      <button className="tap" type="button" onClick={() => setDia(props.hoy)}>Hoy · {shortDay(props.hoy)}</button>
      <div className="week">
        {diasSemana.map((fecha) => (
          <article key={fecha} className={`card week-day${fecha === props.hoy ? " is-today" : ""}`}>
            <h3 className="day-title">{formatDay(fecha)}{fecha === props.hoy ? " · Hoy" : ""}</h3>
            {enViaje(fecha) ? <p className="note">{viaje().motivo}</p> : null}
            {FRANJAS.map((franja) => {
              const rows = filas(fecha, franja.id);
              return (
                <div key={franja.id} className="franja">
                  <div className="franja-label">{franja.label}</div>
                  {rows.length === 0 ? (
                    <SlotSelect
                      label={`${franja.label}, ${formatDay(fecha)}`}
                      value=""
                      texto=""
                      hecho={false}
                      caption=""
                      onValue={(value) => poner({ fecha, franja: franja.id, entry: null, origen: null, value, texto: "", hecho: false, focus: value === "texto" })}
                      onTexto={() => undefined}
                      onHecho={() => undefined}
                    />
                  ) : rows.map((fila) => (
                    <SlotSelect
                      key={fila.key}
                      label={`${franja.label}, ${fila.caption || formatDay(fecha)}`}
                      value={fila.value}
                      texto={fila.texto}
                      hecho={fila.hecho}
                      caption={fila.value === "texto" ? "" : fila.caption}
                      inputId={fila.entry ? "texto-" + fila.entry.id : undefined}
                      onValue={(value) => poner({
                        fecha,
                        franja: franja.id,
                        entry: fila.entry,
                        origen: fila.entry?.origen ?? (fila.cita ? citaId(fila.cita) : null),
                        value,
                        texto: value === "texto" ? (fila.texto || fila.cita?.titulo || "") : fila.texto,
                        hecho: fila.hecho,
                        focus: value === "texto",
                      })}
                      onTexto={(texto) => poner({
                        fecha,
                        franja: franja.id,
                        entry: fila.entry,
                        origen: fila.entry?.origen ?? (fila.cita ? citaId(fila.cita) : null),
                        value: "texto",
                        texto,
                        hecho: fila.hecho,
                      })}
                      onHecho={(hecho) => poner({
                        fecha,
                        franja: franja.id,
                        entry: fila.entry,
                        origen: fila.entry?.origen ?? (fila.cita ? citaId(fila.cita) : null),
                        value: fila.value || "texto",
                        texto: fila.texto,
                        hecho,
                      })}
                    />
                  ))}
                </div>
              );
            })}
            {filas(fecha, "hora").map((fila) => (
              <SlotSelect
                key={fila.key}
                label={fila.entry?.inicio && fila.entry?.fin ? `${fila.entry.inicio}–${fila.entry.fin}` : "Otro horario"}
                value={fila.value}
                texto={fila.texto}
                hecho={fila.hecho}
                caption={fila.entry?.inicio && fila.entry?.fin ? `${fila.entry.inicio}–${fila.entry.fin}` : fila.caption}
                inputId={fila.entry ? "texto-" + fila.entry.id : undefined}
                onValue={(value) => poner({ fecha, franja: "hora", entry: fila.entry, origen: fila.entry?.origen ?? null, value, texto: value === "texto" ? fila.texto : fila.texto, hecho: fila.hecho, focus: value === "texto" })}
                onTexto={(texto) => poner({ fecha, franja: "hora", entry: fila.entry, origen: fila.entry?.origen ?? null, value: "texto", texto, hecho: fila.hecho })}
                onHecho={(hecho) => poner({ fecha, franja: "hora", entry: fila.entry, origen: fila.entry?.origen ?? null, value: fila.value || "texto", texto: fila.texto, hecho })}
              />
            ))}
          </article>
        ))}
      </div>

      <div className="kicker">Resumen de la semana</div>
      <article className="card" aria-label="Resumen de la semana">
        <h3>Semana del {formatDay(diasSemana[0], false)}</h3>
        <div className="ws-sum">
          <div className="ws-row">
            <span />
            {FRANJAS.map((franja) => <span key={franja.id} className="ws-h">{franja.short}</span>)}
          </div>
          {diasSemana.map((fecha) => (
            <div key={fecha} className="ws-row">
              <span className={fecha === props.hoy ? "ws-day is-today" : "ws-day"}>{diaMini(fecha)}</span>
              {FRANJAS.map((franja) => {
                const rows = filas(fecha, franja.id).filter((fila) => fila.value);
                return (
                  <CeldaResumen key={franja.id} rows={rows} abierto={detalle} onTexto={(texto) => setDetalle(detalle === texto ? null : texto)} />
                );
              })}
            </div>
          ))}
        </div>
        <div className="sum-counts">
          {CATS.map((cat) => {
            const items = hechos.filter((item) => item.value === cat.id);
            const done = items.filter((item) => item.hecho).length;
            return <span key={cat.id}>{cat.emoji} {cat.label} {done}/{items.length}</span>;
          })}
          {hechos.some((item) => item.value === "texto") ? <span>{ICONO_TEXTO} Texto {hechos.filter((item) => item.value === "texto" && item.hecho).length}/{hechos.filter((item) => item.value === "texto").length}</span> : null}
          {(() => {
            const clases = resumenIngles(diasSemana[0], diasSemana[6], loadInglesHechos());
            return clases.total > 0 ? <span>🇬🇧 Clases {clases.hechas}/{clases.total}</span> : null;
          })()}
        </div>
        {detalle ? <p className="ws-tip">{ICONO_TEXTO} {detalle}</p> : null}
      </article>

      {getAgenda().pendientes_sin_fecha.length > 0 ? (
        <article className="card">
          <h3>Sin fecha</h3>
          {getAgenda().pendientes_sin_fecha.map((item) => (
            <p key={item.titulo} className="note">{item.titulo}. {item.nota} Pendiente.</p>
          ))}
        </article>
      ) : null}

      <div className="kicker">Copia de tus entradas</div>
      <article className="card">
        <p className="note">Se guardan en este navegador, también los cambios sobre las citas que ya estaban. Exporta el JSON para pasarlas a otro dispositivo.</p>
        <div className="actions">
          <button className="tap primary" type="button" onClick={exportar}>Exportar JSON</button>
          <button className="tap" type="button" onClick={importar}>Importar JSON</button>
        </div>
        {ioMsg ? <p className="note">{ioMsg}</p> : null}
        <textarea className="field area" value={io} onChange={(event) => setIo(event.target.value)} placeholder="Pega aquí un JSON exportado, o pulsa Exportar." />
      </article>
    </section>
  );
}

function icono(value: SlotValue): string {
  if (value === "texto") return ICONO_TEXTO;
  return CATS.find((item) => item.id === value)?.emoji ?? ICONO_TEXTO;
}

function CeldaResumen(props: { rows: Fila[]; abierto: string | null; onTexto: (texto: string) => void }) {
  if (props.rows.length === 0) return <span className="ws-cell">—</span>;
  const textos = props.rows.filter((fila) => fila.value === "texto").map((fila) => fila.texto.trim()).filter(Boolean);
  const icons = (
    <span className="ws-icons">
      {props.rows.map((fila) => (
        <span key={fila.key} className={fila.hecho ? "ws-em done" : "ws-em"}>{icono(fila.value)}{fila.hecho ? <span className="ws-ok">✓</span> : null}</span>
      ))}
    </span>
  );
  if (!textos.length) return <span className="ws-cell">{icons}</span>;
  const texto = textos.join(" · ");
  return (
    <button type="button" className={"ws-cell ws-cell-btn" + (props.abierto === texto ? " on" : "")} aria-label={texto} onClick={() => props.onTexto(texto)}>
      {icons}
    </button>
  );
}

function SlotSelect(props: {
  label: string;
  value: SlotValue;
  texto: string;
  hecho: boolean;
  caption: string;
  inputId?: string;
  onValue: (value: SlotValue) => void;
  onTexto: (texto: string) => void;
  onHecho: (hecho: boolean) => void;
}) {
  return (
    <div className="slot-row">
      <div className="slot-line">
        <select
          className="slot-select"
          aria-label={props.label}
          value={props.value}
          onChange={(event) => props.onValue(event.target.value as SlotValue)}
        >
          <option value="">— Libre —</option>
          <option value="ingles">🇬🇧 Inglés</option>
          <option value="gimnasio">💪 Gimnasio</option>
          <option value="running">🏃 Running</option>
          <option value="hogar">🏠 Hogar</option>
          <option value="texto">📌 Texto libre…</option>
        </select>
        {props.value ? (
          <label className="hecho-check slot-hecho">
            <input type="checkbox" checked={props.hecho} onChange={(event) => props.onHecho(event.target.checked)} />
            Hecho
          </label>
        ) : null}
      </div>
      {props.value === "texto" ? (
        <input
          className="slot-text"
          aria-label={`Texto libre, ${props.label}`}
          value={props.texto}
          id={props.inputId}
          placeholder="Texto libre…"
          onChange={(event) => props.onTexto(event.target.value)}
        />
      ) : null}
      {props.caption && props.value !== "texto" ? <p className="note">{props.caption}</p> : null}
    </div>
  );
}
