import assert from "node:assert/strict";
import test from "node:test";
import { eur, fechaCorta, fechaDiaMes, fechaHoraMadrid, mostCommonDate } from "./format.ts";
import { parseIbkrCsv } from "./ibkr.ts";

test("the usual close is the most common date, and a tie keeps the first", () => {
  assert.equal(mostCommonDate([]), undefined);
  assert.equal(mostCommonDate(["2026-10-23", "2026-10-23", "2026-11-01"]), "2026-10-23");
  assert.equal(mostCommonDate([null, null, "2026-10-23"]), null);
  assert.equal(fechaCorta("2026-10-23"), "23/10");
  assert.equal(eur(1234), "1.234 EUR");
  assert.equal(eur(123493.4), "123.493 EUR");
  assert.equal(eur(-1234), "-1.234 EUR");
  assert.equal(fechaDiaMes("2026-11-17"), "17nov");
  assert.equal(fechaDiaMes("2026-12-09"), "09dic");
  assert.equal(fechaDiaMes("2026-12-10"), "10dic");
  assert.equal(fechaDiaMes("2027-02-24"), "24feb");
  assert.equal(fechaDiaMes("2026-11-09T20:37:25Z"), "09nov");
  assert.equal(fechaDiaMes("2026-11-09T23:30:00Z"), "10nov");
  assert.equal(fechaDiaMes("2026-01-05T12:00:00Z"), "05ene");
  assert.equal(fechaHoraMadrid("2026-11-09T20:37:25Z"), "09/11/2026 21:37");
  assert.equal(fechaHoraMadrid(null), null);
});

test("IBKR positions CSV keeps blanks as missing", () => {
  const parsed = parseIbkrCsv("Symbol,Quantity,CostBasisPrice,Currency,MarkPrice,ReportDate\nMETA,10,615.89,USD,623.21,20261023\nCASH,1,1,EUR,,\n");
  assert.equal(parsed.error, null);
  assert.equal(parsed.rows.length, 1);
  assert.equal(parsed.rows[0].ticker, "META");
  assert.equal(parsed.rows[0].shares, 10);
  assert.equal(parsed.rows[0].avgPrice, 615.89);
  assert.equal(parsed.rows[0].priceDate, "2026-10-23");
  const section = parseIbkrCsv("Positions,Header,Symbol,Quantity\nPositions,Data,ZEG,\n");
  assert.equal(section.rows[0].ticker, "ZEG");
  assert.equal(section.rows[0].shares, null);
});
