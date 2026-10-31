import { useEffect, useState } from "react";
import agenda from "../data/agenda.json";
import deporte from "../data/deporte.json";
import { formatDay, pend, shiftDay, shortDay, weekStart } from "./dates";

const KEY = "semana-agenda-v1";

type Franja = "manana" | "tarde" | "noche" | "hora";
type CatId = "ingles" | "gimnasio" | "running" | "hogar" | "otro";
type Vista = "semana" | "dia" | "lista";

export type Entry = {
  id: string;
  fecha: string;
  franja: Franja;
  inicio: string | null;
  fin: string | null;
  categoria: CatId | null;
  texto: string;
  hecho: boolean;
};

type Draft = {
  id: string | null;
  fecha: string;
  franja: Franja;
  inicio: string;
  fin: string;
  categoria: CatId | null;
  texto: string;
  hecho: boolean;
};

const CATS: { id: CatId; label: string; emoji: string; color: string; bg: string }[] = [
  { id: "ingles", label: "Inglés", emoji: "🗣️", color: "#1F4E79", bg: "#E5F0F8" },
  { id: "gimnasio", label: "Gimnasio", emoji: "💪", color: "#8C3F2A", bg: "#F8E6DC" },
  { id: "running", label: "Running", emoji: "🏃", color: "#1F3B34", bg: "#E6EEE7" },
  { id: "hogar", label: "Hogar", emoji: "🏠", color: "#8A5A12", bg: "#FBEFD9" },
  { id: "otro", label: "Otro", emoji: "✏️", color: "#5C5346", bg: "#EFEAE2" },
];

const FRANJAS: { id: Exclude<Franja, "hora">; label: string }[] = [
  { id: "manana", label: "Mañana" },
  { id: "tarde", label: "Tarde" },
  { id: "noche", label: "Noche" },
];

const TIPO: Record<string, string> = {
  personal: "Personal",
  ingles: "Inglés",
  tarea: "Tarea",
  deporte: "Deporte",
};

const VIAJE = deporte.gimnasio.planificadas_noviembre.parada;

function catOf(id: CatId | null) {
  return CATS.find((cat) => cat.id === id) ?? null;
}

