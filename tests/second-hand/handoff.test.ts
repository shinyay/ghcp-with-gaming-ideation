import assert from "node:assert/strict";
import test from "node:test";
import {
  coreOwnerCount,
  runHandoffFixture
} from "@star-relay/second-hand";

test("local two-player fixture preserves one owner and monotonic sequence", () => {
  const result = runHandoffFixture();
  assert.equal(result.state.owner, 1);
  assert.equal(result.state.handoffSequence, 2);
  assert.equal(result.state.pendingTarget, 0);

  for (const owner of result.owners) {
    assert.equal(coreOwnerCount({ ...result.state, owner }), 1);
  }

  for (let index = 1; index < result.sequences.length; index += 1) {
    const previous = result.sequences[index - 1]!;
    const current = result.sequences[index]!;
    assert.ok(current >= previous);
    assert.ok(current - previous <= 1);
  }

  assert.deepEqual(
    [...new Set(result.sequences)],
    [0, 1, 2]
  );
});

test("handoff fixture is hash deterministic", () => {
  assert.deepEqual(runHandoffFixture().hashes, runHandoffFixture().hashes);
});
