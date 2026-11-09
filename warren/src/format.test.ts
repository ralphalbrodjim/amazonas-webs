import assert from "node:assert/strict";
import test from "node:test";
import { fechaCorta, fechaHoraMadrid, mostCommonDate } from "./format.ts";
import { parseIbkrCsv } from "./ibkr.ts";

test("the usual close is the most common date, and a tie keeps the first", () => {
  assert.equal(mostCommonDate([]), undefined);
  assert.equal(mostCommonDate(["2026-10-23", "2026-10-23", "2026-11-01"]), "2026-10-23");
  assert.equal(mostCommonDate([null, null, "2026-10-23"]), null);
  assert.equal(fechaCorta("2026-10-23"), "23/10");
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
