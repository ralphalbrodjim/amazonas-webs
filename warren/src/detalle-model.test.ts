import assert from "node:assert/strict";
import test from "node:test";
import { addMonths, cagrTone, compareListado, resultadoDe, storedReports, trackedCompanies, warrenUpdateIso, type SortableListRow } from "./detalle-model.ts";
import type { Company, RadarItem } from "./types.ts";

function company(ticker: string, extra: Partial<Company> = {}): Company {
  return { id: ticker, owner_id: "owner", ticker, name: extra.name ?? ticker, exchange: null, currency: "USD", in_portfolio: extra.in_portfolio ?? false, classification: null, quality_stars: null, verdict: null, notes: null, sort: 0, ...extra };
}

function radar(ticker: string, extra: Partial<RadarItem> = {}): RadarItem {
  return { id: "r-" + ticker, owner_id: "owner", company_id: extra.company_id ?? null, ticker, name: extra.name ?? ticker, status: "vigilar", thesis: "", as_of: null, note: null, sort: 0 };
}

test("listado keeps cartera, seguimiento and radar-only tickers", () => {
  const rows = trackedCompanies(
    [company("META", { name: "Meta", in_portfolio: true }), company("DUOL", { name: "Duolingo" })],
    [radar("DUOL", { company_id: "DUOL" }), radar("JD", { name: "JD.com" })],
  );
  assert.deepEqual(rows.map((row) => [row.ticker, row.where, Boolean(row.company)]), [
    ["DUOL", "Seguimiento", true],
    ["JD", "Radar", false],
    ["META", "Cartera", true],
  ]);
});

test("earnings date is the next one, or the previous one plus three months", () => {
  assert.deepEqual(resultadoDe("2026-12-09", "2026-11-22"), { kind: "known", iso: "2026-12-09", approx: false });
  assert.deepEqual(resultadoDe("2026-11-17", "2026-11-22"), { kind: "estimated", iso: "2027-02-17", approx: true });
  assert.equal(addMonths("2026-11-30", 3), "2027-02-28");
  assert.equal(resultadoDe(null, "2026-11-22"), null);
  assert.equal(resultadoDe("2026-11-22", "2026-11-22")?.kind, "known");
});

test("cagr chips and warren date use stored figures only", () => {
  assert.equal(cagrTone(0.19), "gold");
  assert.equal(cagrTone(0.15), "gold");
  assert.equal(cagrTone(0.149), "neutral");
  assert.equal(cagrTone(0), "neutral");
  assert.equal(cagrTone(-0.02), "red");
  assert.equal(warrenUpdateIso([null, "2026-11-14", "2026-11-20T19:00:00Z"]), "2026-11-20");
  assert.equal(warrenUpdateIso([null, undefined]), null);
});

test("column sort toggles high to low and keeps blanks last", () => {
  const rows: SortableListRow[] = [
    { ticker: "AAA", cagr3: 0.1, cagr1: null, resultados: "2026-12-01", warren: null },
    { ticker: "MMM", cagr3: 0.4, cagr1: -0.1, resultados: null, warren: "2026-11-14" },
    { ticker: "ZZZ", cagr3: null, cagr1: 0.2, resultados: "2027-02-17", warren: "2026-11-20" },
  ];
  const order = (key: "empresa" | "cagr3" | "resultados", dir: "desc" | "asc") =>
    rows.slice().sort((a, b) => compareListado(a, b, key, dir)).map((row) => row.ticker);
  assert.deepEqual(order("cagr3", "desc"), ["MMM", "AAA", "ZZZ"]);
  assert.deepEqual(order("cagr3", "asc"), ["AAA", "MMM", "ZZZ"]);
  assert.deepEqual(order("resultados", "desc"), ["ZZZ", "AAA", "MMM"]);
  assert.deepEqual(order("empresa", "desc"), ["ZZZ", "MMM", "AAA"]);
  assert.deepEqual(order("empresa", "asc"), ["AAA", "MMM", "ZZZ"]);
});

test("informes lists only stored reports, newest date first", () => {
  const rows = storedReports([
    company("OLD", { report_md: "texto", report_sent_on: "2026-01-02" }),
    company("NONE"),
    company("NEW", { report_json: { fecha: "2026-11-01" }, report_sent_on: "2026-11-01" }),
    company("BLANK", { report_md: "   " }),
  ]);
  assert.deepEqual(rows.map((row) => row.ticker), ["NEW", "OLD"]);
});
