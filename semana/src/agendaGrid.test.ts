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
    { fecha: "2026-11-10", fila: "run", texto: "4 km · suave" },
    { fecha: "2026-11-10", fila: "ingles", texto: "11:00 Oliver · Use of English" },
  ];
  const vacio = parseWeekGrid(null);
  assert.equal(textoUsuario(vacio, "run", "martes"), undefined);
  assert.equal(textoVisible(vacio, "run", "martes", sugerido(items, "2026-11-10", "run")), "4 km · suave");
  const escrito = conCelda(vacio, "run", "martes", "Descanso");
  assert.equal(textoVisible(escrito, "run", "martes", sugerido(items, "2026-11-10", "run")), "Descanso");
  const borrado = conCelda(vacio, "run", "martes", "");
  assert.equal(textoVisible(borrado, "run", "martes", "4 km · suave"), "");
});

test("known plan kinds land on the matching row", () => {
  assert.equal(filaDe("ingles"), "ingles");
  assert.equal(filaDe("deporte"), "run");
  assert.equal(filaDe("gimnasio"), "gimnasio");
  assert.equal(filaDe("teatro"), "cultura");
  assert.equal(filaDe("tarea"), "otros");
});
