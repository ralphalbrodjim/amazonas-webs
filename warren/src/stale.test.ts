import assert from "node:assert/strict";
import test from "node:test";
import { expectedCloseDate, failureReason, staleTickerReason } from "./stale.ts";
import type { SyncRun } from "./types.ts";

const mondayEvening = new Date("2026-11-09T20:09:00Z");
const mondayMorning = new Date("2026-11-09T07:00:00Z");

test("expected close is the session that has already finished", () => {
  assert.equal(expectedCloseDate("NASDAQ", "USD", mondayEvening), "2026-11-06");
  assert.equal(expectedCloseDate("TSX", "CAD", mondayEvening), "2026-11-06");
  assert.equal(expectedCloseDate(null, "GBP", mondayEvening), "2026-11-09");
  assert.equal(expectedCloseDate("EPA", "EUR", mondayEvening), "2026-11-09");
  assert.equal(expectedCloseDate(null, "USD", mondayMorning), "2026-11-06");
  assert.equal(expectedCloseDate("EPA", "EUR", mondayMorning), "2026-11-06");
  assert.equal(expectedCloseDate("NASDAQ", "USD", new Date("2026-11-09T21:05:00Z")), "2026-11-09");
  assert.equal(expectedCloseDate(null, "USD", new Date("2026-11-08T18:00:00Z")), "2026-11-06");
});

test("a failed or kept close turns the ticker stale and hides the provider key", () => {
  const secret = "SUPERSECRETKEY";
  const run: SyncRun = {
    id: 1, started_at: "2026-11-09T20:00:49Z", trigger: "manual", status: "ok", prices_ok: 1, prices_fail: 1, fx_ok: true,
    detail: { tickers: [
      { ok: false, ticker: "MSFT", symbol: "MSFT", kept_last: true, error: `We have detected your API key as ${secret} and our standard API rate limit is 25 requests per day.` },
      { ok: true, ticker: "META", symbol: "META", price_date: "2026-11-06" },
    ] },
  };
  const msft = staleTickerReason({ ticker: "MSFT", api_symbol: "MSFT", exchange: null, currency: "USD" }, "2026-10-23", run, mondayMorning);
  assert.match(msft ?? "", /Límite diario/);
  assert.match(msft ?? "", /cierre anterior/);
  assert.equal((msft ?? "").includes(secret), false);
  assert.equal(staleTickerReason({ ticker: "META", api_symbol: "META", exchange: null, currency: "USD" }, "2026-11-06", run, mondayMorning), null);
  const pace = failureReason({ ok: false, ticker: "CSU", symbol: "CSU.TRT", kept_last: true, error: "Please consider spreading out your free API requests more sparingly (1 request per second)." });
  assert.match(pace, /espaciar/);
  assert.equal(pace.includes("1 request"), false);
});

test("an older close is stale even when the latest sync marked it ok", () => {
  const run: SyncRun = {
    id: 2, started_at: "2026-11-09T20:00:49Z", trigger: "manual", status: "ok", prices_ok: 1, prices_fail: 0, fx_ok: true,
    detail: { tickers: [{ ok: true, ticker: "MC", symbol: "MC.PAR", price_date: "2026-11-06" }] },
  };
  const reason = staleTickerReason({ ticker: "MC", api_symbol: "MC.PAR", exchange: "EPA", currency: "EUR" }, "2026-11-06", run, mondayEvening);
  assert.match(reason ?? "", /06\/11/);
  assert.match(reason ?? "", /09\/11/);
});
