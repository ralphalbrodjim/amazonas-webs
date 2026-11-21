import assert from "node:assert/strict";
import test from "node:test";
import { gradeClosed, turnCap } from "./rules.mjs";

const part4 = {
  type: "text",
  part: 4,
  keyword: "WISH",
  answer: ["I wish I had taken that opportunity"],
  partial: ["I wish I took that opportunity"],
};

test("Part 4 scores 2, 1, review or 0", () => {
  assert.equal(gradeClosed(part4, "I wish I had taken that opportunity.").points, 2);
  assert.equal(gradeClosed(part4, "I wish I took that opportunity").points, 1);
  assert.equal(gradeClosed(part4, "I wish I had missed it").status, "review");
  assert.equal(gradeClosed(part4, "I wish I had missed it").points, null);
  assert.equal(gradeClosed(part4, "I regret it").points, 0);
});

test("Part 2 accepts more than one answer for one point", () => {
  const item = { type: "text", part: 2, answer: ["do not have to", "don't have to"] };
  assert.equal(gradeClosed(item, "Don't have to.").points, 1);
  assert.equal(gradeClosed(item, "must not").points, 0);
});

test("Parts 5 to 7 are worth 2 and Parts 1 to 3 are worth 1", () => {
  assert.equal(gradeClosed({ type: "text", part: 5, answer: ["tests later cast doubt on the objection"] }, "Tests later cast doubt on the objection.").points, 2);
  assert.equal(gradeClosed({ type: "choice", part: 1, correct: 1 }, 1).points, 1);
  assert.equal(gradeClosed({ type: "choice", part: 1, correct: 1 }, 0).points, 0);
});

test("a 45 minute speaking practice stops at 8 turns", () => {
  assert.equal(turnCap(20), 4);
  assert.equal(turnCap(45), 8);
  assert.equal(turnCap(60), 8);
});
