import { useEffect, useRef, useState } from "react";
import { AGENDA_FILAS, HORAS_OPCIONES, LABORABLES, conCelda, conHoras, etiquetaHoras, filaDe, horasDe, parseHoras, parseWeekGrid, semanaGuardada, sugerido, textoVisible, totalHoras, weekStorageKey, type DiaId, type FilaId, type Horas, type HorasMap, type PlanItem, type WeekGrid } from "./agendaGrid";
import { useSync } from "./cloud";
import { shiftDay, shortDay, weekStart } from "./dates";
import { getAgenda, getCultura, getDeporte, getIngles } from "./liveContent";

function planDeLaSemana(fechas: Set<string>): PlanItem[] {
  const items: PlanItem[] = [];
  const add = (fecha: string | null | undefined, fila: FilaId | "cultura", texto: string) => {
    if (!fecha || !fechas.has(fecha) || !texto.trim() || fila === "cultura") return;
    items.push({ fecha, fila, texto: texto.trim() });
  };
  for (const cita of getAgenda().citas) add(cita.fecha, filaDe(cita.tipo), [cita.hora, cita.titulo].filter(Boolean).join(" · "));
  const deporte = getDeporte();
  for (const run of deporte.running.octubre_2026.no_hechas) add(run.fecha, "deporte", run.plan);
  for (const run of deporte.running.noviembre_2026.plan) add(run.fecha, "deporte", [run.km + " km", run.tipo].filter(Boolean).join(" · "));
  for (const run of [...deporte.running.octubre_2026.registros, ...deporte.running.noviembre_2026.registros]) {
    const bits = [run.km != null ? run.km.toLocaleString("es-ES", { maximumFractionDigits: 2 }) + " km" : "", "tiempo" in run ? run.tiempo : "", run.nota].filter(Boolean);
    add(run.fecha, "deporte", bits.join(" · "));
  }
  for (const sesion of deporte.gimnasio.planificadas_noviembre.sesiones) add(sesion.fecha, "deporte", sesion.contenido);
  for (const sesion of deporte.gimnasio.no_hechas) add(sesion.fecha, "deporte", sesion.plan);
  for (const clase of getIngles().clases_programadas) add(clase.fecha, "ingles", [clase.hora, clase.profesor, clase.destreza].filter(Boolean).join(" · "));
  for (const pieza of getCultura()) add(pieza.fecha, "cultura", pieza.titulo);
  return items;
}

export function Planner(props: { hoy: string }) {
  const sync = useSync();
  const [anchor, setAnchor] = useState(props.hoy);
  const monday = weekStart(anchor);
  const key = weekStorageKey(monday);
  const days = LABORABLES.map((dia, index) => ({ ...dia, fecha: shiftDay(monday, index) }));
  const [grid, setGrid] = useState<WeekGrid>({});
  const [horas, setHoras] = useState<HorasMap>({});
  const horasRef = useRef<HorasMap>({});
  const gridRef = useRef<WeekGrid>({});
  const [ready, setReady] = useState(false);
  const edited = useRef(false);

  useEffect(() => {
    edited.current = false;
    setReady(false);
    setGrid({});
    setHoras({});
    gridRef.current = {};
    horasRef.current = {};
    const offKey = sync.onKey(key, (value) => {
      if (!edited.current) {
        const next = parseWeekGrid(value);
        const hours = parseHoras(value);
        gridRef.current = next;
        horasRef.current = hours;
        setGrid(next);
        setHoras(hours);
      }
      setReady(true);
    });
    const offReady = sync.onReady(() => setReady(true));
    return () => { offKey(); offReady(); };
  }, [key, sync]);

  function publish(nextGrid: WeekGrid, nextHoras: HorasMap) {
    gridRef.current = nextGrid;
    horasRef.current = nextHoras;
    sync.push(key, semanaGuardada(nextGrid, nextHoras));
  }

  function edit(fila: FilaId, dia: DiaId, texto: string) {
    edited.current = true;
    setGrid((current) => {
      const next = conCelda(current, fila, dia, texto);
      publish(next, horasRef.current);
      return next;
    });
  }

  function elegirHoras(fila: FilaId, dia: DiaId, value: Horas) {
    edited.current = true;
    setHoras((current) => {
      const next = conHoras(current, fila, dia, value);
      publish(gridRef.current, next);
      return next;
    });
  }

  const fechas = new Set(days.map((dia) => dia.fecha));
  const planes = planDeLaSemana(fechas);

  return (
    <section>
      <div className="kicker">Agenda</div>
      <h2>Tu semana</h2>
      <div className="nav agenda-nav">
        <button className="tap" type="button" onClick={() => setAnchor(shiftDay(monday, -7))} aria-label="Semana anterior">◀</button>
        <div className="grow">Semana del {shortDay(monday)}</div>
        <button className="tap" type="button" onClick={() => setAnchor(props.hoy)}>Hoy</button>
        <button className="tap" type="button" onClick={() => setAnchor(shiftDay(monday, 7))} aria-label="Semana siguiente">▶</button>
      </div>
      <div className="org-scroll agenda-scroll">
        <table className="org-table agenda-table">
          <thead>
            <tr>
              <th className="org-jefe">Día</th>
              {AGENDA_FILAS.map((fila) => (
                <th key={fila.id}>
                  <span className="org-chip agenda-head"><span aria-hidden="true">{fila.icono}</span><span>{fila.nombre}</span></span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((dia) => (
              <tr key={dia.id} className={dia.fecha === props.hoy ? "hoy" : ""}>
                <th className="org-jefe" scope="row">
                  <span className="agenda-day">{dia.label}</span>
                  <span className="org-date">{shortDay(dia.fecha)}</span>
                </th>
                {AGENDA_FILAS.map((fila) => {
                  const propuesto = sugerido(planes, dia.fecha, fila.id);
                  const valor = textoVisible(grid, fila.id, dia.id, propuesto);
                  const hours = horasDe(horas, fila.id, dia.id);
                  const activo = hours > 0;
                  return (
                    <td key={fila.id} className={activo ? "hecho" : ""}>
                      <div className="agenda-cell">
                        <textarea
                          className={activo ? "org-cell done-text" : "org-cell"}
                          aria-label={dia.label + ", " + fila.nombre}
                          rows={2}
                          value={valor}
                          disabled={!ready}
                          placeholder="—"
                          onChange={(event) => edit(fila.id, dia.id, event.target.value)}
                        />
                        <select
                          className={activo ? "agenda-horas on" : "agenda-horas"}
                          aria-label={"Horas de " + fila.nombre + ", " + dia.label}
                          value={String(hours)}
                          disabled={!ready}
                          onChange={(event) => elegirHoras(fila.id, dia.id, Number(event.target.value) as Horas)}
                        >
                          {HORAS_OPCIONES.map((opcion) => <option key={opcion} value={String(opcion)}>{etiquetaHoras(opcion)}</option>)}
                        </select>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalHoras(horas) > 0 ? <p className="agenda-total">Esta semana: {totalHoras(horas).toLocaleString("es-ES", { maximumFractionDigits: 1 })} h</p> : null}
    </section>
  );
}
