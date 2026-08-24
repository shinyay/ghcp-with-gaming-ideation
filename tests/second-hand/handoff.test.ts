import assert from "node:assert/strict";
import test from "node:test";
import {
  CaptionCode,
  EncounterPhase,
  GameMode,
  assertSecondHandInvariants,
  coreOwnerCount,
  createSecondHandState,
  deriveCompanionInput,
  stepSecondHand,
  type SecondHandState
} from "@star-relay/second-hand";

function advanceWithCompanions(
  initial: SecondHandState,
  stop: (state: SecondHandState) => boolean,
  maxTicks: number
): SecondHandState {
  let state = initial;
  let previousSequence = state.handoffSequence;
  while (!stop(state) && state.tick < maxTicks) {
    const input =
      deriveCompanionInput(state, 1) | deriveCompanionInput(state, 2);
    state = stepSecondHand(state, input);
    assertSecondHandInvariants(state);
    assert.equal(coreOwnerCount(state), 1);
    assert.ok(state.handoffSequence >= previousSequence);
    assert.ok(state.handoffSequence - previousSequence <= 1);
    previousSequence = state.handoffSequence;
  }
  return state;
}

test("local two-player roles exchange atomically at each accepted handoff", () => {
  const state = advanceWithCompanions(
    createSecondHandState({ mode: GameMode.LocalTwoPlayer }),
    (current) => current.handoffSequence === 2,
    480
  );

  assert.equal(state.owner, 1);
  assert.equal(state.handoffSequence, 2);
  assert.equal(state.relayIndex, 2);
  assert.equal(state.relayActivatedMask, 0b0011);
  assert.equal(state.pendingTarget, 0);
  assert.ok(state.lastConvergenceTicks > 0);
});

test("PAIRLESS resolves only after the reciprocal return handoff", () => {
  const outboundReady = advanceWithCompanions(
    createSecondHandState({ mode: GameMode.LocalTwoPlayer }),
    (current) =>
      current.encounterPhase === EncounterPhase.PairlessOutbound &&
      current.handoffSequence === 4,
    900
  );
  assert.equal(outboundReady.relayIndex, 4);
  assert.equal(outboundReady.encounterPhase, EncounterPhase.PairlessOutbound);
  assert.equal(outboundReady.missionCompletedTick, 0);

  const returnRequired = advanceWithCompanions(
    outboundReady,
    (current) => current.encounterPhase === EncounterPhase.PairlessReturn,
    1100
  );
  assert.equal(returnRequired.handoffSequence, 5);
  assert.equal(returnRequired.encounterPhase, EncounterPhase.PairlessReturn);
  assert.equal(returnRequired.missionCompletedTick, 0);
  assert.ok(returnRequired.pairlessDeadlineTick > returnRequired.tick);

  const complete = advanceWithCompanions(
    returnRequired,
    (current) => current.encounterPhase === EncounterPhase.Complete,
    1400
  );
  assert.equal(complete.handoffSequence, 6);
  assert.equal(complete.owner, complete.pairlessOriginOwner);
  assert.equal(complete.encounterPhase, EncounterPhase.Complete);
  assert.equal(complete.missionCompletedTick, complete.tick);
});

test("one player plus AI companion can complete the full slice", () => {
  let state = createSecondHandState({
    mode: GameMode.AiCompanion,
    p1DelayMs: 100,
    p2DelayMs: 100,
    jitterMs: 17,
    lossPermille: 10,
    seed: 777
  });

  while (
    state.encounterPhase !== EncounterPhase.Complete &&
    state.tick < 1200
  ) {
    state = stepSecondHand(state, deriveCompanionInput(state, 1));
    assertSecondHandInvariants(state);
  }

  assert.equal(state.encounterPhase, EncounterPhase.Complete);
  assert.equal(state.relayIndex, 4);
  assert.equal(state.handoffSequence, 6);
  assert.ok(state.missionCompletedTick > 0);
});

test("catch availability is observable before an assisted acceptance", () => {
  let state = createSecondHandState({ mode: GameMode.LocalTwoPlayer });
  const captions = new Set<number>([state.captionCode]);
  while (state.handoffSequence === 0 && state.tick < 180) {
    state = stepSecondHand(
      state,
      deriveCompanionInput(state, 1) | deriveCompanionInput(state, 2)
    );
    captions.add(state.captionCode);
  }

  assert.equal(state.handoffSequence, 1);
  assert.equal(captions.has(CaptionCode.CatchWindow), true);
  assert.equal(captions.has(CaptionCode.RelayActivated), true);
});
