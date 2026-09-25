import assert from "node:assert/strict";
import test from "node:test";
import { loneClassParticipantConfirmed } from "../lib/class-lone-participant-recheck.ts";

test("an empty or incomplete class presence snapshot cannot close a room", () => {
  assert.equal(loneClassParticipantConfirmed(null, "self"), false);
  assert.equal(loneClassParticipantConfirmed([], "self"), false);
  assert.equal(loneClassParticipantConfirmed([{ identity: "other" }], "self"), false);
  assert.equal(loneClassParticipantConfirmed([{ identity: "self" }], ""), false);
});

test("only a successful snapshot containing exactly the caller is lone", () => {
  assert.equal(loneClassParticipantConfirmed([{ identity: "self" }], "self"), true);
  assert.equal(loneClassParticipantConfirmed([{ identity: "self" }, { identity: "other" }], "self"), false);
});
