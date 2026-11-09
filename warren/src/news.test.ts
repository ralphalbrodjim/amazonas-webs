import assert from "node:assert/strict";
import test from "node:test";
import { newsDay, newsGroups } from "./news.ts";

test("a late UTC post falls on the next Madrid day, and filings lead the day", () => {
  assert.equal(newsDay({ published_on: "2026-11-09", published_at: "2026-11-09T23:30:00Z" }), "2026-11-10");
  const groups = newsGroups([
    { ticker: "MSFT", kind: "x_post", published_on: "2026-11-09", published_at: "2026-11-09T19:00:00Z" },
    { ticker: "MSFT", kind: "filing", published_on: "2026-11-09", published_at: "2026-11-09T12:00:00Z" },
    { ticker: "GOOGL", kind: "press", published_on: "2026-11-09", published_at: "2026-11-09T15:00:00Z" },
    { ticker: "MSFT", kind: "filing", published_on: "2026-11-08", published_at: "2026-11-08T12:00:00Z" },
  ], "", "todos");
  assert.deepEqual(groups.map((group) => group.day), ["2026-11-09", "2026-11-08"]);
  assert.deepEqual(groups[0].items.map((item) => item.kind), ["filing", "press", "x_post"]);
  assert.deepEqual(newsGroups(groups.flatMap((group) => group.items), "MSFT", "todos").flatMap((group) => group.items).map((item) => item.ticker), ["MSFT", "MSFT", "MSFT"]);
  assert.deepEqual(newsGroups(groups.flatMap((group) => group.items), "MSFT", "filing").flatMap((group) => group.items).map((item) => item.kind), ["filing", "filing"]);
});
