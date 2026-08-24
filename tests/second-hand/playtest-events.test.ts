import assert from "node:assert/strict";
import test from "node:test";
import {
  EncounterPhase,
  GameMode,
  appendTransitionEvents,
  assertPlaytestLogSafe,
  createPlaytestLog,
  createSecondHandState,
  deriveCompanionInput,
  serializePlaytestLog,
  stepSecondHand
} from "@star-relay/second-hand";

test("playtest log contains only an anonymous session ID and numeric events", () => {
  let state = createSecondHandState({ mode: GameMode.LocalTwoPlayer });
  let log = createPlaytestLog(
    "0123456789abcdef0123456789abcdef",
    GameMode.LocalTwoPlayer
  );

  while (
    state.encounterPhase !== EncounterPhase.Complete &&
    state.tick < 900
  ) {
    const previous = state;
    state = stepSecondHand(
      state,
      deriveCompanionInput(state, 1) | deriveCompanionInput(state, 2)
    );
    log = appendTransitionEvents(log, previous, state);
  }

  assert.equal(state.encounterPhase, EncounterPhase.Complete);
  assertPlaytestLogSafe(log);
  assert.deepEqual(Object.keys(log).sort(), [
    "events",
    "schemaVersion",
    "sessionId"
  ]);
  assert.ok(log.events.length > 12);
  for (const event of log.events) {
    assert.deepEqual(Object.keys(event).sort(), [
      "actor",
      "code",
      "sequence",
      "tick",
      "value"
    ]);
    for (const value of Object.values(event)) {
      assert.equal(typeof value, "number");
      assert.ok(Number.isSafeInteger(value));
    }
  }

  const serialized = serializePlaytestLog(log);
  assert.equal(serialized.includes("freeText"), false);
  assert.equal(serialized.includes("deviceId"), false);
  assert.equal(serialized.includes("email"), false);
  assert.equal(serialized.includes("ipAddress"), false);
});

test("playtest session ID rejects arbitrary identifiers", () => {
  assert.throws(
    () => createPlaytestLog("not-an-anonymous-id", GameMode.AiCompanion),
    /sessionId/
  );
});

test("playtest export rejects unknown top-level and event fields", () => {
  const log = createPlaytestLog(
    "fedcba9876543210fedcba9876543210",
    GameMode.LocalTwoPlayer
  );
  const topLevelInjection = {
    ...log,
    email: "player@example.invalid"
  };
  assert.throws(
    () => serializePlaytestLog(topLevelInjection),
    /unknown or missing fields/
  );

  const eventInjection = {
    ...log,
    events: [
      {
        ...log.events[0]!,
        deviceId: "device-123"
      }
    ]
  };
  assert.throws(
    () => serializePlaytestLog(eventInjection),
    /unknown or missing fields/
  );
});
