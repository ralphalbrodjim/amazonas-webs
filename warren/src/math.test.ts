import assert from "node:assert/strict";
import test from "node:test";
import {
  cagr3,
  fcf,
  futurePnlEur,
  isOld,
  maxPriceForCagr,
  methodPrices,
  mixto,
  perTargetGrown,
  pickTarget,
  portfolioCagr,
  positionReturn,
  priceReturn,
  toEur,
  toMajor,
} from "./math.ts";

test("META Warren 3y target matches the Excel growth path, price only", () => {
  const target = perTargetGrown(28.4, 0.187, 20);
  assert.ok(target !== null);
  assert.ok(Math.abs(target - 949.95) < 0.02);
  const ret = priceReturn(target, 623.21);
  const oldWithDividend = (target! + 1 - 623.21) / 623.21;
  assert.notEqual(ret, oldWithDividend);
  assert.ok(Math.abs(cagr3(target, 623.21)! - ((target! / 623.21) ** (1 / 3) - 1)) < 1e-12);
});

test("Mixto is 50/50 and stays empty when TIKR is missing", () => {
  assert.equal(mixto(950, null), null);
  assert.equal(mixto(null, 100), null);
  assert.equal(mixto(100, 300), 200);
  assert.equal(pickTarget("mixto", 20.79, null), null);
  assert.equal(pickTarget("warren", 20.79, null), 20.79);
  assert.equal(pickTarget("tikr", 20.79, null), null);
});

test("15% hurdle and position return do not invent a zero", () => {
  const max = maxPriceForCagr(950, 0.15);
  assert.ok(max !== null && Math.abs(max - 950 / 1.15 ** 3) < 1e-9);
  assert.equal(maxPriceForCagr(null, 0.15), null);
  assert.equal(positionReturn(623.21, 615.89), 623.21 / 615.89 - 1);
  assert.equal(positionReturn(null, 615.89), null);
  assert.equal(priceReturn(null, 100), null);
});

test("EV equity subtracts net debt once and FCF is CFO minus positive CAPEX", () => {
  assert.equal(fcf(100, 30), 70);
  assert.equal(fcf(null, 30), null);
  const price = (70 * 10 - 50 + 0) / 10;
  assert.equal(
    methodPrices({
      target_price: null, bpa: null, per: null, bpa_base: null, growth: null,
      ev_fcf: 10, ev_ebitda: null, ev_ebit: null,
      fcf: 70, ebitda: null, ebit: null, net_debt: 50, equity_adjustments: 0, diluted_shares: 10,
    }).evFcf,
    price,
  );
});

test("direct target is not relabelled as a PER", () => {
  const prices = methodPrices({
    target_price: 20.79, bpa: null, per: null, bpa_base: null, growth: null,
    ev_fcf: null, ev_ebitda: null, ev_ebit: null,
    fcf: null, ebitda: null, ebit: null, net_debt: null, equity_adjustments: null, diluted_shares: null,
  });
  assert.equal(prices.per, null);
  assert.equal(prices.target, 20.79);
});

test("FX, pence and portfolio total", () => {
  assert.equal(toEur(100, "EUR", null), 100);
  assert.equal(toEur(108, "USD", 1.08), 100);
  assert.equal(toEur(108, "USD", null), null);
  assert.deepEqual(toMajor(1696, "GBX"), { price: 16.96, currency: "GBP" });
  assert.equal(futurePnlEur(null, 10, 8, "USD", 1.1), null);
  assert.equal(portfolioCagr([{ valueNow: 100, valueFuture: null }]), null);
  assert.equal(portfolioCagr([]), null);
});

test("a close older than five days is old data; a missing date is not a fake zero", () => {
  assert.equal(isOld("2026-10-23", "2026-11-07"), true);
  assert.equal(isOld("2026-11-06", "2026-11-07"), false);
  assert.equal(isOld(null, "2026-11-07"), false);
});
