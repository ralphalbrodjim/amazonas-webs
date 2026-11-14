import assert from "node:assert/strict";
import test from "node:test";
import { calendarModel, calendarRows, compareRadar, entrada15, inCartera, isSoon, meanRent, passesFloor, shownReturn, virtualLines, weekday } from "./pendientes.ts";
import type { Company, EarningsRow, RadarItem, VirtualEntry } from "./types.ts";

function company(ticker: string, extra: Partial<Company> = {}): Company {
  return { id: ticker, owner_id: "owner", ticker, name: extra.name ?? ticker, exchange: null, currency: extra.currency ?? "USD", in_portfolio: extra.in_portfolio ?? false, classification: null, quality_stars: null, verdict: null, notes: null, sort: 0, ...extra };
}

function radar(ticker: string, extra: Partial<RadarItem> = {}): RadarItem {
  return { id: ticker, owner_id: "owner", company_id: ticker, ticker, name: ticker, status: "vigilar", thesis: "", as_of: null, note: null, sort: 0, price_currency: "USD", scenario: "warren", ...extra };
}

const book = [
  company("BKNG", { name: "Booking", origin: "warren_proposal", report_md: "informe", report_sent_on: "2026-11-10", entry_price_15: 156 }),
  company("INTU", { name: "Intuit", origin: "warren_proposal", report_md: "informe", report_sent_on: "2026-11-10", entry_price_15: 308 }),
  company("DUOL", { name: "Duolingo", origin: "manual" }),
  company("META", { name: "Meta", in_portfolio: true, origin: "manual" }),
];

const radarRows = [
  radar("JD", { price: 27.85, potencial_1a: 0.3978, cagr_3a: 0.3518, target_1a: 38.93, target_3a: 68.8 }),
  radar("BKNG", { price: 159.58, price_date: "2026-11-13", target_1a: 192, target_3a: 232, target_1a_warren: 192, target_3a_warren: 232, potencial_1a: 0.2032, cagr_3a: 0.1328, max_price_15: 152.54 }),
  radar("INTU", { price: 341.7, target_1a: 365, target_3a: 450, target_1a_warren: 365, target_3a_warren: 450, potencial_1a: 0.0682, cagr_3a: 0.0961, max_price_15: 295.88 }),
  radar("META", { price: 628.77, target_1a: 850.1, target_3a: 949.95, target_1a_tikr: 850.1, target_3a_warren: 949.95, potencial_1a: 0.352, cagr_3a: 0.1475, max_price_15: 624.6071789621106 }),
  radar("ADBE", { potencial_1a: 0.123, cagr_3a: null, target_1a: 266.91, target_3a: null }),
  radar("DUOL", { price: 164.12, potencial_1a: -0.0807, cagr_3a: null, target_1a: 150.87, target_3a: null }),
];

test("radar order keeps a missing score after every number and breaks ties by ticker", () => {
  const companyOf = (item: RadarItem) => book.find((row) => row.ticker === item.ticker) ?? company(item.ticker, { in_portfolio: true });
  const byCagr = [...radarRows].sort((a, b) => compareRadar(a, b, "cagr3", companyOf)).map((row) => row.ticker);
  assert.deepEqual(byCagr, ["JD", "META", "BKNG", "INTU", "ADBE", "DUOL"]);
  const starred = [
    radar("ZZ", { company_id: "ZZ" }),
    radar("AA", { company_id: "AA" }),
  ];
  const names = new Map<string, Company>([
    ["ZZ", company("ZZ", { opportunity_stars: 5 })],
    ["AA", company("AA", { opportunity_stars: null })],
  ]);
  assert.deepEqual(starred.sort((a, b) => compareRadar(a, b, "stars", (item) => names.get(item.ticker) ?? null)).map((row) => row.ticker), ["ZZ", "AA"]);
  assert.equal(passesFloor(null, 0), false);
  assert.equal(passesFloor(0.1328, 0.1), true);
  assert.equal(passesFloor(-0.08, 0), false);
  assert.equal(inCartera(book[0], "no"), true);
  assert.equal(inCartera(book[3], "si"), true);
  assert.equal(inCartera(book[3], "no"), false);
});

