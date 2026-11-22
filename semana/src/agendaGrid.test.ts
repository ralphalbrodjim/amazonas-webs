import assert from "node:assert/strict";
import test from "node:test";
import { conCelda, conHoras, etiquetaHoras, filaDe, horasDe, isoWeekId, parseHoras, parseWeekGrid, semanaGuardada, sugerido, textoUsuario, textoVisible, totalHoras, weekStorageKey, type PlanItem } from "./agendaGrid.ts";

test("the week of 9 November 2026 is 2026-W46", () => {
  assert.equal(isoWeekId("2026-11-09"), "2026-W46");
  assert.equal(isoWeekId("2026-11-15"), "2026-W46");
  assert.equal(weekStorageKey("2026-11-09"), "agenda-semana-2026-W46");
});

test("a plan fills an empty cell and never replaces Alberto's text", () => {
  const items: PlanItem[] = [
    { fecha: "2026-11-10", fila: "deporte", texto: "4 km · suave" },
    { fecha: "2026-11-10", fila: "ingles", texto: "11:00 Oliver · Use of English" },
  ];
  const vacio = parseWeekGrid(null);
  assert.equal(textoUsuario(vacio, "deporte", "martes"), undefined);
  assert.equal(textoVisible(vacio, "deporte", "martes", sugerido(items, "2026-11-10", "deporte")), "4 km · suave");
  const escrito = conCelda(vacio, "deporte", "martes", "Descanso");
  assert.equal(textoVisible(escrito, "deporte", "martes", sugerido(items, "2026-11-10", "deporte")), "Descanso");
  const borrado = conCelda(vacio, "deporte", "martes", "");
  assert.equal(textoVisible(borrado, "deporte", "martes", "4 km · suave"), "");
});

test("gimnasio and run become one Deporte cell and cultura stays stored", () => {
  const grid = parseWeekGrid({
    gimnasio: { lunes: "cuerpo completo" },
    run: { lunes: "6 km suave", martes: "6 km suave" },
    cultura: { lunes: "teatro" },
    deporte: { martes: "ya escrito" },
  });
  assert.equal(textoUsuario(grid, "deporte", "lunes"), "cuerpo completo · 6 km suave");
  assert.equal(textoUsuario(grid, "deporte", "martes"), "ya escrito");
  assert.equal(grid.cultura?.lunes, "teatro");
  assert.equal(grid.gimnasio?.lunes, "cuerpo completo");
  assert.equal(grid.run?.lunes, "6 km suave");
});

test("hours stay with the week and an old done tick becomes 1 h", () => {
  const grid = parseWeekGrid({ deporte: { lunes: "cuerpo completo · 6 km suave" }, cultura: { lunes: "teatro" } });
  const marked = conHoras({}, "deporte", "lunes", 1.5);
  const saved = semanaGuardada(grid, marked);
  assert.equal(horasDe(parseHoras(saved), "deporte", "lunes"), 1.5);
  assert.equal(horasDe(parseHoras(saved), "ingles", "lunes"), 0);
  assert.equal(textoUsuario(parseWeekGrid(saved), "deporte", "lunes"), "cuerpo completo · 6 km suave");
  assert.equal(parseWeekGrid(saved).cultura?.lunes, "teatro");
  assert.equal("hecho" in saved, false);
  const cleared = semanaGuardada(grid, conHoras(marked, "deporte", "lunes", 0));
  assert.equal(horasDe(parseHoras(cleared), "deporte", "lunes"), 0);
  assert.equal("horas" in cleared, false);
  const legacy = { deporte: { martes: "clase" }, hecho: { deporte: { martes: true }, ingles: { lunes: false } } };
  assert.equal(horasDe(parseHoras(legacy), "deporte", "martes"), 1);
  assert.equal(horasDe(parseHoras(legacy), "ingles", "lunes"), 0);
  assert.equal(totalHoras(parseHoras({ horas: { deporte: { lunes: 1, martes: 0.5 }, cocina: { miercoles: 0 } } })), 1.5);
  assert.equal(etiquetaHoras(0), "0 h");
  assert.equal(etiquetaHoras(0.5), "0,5 h");
  assert.equal(etiquetaHoras(1.5), "1,5 h");
});

test("known plan kinds land on the matching column", () => {
  assert.equal(filaDe("ingles"), "ingles");
  assert.equal(filaDe("deporte"), "deporte");
  assert.equal(filaDe("gimnasio"), "deporte");
  assert.equal(filaDe("correr"), "deporte");
  assert.equal(filaDe("teatro"), "cultura");
  assert.equal(filaDe("tarea"), "otros");
});
