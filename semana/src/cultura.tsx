import { useEffect, useState } from "react";
import seedData from "../data/cultura.json";
import { formatDay } from "./dates";

const KEY = "semana-cultura-v1";

export const TIPOS = [
  { id: "museo", emoji: "🏛️", label: "Museo / exposición" },
  { id: "pelicula", emoji: "🎬", label: "Película" },
  { id: "serie", emoji: "📺", label: "Serie" },
  { id: "restaurante", emoji: "🍽️", label: "Restaurante" },
  { id: "teatro", emoji: "🎭", label: "Teatro" },
  { id: "libro", emoji: "📚", label: "Libro" },
  { id: "concierto", emoji: "🎵", label: "Concierto / música" },
  { id: "podcast", emoji: "🎙️", label: "Podcast" },
  { id: "otro", emoji: "📌", label: "Otro" },
] as const;

export type TipoCultura = (typeof TIPOS)[number]["id"];

export type Propuesta = {
  id: string;
  titulo: string;
  tipo: TipoCultura;
  detalle: string;
  lugar: string;
  fecha: string;
  enlace: string;
};

type Saved = { hechos: string[]; ocultas: string[]; propias: Propuesta[] };

const VACIO: Saved = { hechos: [], ocultas: [], propias: [] };

function norm(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function tipoDe(value: unknown): TipoCultura {
  const s = norm(String(value ?? ""));
  if (s.includes("museo") || s.includes("expos")) return "museo";
  if (s.includes("pelicula") || s.includes("cine")) return "pelicula";
  if (s.includes("serie")) return "serie";
  if (s.includes("restaur")) return "restaurante";
  if (s.includes("teatro")) return "teatro";
  if (s.includes("libro")) return "libro";
  if (s.includes("conciert") || s.includes("music")) return "concierto";
  if (s.includes("podcast")) return "podcast";
  if (s === "otro" || s.includes("otro")) return "otro";
  for (const tipo of TIPOS) if (s === tipo.id) return tipo.id;
  return "otro";
}

export function emojiDe(tipo: TipoCultura): string {
  return TIPOS.find((item) => item.id === tipo)?.emoji ?? "📌";
}

function texto(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function cruda(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    for (const key of ["propuestas", "items", "cultura"]) {
      if (Array.isArray(obj[key])) return obj[key];
    }
  }
  return [];
}

function slug(value: string): string {
  return norm(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "sin-titulo";
}

export function seedPropuestas(data: unknown = seedData): Propuesta[] {
  const out: Propuesta[] = [];
  cruda(data).forEach((item, index) => {
    if (!item || typeof item !== "object") return;
    const row = item as Record<string, unknown>;
    const titulo = texto(row.titulo ?? row.title ?? row.nombre);
    if (!titulo) return;
    const idDado = texto(row.id);
    out.push({
      id: "seed:" + (idDado || `${index}:${slug(titulo)}`),
      titulo,
      tipo: tipoDe(row.tipo ?? row.type ?? row.categoria),
      detalle: texto(row.detalle ?? row.detail ?? row.descripcion ?? row.nota),
      lugar: texto(row.lugar ?? row.sitio ?? row.donde),
      fecha: texto(row.fecha ?? row.date ?? row.cuando),
      enlace: texto(row.enlace ?? row.url ?? row.link),
    });
  });
  return out;
}

function propuestaGuardada(value: unknown): Propuesta | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const id = texto(row.id);
  const titulo = texto(row.titulo);
  if (!id.startsWith("propia:") || !titulo) return null;
  return {
    id,
    titulo,
    tipo: tipoDe(row.tipo),
    detalle: texto(row.detalle),
    lugar: texto(row.lugar),
    fecha: texto(row.fecha),
    enlace: texto(row.enlace),
  };
}

function loadSaved(): Saved {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== "object") return VACIO;
    const obj = parsed as Record<string, unknown>;
    const strings = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
    const propias = Array.isArray(obj.propias) ? obj.propias.map(propuestaGuardada).filter((item): item is Propuesta => item !== null) : [];
    return { hechos: strings(obj.hechos), ocultas: strings(obj.ocultas), propias };
  } catch {
    return VACIO;
  }
}

