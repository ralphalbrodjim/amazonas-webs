import { useEffect, useState } from "react";
import { AGENDA_FILAS, cuentaMes, formatoHoras, horasPorMes, shiftMonth, type MesCuenta } from "./agendaGrid";
import { useSync } from "./cloud";
import { formatMonth } from "./dates";

const MESES = 6;

export function Estadisticas(props: { hoy: string; onClose: () => void }) {
  const sync = useSync();
  const actual = props.hoy.slice(0, 7);
  const [mes, setMes] = useState(actual);
  const [weeks, setWeeks] = useState<Record<string, unknown>>({});
  useEffect(() => sync.onPrefix("agenda-semana-", (key, value) => {
    setWeeks((current) => current[key] === value ? current : { ...current, [key]: value });
  }), [sync]);
  const rows = horasPorMes(Object.entries(weeks).map(([key, value]) => ({ key, value })));
  const cuenta = cuentaMes(rows, mes);
  const recientes = Array.from({ length: MESES }, (_, index) => shiftMonth(actual, index - (MESES - 1)));
  const maximo = Math.max(...recientes.map((item) => cuentaMes(rows, item).total), 0);
  return (
    <section className="estadisticas">
      <button type="button" className="tap agenda-back" onClick={props.onClose}>← Agenda</button>
      <div className="kicker">Estadísticas</div>
      <div className="nav agenda-nav">
        <button type="button" className="tap" aria-label="Mes anterior" onClick={() => setMes(shiftMonth(mes, -1))}>◀</button>
        <div className="grow">{formatMonth(mes + "-01")}</div>
        <button type="button" className="tap" aria-label="Mes siguiente" onClick={() => setMes(shiftMonth(mes, 1))}>▶</button>
      </div>
      <div className="mes-chips">
        {AGENDA_FILAS.map((fila) => (
          <p key={fila.id} className={"mes-chip " + fila.id}>
            <span>{fila.icono} {fila.nombre}</span>
            <b>{formatoHoras(cuenta[fila.id])}</b>
          </p>
        ))}
        <p className="mes-chip total">
          <span>Total</span>
          <b>{formatoHoras(cuenta.total)}</b>
        </p>
      </div>
      <h3>Últimos meses</h3>
      <table className="mes-table">
        <thead>
          <tr>
            <th scope="col">Mes</th>
            {AGENDA_FILAS.map((fila) => <th key={fila.id} scope="col" title={fila.nombre}><span aria-hidden="true">{fila.icono}</span><span className="sr">{fila.nombre}</span></th>)}
            <th scope="col">Total</th>
          </tr>
        </thead>
        <tbody>
          {recientes.map((item) => {
            const row = cuentaMes(rows, item);
            return <MesFila key={item} row={row} maximo={maximo} activo={item === mes} />;
          })}
        </tbody>
      </table>
    </section>
  );
}

function mesCorto(mes: string): string {
  const [year, month] = mes.split("-").map(Number);
  return new Intl.DateTimeFormat("es-ES", { timeZone: "UTC", month: "short", year: "2-digit" }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function MesFila(props: { row: MesCuenta; maximo: number; activo: boolean }) {
  const ancho = props.maximo > 0 ? Math.round((props.row.total / props.maximo) * 100) : 0;
  const etiqueta = mesCorto(props.row.mes);
  return (
    <tr className={props.activo ? "activo" : ""}>
      <th scope="row">{etiqueta}</th>
      {AGENDA_FILAS.map((fila) => <td key={fila.id}>{formatoHoras(props.row[fila.id])}</td>)}
      <td>
        <span className="mes-total">{formatoHoras(props.row.total)}</span>
        <span className="mes-bar" style={{ width: ancho + "%" }} />
      </td>
    </tr>
  );
}
