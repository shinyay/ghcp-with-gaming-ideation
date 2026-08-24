import fixture from "../fixtures/legacy-replay.json";
import assert from "node:assert/strict";
import test from "node:test";
import {
  LEGACY_CATCH_RADIUS,
  LEGACY_FREE_SPEED,
  LEGACY_HELD_SPEED,
  LEGACY_OUTBOUND_VX,
  LEGACY_OUTBOUND_VY,
  LEGACY_PERFECT_RADIUS,
  LEGACY_REPLAY,
  LegacyEvent,
  LegacyInput,
  LegacyPhase,
  assertLegacyState,
  createLegacyState,
  legacyInputAtTick,
  runLegacyReplay,
  stepLegacy,
  type LegacyState
} from "@star-relay/legacy-1998";
import { legacyOutcome } from "../../apps/demo-site/src/legacy-view";

function advanceReplay(
  predicate: (state: LegacyState) => boolean,
  maximumTicks = LEGACY_REPLAY.totalTicks
): LegacyState {
  let state = createLegacyState(LEGACY_REPLAY.seed);
  while (!predicate(state) && state.tick < maximumTicks) {
    state = stepLegacy(
      state,
      legacyInputAtTick(LEGACY_REPLAY, state.tick)
    );
  }
  return state;
}

function previewAndThrow(state: LegacyState): LegacyState {
  for (let tick = 0; tick < 48; tick += 1) {
    state = stepLegacy(state, LegacyInput.Aim);
  }
  return stepLegacy(state, LegacyInput.Throw);
}

function advanceToCompletion(state: LegacyState): LegacyState {
  for (let tick = 0; tick < 300 && state.phase !== LegacyPhase.Complete; tick += 1) {
    state = stepLegacy(state, LegacyInput.None);
  }
  return state;
}

test("fixed 1800-tick replay reaches the complete Mirror Corridor loop", () => {
  let state = createLegacyState(LEGACY_REPLAY.seed);
  let eventSequence = state.eventSequence;
  const events: Array<{ tick: number; event: number }> = [];

  for (let tick = 0; tick < LEGACY_REPLAY.totalTicks; tick += 1) {
    state = stepLegacy(state, legacyInputAtTick(LEGACY_REPLAY, tick));
    assertLegacyState(state);
    if (state.eventSequence !== eventSequence) {
      events.push({ tick: state.tick, event: state.lastEvent });
      eventSequence = state.eventSequence;
    }
  }

  const first = runLegacyReplay();
  const second = runLegacyReplay();
  assert.equal(fixture.schema_version, 2);
  assert.equal(LEGACY_REPLAY.seed, fixture.seed);
  assert.equal(LEGACY_REPLAY.totalTicks, fixture.total_ticks);
  assert.deepEqual(LEGACY_REPLAY.checkpointTicks, fixture.checkpoint_ticks);
  assert.deepEqual(events, fixture.expected_events);
  assert.equal(first.state.tick, 1800);
  assert.equal(first.state.phase, fixture.expected_final_state.phase);
  assert.equal(first.state.banked, fixture.expected_final_state.banked);
  assert.equal(first.state.humCleared, fixture.expected_final_state.hum_cleared);
  assert.equal(
    first.state.pealCleared,
    fixture.expected_final_state.peal_cleared
  );
  assert.equal(first.state.choirHits, fixture.expected_final_state.choir_hits);
  assert.equal(
    first.state.connectedRelay,
    fixture.expected_final_state.connected_relay
  );
  assert.equal(
    first.state.perfectCatch,
    fixture.expected_final_state.perfect_catch
  );
  assert.equal(
    first.state.routeMissed,
    fixture.expected_final_state.route_missed
  );
  assert.equal(
    first.state.overrayTriggered,
    fixture.expected_final_state.overray_triggered
  );
  assert.equal(first.state.chain, fixture.expected_final_state.chain);
  assert.equal(first.state.charge, fixture.expected_final_state.charge);
  assert.equal(first.state.score, fixture.expected_final_state.score);
  assert.equal(first.finalHash, fixture.expected_final_hash);
  assert.deepEqual(first.checkpointHashes, fixture.expected_checkpoint_hashes);
  assert.equal(second.finalHash, first.finalHash);
  assert.deepEqual(second.checkpointHashes, first.checkpointHashes);
});

