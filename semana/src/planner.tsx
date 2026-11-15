import { useEffect, useRef, useState } from "react";
import { AGENDA_FILAS, LABORABLES, conCelda, filaDe, parseWeekGrid, sugerido, textoVisible, weekStorageKey, type DiaId, type FilaId, type PlanItem, type WeekGrid } from "./agendaGrid";
import { useSync } from "./cloud";
import { shiftDay, shortDay, weekStart } from "./dates";
import { getAgenda, getCultura, getDeporte, getIngles } from "./liveContent";

function planDeLaSemana(fechas: Set<string>): PlanItem[] {
  const items: PlanItem[] = [];
  const add = (fecha: string | null | undefined, fila: FilaId, texto: string) => {
    if (!fecha || !fechas.has(fecha) || !texto.trim()) return;
    items.push({ fecha, fila, texto: texto.trim() });
  };
  for (const cita of getAgenda().citas) add(cita.fecha, filaDe(cita.tipo), [cita.hora, cita.titulo].filter(Boolean).join(" · "));
  const deporte = getDeporte();
  for (const run of deporte.running.octubre_2026.no_hechas) add(run.fecha, "run", run.plan);
  for (const run of deporte.running.noviembre_2026.plan) add(run.fecha, "run", [run.km + " km", run.tipo].filter(Boolean).join(" · "));
  for (const run of [...deporte.running.octubre_2026.registros, ...deporte.running.noviembre_2026.registros]) {
    const bits = [run.km != null ? run.km.toLocaleString("es-ES", { maximumFractionDigits: 2 }) + " km" : "", "tiempo" in run ? run.tiempo : "", run.nota].filter(Boolean);
    add(run.fecha, "run", bits.join(" · "));
  }
  for (const sesion of deporte.gimnasio.planificadas_noviembre.sesiones) add(sesion.fecha, "gimnasio", sesion.contenido);
  for (const sesion of deporte.gimnasio.no_hechas) add(sesion.fecha, "gimnasio", sesion.plan);
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
  const [ready, setReady] = useState(false);
  const edited = useRef(false);

  useEffect(() => {
    edited.current = false;
    setReady(false);
    setGrid({});
    const offKey = sync.onKey(key, (value) => {
      if (!edited.current) setGrid(parseWeekGrid(value));
      setReady(true);
    });
    const offReady = sync.onReady(() => setReady(true));
    return () => { offKey(); offReady(); };
  }, [key, sync]);

  function edit(fila: FilaId, dia: DiaId, texto: string) {
    edited.current = true;
    setGrid((current) => {
      const next = conCelda(current, fila, dia, texto);
      sync.push(key, next);
      return next;
    });
  }

  const fechas = new Set(days.map((dia) => dia.fecha));
  const planes = planDeLaSemana(fechas);

  return (
    <section>
      <div className="kicker">Agenda</div>
      <h2>Tu semana</h2>
      <p className="lead">Escribe en la casilla. Se guarda solo y llega al otro teléfono. Si aún no has escrito nada, se muestra el plan que ya había.</p>
      <div className="nav">
        <button className="tap" type="button" onClick={() => setAnchor(shiftDay(monday, -7))} aria-label="Semana anterior">◀</button>
        <div className="grow">Semana del {shortDay(monday)}</div>
        <button className="tap" type="button" onClick={() => setAnchor(shiftDay(monday, 7))} aria-label="Semana siguiente">▶</button>
      </div>
      <button className="tap" type="button" onClick={() => setAnchor(props.hoy)}>Hoy</button>
      <div className="org-scroll">
        <table className="org-table">
          <thead>
            <tr>
              <th className="org-jefe">Actividad</th>
              {days.map((dia) => (
                <th key={dia.id} className={dia.fecha === props.hoy ? "org-today" : ""}>
                  {dia.label}
                  <span className="org-date">{shortDay(dia.fecha)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {AGENDA_FILAS.map((fila) => (
              <tr key={fila.id}>
                <th className="org-jefe" scope="row">
                  <span className="org-chip"><span aria-hidden="true">{fila.icono}</span><span>{fila.nombre}</span></span>
                </th>
                {days.map((dia) => {
                  const propuesto = sugerido(planes, dia.fecha, fila.id);
                  const valor = textoVisible(grid, fila.id, dia.id, propuesto);
                  return (
                    <td key={dia.id} className={dia.fecha === props.hoy ? "org-today" : ""}>
                      <textarea
                        className="org-cell"
                        aria-label={fila.nombre + ", " + dia.label}
                        rows={2}
                        value={valor}
                        disabled={!ready}
                        placeholder="—"
                        onChange={(event) => edit(fila.id, dia.id, event.target.value)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
