import assert from "node:assert/strict";
import test from "node:test";
import { fmtCompact } from "./format.ts";
import { isQuarter, seriesYears } from "./years.ts";

test("MSFT statement figures stay in billions with one decimal", () => {
  assert.equal(fmtCompact(74_071_000_000), "74,1 B");
  assert.equal(fmtCompact(71_611_000_000), "71,6 B");
  assert.equal(fmtCompact(66_987_000_000), "67,0 B");
  assert.equal(fmtCompact(19_257_000_000), "19,3 B");
  assert.equal(fmtCompact(25_663_000_000), "25,7 B");
  assert.equal(fmtCompact(18_633_000_000), "18,6 B");
  assert.equal(fmtCompact(245_122_000_000), "245,1 B");
});

test("each period keeps SEC, then TIKR, then Excel", () => {
  const rows = [
    { source: "Excel", fiscal_label: "2024", filed_on: null },
    { source: "SEC", fiscal_label: "2024", filed_on: "2026-07-29" },
    { source: "TIKR", fiscal_label: "2027e", filed_on: null },
    { source: "Excel", fiscal_label: "2027e", filed_on: null },
    { source: "Excel", fiscal_label: "2028e", filed_on: null },
    { source: "SEC", fiscal_label: "2024Q3", filed_on: "2025-10-29" },
  ];
  assert.equal(isQuarter("2026e"), false);
  assert.equal(isQuarter("FY25"), false);
  const annual = seriesYears(rows, "anual");
  assert.deepEqual(annual.map((row) => [row.fiscal_label, row.source]), [["2024", "SEC"], ["2027e", "TIKR"], ["2028e", "Excel"]]);
  assert.deepEqual(seriesYears(rows, "trimestre").map((row) => row.fiscal_label), ["2024Q3"]);
  assert.deepEqual(seriesYears([{ source: "Otro", fiscal_label: "2024", filed_on: null }], "anual"), []);
});
