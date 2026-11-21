import assert from "node:assert/strict";
import test from "node:test";
import { conCelda, filaDe, isoWeekId, parseWeekGrid, sugerido, textoUsuario, textoVisible, weekStorageKey, type PlanItem } from "./agendaGrid.ts";

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

test("known plan kinds land on the matching column", () => {
  assert.equal(filaDe("ingles"), "ingles");
  assert.equal(filaDe("deporte"), "deporte");
  assert.equal(filaDe("gimnasio"), "deporte");
  assert.equal(filaDe("correr"), "deporte");
  assert.equal(filaDe("teatro"), "cultura");
  assert.equal(filaDe("tarea"), "otros");
});
