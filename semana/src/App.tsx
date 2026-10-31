import { useState } from "react";
import ingles from "../data/ingles.json";
import deporte from "../data/deporte.json";
import { formatDay, formatWhen, kg, km, madridToday, pend, signedKg } from "./dates";
import { Planner } from "./planner";

type Tab = "agenda" | "ingles" | "deporte";

function Pill(props: { kind: "miss" | "wait" | "neutral" | "recorded"; children: string }) {
  return <span className={`pill ${props.kind}`}>{props.children}</span>;
}

function claseEstado(estado: string): { kind: "miss" | "wait" | "neutral"; label: string } {
  if (estado === "no_realizada") return { kind: "miss", label: "No realizada" };
  if (estado === "programada") return { kind: "neutral", label: "Programada" };
  if (estado === "pendiente_de_fecha") return { kind: "wait", label: "Pendiente de fecha" };
  return { kind: "miss", label: "No hecha" };
}

function deberEstado(estado: string): { kind: "miss" | "wait"; label: string } {
  if (estado === "no_reportada") return { kind: "miss", label: "No hecha" };
  return { kind: "miss", label: "No hecha" };
}

export default function App() {
  const hoy = madridToday();
  const [tab, setTab] = useState<Tab>("agenda");

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <h1>Mi semana</h1>
          <p>Agenda, inglés y deporte</p>
        </div>
      </header>
      <main className="wrap">
        <div className="tabs" role="tablist" aria-label="Secciones">
          {([
            ["agenda", "Agenda"],
            ["ingles", "Inglés"],
            ["deporte", "Running y gimnasio"],
          ] as const).map(([id, label]) => (
            <button key={id} className="tab" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </div>
        {tab === "agenda" ? <Planner hoy={hoy} /> : null}
        {tab === "ingles" ? <Ingles /> : null}
        {tab === "deporte" ? <Deporte /> : null}
      </main>
    </div>
  );
}

function Ingles() {
  const prueba = ingles.prueba_de_nivel;
  const posteriores = ingles["clases_posteriores_hasta_2026-11-30"];
  const pruebaEstado = claseEstado(prueba.estado);

  return (
    <section>
      <div className="kicker">Actualizado {formatWhen(ingles.actualizado)}</div>
      <h2>Inglés</h2>
      <p className="source">{ingles.fuente}</p>
      <div className="stats">
        <article className="card">
          <div className="stat-label">Nivel actual</div>
          <div className="stat-value" style={{ fontSize: 22 }}>{ingles.nivel_actual}</div>
        </article>
        <article className="card">
          <div className="stat-label">Objetivo</div>
          <div className="stat-value" style={{ fontSize: 22 }}>{ingles.nivel_objetivo}</div>
          <div className="stat-label">{ingles.plazo_objetivo_meses} meses</div>
        </article>
        <article className="card">
          <div className="stat-label">Clases completadas</div>
          <div className="stat-value">{ingles.clases_completadas}</div>
          <Pill kind="miss">No hechas</Pill>
        </article>
        <article className="card">
          <div className="stat-label">Minutos completados</div>
          <div className="stat-value">{ingles.minutos_completados}</div>
        </article>
      </div>

      <div className="kicker">Prueba de nivel</div>
      <article className="card">
        <h3>Sir Edward</h3>
        <div className="meta">
          <span>{formatDay(prueba.fecha_prevista)}</span>
          <span>{prueba.hora}</span>
          <Pill kind={pruebaEstado.kind}>{pruebaEstado.label}</Pill>
        </div>
        <p className="note">Resultado: {pend(prueba.resultado)}</p>
        <p className="note">{prueba.nota}</p>
      </article>

      <div className="kicker">Clases</div>
      <div className="grid">
        {ingles.clases_programadas.map((clase) => {
          const estado = claseEstado(clase.estado);
          return (
            <article key={`${clase.profesor}-${clase.destreza}`} className="card">
              <h3>{clase.destreza}</h3>
              <div className="meta">
                <span>{clase.profesor}</span>
                <span>{clase.fecha ? formatDay(clase.fecha) : "Fecha: Pendiente"}</span>
                <span>Hora: {pend(clase.hora)}</span>
                <Pill kind={estado.kind}>{estado.label}</Pill>
              </div>
              {"nota" in clase && clase.nota ? <p className="note">{clase.nota}</p> : null}
            </article>
          );
        })}
      </div>
      <p className="note">{ingles.nota_calendario}</p>
      <p className="note">Clases posteriores hasta el 30 de noviembre: {pend(posteriores)}</p>

      <div className="kicker">Deberes</div>
      <div className="grid">
        {ingles.deberes_pendientes.map((deber) => {
          const estado = deberEstado(deber.estado);
          return (
            <article key={deber.profesor} className="card">
              <h3>{deber.profesor}</h3>
              <div className="meta">
                <Pill kind={estado.kind}>{estado.label}</Pill>
              </div>
              <p className="note">{deber.tarea}</p>
              <p className="note">Hacer: {deber.hacer}</p>
              <p className="note">Entrega: {formatWhen(deber.entrega)}</p>
            </article>
          );
        })}
      </div>

      <div className="kicker">Progreso por destreza</div>
      <div className="grid">
        {Object.entries(ingles.progreso_por_destreza).map(([destreza, valor]) => (
          <article key={destreza} className="card">
            <h3>{etiquetaDestreza(destreza)}</h3>
            <div className="meta">
              <span>{pend(valor)}</span>
              <Pill kind="miss">No hecha</Pill>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function etiquetaDestreza(key: string): string {
  const names: Record<string, string> = {
    speaking: "Speaking",
    listening: "Listening",
    reading: "Reading",
    use_of_english: "Use of English",
    writing: "Writing",
  };
  return names[key] ?? key;
}

function Deporte() {
  const octubre = deporte.running.octubre_2026;
  const noviembre = deporte.running.noviembre_2026;
  const gym = deporte.gimnasio;
  const peso = deporte.peso;
  const octubrePct = Math.min(100, (octubre.total_km / octubre.objetivo_km) * 100);
  const noviembrePct = Math.min(100, (noviembre.realizados_km / noviembre.objetivo_km) * 100);
  const sinSalidas = noviembre.sin_salidas;
  const parada = gym.planificadas_noviembre.parada;

  return (
    <section>
      <div className="kicker">Actualizado {formatWhen(deporte.actualizado)}</div>
      <h2>Running y gimnasio</h2>
      <p className="source">{deporte.fuente}</p>

      <div className="kicker">Octubre 2026</div>
      <div className="stats">
        <article className="card">
          <div className="stat-label">Kilómetros</div>
          <div className="stat-value">{km(octubre.total_km)}</div>
          <div className="stat-label">{octubre.salidas_validas} salidas válidas</div>
        </article>
        <article className="card">
          <div className="stat-label">Objetivo</div>
          <div className="stat-value">{km(octubre.objetivo_km)} km</div>
          <Pill kind="miss">No cumplido</Pill>
        </article>
        <article className="card">
          <div className="stat-label">Ritmo medio</div>
          <div className="stat-value" style={{ fontSize: 26 }}>{octubre.ritmo_medio_min_km}</div>
          <div className="stat-label">min/km</div>
        </article>
        <article className="card">
          <div className="stat-label">Mejor ritmo</div>
          <div className="stat-value" style={{ fontSize: 26 }}>{octubre.mejor_ritmo.ritmo_min_km}</div>
          <div className="stat-label">{formatDay(octubre.mejor_ritmo.fecha, false)} · {km(octubre.mejor_ritmo.km)} km</div>
        </article>
      </div>
      <article className="card" style={{ marginTop: 12 }}>
        <h3>Hacia los {km(octubre.objetivo_km)} km</h3>
        <div className="track" role="meter" aria-valuemin={0} aria-valuemax={octubre.objetivo_km} aria-valuenow={octubre.total_km} aria-label="Kilómetros de octubre">
          <div className="fill" style={{ width: `${octubrePct}%` }} />
        </div>
        <p className="note">{km(octubre.total_km)} de {km(octubre.objetivo_km)} km. {octubre.ritmo_medio_nota}</p>
      </article>
      <article className="card" style={{ marginTop: 12 }}>
        <h3>Kilómetros por salida</h3>
        <KmChart rows={octubre.registros} />
      </article>
      <div className="grid" style={{ marginTop: 12 }}>
        {octubre.registros.map((salida) => (
          <article key={salida.fecha} className="card">
            <h3>{formatDay(salida.fecha)}</h3>
            <div className="meta">
              <span>{km(salida.km)} km</span>
              <span>Tiempo: {pend(salida.tiempo)}</span>
              <span>Ritmo: {salida.ritmo_min_km === null ? "Pendiente" : `${salida.ritmo_min_km} min/km`}</span>
              <Pill kind="recorded">Registrada</Pill>
            </div>
            {salida.nota ? <p className="note">{salida.nota}</p> : null}
          </article>
        ))}
      </div>
      <div className="kicker">No cuenta</div>
      <div className="grid">
        {octubre.excluidas.map((item) => (
          <article key={item.fecha} className="card">
            <h3>{formatDay(item.fecha)} · {km(item.km)} km</h3>
            <div className="meta"><Pill kind="miss">No cuenta</Pill></div>
            <p className="note">{item.motivo}</p>
          </article>
        ))}
      </div>
      <div className="kicker">No hechas en octubre</div>
      <div className="grid">
        {octubre.no_hechas.map((item) => (
          <article key={item.fecha} className="card">
            <h3>{formatDay(item.fecha)}</h3>
            <div className="meta">
              <span>{item.plan}</span>
              <Pill kind="miss">No hecha</Pill>
            </div>
          </article>
        ))}
      </div>

      <div className="kicker">Noviembre 2026</div>
      <article className="card">
        <h3>Objetivo: {km(noviembre.objetivo_km)} km</h3>
        <div className="track" role="meter" aria-valuemin={0} aria-valuemax={noviembre.objetivo_km} aria-valuenow={noviembre.realizados_km} aria-label="Kilómetros de noviembre">
          <div className="fill" style={{ width: `${noviembrePct}%` }} />
        </div>
        <p className="note">{km(noviembre.realizados_km)} de {km(noviembre.objetivo_km)} km hechos. Planificado: {km(noviembre.total_planificado_km)} km.</p>
        <p className="note">{noviembre.estado}</p>
        <p className="note">{noviembre.criterio}</p>
        <div className="meta">
          <Pill kind="wait">Pendiente de confirmar</Pill>
          <Pill kind="miss">Kilómetros no hechos</Pill>
        </div>
      </article>
      <div className="kicker">Plan de sesiones</div>
      <div className="grid">
        {noviembre.plan.map((sesion) => (
          <article key={sesion.fecha} className="card">
            <h3>{formatDay(sesion.fecha)}</h3>
            <div className="meta">
              <span>{sesion.dia}</span>
              <span>{km(sesion.km)} km</span>
              <span>{sesion.tipo}</span>
              <Pill kind="miss">No hecha</Pill>
            </div>
          </article>
        ))}
      </div>
      <article className="card" style={{ marginTop: 12 }}>
        <h3>Sin salidas</h3>
        <p className="note">Del {formatDay(sinSalidas.desde, false)} al {formatDay(sinSalidas.hasta, false)}. {sinSalidas.motivo}</p>
      </article>

      <div className="kicker">Gimnasio</div>
      <article className="card">
        <h3>Sesiones registradas: {gym.registradas.length}</h3>
        <div className="meta"><Pill kind="miss">No hecha</Pill></div>
        <p className="note">No hay ninguna sesión registrada. Lo que no está reportado cuenta como no hecho.</p>
      </article>
      <div className="grid" style={{ marginTop: 12 }}>
        {gym.no_hechas.map((item) => (
          <article key={item.fecha} className="card">
            <h3>{formatDay(item.fecha)}</h3>
            <div className="meta">
              <span>{item.plan}</span>
              <span>{item.motivo}</span>
              <Pill kind="miss">No hecha</Pill>
            </div>
          </article>
        ))}
      </div>
      <article className="card" style={{ marginTop: 12 }}>
        <h3>Noviembre · {gym.planificadas_noviembre.estado}</h3>
        <p className="note">Descanso: {gym.descanso}</p>
        <p className="note">Parada del {formatDay(parada.desde, false)} al {formatDay(parada.hasta, false)}. {parada.motivo}.</p>
      </article>
      <div className="grid">
        {gym.planificadas_noviembre.sesiones.map((sesion) => (
          <article key={sesion.fecha} className="card">
            <h3>{formatDay(sesion.fecha)}</h3>
            <div className="meta">
              <span>{sesion.contenido}</span>
              <Pill kind="miss">No hecha</Pill>
            </div>
          </article>
        ))}
      </div>

      <div className="kicker">Peso</div>
      <div className="stats">
        <article className="card">
          <div className="stat-label">Último</div>
          <div className="stat-value">{kg(peso.ultimo.kg)} kg</div>
          <div className="stat-label">{formatDay(peso.ultimo.fecha, false)}</div>
        </article>
        <article className="card">
          <div className="stat-label">Inicio</div>
          <div className="stat-value">{kg(peso.inicio.kg)} kg</div>
          <div className="stat-label">{formatDay(peso.inicio.fecha, false)}</div>
        </article>
        <article className="card">
          <div className="stat-label">Cambio desde el inicio</div>
          <div className="stat-value" style={{ fontSize: 26 }}>{signedKg(peso.ultimo.cambio_desde_inicio_kg)}</div>
        </article>
        <article className="card">
          <div className="stat-label">Objetivo</div>
          <div className="stat-value">{kg(peso.objetivo_kg)} kg</div>
          <div className="stat-label">Faltan {kg(peso.faltan_kg)} kg · {peso.altura_cm} cm</div>
        </article>
      </div>
      <article className="card" style={{ marginTop: 12 }}>
        <h3>Peso registrado</h3>
        <PesoChart puntos={peso.historico} objetivo={peso.objetivo_kg} />
        <p className="note">Escala de los pesos registrados. El objetivo de {kg(peso.objetivo_kg)} kg queda fuera: faltan {kg(peso.faltan_kg)} kg.</p>
        <div>
          {peso.historico.map((punto) => (
            <div key={punto.fecha} className="row">
              <span>{formatDay(punto.fecha, false)}</span>
              <b>{kg(punto.kg)} kg</b>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

function KmChart(props: { rows: { fecha: string; km: number }[] }) {
  const width = 640;
  const height = 220;
  const padL = 36;
  const padR = 8;
  const padT = 22;
  const padB = 32;
  const max = Math.max(...props.rows.map((row) => row.km));
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const gap = 8;
  const barW = (innerW - gap * (props.rows.length - 1)) / props.rows.length;
  const y = (value: number) => padT + (1 - value / max) * innerH;
  return (
    <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Kilómetros de cada salida válida de octubre">
      <line x1={padL} x2={width - padR} y1={y(0)} y2={y(0)} stroke="#E4DDCF" />
      <text x={padL - 6} y={y(max) + 4} textAnchor="end" fontSize="11" fill="#6B746F">{km(max)}</text>
      <text x={padL - 6} y={y(0)} textAnchor="end" fontSize="11" fill="#6B746F">0</text>
      {props.rows.map((row, index) => {
        const x = padL + index * (barW + gap);
        const top = y(row.km);
        return (
          <g key={row.fecha}>
            <rect x={x} y={top} width={barW} height={Math.max(1, y(0) - top)} rx={4} fill="#2F5A4B" />
            <text x={x + barW / 2} y={top - 4} textAnchor="middle" fontSize="11" fill="#1E2B27">{km(row.km)}</text>
            <text x={x + barW / 2} y={height - 10} textAnchor="middle" fontSize="11" fill="#6B746F">{Number(row.fecha.slice(8))}</text>
          </g>
        );
      })}
    </svg>
  );
}

function PesoChart(props: { puntos: { fecha: string; kg: number }[]; objetivo: number }) {
  const width = 640;
  const height = 220;
  const padL = 48;
  const padR = 16;
  const padT = 28;
  const padB = 36;
  const values = props.puntos.map((punto) => punto.kg);
  const low = Math.min(...values);
  const high = Math.max(...values);
  const pad = Math.max(0.2, (high - low) * 0.8);
  const min = low - pad;
  const max = high + pad;
  const span = max - min;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const inset = 48;
  const x = (index: number) => {
    if (props.puntos.length === 1) return padL + innerW / 2;
    return padL + inset + (index / (props.puntos.length - 1)) * (innerW - inset * 2);
  };
  const y = (value: number) => padT + ((max - value) / span) * innerH;
  const line = props.puntos.map((punto, index) => `${index === 0 ? "M" : "L"}${x(index)},${y(punto.kg)}`).join(" ");
  return (
    <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Peso registrado, de ${kg(low)} a ${kg(high)} kg. El objetivo de ${kg(props.objetivo)} kg queda fuera de esta escala.`}>
      <line x1={padL} x2={width - padR} y1={y(low)} y2={y(low)} stroke="#E4DDCF" />
      <line x1={padL} x2={width - padR} y1={y(high)} y2={y(high)} stroke="#E4DDCF" />
      <text x={padL - 8} y={y(high) + 4} textAnchor="end" fontSize="12" fill="#6B746F">{kg(high)}</text>
      <text x={padL - 8} y={y(low) + 4} textAnchor="end" fontSize="12" fill="#6B746F">{kg(low)}</text>
      <path d={line} fill="none" stroke="#1F3B34" strokeWidth="2" />
      {props.puntos.map((punto, index) => (
        <g key={punto.fecha}>
          <circle cx={x(index)} cy={y(punto.kg)} r={5} fill="#1F3B34" />
          <text x={x(index)} y={y(punto.kg) - 10} textAnchor="middle" fontSize="13" fill="#1E2B27">{kg(punto.kg)}</text>
          <text x={x(index)} y={height - 12} textAnchor="middle" fontSize="12" fill="#6B746F">{punto.fecha.slice(8)}/{punto.fecha.slice(5, 7)}</text>
        </g>
      ))}
    </svg>
  );
}
