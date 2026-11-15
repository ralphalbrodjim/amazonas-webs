import assert from "node:assert/strict";
import test from "node:test";
import { chooseIncoming } from "./syncChoice.ts";

test("an empty cloud note wins over an old copy left on a phone", () => {
  const choice = chooseIncoming({
    remoteExists: true,
    remote: "",
    local: "Receta vieja de Marta",
    authoritative: true,
    remoteEmpty: true,
    localEmpty: false,
  });
  assert.equal(choice.use, "remote");
  assert.equal(choice.value, "");
});

test("a saved cloud note wins over a different copy on the other phone", () => {
  const choice = chooseIncoming({
    remoteExists: true,
    remote: "Nota nueva",
    local: "Nota vieja",
    authoritative: true,
    remoteEmpty: false,
    localEmpty: false,
  });
  assert.equal(choice.use, "remote");
  assert.equal(choice.value, "Nota nueva");
});

test("with no cloud row, leftover phone text is not uploaded again", () => {
  const choice = chooseIncoming({
    remoteExists: false,
    remote: undefined,
    local: "Receta vieja",
    authoritative: true,
    remoteEmpty: true,
    localEmpty: false,
  });
  assert.equal(choice.use, "none");
});
