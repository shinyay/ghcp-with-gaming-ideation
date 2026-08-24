import assert from "node:assert/strict";
import test from "node:test";
import {
  EncounterPhase,
  GameMode,
  LATENCY_FIXTURES,
  RouteId,
  SecondHandInput,
  coreOwnerCount,
  createSecondHandState,
  jitterMillisecondsToTicks,
  millisecondsToTicks,
  runLatencyFixture,
  stepSecondHand,
  type SecondHandState
} from "@star-relay/second-hand";

for (const fixture of LATENCY_FIXTURES) {
  test(`${fixture.latencyMs}ms fixture converges within its receive limit`, () => {
    const result = runLatencyFixture(fixture);

    assert.equal(result.state.encounterPhase, EncounterPhase.Complete);
    assert.equal(result.state.relayIndex, 4);
    assert.equal(result.state.handoffSequence, 6);
    assert.equal(result.handoffConvergenceTicks.length, 6);
    assert.equal(result.rawIntentTicks.length, 6);
    assert.equal(result.acceptedTicks.length, 6);
    assert.ok(result.completionTick <= fixture.maxMissionTicks);
    assert.equal(result.completionTick, fixture.expectedCompletionTick);
    assert.equal(
      result.state.deliveredPacketCount,
      fixture.expectedDeliveredPackets
    );
    assert.equal(
      result.state.droppedPacketCount,
      fixture.expectedDroppedPackets
    );
    assert.equal(
      result.state.stalePacketCount,
      fixture.expectedStalePackets
    );
    assert.equal(result.state.maxQueueDepth, fixture.expectedMaxQueueDepth);
    assert.deepEqual(
      result.rawIntentTicks,
      fixture.expectedRawIntentTicks
    );
    assert.deepEqual(result.acceptedTicks, fixture.expectedAcceptedTicks);
    assert.deepEqual(
      result.handoffConvergenceTicks,
      fixture.expectedConvergenceTicks
    );

    for (const owner of result.owners) {
      assert.equal(coreOwnerCount({ owner }), 1);
    }
    for (let index = 1; index < result.sequences.length; index += 1) {
      const previous = result.sequences[index - 1]!;
      const current = result.sequences[index]!;
      assert.ok(current >= previous);
      assert.ok(current - previous <= 1);
    }
    for (const convergenceTicks of result.handoffConvergenceTicks) {
      assert.ok(
        convergenceTicks >= fixture.minReceiveTicks,
        `${convergenceTicks} was below ${fixture.minReceiveTicks}`
      );
      assert.ok(
        convergenceTicks <= fixture.maxReceiveTicks,
        `${convergenceTicks} exceeded ${fixture.maxReceiveTicks}`
      );
    }
  });

  test(`${fixture.latencyMs}ms fixture is deterministic for its seed`, () => {
    const first = runLatencyFixture(fixture);
    const second = runLatencyFixture(fixture);
    assert.deepEqual(first.hashes, second.hashes);
    assert.deepEqual(
      first.handoffConvergenceTicks,
      second.handoffConvergenceTicks
    );
    assert.deepEqual(first.rawIntentTicks, second.rawIntentTicks);
    assert.deepEqual(first.acceptedTicks, second.acceptedTicks);
    assert.equal(first.completionTick, second.completionTick);
  });
}

test("latency presets map to deterministic 60 Hz integer ticks", () => {
  assert.deepEqual(
    LATENCY_FIXTURES.map((fixture) => millisecondsToTicks(fixture.latencyMs)),
    [3, 6, 9, 12]
  );
  assert.deepEqual(
    LATENCY_FIXTURES.map((fixture) =>
      jitterMillisecondsToTicks(fixture.jitterMs)
    ),
    [0, 1, 2, 3]
  );
  assert.deepEqual(
    LATENCY_FIXTURES.map((fixture) => fixture.lossPermille),
    [0, 10, 25, 50]
  );
});

test("latency traces prove that higher-delay fixtures are not no-op aliases", () => {
  const results = LATENCY_FIXTURES.map(runLatencyFixture);
  assert.deepEqual(
    results.map((result) => result.completionTick),
    [310, 346, 388, 423]
  );
  assert.deepEqual(
    results.map((result) => result.state.maxQueueDepth),
    [8, 16, 23, 30]
  );
  assert.deepEqual(
    results.map((result) => result.state.droppedPacketCount),
    [0, 10, 19, 40]
  );
});

test("same-tick packets use the latest player snapshot instead of merging commands", () => {
  const initial = createSecondHandState({
    mode: GameMode.LocalTwoPlayer,
    p1DelayMs: 1000,
    p2DelayMs: 1000
  });
  const state = {
    ...initial,
    packetSequence: 3,
    inputQueue: [
      {
        deliverTick: 1,
        sequence: 1,
        player: 1,
        mask: SecondHandInput.P1Interact
      },
      {
        deliverTick: 1,
        sequence: 3,
        player: 1,
        mask: SecondHandInput.P1RouteDirect
      }
    ] as const
  };

  const next = stepSecondHand(state, SecondHandInput.None);
  assert.equal(next.selectedRoute, RouteId.Direct);
  assert.equal(next.pendingTarget, 0);
});

test("late out-of-order snapshots cannot trigger stale interactions", () => {
  const initial = createSecondHandState({
    mode: GameMode.LocalTwoPlayer,
    p1DelayMs: 1000,
    p2DelayMs: 1000
  });
  let state: SecondHandState = {
    ...initial,
    packetSequence: 3,
    inputQueue: [
      {
        deliverTick: 1,
        sequence: 3,
        player: 1,
        mask: SecondHandInput.P1RouteDirect
      },
      {
        deliverTick: 2,
        sequence: 1,
        player: 1,
        mask: SecondHandInput.P1Interact
      }
    ] as const
  };

  state = stepSecondHand(state, SecondHandInput.None);
  assert.equal(state.selectedRoute, RouteId.Direct);
  state = stepSecondHand(state, SecondHandInput.None);
  assert.equal(state.pendingTarget, 0);
  assert.equal(state.stalePacketCount, 1);
});
