import { getOrganizacionSemana } from "./liveContent";
import { DIAS, JEFES, textoCelda } from "./organizacionModel";

export function Organizacion() {
  const celdas = getOrganizacionSemana();
  return (
    <section>
      <div className="kicker">Organización</div>
      <h2>Organización semana</h2>
      <p className="lead">Una fila por jefe y una columna por cada día de la semana. Las casillas están vacías hasta que se publiquen.</p>
      <div className="org-scroll">
        <table className="org-table">
          <thead>
            <tr>
              <th className="org-jefe">Jefe</th>
              {DIAS.map((dia) => <th key={dia.id}>{dia.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {JEFES.map((jefe) => (
              <tr key={jefe.id}>
                <th className="org-jefe" scope="row">
                  <span className="org-chip">
                    <span aria-hidden="true">{jefe.icono}</span>
                    <span>{jefe.nombre}<small>{jefe.area}</small></span>
                  </span>
                </th>
                {DIAS.map((dia) => {
                  const texto = textoCelda(celdas, jefe.id, dia.id);
                  return <td key={dia.id}>{texto ? texto : <span className="org-empty">—</span>}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