function enlaceSeguro(value: string): string {
  const limpio = value.trim();
  if (!limpio || /\s/.test(limpio)) return "";
  if (/^https?:\/\//i.test(limpio)) return limpio;
  if (/^[a-z0-9.-]+\.[a-z]{2,}([/?#].*)?$/i.test(limpio)) return "https://" + limpio;
  return "";
}

function fechaVisible(value: string): string {
  const iso = value.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso) && value.trim() === iso) return formatDay(iso);
  return value;
}

export function Cultura() {
  const [saved, setSaved] = useState<Saved>(loadSaved);
  const [filtro, setFiltro] = useState<"pendiente" | "hecho">("pendiente");
  const [form, setForm] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState<TipoCultura | "">("");
  const [detalle, setDetalle] = useState("");
  const [enlace, setEnlace] = useState("");
  const [borrar, setBorrar] = useState<string | null>(null);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch { /* sin almacenamiento */ }
  }, [saved]);

  const semillas = seedPropuestas().filter((item) => !saved.ocultas.includes(item.id));
  const todas = [...semillas, ...saved.propias];
  const hecha = (id: string) => saved.hechos.includes(id);
  const pendientes = todas.filter((item) => !hecha(item.id));
  const hechas = todas.filter((item) => hecha(item.id));
  const lista = filtro === "hecho" ? hechas : pendientes;

  const toggle = (id: string) => setSaved((prev) => ({
    ...prev,
    hechos: prev.hechos.includes(id) ? prev.hechos.filter((item) => item !== id) : [...prev.hechos, id],
  }));

  const eliminar = (item: Propuesta) => setSaved((prev) => ({
    hechos: prev.hechos.filter((id) => id !== item.id),
    ocultas: item.id.startsWith("seed:") && !prev.ocultas.includes(item.id) ? [...prev.ocultas, item.id] : prev.ocultas,
    propias: prev.propias.filter((propia) => propia.id !== item.id),
  }));

  const agregar = () => {
    const nombre = titulo.trim();
    if (!nombre || !tipo) return;
    const propia: Propuesta = {
      id: "propia:" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      titulo: nombre,
      tipo,
      detalle: detalle.trim(),
      lugar: "",
      fecha: "",
      enlace: enlace.trim(),
    };
    setSaved((prev) => ({ ...prev, propias: [...prev.propias, propia] }));
    setTitulo("");
    setTipo("");
    setDetalle("");
    setEnlace("");
    setForm(false);
    setFiltro("pendiente");
  };

  return (
    <section>
      <div className="kicker">Don Ateneo</div>
      <h2>Cultura</h2>
      <p className="lead">Las propuestas que te manda por email. Pendiente es lo que aún no has hecho.</p>
      <div className="cult-filters" role="group" aria-label="Filtrar propuestas">
        <button type="button" className="cult-filter" aria-pressed={filtro === "pendiente"} onClick={() => setFiltro("pendiente")}>
          Pendiente <span>{pendientes.length}</span>
        </button>
        <button type="button" className="cult-filter" aria-pressed={filtro === "hecho"} onClick={() => setFiltro("hecho")}>
          Hecho <span>{hechas.length}</span>
        </button>
      </div>
      <button type="button" className="tap primary cult-add" onClick={() => setForm((on) => !on)}>{form ? "Cerrar" : "+ Añadir"}</button>
      {form ? (
        <form className="card cult-form" onSubmit={(event) => { event.preventDefault(); agregar(); }}>
          <label>Título
            <input value={titulo} onChange={(event) => setTitulo(event.target.value)} required />
          </label>
          <label>Tipo
            <select aria-label="Tipo" value={tipo} onChange={(event) => setTipo(event.target.value as TipoCultura | "")} required>
              <option value="">Elige el tipo</option>
              {TIPOS.map((item) => <option key={item.id} value={item.id}>{item.emoji} {item.label}</option>)}
            </select>
          </label>
          <label>Detalle
            <textarea value={detalle} onChange={(event) => setDetalle(event.target.value)} rows={3} />
          </label>
          <label>Enlace
            <input value={enlace} onChange={(event) => setEnlace(event.target.value)} inputMode="url" placeholder="https://" />
          </label>
          <button type="submit" className="tap primary">Guardar propuesta</button>
        </form>
      ) : null}
      {lista.length === 0 ? <p className="empty cult-empty">{filtro === "hecho" ? "Ninguna propuesta marcada como hecha." : "No hay propuestas pendientes."}</p> : null}
      <div className="grid">
        {lista.map((item) => {
          const url = enlaceSeguro(item.enlace);
          const hecho = hecha(item.id);
          return (
            <article key={item.id} className="card cult-card">
              <div className="cult-title">
                <span className="cult-ico" aria-hidden="true">{emojiDe(item.tipo)}</span>
                <h3>{item.titulo}</h3>
              </div>
              {item.detalle ? <p className="cult-detalle">{item.detalle}</p> : null}
              {(item.lugar || item.fecha) ? (
                <div className="meta">
                  {item.lugar ? <span>{item.lugar}</span> : null}
                  {item.fecha ? <span>{fechaVisible(item.fecha)}</span> : null}
                </div>
              ) : null}
              {url ? <a className="cult-link" href={url} target="_blank" rel="noopener noreferrer">{url}</a> : null}
              <div className="cult-actions">
                <button type="button" className={hecho ? "tap done-on" : "tap done-off"} aria-pressed={hecho} onClick={() => toggle(item.id)}>
                  {hecho ? "Hecho" : "Pendiente"}
                </button>
                {borrar === item.id ? (
                  <div className="cult-confirm" id={"borra-" + item.id}>
                    <p>¿Eliminar «{item.titulo}»?</p>
                    <button type="button" className="tap danger" onClick={() => { eliminar(item); setBorrar(null); }}>Eliminar</button>
                    <button type="button" className="tap" onClick={() => setBorrar(null)}>Cancelar</button>
                  </div>
                ) : (
                  <button type="button" className="tap danger" onClick={() => setBorrar(item.id)}>Eliminar</button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
