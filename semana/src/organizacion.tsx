import { getOrganizacion, type OrganizacionItem } from "./liveContent";

function costeClase(coste: string): string {
  const texto = coste.toLowerCase();
  if (texto.includes("alto")) return "alto";
  if (texto.includes("medio")) return "medio";
  if (texto.includes("bajo")) return "bajo";
  return "";
}

function cuenta(n: number): string {
  return n === 1 ? "1 automatización" : n + " automatizaciones";
}

function Grupo(props: { titulo: string; items: OrganizacionItem[] }) {
  return (
    <section className="org-group">
      <h3>{props.titulo}</h3>
      {props.items.length === 0 ? <p className="note">Ninguna.</p> : null}
      {props.items.map((item) => (
        <article key={item.id} className="card org-card">
          <div className="org-top">
            <span className="org-ico" aria-hidden="true">{item.icono}</span>
            <div className="org-main">
              <h3>{item.titulo}</h3>
              {item.frecuencia ? <p className="org-freq">{item.frecuencia}</p> : null}
            </div>
            {item.coste ? <span className={"org-cost " + costeClase(item.coste)}>{item.coste}</span> : null}
          </div>
          {item.descripcion ? <p className="org-desc">{item.descripcion}</p> : null}
          {item.nota ? <p className="note">{item.nota}</p> : null}
        </article>
      ))}
    </section>
  );
}

export function Organizacion() {
  const items = getOrganizacion();
  const auto = items.filter((item) => item.automatico);
  const manual = items.filter((item) => !item.automatico);
  return (
    <section>
      <div className="kicker">Organización</div>
      <h2>Organización semana</h2>
      <p className="lead">{cuenta(auto.length)}. El distintivo es el coste: bajo, medio, alto, o un porcentaje de uso.</p>
      <div className="org-legend" aria-label="Leyenda de coste">
        <span className="org-cost bajo">Bajo</span>
        <span className="org-cost medio">Medio</span>
        <span className="org-cost alto">Alto</span>
      </div>
      {items.length === 0 ? (
        <p className="empty">Todavía no hay nada publicado. Aparecerá aquí al añadir filas de organización.</p>
      ) : (
        <>
          <Grupo titulo="⚙️ Automatizado" items={auto} />
          <Grupo titulo="✋ Manual" items={manual} />
        </>
      )}
    </section>
  );
}