test("held movement is slower than free movement and Core ownership stays valid", () => {
  const held = createLegacyState(LEGACY_REPLAY.seed);
  const heldMoved = stepLegacy(held, LegacyInput.Right);
  assert.equal(heldMoved.playerX - held.playerX, LEGACY_HELD_SPEED);
  assert.equal(heldMoved.coreX, heldMoved.playerX);
  assert.equal(heldMoved.coreY, heldMoved.playerY);

  const outbound = advanceReplay(
    (state) => state.phase === LegacyPhase.Outbound
  );
  assert.equal(outbound.coreVx, LEGACY_OUTBOUND_VX);
  assert.equal(outbound.coreVy, LEGACY_OUTBOUND_VY);
  const freeMoved = stepLegacy(outbound, LegacyInput.Right);
  assert.equal(freeMoved.playerX - outbound.playerX, LEGACY_FREE_SPEED);
  assert.notEqual(freeMoved.coreX, freeMoved.playerX);
  assertLegacyState(freeMoved);
});

test("Bank changes route lineage without direct reward", () => {
  const beforeBank = advanceReplay(
    (state) =>
      state.phase === LegacyPhase.Outbound &&
      state.coreY + state.coreVy <= 1_500
  );
  const banked = stepLegacy(beforeBank, LegacyInput.None);

  assert.equal(banked.banked, 1);
  assert.equal(banked.phase, LegacyPhase.Banked);
  assert.equal(banked.coreVy, -beforeBank.coreVy);
  assert.equal(banked.humCleared, 0);
  assert.equal(banked.score, beforeBank.score);
  assert.equal(banked.chain, beforeBank.chain);
  assert.equal(banked.charge, beforeBank.charge);
});

test("an early Catch completes safely but does not trigger OVERRAY", () => {
  let state = advanceReplay(
    (candidate) => candidate.phase === LegacyPhase.Returning
  );

  while (state.phase === LegacyPhase.Returning) {
    const candidate = stepLegacy(state, LegacyInput.None);
    const dx = candidate.coreX - candidate.playerX;
    const dy = candidate.coreY - candidate.playerY;
    const distanceSquared = dx * dx + dy * dy;
    if (
      distanceSquared <= LEGACY_CATCH_RADIUS * LEGACY_CATCH_RADIUS &&
      distanceSquared > LEGACY_PERFECT_RADIUS * LEGACY_PERFECT_RADIUS
    ) {
      break;
    }
    state = candidate;
  }
  state = stepLegacy(state, LegacyInput.Catch);

  assert.equal(state.phase, LegacyPhase.Complete);
  assert.equal(state.catchQuality, 1);
  assert.equal(state.perfectCatch, 0);
  assert.equal(state.charge, 85);
  assert.equal(state.overrayTriggered, 0);
  assert.equal(legacyOutcome(state), "catch");
  assertLegacyState(state);
});

test("an off-axis throw cannot Bank outside the finite mirror", () => {
  let state = createLegacyState(LEGACY_REPLAY.seed);
  while (state.playerX < 8_000) {
    state = stepLegacy(state, LegacyInput.Right);
  }
  state = advanceToCompletion(previewAndThrow(state));

  assert.equal(state.phase, LegacyPhase.Complete);
  assert.equal(state.routeMissed, 1);
  assert.equal(state.banked, 0);
  assert.equal(state.connectedRelay, 0);
  assert.equal(state.chain, 0);
  assert.equal(state.charge, 0);
  assert.equal(state.score, 0);
  assert.equal(legacyOutcome(state), "route-miss");
});

test("a banked route outside the Relay hitbox grants no Relay reward", () => {
  let state = createLegacyState(LEGACY_REPLAY.seed);
  while (state.playerX > 900) {
    state = stepLegacy(state, LegacyInput.Left);
  }
  for (let tick = 0; tick < 7; tick += 1) {
    state = stepLegacy(state, LegacyInput.Up);
  }
  state = advanceToCompletion(previewAndThrow(state));

  assert.equal(state.phase, LegacyPhase.Complete);
  assert.equal(state.banked, 1);
  assert.equal(state.routeMissed, 1);
  assert.equal(state.connectedRelay, 0);
  assert.equal(state.chain, 0);
  assert.equal(state.charge, 0);
  assert.equal(state.score, 0);
});

test("a low-charge PERFECT CATCH does not claim OVERRAY", () => {
  let state = advanceReplay(
    (candidate) => candidate.phase === LegacyPhase.Returning
  );
  while (state.phase === LegacyPhase.Returning) {
    const candidate = stepLegacy(state, LegacyInput.None);
    const dx = candidate.coreX - candidate.playerX;
    const dy = candidate.coreY - candidate.playerY;
    if (
      dx * dx + dy * dy <=
      LEGACY_PERFECT_RADIUS * LEGACY_PERFECT_RADIUS
    ) {
      break;
    }
    state = candidate;
  }

  state = stepLegacy({ ...state, charge: 0 }, LegacyInput.Catch);
  assert.equal(state.perfectCatch, 1);
  assert.equal(state.charge, 25);
  assert.equal(state.overrayTriggered, 0);
  assert.equal(state.lastEvent, LegacyEvent.PerfectCatch);
  assert.equal(legacyOutcome(state), "perfect");
  assertLegacyState(state);
});
