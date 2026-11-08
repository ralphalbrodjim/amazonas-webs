import assert from "node:assert/strict";
import test from "node:test";
import { kmDelMes, mergeAgenda, type AgendaBag } from "./agendaStore.ts";

const vacio = (): AgendaBag => ({ entradas: [], ocultas: [], kmMes: {}, runsMigrated: false });

test("known runs are marked done and November is the sum", () => {
  const first = mergeAgenda(vacio(), ["2026-10-13"]);
  assert.equal(first.changed, true);
  const dates = first.bag.entradas.filter((item) => item.categoria === "running" && item.hecho).map((item) => item.fecha);
  for (const fecha of ["2026-10-22", "2026-10-25", "2026-10-31", "2026-11-01", "2026-11-02", "2026-11-07", "2026-10-13"]) {
    assert.ok(dates.includes(fecha), fecha);
  }
  const nov = kmDelMes(first.bag, "2026-11");
  assert.equal(Math.round(nov.km * 100), 1234);
  assert.equal(nov.salidas, 3);
  assert.equal(nov.override, false);
  const oct = kmDelMes(first.bag, "2026-10");
  assert.equal(oct.km, 35.86);
  assert.equal(oct.salidas, 10);
  const second = mergeAgenda(first.bag, ["2026-10-13"]);
  assert.equal(second.changed, false);
});
