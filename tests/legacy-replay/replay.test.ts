import fixture from "../fixtures/legacy-replay.json";
import assert from "node:assert/strict";
import test from "node:test";
import {
  LEGACY_REPLAY,
  runLegacyReplay
} from "@star-relay/legacy-1998";

test("fixed 1800-tick replay reaches every core-loop event", () => {
  const first = runLegacyReplay();
  const second = runLegacyReplay();

  assert.equal(LEGACY_REPLAY.seed, fixture.seed);
  assert.equal(LEGACY_REPLAY.totalTicks, fixture.total_ticks);
  assert.equal(first.state.tick, 1800);
  assert.equal(first.state.banked, 1);
  assert.equal(first.state.piercedEnemy, 1);
  assert.equal(first.state.connectedRelay, 1);
  assert.equal(first.state.perfectCatch, 1);
  assert.equal(first.state.overrayTriggered, 1);
  assert.equal(first.state.chain, 3);
  assert.equal(first.state.charge, 100);
  assert.equal(first.finalHash, fixture.expected_final_hash);
  assert.deepEqual(first.checkpointHashes, fixture.expected_checkpoint_hashes);
  assert.equal(second.finalHash, first.finalHash);
  assert.deepEqual(second.checkpointHashes, first.checkpointHashes);
});