test("BKNG and INTU targets match the stored radar, and a missing side stays empty", () => {
  assert.equal(shownReturn(192, 159.58, 1).text, "+20,3 %");
  assert.equal(shownReturn(232, 159.58, 3).text, "+13,3 %");
  assert.equal(shownReturn(450, 341.7, 3).text, "+9,6 %");
  assert.equal(shownReturn(null, 164.12, 3).sin, true);
  assert.equal(entrada15(book[0], radarRows[1]).price, 156);
  assert.equal(entrada15(book[1], radarRows[2]).price, 308);
  assert.equal(entrada15(book[3], radarRows[3]).price?.toFixed(2), "624.61");
  assert.equal(entrada15(company("CSU", { in_portfolio: true }), radar("CSU", { max_price_15: null })).price, null);
});

test("virtual portfolio uses the saved buy only when Warren stored one", () => {
  const lines = virtualLines(book, radarRows, [
    { id: "1", owner_id: "owner", company_id: "BKNG", ticker: "BKNG", entered_on: "2026-11-10", entry_price: 159.26, currency: "USD", price_source: "Yahoo", note: "", auto: true, analysis_sent_on: "2026-11-10" },
    { id: "2", owner_id: "owner", company_id: "INTU", ticker: "INTU", entered_on: "2026-11-10", entry_price: 340.44, currency: "USD", price_source: "Yahoo", note: "", auto: true, analysis_sent_on: "2026-11-10" },
  ] satisfies VirtualEntry[]);
  assert.deepEqual(lines.map((line) => line.ticker), ["BKNG", "INTU", "DUOL"]);
  assert.equal(lines[0].entryPrice, 159.26);
  assert.equal(lines[1].entryPrice, 340.44);
  assert.equal(lines[2].pendingBuy, true);
  assert.equal(lines[2].rent, null);
  assert.equal(lines[0].entrada, 156);
  assert.equal(lines[1].entrada, 308);
  assert.equal(lines.some((line) => line.ticker === "META"), false);
  assert.ok(meanRent(lines)! > 0 && meanRent(lines)! < 0.01);
});

test("the calendar keeps the known dates and parks the rest", () => {
  const companies = ["JD", "ADBE", "LULU", "WKL", "AMZN", "BKNG"].map((ticker) => company(ticker, { in_portfolio: ticker !== "BKNG" }));
  const earnings: EarningsRow[] = [
    { company_id: "JD", next_date: "2026-11-17", certainty: null, time_of_day: "pre-market", source: "Nasdaq", pending_reason: null },
    { company_id: "ADBE", next_date: "2026-12-09", certainty: null, time_of_day: null, source: "Nasdaq", pending_reason: null },
    { company_id: "LULU", next_date: "2026-12-10", certainty: null, time_of_day: null, source: "Nasdaq", pending_reason: null },
    { company_id: "WKL", next_date: "2027-02-24", certainty: "confirmed", time_of_day: null, source: "IR", pending_reason: null },
    { company_id: "AMZN", next_date: null, certainty: null, time_of_day: null, source: "Pendiente", pending_reason: "Sin fecha" },
  ];
  const model = calendarModel(calendarRows(companies, earnings), "2026-11-14");
  assert.deepEqual(model.months.map((month) => month.rows.map((row) => row.ticker)), [["JD"], ["ADBE", "LULU"], ["WKL"]]);
  assert.deepEqual(model.undated.map((row) => row.ticker), ["AMZN", "BKNG"]);
  assert.equal(isSoon("2026-11-14", "2026-11-17"), true);
  assert.equal(isSoon("2026-11-14", "2026-12-09"), false);
  assert.equal(weekday("2026-11-17"), "martes");
  assert.equal(weekday("2026-12-09"), "miércoles");
});
