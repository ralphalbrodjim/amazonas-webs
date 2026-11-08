import { useEffect, useState } from "react";
import { watchContent } from "../../shared/content";
import { applySemanaContent, getDeporte } from "./liveContent";
import { formatDay, formatWhen, kg, km, madridToday, pend, shiftDay, signedKg, weekStart } from "./dates";
import { CloudSync } from "./cloud";
import { Cultura } from "./cultura";
import { Organizacion } from "./organizacion";
import { Planner } from "./planner";
import { useSync } from "./cloud";
import { AGENDA_KEY, DEPORTE_KEY, deporteDates, gimnasioHecho, kmDelMes, mergeAgenda, parseBag, salidasHechas, type AgendaBag } from "./agendaStore";

type Tab = "agenda" | "deporte" | "cultura" | "organizacion";

function Pill(props: { kind: "miss" | "wait" | "neutral" | "recorded" | "completo"; children: string }) {
  return <span className={`pill ${props.kind}`}>{props.children}</span>;
}

export default function App() {
  const hoy = madridToday();
  const [tab, setTab] = useState<Tab>("agenda");
  const [contentRev, setContentRev] = useState(0);
  useEffect(() => watchContent("semana", (rows) => { applySemanaContent(rows); setContentRev((n) => n + 1); }), []);

  return (
    <CloudSync>
    <div className="app" data-content={contentRev}>
      <header className="header">
        <div className="header-inner">
          <h1>Mi semana</h1>
          <p>Agenda, deporte y cultura</p>
        </div>
      </header>
      <main className="wrap">
        <div className="tabs" role="tablist" aria-label="Secciones">
          {([
            ["agenda", "Agenda"],
            ["deporte", "Running y gimnasio"],
            ["cultura", "🎭 Cultura"],
            ["organizacion", "Organización semana"],
          ] as const).map(([id, label]) => (
            <button key={id} className="tab" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </div>
        {tab === "agenda" ? <Planner hoy={hoy} /> : null}
        {tab === "deporte" ? <Deporte /> : null}
        {tab === "cultura" ? <Cultura /> : null}
        {tab === "organizacion" ? <Organizacion /> : null}
      </main>
    </div>
    </CloudSync>
  );
}


function readBag(): AgendaBag {
  try {
    const raw = localStorage.getItem(AGENDA_KEY);
    const dates = (() => { try { return deporteDates(JSON.parse(localStorage.getItem(DEPORTE_KEY) || "[]")); } catch { return []; } })();
    return mergeAgenda(parseBag(raw ? JSON.parse(raw) : {}), dates).bag;
  } catch {
    return mergeAgenda({ entradas: [], ocultas: [], kmMes: {}, runsMigrated: false }, []).bag;
  }
}

function kmDePlan(plan: string): number {
  const match = plan.match(/(\d+(?:[.,]\d+)?)/);
  return match ? Number(match[1].replace(",", ".")) : 0;
}

const HECHO_COLOR = "#1F3B34";
const PLAN_COLOR = "#C5D0C8";

function nombreMes(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const text = new Intl.DateTimeFormat("es-ES", { timeZone: "UTC", month: "long", year: "numeric" }).format(new Date(Date.UTC(y, m - 1, 1)));
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function semanasDelMes(ym: string): { start: string; end: string; label: string }[] {
  const [y, m] = ym.split("-").map(Number);
  const first = ym + "-01";
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const last = ym + "-" + String(lastDay).padStart(2, "0");
  const weeks: { start: string; end: string; label: string }[] = [];
  for (let cursor = weekStart(first); cursor <= last; cursor = shiftDay(cursor, 7)) {
    const weekEnd = shiftDay(cursor, 6);
    const from = cursor < first ? first : cursor;
    const to = weekEnd > last ? last : weekEnd;
    const desdeDia = Number(from.slice(8));
    const hastaDia = Number(to.slice(8));
    weeks.push({ start: cursor, end: weekEnd, label: desdeDia === hastaDia ? String(desdeDia) : `${desdeDia}–${hastaDia}` });
  }
  return weeks;
}

const MINUTOS_GYM = 30;

function cifraBarra(week: { hecho: number; plan: number }, format: (n: number) => string, unit?: string): string {
  const text = week.hecho > 0 && week.plan > 0 ? format(week.hecho) + "/" + format(week.plan) : week.plan > 0 ? format(week.plan) : format(week.hecho);
  return unit ? text + " " + unit : text;
}

function Barras(props: { aria: string; weeks: { label: string; hecho: number; plan: number }[]; format: (n: number) => string; unit?: string }) {
  if (props.weeks.length === 0) return <p className="note">Sin plan este mes</p>;
  const width = 360;
  const height = 210;
  const padL = 36;
  const padR = 8;
  const padT = 28;
  const padB = 28;
  const max = Math.max(...props.weeks.flatMap((week) => [week.hecho, week.plan]), 1);
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const groupW = innerW / props.weeks.length;
  const barW = Math.min(16, Math.max(8, (groupW - 18) / 2));
  const y = (value: number) => padT + (1 - value / max) * innerH;
  const base = padT + innerH;
  return (
    <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={props.aria}>
      <line x1={padL} x2={width - padR} y1={base} y2={base} stroke="#E4DDCF" />
      <text x={padL - 4} y={y(max) + 4} textAnchor="end" fontSize="11" fill="#6B746F">{props.format(max)}</text>
      <text x={padL - 4} y={base} textAnchor="end" fontSize="11" fill="#6B746F">0</text>
      {props.weeks.map((week, index) => {
        const cx = padL + index * groupW + groupW / 2;
        const top = Math.min(week.plan > 0 ? y(week.plan) : base, week.hecho > 0 ? y(week.hecho) : base);
        return (
          <g key={week.label}>
            <rect x={cx - barW - 2} y={y(week.plan)} width={barW} height={week.plan > 0 ? Math.max(1, base - y(week.plan)) : 0} rx={3} fill={PLAN_COLOR} />
            <rect x={cx + 2} y={y(week.hecho)} width={barW} height={week.hecho > 0 ? Math.max(1, base - y(week.hecho)) : 0} rx={3} fill={HECHO_COLOR} />
            <text x={cx} y={Math.max(14, top - 6)} textAnchor="middle" fontSize={props.unit ? 13 : 15} fontWeight="700" fill="#1E2B27">{cifraBarra(week, props.format, props.unit)}</text>
            <text x={cx} y={height - 8} textAnchor="middle" fontSize="12" fill="#1E2B27">{week.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function Deporte() {
  const deporte = getDeporte();
  const hoy = madridToday();
  const [mes, setMes] = useState(hoy.slice(0, 7));
  const sync = useSync();
  const [bag, setBag] = useState<AgendaBag>(readBag);
  useEffect(() => sync.onKey(AGENDA_KEY, (value) => {
    try {
      const dates = deporteDates(JSON.parse(localStorage.getItem(DEPORTE_KEY) || "[]"));
      setBag(mergeAgenda(parseBag(value), dates).bag);
    } catch { /* remoto ilegible */ }
  }), [sync]);
  useEffect(() => {
    const next = readBag();
    setBag(next);
    sync.push(AGENDA_KEY, next);
  }, [sync]);
  const runningHecho = (fecha: string) => bag.entradas.some((item) => item.fecha === fecha && item.categoria === "running" && item.hecho);

  const octubre = deporte.running.octubre_2026;
  const noviembre = deporte.running.noviembre_2026;
  const gym = deporte.gimnasio;
  const peso = deporte.peso;
  const octInfo = kmDelMes(bag, "2026-10");
  const novInfo = kmDelMes(bag, "2026-11");
  const octKm = octInfo.km;
  const novKm = novInfo.km;
  const octubrePct = Math.min(100, (octKm / octubre.objetivo_km) * 100);
  const noviembrePct = Math.min(100, (novKm / noviembre.objetivo_km) * 100);
  const sinSalidas = noviembre.sin_salidas;
  const parada = gym.planificadas_noviembre.parada;
  const noHechasRun = octubre.no_hechas.filter((item) => item.fecha >= hoy);
  const planNov = noviembre.plan.filter((sesion) => sesion.fecha >= hoy);
  const noHechasGym = gym.no_hechas.filter((item) => item.fecha >= hoy);
  const planGym = gym.planificadas_noviembre.sesiones.filter((sesion) => sesion.fecha >= hoy);
  const fechasMes = [
    ...octubre.registros.map((item) => item.fecha),
    ...octubre.no_hechas.map((item) => item.fecha),
    ...noviembre.plan.map((item) => item.fecha),
    ...gym.no_hechas.map((item) => item.fecha),
    ...gym.planificadas_noviembre.sesiones.map((item) => item.fecha),
  ];
  const meses = [...new Set([...fechasMes.map((fecha) => fecha.slice(0, 7)), hoy.slice(0, 7)])].sort();
  const dentro = (fecha: string, week: { start: string; end: string }) => fecha.slice(0, 7) === mes && fecha >= week.start && fecha <= week.end;
  const semanasRun = semanasDelMes(mes).map((week) => {
    let hecho = 0;
    let plan = 0;
    for (const item of octubre.no_hechas) if (dentro(item.fecha, week)) plan += kmDePlan(item.plan);
    for (const item of noviembre.plan) if (dentro(item.fecha, week)) plan += item.km;
    for (const item of bag.entradas) if (item.categoria === "running" && item.hecho && item.km !== null && dentro(item.fecha, week)) hecho += item.km;
    return { label: week.label, hecho, plan };
  }).filter((week) => week.hecho > 0 || week.plan > 0);
  const semanasGym = semanasDelMes(mes).map((week) => {
    let hecho = 0;
    let plan = 0;
    for (const item of [...gym.no_hechas, ...gym.planificadas_noviembre.sesiones]) if (dentro(item.fecha, week)) {
      plan += 1;
      if (gimnasioHecho(bag.entradas, item.fecha)) hecho += 1;
    }
    return { label: week.label, hecho, plan };
  }).filter((week) => week.hecho > 0 || week.plan > 0);
  const salidasMes = salidasHechas(bag.entradas).filter((item) => item.fecha.slice(0, 7) === mes);
  const barrasSalida = salidasMes.map((item) => ({ label: String(Number(item.fecha.slice(8))), hecho: item.km ?? 0, plan: 0 }));
  const barrasMeses = ["2026-10", "2026-11"].map((item) => ({ label: nombreMes(item).slice(0, 3), hecho: kmDelMes(bag, item).km, plan: 0 }));
  const kmHechosMes = semanasRun.reduce((sum, week) => sum + week.hecho, 0);
  const objetivo = mes === "2026-10" ? octubre.objetivo_km : mes === "2026-11" ? noviembre.objetivo_km : null;
  const antesDe = mes === "2026-11" ? sinSalidas.desde : null;
  const ariaRun = semanasRun.length === 0 ? "Sin plan de running este mes" : "Running por semana. Verde oscuro es hecho, gris es planificado. " + semanasRun.map((week) => `${week.label}: ${km(week.hecho)} km hechos, ${km(week.plan)} planificados`).join(". ");
  const minGym = (sesiones: number) => sesiones * MINUTOS_GYM;
  const ariaGym = semanasGym.length === 0 ? "Sin plan de gimnasio este mes" : "Gimnasio por semana, 30 minutos por sesión. Verde oscuro es hecho, gris es planificado. " + semanasGym.map((week) => `${week.label}: ${minGym(week.hecho)} min hechos, ${minGym(week.plan)} min planificados`).join(". ");

  return (
    <section>
      <div className="kicker">Actualizado {formatWhen(deporte.actualizado)}</div>
      <h2>Running y gimnasio</h2>
      <p className="source">{deporte.fuente}</p>
      <p className="lead">Los kilómetros salen de las salidas marcadas como hechas en la semana. El gimnasio cuenta 30 minutos por sesión hecha allí.</p>

      <div id="graficas-mes">
        <label className="mes-label">Mes
          <select aria-label="Mes de las gráficas" value={mes} onChange={(event) => setMes(event.target.value)}>
            {meses.map((item) => <option key={item} value={item}>{nombreMes(item)}</option>)}
          </select>
        </label>
        <article className="card" style={{ marginTop: 12 }}>
          <h3>Kilómetros por salida</h3>
          <Barras aria={"Kilómetros de cada salida en " + nombreMes(mes)} weeks={barrasSalida} format={(value) => km(value)} />
          {salidasMes.length === 0 ? <p className="note">Sin salidas con kilómetros este mes.</p> : salidasMes.map((item) => <p key={item.fecha} className="note">{formatDay(item.fecha, false)} · {km(item.km ?? 0)} km{item.duracion ? " · " + item.duracion : ""}</p>)}
        </article>
        <article className="card" style={{ marginTop: 12 }}>
          <h3>Kilómetros por mes</h3>
          <Barras aria="Kilómetros totales de octubre y noviembre" weeks={barrasMeses} format={(value) => km(value)} />
          <p className="note">Octubre: {km(octInfo.km)} km en {octInfo.salidas} salidas{octInfo.override ? " (total de la app; solo hay tres salidas sueltas)" : ""}.</p>
          <p className="note">Noviembre: {km(novInfo.km)} km en {novInfo.salidas} salidas.</p>
        </article>
        <article className="card" style={{ marginTop: 12 }}>
          <h3>Running</h3>
          <div className="chart-legend">
            <span><i className="swatch hecho" /> Hecho</span>
            <span><i className="swatch plan" /> Planificado</span>
          </div>
          <Barras aria={ariaRun} weeks={semanasRun} format={(value) => km(value)} />
          {semanasRun.length > 0 && objetivo !== null ? <p className="note">Acumulado: {km(kmHechosMes)} de {km(objetivo)} km{antesDe ? `, antes del ${formatDay(antesDe, false)}` : ""}.</p> : null}
        </article>
        <article className="card" style={{ marginTop: 12 }}>
          <h3>Gimnasio</h3>
          <div className="chart-legend">
            <span><i className="swatch hecho" /> Hecho</span>
            <span><i className="swatch plan" /> Planificado</span>
          </div>
          <Barras aria={ariaGym} weeks={semanasGym} format={(value) => String(minGym(value))} unit="min" />
          {semanasGym.length > 0 ? <p className="note">{minGym(semanasGym.reduce((sum, week) => sum + week.hecho, 0))}/{minGym(semanasGym.reduce((sum, week) => sum + week.plan, 0))} min. Cada sesión cuenta 30 min.</p> : null}
        </article>
      </div>

      <div className="kicker">Octubre 2026</div>
      <div className="stats">
        <article className="card">
          <div className="stat-label">Kilómetros</div>
          <div className="stat-value">{km(octKm)}</div>
          <div className="stat-label">{octInfo.salidas} salidas</div>
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
        <div className="track" role="meter" aria-valuemin={0} aria-valuemax={octubre.objetivo_km} aria-valuenow={octKm} aria-label="Kilómetros de octubre">
          <div className="fill" style={{ width: `${octubrePct}%` }} />
        </div>
        <p className="note">{km(octKm)} de {km(octubre.objetivo_km)} km. {octubre.ritmo_medio_nota}</p>
      </article>
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
      {noHechasRun.length > 0 ? <div className="kicker">No hechas en octubre</div> : null}
      <div className="grid">
        {noHechasRun.map((item) => (
          <article key={item.fecha} className="card">
            <h3>{formatDay(item.fecha)}</h3>
            <div className="meta"><span>{item.plan}</span></div>
            <p className="note">Se marca en la semana.</p>
          </article>
        ))}
      </div>

      <div className="kicker">Noviembre 2026</div>
      <article className="card">
        <h3>Objetivo: {km(noviembre.objetivo_km)} km</h3>
        <div className="track" role="meter" aria-valuemin={0} aria-valuemax={noviembre.objetivo_km} aria-valuenow={novKm} aria-label="Kilómetros de noviembre">
          <div className="fill" style={{ width: `${noviembrePct}%` }} />
        </div>
        <p className="note">{km(novKm)} de {km(noviembre.objetivo_km)} km hechos. Planificado: {km(noviembre.total_planificado_km)} km.</p>
        <p className="note">{noviembre.estado}</p>
        <p className="note">{noviembre.criterio}</p>
        <div className="meta">
          <Pill kind="wait">Pendiente de confirmar</Pill>
          {novKm === 0 ? <Pill kind="miss">Kilómetros no hechos</Pill> : null}
        </div>
      </article>
      <div className="kicker">Plan de sesiones</div>
      <div className="grid">
        {planNov.map((sesion) => (
          <article key={sesion.fecha} className="card">
            <h3>{formatDay(sesion.fecha)}</h3>
            <div className="meta">
              <span>{sesion.dia}</span>
              <span>{km(sesion.km)} km</span>
              <span>{sesion.tipo}</span>
              {runningHecho(sesion.fecha) ? <Pill kind="recorded">Hecha en la semana</Pill> : null}
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
        <h3>Minutos registrados: {gym.registradas.length * MINUTOS_GYM}</h3>
        <div className="meta"><Pill kind="miss">No hecha</Pill></div>
        <p className="note">No hay ninguna sesión registrada. Lo que no está reportado cuenta como no hecho.</p>
      </article>
      <div className="grid" style={{ marginTop: 12 }}>
        {noHechasGym.map((item) => (
          <article key={item.fecha} className="card">
            <h3>{formatDay(item.fecha)}</h3>
            <div className="meta">
              <span>{item.plan}</span>
              <span>{item.motivo}</span>
            </div>
            <p className="note">Se marca en la semana.</p>
          </article>
        ))}
      </div>
      <article className="card" style={{ marginTop: 12 }}>
        <h3>Noviembre · {gym.planificadas_noviembre.estado}</h3>
        <p className="note">Descanso: {gym.descanso}</p>
        <p className="note">Parada del {formatDay(parada.desde, false)} al {formatDay(parada.hasta, false)}. {parada.motivo}.</p>
      </article>
      <div className="grid">
        {planGym.map((sesion) => (
          <article key={sesion.fecha} className="card">
            <h3>{formatDay(sesion.fecha)}</h3>
            <div className="meta">
              <span>{sesion.contenido}</span>
            </div>
            {gimnasioHecho(bag.entradas, sesion.fecha) ? <Pill kind="recorded">Hecha en la semana</Pill> : <p className="note">Se marca en la semana.</p>}
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
