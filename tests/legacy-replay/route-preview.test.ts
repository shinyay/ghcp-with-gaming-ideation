import assert from "node:assert/strict";
import test from "node:test";
import {
  LEGACY_MIRROR_MAX_X,
  LEGACY_MIRROR_MIN_X,
  LEGACY_MIRROR_Y,
  LEGACY_RELAY_HIT_HALF_HEIGHT,
  LEGACY_RELAY_X,
  LEGACY_RELAY_Y,
  LEGACY_REPLAY,
  LegacyInput,
  LegacyPhase,
  createLegacyState,
  predictLegacyRoute,
  stepLegacy,
  type LegacyState
} from "@star-relay/legacy-1998";

/**
 * The route preview must show the trajectory the simulation would really
 * produce. These tests hold the predictor to the simulator, so a preview can
 * never promise a connection the simulation does not deliver.
 */

const READY_TICKS = 48;

function moveTo(state: LegacyState, targetX: number): LegacyState {
  let current = state;
  while (current.playerX < targetX && current.tick < 600) {
    current = stepLegacy(current, LegacyInput.Right);
  }
  return current;
}

function throwAndSettle(state: LegacyState): LegacyState {
  let current = state;
  for (let tick = 0; tick < READY_TICKS; tick += 1) {
    current = stepLegacy(current, LegacyInput.Aim);
  }
  current = stepLegacy(current, LegacyInput.Throw);
  while (
    current.phase !== LegacyPhase.RelaySeated &&
    current.routeMissed === 0 &&
    current.tick < 900
  ) {
    current = stepLegacy(current, LegacyInput.None);
  }
  return current;
}

test("the predictor agrees with the simulation from the starting position", () => {
  const start = createLegacyState(LEGACY_REPLAY.seed);
  const prediction = predictLegacyRoute(start.playerX, start.playerY);
  const settled = throwAndSettle(start);

  assert.equal(prediction.connects, true);
  assert.equal(prediction.outcome, "connects");
  assert.equal(settled.connectedRelay, 1);
  assert.equal(settled.routeMissed, 0);
});

test("the predictor reports a miss wherever the simulation misses", () => {
  const start = createLegacyState(LEGACY_REPLAY.seed);
  let missesFound = 0;

  for (let targetX = start.playerX; targetX <= 7_800; targetX += 240) {
    const positioned = moveTo(createLegacyState(LEGACY_REPLAY.seed), targetX);
    const prediction = predictLegacyRoute(
      positioned.playerX,
      positioned.playerY
    );
    const settled = throwAndSettle(positioned);
    const simulationConnected = settled.connectedRelay === 1;

    assert.equal(
      prediction.connects,
      simulationConnected,
      `prediction disagreed with the simulation at playerX ${positioned.playerX}`
    );
    assert.equal(prediction.banked, settled.banked === 1);
    if (!simulationConnected) {
      missesFound += 1;
    }
  }

  assert.ok(missesFound > 0, "no reachable miss was exercised");
});

test("a predicted bank point sits on the mirror inside its span", () => {
  const start = createLegacyState(LEGACY_REPLAY.seed);
  const prediction = predictLegacyRoute(start.playerX, start.playerY);
  const bank = prediction.points[1];

  assert.ok(bank, "a banked route must expose a bank vertex");
  assert.equal(bank.y, LEGACY_MIRROR_Y);
  assert.ok(bank.x >= LEGACY_MIRROR_MIN_X && bank.x <= LEGACY_MIRROR_MAX_X);
});

test("a connecting prediction terminates inside the Relay hitbox", () => {
  const start = createLegacyState(LEGACY_REPLAY.seed);
  const prediction = predictLegacyRoute(start.playerX, start.playerY);
  const terminal = prediction.points[prediction.points.length - 1];

  assert.ok(terminal);
  assert.equal(terminal.x, LEGACY_RELAY_X);
  assert.ok(
    Math.abs(terminal.y - LEGACY_RELAY_Y) <= LEGACY_RELAY_HIT_HALF_HEIGHT
  );
});

test("a route whose bank point clears the mirror span reports a mirror miss", () => {
  const offset = moveTo(createLegacyState(LEGACY_REPLAY.seed), 2_500);
  const prediction = predictLegacyRoute(offset.playerX, offset.playerY);

  assert.equal(prediction.outcome, "misses-mirror");
  assert.equal(prediction.connects, false);
  assert.equal(prediction.banked, false);
  assert.equal(prediction.points.length, 2);

  const terminal = prediction.points[1];
  assert.ok(terminal);
  assert.ok(
    terminal.x > LEGACY_MIRROR_MAX_X,
    "the bank point must land past the mirror for this case"
  );
});

test("a route that never reaches the mirror never claims a bank", () => {
  const start = createLegacyState(LEGACY_REPLAY.seed);
  const far = moveTo(createLegacyState(LEGACY_REPLAY.seed), 7_900);
  const prediction = predictLegacyRoute(far.playerX, far.playerY);

  assert.notEqual(far.playerX, start.playerX);
  assert.equal(prediction.connects, false);
  assert.equal(prediction.banked, false);
  assert.equal(prediction.outcome, "leaves-field");
  assert.equal(prediction.points.length, 2);
});

test("prediction is pure and never advances simulation state", () => {
  const start = createLegacyState(LEGACY_REPLAY.seed);
  const before = JSON.stringify(start);
  predictLegacyRoute(start.playerX, start.playerY);
  assert.equal(JSON.stringify(start), before);
});