function uid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `e-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadEntradas(): Entry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { entradas?: unknown };
    return normalize(parsed.entradas);
  } catch {
    return [];
  }
}

function normalize(value: unknown): Entry[] {
  if (!Array.isArray(value)) throw new Error("sin entradas");
  return value.map((item) => {
    if (!item || typeof item !== "object") throw new Error("entrada");
    const row = item as Partial<Entry>;
    if (typeof row.fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(row.fecha)) throw new Error("fecha");
    if (row.franja !== "manana" && row.franja !== "tarde" && row.franja !== "noche" && row.franja !== "hora") throw new Error("franja");
    const categoria = CATS.some((cat) => cat.id === row.categoria) ? row.categoria as CatId : null;
    return {
      id: typeof row.id === "string" ? row.id : uid(),
      fecha: row.fecha,
      franja: row.franja,
      inicio: typeof row.inicio === "string" ? row.inicio : null,
      fin: typeof row.fin === "string" ? row.fin : null,
      categoria,
      texto: typeof row.texto === "string" ? row.texto : "",
      hecho: row.hecho === true,
    };
  });
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
  return fecha >= VIAJE.desde && fecha <= VIAJE.hasta;
}

export function Planner(props: { hoy: string }) {
  const [vista, setVista] = useState<Vista>("semana");
  const [dia, setDia] = useState(props.hoy);
  const [entradas, setEntradas] = useState<Entry[]>(loadEntradas);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState("");
  const [borrar, setBorrar] = useState<string | null>(null);
  const [io, setIo] = useState("");
  const [ioMsg, setIoMsg] = useState("");
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ entradas }));
    } catch {
      setAviso("Este navegador no guarda los cambios. Exporta el JSON antes de salir.");
    }
  }, [entradas]);

  const semana = weekStart(dia);
  const diasSemana = Array.from({ length: 7 }, (_, i) => shiftDay(semana, i));

  function abrirDia(fecha: string) {
    setDia(fecha);
    setVista("dia");
    setDraft(null);
    setError("");
  }

  function nuevo(fecha: string, franja: Franja, inicio = "", fin = "") {
    setDraft({ id: null, fecha, franja, inicio, fin, categoria: null, texto: "", hecho: false });
    setError("");
    setVista("dia");
    setDia(fecha);
  }

  function guardar() {
    if (!draft) return;
    if (!draft.categoria && !draft.texto.trim()) {
      setError("Elige una categoría o escribe un texto.");
      return;
    }
    if (draft.franja === "hora" && (!draft.inicio || !draft.fin || draft.fin <= draft.inicio)) {
      setError("Indica una hora de inicio y una hora de fin posterior.");
      return;
    }
    const entry: Entry = {
      id: draft.id ?? uid(),
      fecha: draft.fecha,
      franja: draft.franja,
      inicio: draft.franja === "hora" ? draft.inicio : null,
      fin: draft.franja === "hora" ? draft.fin : null,
      categoria: draft.categoria,
      texto: draft.texto.trim(),
      hecho: draft.hecho,
    };
    setEntradas((list) => draft.id ? list.map((item) => item.id === draft.id ? entry : item) : [...list, entry]);
    setDraft(null);
    setError("");
  }

  function exportar() {
    setIo(JSON.stringify({ entradas }, null, 1));
    setIoMsg("JSON listo: cópialo para llevarlo a otro dispositivo.");
  }

  function importar() {
    try {
      const parsed = JSON.parse(io) as { entradas?: unknown };
      const list = normalize(Array.isArray(parsed) ? parsed : parsed.entradas);
      setEntradas(list);
      setIoMsg("Entradas importadas. La agenda original no se ha tocado.");
    } catch {
      setIoMsg("El texto no es un JSON válido de esta agenda.");
    }
  }

  const citasDia = (fecha: string) => agenda.citas.filter((cita) => cita.fecha === fecha);
  const miasDia = (fecha: string) => entradas.filter((item) => item.fecha === fecha);

  return (
    <section>
      <div className="kicker">{agenda.fuente}</div>
      <h2>Tu semana</h2>
      <p className="lead">Las citas que ya venían en la agenda se ven junto a las tuyas y no se pueden editar. Lo que añadas empieza como no hecho.</p>
      {aviso ? <p className="callout">{aviso}</p> : null}
      <div className="subtabs" style={{ marginTop: 14 }}>
        {([
          ["semana", "Semana"],
          ["dia", "Día"],
          ["lista", "Lista"],
        ] as const).map(([id, label]) => (
          <button key={id} className="subtab" aria-selected={vista === id} onClick={() => setVista(id)}>{label}</button>
        ))}
      </div>

      {vista === "semana" ? (
        <div>
          <div className="nav">
            <button className="tap" onClick={() => setDia(shiftDay(semana, -7))} aria-label="Semana anterior">‹</button>
            <div className="grow">{shortDay(diasSemana[0])} – {shortDay(diasSemana[6])}</div>
            <button className="tap" onClick={() => setDia(shiftDay(semana, 7))} aria-label="Semana siguiente">›</button>
          </div>
          <button className="tap" onClick={() => setDia(props.hoy)}>Hoy</button>
          <div className="week">
            {diasSemana.map((fecha) => (
              <article key={fecha} className={`card week-day${fecha === props.hoy ? " is-today" : ""}`}>
                <button className="day-jump" onClick={() => abrirDia(fecha)}>
                  <span>{formatDay(fecha)}</span>
                  {fecha === props.hoy ? <span className="hoy-tag">Hoy</span> : null}
                </button>
                {enViaje(fecha) ? <p className="note">{VIAJE.motivo}</p> : null}
                {FRANJAS.map((franja) => {
                  const fijas = citasDia(fecha).filter((cita) => franjaDe(cita.hora) === franja.id);
                  const propias = miasDia(fecha).filter((item) => item.franja === franja.id);
                  return (
                    <div key={franja.id} className="slot-line">
                      <span className="slot-name">{franja.label}</span>
                      {fijas.map((cita) => <span key={cita.titulo} className="chip readonly">{cita.titulo}</span>)}
                      {propias.map((item) => <ItemChip key={item.id} item={item} />)}
                      {fijas.length + propias.length === 0 ? <span className="empty-slot">Libre</span> : null}
                    </div>
                  );
                })}
                {miasDia(fecha).filter((item) => item.franja === "hora").map((item) => <ItemChip key={item.id} item={item} />)}
                {citasDia(fecha).filter((cita) => franjaDe(cita.hora) === "sin-hora").map((cita) => <span key={cita.titulo} className="chip readonly">{cita.titulo}</span>)}
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {vista === "dia" ? (
        <Dia
          fecha={dia}
          hoy={props.hoy}
          citas={citasDia(dia)}
          entradas={miasDia(dia)}
          draft={draft}
          error={error}
          borrar={borrar}
          onPrev={() => setDia(shiftDay(dia, -1))}
          onNext={() => setDia(shiftDay(dia, 1))}
          onHoy={() => setDia(props.hoy)}
          onNuevo={nuevo}
          onEdit={(item) => {
            setDraft({
              id: item.id,
              fecha: item.fecha,
              franja: item.franja,
              inicio: item.inicio ?? "",
              fin: item.fin ?? "",
              categoria: item.categoria,
              texto: item.texto,
              hecho: item.hecho,
            });
            setError("");
          }}
          onToggle={(id) => setEntradas((list) => list.map((item) => item.id === id ? { ...item, hecho: !item.hecho } : item))}
          onAskDelete={setBorrar}
          onDelete={(id) => {
            setEntradas((list) => list.filter((item) => item.id !== id));
            setBorrar(null);
            if (draft?.id === id) setDraft(null);
          }}
          onDraft={setDraft}
          onSave={guardar}
          onCancel={() => { setDraft(null); setError(""); }}
        />
      ) : null}

      {vista === "lista" ? (
        <Lista entradas={entradas} hoy={props.hoy} onOpen={abrirDia} />
      ) : null}

      <div className="kicker">Copia de tus entradas</div>
      <article className="card">
        <p className="note">Se guardan en este navegador. Exporta el JSON para pasarlas a otro dispositivo. La agenda importada no entra en el archivo.</p>
        <div className="actions">
          <button className="tap primary" onClick={exportar}>Exportar JSON</button>
          <button className="tap" onClick={importar}>Importar JSON</button>
        </div>
        {ioMsg ? <p className="note">{ioMsg}</p> : null}
        <textarea className="field area" value={io} onChange={(event) => setIo(event.target.value)} placeholder="Pega aquí un JSON exportado, o pulsa Exportar." />
      </article>
    </section>
  );
}

function ItemChip(props: { item: Entry }) {
  const cat = catOf(props.item.categoria);
  const label = props.item.texto || cat?.label || "Nota";
  return (
    <span className="chip" style={{ background: cat?.bg ?? "#fff", color: cat?.color ?? "#1E2B27", opacity: props.item.hecho ? 0.55 : 1 }}>
      {cat ? `${cat.emoji} ` : ""}{label}{props.item.hecho ? " · Hecha" : " · No hecha"}
      {props.item.franja === "hora" && props.item.inicio && props.item.fin ? ` · ${props.item.inicio}–${props.item.fin}` : ""}
    </span>
  );
}

function Dia(props: {
  fecha: string;
  hoy: string;
  citas: typeof agenda.citas;
  entradas: Entry[];
  draft: Draft | null;
  error: string;
  borrar: string | null;
  onPrev: () => void;
  onNext: () => void;
  onHoy: () => void;
  onNuevo: (fecha: string, franja: Franja, inicio?: string, fin?: string) => void;
  onEdit: (item: Entry) => void;
  onToggle: (id: string) => void;
  onAskDelete: (id: string | null) => void;
  onDelete: (id: string) => void;
  onDraft: (draft: Draft) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const sinHora = props.citas.filter((cita) => franjaDe(cita.hora) === "sin-hora");
  const customKeys = [...new Set(props.entradas.filter((item) => item.franja === "hora").map((item) => `${item.inicio}–${item.fin}`))].sort();
  return (
    <div>
      <div className="nav">
        <button className="tap" onClick={props.onPrev} aria-label="Día anterior">‹</button>
        <div className="grow">{formatDay(props.fecha)}{props.fecha === props.hoy ? " · Hoy" : ""}</div>
        <button className="tap" onClick={props.onNext} aria-label="Día siguiente">›</button>
      </div>
      <button className="tap" onClick={props.onHoy}>Hoy</button>
      {enViaje(props.fecha) ? <p className="callout">{VIAJE.motivo}, del {formatDay(VIAJE.desde, false)} al {formatDay(VIAJE.hasta, false)}.</p> : null}
      {FRANJAS.map((franja) => (
        <Slot
          key={franja.id}
          title={franja.label}
          citas={props.citas.filter((cita) => franjaDe(cita.hora) === franja.id)}
          entradas={props.entradas.filter((item) => item.franja === franja.id)}
          draft={props.draft && props.draft.fecha === props.fecha && props.draft.franja === franja.id ? props.draft : null}
          error={props.error}
          borrar={props.borrar}
          onAdd={() => props.onNuevo(props.fecha, franja.id)}
          onEdit={props.onEdit}
          onToggle={props.onToggle}
          onAskDelete={props.onAskDelete}
          onDelete={props.onDelete}
          onDraft={props.onDraft}
          onSave={props.onSave}
          onCancel={props.onCancel}
        />
      ))}
      {customKeys.map((key) => {
        const [inicio, fin] = key.split("–");
        return (
          <Slot
            key={key}
            title={`${inicio}–${fin}`}
            citas={[]}
            entradas={props.entradas.filter((item) => item.franja === "hora" && item.inicio === inicio && item.fin === fin)}
            draft={props.draft && props.draft.franja === "hora" && props.draft.inicio === inicio && props.draft.fin === fin ? props.draft : null}
            error={props.error}
            borrar={props.borrar}
            onAdd={() => props.onNuevo(props.fecha, "hora", inicio, fin)}
            onEdit={props.onEdit}
            onToggle={props.onToggle}
            onAskDelete={props.onAskDelete}
            onDelete={props.onDelete}
            onDraft={props.onDraft}
            onSave={props.onSave}
            onCancel={props.onCancel}
          />
        );
      })}
      {sinHora.length > 0 ? (
        <div className="slot">
          <h3>Sin hora</h3>
          {sinHora.map((cita) => <CitaFija key={cita.titulo} cita={cita} />)}
        </div>
      ) : null}
      <div className="slot">
        <h3>Otro horario</h3>
        <p className="note">Añade un tramo con hora de inicio y de fin.</p>
        {props.draft && props.draft.franja === "hora" && !props.draft.id && !customKeys.includes(`${props.draft.inicio}–${props.draft.fin}`) ? (
          <EntryForm draft={props.draft} error={props.error} showTime onDraft={props.onDraft} onSave={props.onSave} onCancel={props.onCancel} />
        ) : (
          <button className="tap primary" onClick={() => props.onNuevo(props.fecha, "hora")}>Añadir horario</button>
        )}
      </div>
    </div>
  );
}

function Slot(props: {
  title: string;
  citas: typeof agenda.citas;
  entradas: Entry[];
  draft: Draft | null;
  error: string;
  borrar: string | null;
  onAdd: () => void;
  onEdit: (item: Entry) => void;
  onToggle: (id: string) => void;
  onAskDelete: (id: string | null) => void;
  onDelete: (id: string) => void;
  onDraft: (draft: Draft) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="slot">
      <h3>{props.title}</h3>
      {props.citas.map((cita) => <CitaFija key={`${cita.titulo}-${cita.hora}`} cita={cita} />)}
      {props.entradas.map((item) => props.draft?.id === item.id ? (
        <EntryForm key={item.id} draft={props.draft} error={props.error} showTime={props.draft.franja === "hora"} onDraft={props.onDraft} onSave={props.onSave} onCancel={props.onCancel} />
      ) : (
        <Entrada
          key={item.id}
          item={item}
          confirmar={props.borrar === item.id}
          onToggle={() => props.onToggle(item.id)}
          onEdit={() => props.onEdit(item)}
          onAskDelete={() => props.onAskDelete(props.borrar === item.id ? null : item.id)}
          onDelete={() => props.onDelete(item.id)}
        />
      ))}
      {props.draft && !props.draft.id ? (
        <EntryForm draft={props.draft} error={props.error} showTime={props.draft.franja === "hora"} onDraft={props.onDraft} onSave={props.onSave} onCancel={props.onCancel} />
      ) : (
        <button className="tap" onClick={props.onAdd}>Añadir</button>
      )}
    </div>
  );
}

function CitaFija(props: { cita: (typeof agenda.citas)[number] }) {
  const cita = props.cita;
  return (
    <article className="card readonly-card">
      <h3>{cita.titulo}</h3>
      <div className="meta">
        <span>Agenda · solo lectura</span>
        <span>{TIPO[cita.tipo] ?? cita.tipo}</span>
        <span>Hora: {pend(cita.hora)}</span>
        <span>Lugar: {pend(cita.lugar)}</span>
      </div>
      {cita.nota ? <p className="note">{cita.nota}</p> : null}
    </article>
  );
}

function Entrada(props: {
  item: Entry;
  confirmar: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onAskDelete: () => void;
  onDelete: () => void;
}) {
  const cat = catOf(props.item.categoria);
  return (
    <article className="card own-card" style={{ borderLeftColor: cat?.color ?? "#C8BBA8", background: cat?.bg ?? "#fff" }}>
      <button className={`tap ${props.item.hecho ? "done-on" : "done-off"}`} aria-pressed={props.item.hecho} onClick={props.onToggle}>
        {props.item.hecho ? "Hecha" : "No hecha"}
      </button>
      <h3>{cat ? `${cat.emoji} ${cat.label}` : "Nota"}</h3>
      {props.item.texto ? <p className="note">{props.item.texto}</p> : null}
      <div className="actions">
        <button className="tap" onClick={props.onEdit}>Editar</button>
        {props.confirmar ? (
          <button className="tap danger" onClick={props.onDelete}>Confirmar borrado</button>
        ) : (
          <button className="tap" onClick={props.onAskDelete}>Borrar</button>
        )}
      </div>
    </article>
  );
}

function EntryForm(props: {
  draft: Draft;
  error: string;
  showTime: boolean;
  onDraft: (draft: Draft) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const draft = props.draft;
  return (
    <div className="form">
      {props.showTime ? (
        <div className="time-row">
          <label>Inicio
            <input className="field" type="time" value={draft.inicio} onChange={(event) => props.onDraft({ ...draft, inicio: event.target.value })} />
          </label>
          <label>Fin
            <input className="field" type="time" value={draft.fin} onChange={(event) => props.onDraft({ ...draft, fin: event.target.value })} />
          </label>
        </div>
      ) : null}
      <div className="cats" role="group" aria-label="Categoría">
        {CATS.map((cat) => {
          const on = draft.categoria === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              className="cat"
              aria-pressed={on}
              style={{ background: cat.bg, color: cat.color, borderColor: on ? cat.color : "transparent" }}
              onClick={() => props.onDraft({ ...draft, categoria: on ? null : cat.id })}
            >
              {cat.emoji} {cat.label}
            </button>
          );
        })}
      </div>
      <label className="block-label">Texto libre
        <textarea className="field area" value={draft.texto} onChange={(event) => props.onDraft({ ...draft, texto: event.target.value })} placeholder="O escribe lo que quieras" />
      </label>
      <button type="button" className={`tap ${draft.hecho ? "done-on" : "done-off"}`} aria-pressed={draft.hecho} onClick={() => props.onDraft({ ...draft, hecho: !draft.hecho })}>
        {draft.hecho ? "Hecha" : "No hecha"}
      </button>
      {props.error ? <p className="note" style={{ color: "#8C3F2A" }}>{props.error}</p> : null}
      <div className="actions">
        <button className="tap primary" onClick={props.onSave}>Guardar</button>
        <button className="tap" onClick={props.onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

function Lista(props: { entradas: Entry[]; hoy: string; onOpen: (fecha: string) => void }) {
  const fechas = [...new Set([...agenda.citas.map((cita) => cita.fecha), ...props.entradas.map((item) => item.fecha)])].sort();
  return (
    <div>
      <p className="callout">{agenda.aviso}</p>
      {fechas.map((fecha) => (
        <div key={fecha}>
          <div className="day-head">
            <h3>{formatDay(fecha)}</h3>
            {fecha === props.hoy ? <span className="hoy-tag">Hoy</span> : null}
          </div>
          <div className="grid">
            {agenda.citas.filter((cita) => cita.fecha === fecha).map((cita) => <CitaFija key={`${cita.titulo}-${cita.hora}`} cita={cita} />)}
            {props.entradas.filter((item) => item.fecha === fecha).map((item) => {
              const cat = catOf(item.categoria);
              return (
                <button key={item.id} className="card own-card jump" style={{ borderLeftColor: cat?.color ?? "#C8BBA8", background: cat?.bg ?? "#fff" }} onClick={() => props.onOpen(fecha)}>
                  <strong>{cat ? `${cat.emoji} ${cat.label}` : "Nota"} · {item.hecho ? "Hecha" : "No hecha"}</strong>
                  {item.texto ? <span className="note">{item.texto}</span> : null}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <div className="kicker">Sin fecha</div>
      <div className="grid">
        {agenda.pendientes_sin_fecha.map((item) => (
          <article key={item.titulo} className="card">
            <h3>{item.titulo}</h3>
            <div className="meta"><span>{TIPO[item.tipo] ?? item.tipo}</span><span>Pendiente</span></div>
            <p className="note">{item.nota}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
