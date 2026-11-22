import assert from "node:assert/strict";
import test from "node:test";
import { storedReports, trackedCompanies } from "./detalle-model.ts";
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

test("informes lists only stored reports, newest date first", () => {
  const rows = storedReports([
    company("OLD", { report_md: "texto", report_sent_on: "2026-01-02" }),
    company("NONE"),
    company("NEW", { report_json: { fecha: "2026-11-01" }, report_sent_on: "2026-11-01" }),
    company("BLANK", { report_md: "   " }),
  ]);
  assert.deepEqual(rows.map((row) => row.ticker), ["NEW", "OLD"]);
});
