import {
  DEFAULT_SECOND_HAND_CONFIG,
  EncounterPhase,
  GameMode,
  RouteId,
  SecondHandInput,
  type LatencyFixture,
  type PlayerId,
  type SecondHandState
} from "./model";
import {
  assertSecondHandInvariants,
  createSecondHandState,
  deriveCompanionInput,
  hashSecondHandState,
  stepSecondHand
} from "./simulation";

export const LATENCY_FIXTURES: readonly LatencyFixture[] = [
  {
    latencyMs: 50,
    p1DelayMs: 50,
    p2DelayMs: 50,
    jitterMs: 0,
    lossPermille: 0,
    seed: 50_050,
    minReceiveTicks: 43,
    maxReceiveTicks: 64,
    maxMissionTicks: 360,
    expectedCompletionTick: 310,
    expectedDeliveredPackets: 614,
    expectedDroppedPackets: 0,
    expectedStalePackets: 0,
    expectedMaxQueueDepth: 8,
    expectedRawIntentTicks: [5, 54, 103, 152, 201, 266],
    expectedAcceptedTicks: [49, 98, 147, 196, 261, 310],
    expectedConvergenceTicks: [44, 44, 44, 44, 60, 44]
  },
  {
    latencyMs: 100,
    p1DelayMs: 100,
    p2DelayMs: 100,
    jitterMs: 17,
    lossPermille: 10,
    seed: 100_100,
    minReceiveTicks: 46,
    maxReceiveTicks: 68,
    maxMissionTicks: 400,
    expectedCompletionTick: 346,
    expectedDeliveredPackets: 669,
    expectedDroppedPackets: 10,
    expectedStalePackets: 59,
    expectedMaxQueueDepth: 16,
    expectedRawIntentTicks: [7, 64, 118, 173, 229, 299],
    expectedAcceptedTicks: [55, 111, 165, 220, 292, 346],
    expectedConvergenceTicks: [48, 47, 47, 47, 63, 47]
  },
  {
    latencyMs: 150,
    p1DelayMs: 150,
    p2DelayMs: 150,
    jitterMs: 33,
    lossPermille: 25,
    seed: 150_150,
    minReceiveTicks: 49,
    maxReceiveTicks: 72,
    maxMissionTicks: 450,
    expectedCompletionTick: 388,
    expectedDeliveredPackets: 738,
    expectedDroppedPackets: 19,
    expectedStalePackets: 236,
    expectedMaxQueueDepth: 23,
    expectedRawIntentTicks: [11, 73, 135, 195, 258, 337],
    expectedAcceptedTicks: [62, 123, 186, 245, 325, 388],
    expectedConvergenceTicks: [51, 50, 51, 50, 67, 51]
  },
  {
    latencyMs: 200,
    p1DelayMs: 200,
    p2DelayMs: 200,
    jitterMs: 50,
    lossPermille: 50,
    seed: 200_200,
    minReceiveTicks: 52,
    maxReceiveTicks: 76,
    maxMissionTicks: 480,
    expectedCompletionTick: 423,
    expectedDeliveredPackets: 782,
    expectedDroppedPackets: 40,
    expectedStalePackets: 323,
    expectedMaxQueueDepth: 30,
    expectedRawIntentTicks: [12, 80, 151, 221, 289, 370],
    expectedAcceptedTicks: [65, 137, 207, 277, 356, 423],
    expectedConvergenceTicks: [53, 57, 56, 56, 67, 53]
  }
];

export interface LatencyFixtureResult {
  readonly fixture: LatencyFixture;
  readonly state: SecondHandState;
  readonly completionTick: number;
  readonly handoffConvergenceTicks: readonly number[];
  readonly authoritativeConvergenceTicks: readonly number[];
  readonly rawIntentTicks: readonly number[];
  readonly acceptedTicks: readonly number[];
  readonly hashes: readonly string[];
  readonly owners: readonly PlayerId[];
  readonly sequences: readonly number[];
}

export function runLatencyFixture(
  fixture: LatencyFixture
): LatencyFixtureResult {
  let state = createSecondHandState({
    ...DEFAULT_SECOND_HAND_CONFIG,
    mode: GameMode.LocalTwoPlayer,
    catchAssist: true,
    p1DelayMs: fixture.p1DelayMs,
    p2DelayMs: fixture.p2DelayMs,
    jitterMs: fixture.jitterMs,
    lossPermille: fixture.lossPermille,
    seed: fixture.seed
  });
  const hashes = [hashSecondHandState(state)];
  const owners: PlayerId[] = [state.owner];
  const sequences = [state.handoffSequence];
  const handoffConvergenceTicks: number[] = [];
  const authoritativeConvergenceTicks: number[] = [];
  const rawIntentTicks: number[] = [];
  const acceptedTicks: number[] = [];
  let pendingIntentTick = 0;

  while (
    state.tick < fixture.maxMissionTicks &&
    state.encounterPhase !== EncounterPhase.Complete
  ) {
    const previousSequence = state.handoffSequence;
    const inputMask =
      deriveCompanionInput(state, 1) | deriveCompanionInput(state, 2);
    const ownerInteraction =
      state.owner === 1
        ? SecondHandInput.P1Interact
        : SecondHandInput.P2Interact;
    if (
      pendingIntentTick === 0 &&
      state.pendingTarget === 0 &&
      state.selectedRoute !== RouteId.None &&
      (inputMask & ownerInteraction) !== 0
    ) {
      pendingIntentTick = state.tick + 1;
    }
    state = stepSecondHand(state, inputMask);
    assertSecondHandInvariants(state);
    if (state.handoffSequence > previousSequence) {
      if (pendingIntentTick === 0) {
        throw new Error("Accepted handoff has no raw sender intent");
      }
      rawIntentTicks.push(pendingIntentTick);
      acceptedTicks.push(state.lastAcceptedTick);
      handoffConvergenceTicks.push(state.lastAcceptedTick - pendingIntentTick);
      authoritativeConvergenceTicks.push(state.lastConvergenceTicks);
      pendingIntentTick = 0;
    }
    hashes.push(hashSecondHandState(state));
    owners.push(state.owner);
    sequences.push(state.handoffSequence);
  }

  return {
    fixture,
    state,
    completionTick: state.missionCompletedTick,
    handoffConvergenceTicks,
    authoritativeConvergenceTicks,
    rawIntentTicks,
    acceptedTicks,
    hashes,
    owners,
    sequences
  };
}
