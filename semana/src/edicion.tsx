import type { ReactNode } from "react";
import { formatDay, madridToday, shiftDay } from "./dates";
import type { CulturaDia, CulturaPropuestaDia } from "./liveContent";
import { emojiDe, tipoDe, type Propuesta } from "./cultura";

function seguro(value: string): string {
  const limpio = value.trim();
  if (/^https:\/\/\S+$/i.test(limpio)) return limpio;
  return "";
}

function slug(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "propuesta";
}

export function idDePropuesta(fecha: string, titulo: string, index: number, titulos: string[]): string {
  const base = slug(titulo);
  const repetida = titulos.filter((item) => slug(item) === base).length > 1;
  return "propia:ateneo:" + fecha + ":" + base + (repetida ? "-" + index : "");
}

export function propuestaDeEdicion(dia: CulturaDia, item: CulturaPropuestaDia, index: number): Propuesta {
  const historia = item.historia || item.descripcion;
  const extra = [item.horario ? "Horario: " + item.horario : "", item.precio ? "Precio: " + item.precio : ""].filter(Boolean);
  return {
    id: idDePropuesta(dia.fecha, item.titulo, index, dia.propuestas.map((row) => row.titulo)),
    titulo: item.titulo,
    tipo: tipoDe(item.tipo),
    detalle: [historia, ...extra].filter(Boolean).join("\n"),
    lugar: item.lugar,
    fecha: dia.fecha,
    enlace: item.enlace,
  };
}

function trozos(text: string, key: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\(https:\/\/[^)\s]+\)|https:\/\/[^\s]+)/g);
  return parts.map((part, index) => {
    const id = key + "-" + index;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={id}>{part.slice(2, -2)}</strong>;
    const link = part.match(/^\[([^\]]+)\]\((https:\/\/[^)\s]+)\)$/);
    if (link) return <a key={id} href={link[2]} target="_blank" rel="noopener noreferrer">{link[1]}</a>;
    if (/^https:\/\/\S+$/.test(part)) return <a key={id} href={part} target="_blank" rel="noopener noreferrer">{part}</a>;
    const lines = part.split("\n");
    return lines.map((line, lineIndex) => <span key={id + "-" + lineIndex}>{line}{lineIndex < lines.length - 1 ? <br /> : null}</span>);
  });
}

export function TextoRico(props: { text: string }) {
  const blocks = props.text.replace(/\r\n/g, "\n").split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  return (
    <div className="edition-text">
      {blocks.map((block, index) => {
        const lines = block.split("\n");
        if (lines.every((line) => line.startsWith("- "))) {
          return <ul key={index}>{lines.map((line, lineIndex) => <li key={lineIndex}>{trozos(line.slice(2), index + "-" + lineIndex)}</li>)}</ul>;
        }
        return <p key={index}>{trozos(block, String(index))}</p>;
      })}
    </div>
  );
}

export function Edicion(props: {
  dia: string;
  ediciones: CulturaDia[];
  anadidas: Set<string>;
  onDia: (dia: string) => void;
  onAdd: (item: Propuesta) => void;
}) {
  const hoy = madridToday();
  const delDia = props.ediciones.filter((item) => item.fecha === props.dia);
  return (
    <div>
      <div className="nav edition-nav">
        <button className="tap" type="button" aria-label="Día anterior" onClick={() => props.onDia(shiftDay(props.dia, -1))}>‹</button>
        <label className="grow edition-date">
          {formatDay(props.dia)}
          <input type="date" aria-label="Elegir día" value={props.dia} onChange={(event) => event.target.value && props.onDia(event.target.value)} />
        </label>
        <button className="tap" type="button" aria-label="Día siguiente" onClick={() => props.onDia(shiftDay(props.dia, 1))}>›</button>
      </div>
      {props.dia !== hoy ? <button className="tap" type="button" onClick={() => props.onDia(hoy)}>Hoy</button> : null}
      {delDia.length === 0 ? (
        <article className="edition-cover">
          <p className="edition-kicker">Don Ateneo</p>
          <h2>{props.dia === hoy ? "La edición de hoy todavía no ha llegado" : "No hay edición este día"}</h2>
          <p>Cuando Don Ateneo publique el día, la carta, las historias y las propuestas aparecerán aquí.</p>
        </article>
      ) : delDia.map((edicion) => (
        <article key={edicion.id} className="edition">
          <header className="edition-cover">
            <p className="edition-kicker">Edición de Don Ateneo</p>
            <h2>{edicion.titulo || "La carta del día"}</h2>
            <p>{formatDay(edicion.fecha)}</p>
          </header>
          {edicion.intro ? <TextoRico text={edicion.intro} /> : null}
          {edicion.secciones.map((seccion, index) => {
            const imagen = seguro(seccion.imagen);
            const enlace = seguro(seccion.enlace);
            return (
              <section key={index} className="edition-section">
                {seccion.titulo ? <h3>{seccion.titulo}</h3> : null}
                {imagen ? <figure className="edition-figure"><img src={imagen} alt="" loading="lazy" /></figure> : null}
                {seccion.texto ? <TextoRico text={seccion.texto} /> : null}
                {enlace ? <a className="cult-link" href={enlace} target="_blank" rel="noopener noreferrer">{enlace}</a> : null}
              </section>
            );
          })}
          {edicion.propuestas.length > 0 ? <h3 className="edition-proposals-title">Propuestas</h3> : null}
          {edicion.propuestas.map((item, index) => {
            const guardada = propuestaDeEdicion(edicion, item, index);
            const anadida = props.anadidas.has(guardada.id);
            const enlace = seguro(item.enlace);
            const relato = item.historia || item.descripcion;
            return (
              <section key={guardada.id} className="edition-proposal">
                <div className="cult-title">
                  <span className="cult-ico" aria-hidden="true">{emojiDe(tipoDe(item.tipo))}</span>
                  <div>
                    <h3>{item.titulo}</h3>
                    <p className="edition-meta">{[item.tipo, item.lugar, item.horario, item.precio].filter(Boolean).join(" · ")}</p>
                  </div>
                </div>
                {relato ? <TextoRico text={relato} /> : null}
                {enlace ? <a className="cult-link" href={enlace} target="_blank" rel="noopener noreferrer">{enlace}</a> : null}
                <button type="button" className={anadida ? "tap done-on" : "tap primary"} disabled={anadida} onClick={() => props.onAdd(guardada)}>
                  {anadida ? "✓ Añadido" : "➕ Añadir"}
                </button>
              </section>
            );
          })}
        </article>
      ))}
    </div>
  );
}
