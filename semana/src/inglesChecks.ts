import ingles from "../data/ingles.json";
import { shiftDay, weekStart } from "./dates";

export const INGLES_KEY = "semana-ingles-v1";

export function loadInglesHechos(): string[] {
  try {
    const raw = localStorage.getItem(INGLES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function idPrueba(): string {
  return "prueba";
}

export function idClase(clase: { fecha: string | null; profesor: string; destreza: string }): string {
  return `clase:${clase.fecha ?? "sin-fecha"}|${clase.profesor}|${clase.destreza}`;
}

export function idDeber(deber: { profesor: string }): string {
  return `deber:${deber.profesor}`;
}

function fechaDeber(hacer: string): string | null {
  const fecha = hacer.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : null;
}

export function idsInglesEntre(desde: string, hasta: string): string[] {
  const ids: string[] = [];
  const prueba = ingles.prueba_de_nivel.fecha_prevista;
  if (prueba >= desde && prueba <= hasta) ids.push(idPrueba());
  for (const clase of ingles.clases_programadas) {
    if (clase.fecha && clase.fecha >= desde && clase.fecha <= hasta) ids.push(idClase(clase));
  }
  for (const deber of ingles.deberes_pendientes) {
    const fecha = fechaDeber(deber.hacer);
    if (fecha && fecha >= desde && fecha <= hasta) ids.push(idDeber(deber));
  }
  return ids;
}

export function resumenIngles(desde: string, hasta: string, hechos: string[]): { hechas: number; total: number } {
  const ids = idsInglesEntre(desde, hasta);
  return { total: ids.length, hechas: ids.filter((id) => hechos.includes(id)).length };
}

export function semanaDe(hoy: string): { desde: string; hasta: string } {
  const desde = weekStart(hoy);
  return { desde, hasta: shiftDay(desde, 6) };
}
