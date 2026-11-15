import assert from "node:assert/strict";
import test from "node:test";
import { celdasOrganizacion, textoCelda } from "./organizacionModel.ts";

test("a weekday cell is kept and Kaito is ignored", () => {
  const celdas = celdasOrganizacion([
    { kind: "organizacion", id: "viejo", data: { titulo: "Antes" } },
    { kind: "organizacion_semana", id: "ralph-lunes", data: { jefe: "ralph", dia: "lunes", texto: "Comité" }, sort: 1 },
    { kind: "organizacion_semana", id: "kaito-lunes", data: { jefe: "kaito", dia: "lunes", texto: "Japonés" }, sort: 2 },
    { kind: "organizacion_semana", id: "lola-vacio", data: { jefe: "lola", dia: "martes", texto: "  " }, sort: 3 },
  ]);
  assert.deepEqual(celdas.map((celda) => celda.id), ["ralph-lunes", "lola-vacio"]);
  assert.equal(textoCelda(celdas, "ralph", "lunes"), "Comité");
  assert.equal(textoCelda(celdas, "lola", "martes"), "");
  assert.equal(textoCelda(celdas, "warren", "viernes"), "");
  const finde = celdasOrganizacion([{ kind: "organizacion_semana", id: "rocky-domingo", data: { jefe: "rocky", dia: "domingo", texto: "Descanso" } }]);
  assert.equal(textoCelda(finde, "rocky", "domingo"), "Descanso");
  assert.equal(textoCelda(finde, "rocky", "sabado"), "");
});
