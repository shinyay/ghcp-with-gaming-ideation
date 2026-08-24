import {
  FIXED_TICKS_PER_SECOND,
  hashCanonical,
  nextXorShift32,
  serializeIntegerState
} from "@star-relay/game-core";

export const LEGACY_DURATION_TICKS = 30 * FIXED_TICKS_PER_SECOND;
export const LEGACY_SEED = 0x5a17c0de;
export const LEGACY_WORLD_WIDTH = 12_800;
export const LEGACY_WORLD_HEIGHT = 7_200;
export const LEGACY_HELD_SPEED = 80;
export const LEGACY_FREE_SPEED = 120;
export const LEGACY_ROUTE_READY_TICKS = 48;
export const LEGACY_RELAY_SEAT_TICKS = 90;
export const LEGACY_CATCH_RADIUS = 620;
export const LEGACY_PERFECT_RADIUS = 280;
export const LEGACY_OUTBOUND_VX = 180;
export const LEGACY_OUTBOUND_VY = -120;
export const LEGACY_RETURN_VX = -240;

const PLAYER_MIN_X = 900;
const PLAYER_MAX_X = 8_000;
const PLAYER_MIN_Y = 900;
const PLAYER_MAX_Y = 6_300;
const MIRROR_MIN_X = 5_500;
const MIRROR_MAX_X = 7_900;
const MIRROR_Y = 1_500;
const RELAY_X = 12_100;
const RELAY_Y = 4_680;
const RELAY_HIT_HALF_HEIGHT = 460;
const RETURN_TRACKING_SPEED = 48;
const ENEMY_HIT_RADIUS = 420;

const HUM_X = 8_300;
const HUM_Y = 2_120;
const PEAL_X = 9_400;
const PEAL_Y = 2_860;
const CHOIR_NODES = [
  [10_100, 3_330],
  [10_650, 3_700],
  [11_200, 4_070]
] as const;

export const LegacyInput = {
  None: 0,
  Aim: 1 << 0,
  Throw: 1 << 1,
  Catch: 1 << 2,
  Up: 1 << 3,
  Down: 1 << 4,
  Left: 1 << 5,
  Right: 1 << 6
} as const;

export const LegacyPhase = {
  Held: 0,
  Outbound: 1,
  Banked: 2,
  RelaySeated: 3,
  Returning: 4,
  Complete: 5
} as const;

export type LegacyPhase = (typeof LegacyPhase)[keyof typeof LegacyPhase];

export const LegacyCoreOwner = {
  Player: 0,
  Transit: 1,
  Relay: 2
} as const;

export type LegacyCoreOwner =
  (typeof LegacyCoreOwner)[keyof typeof LegacyCoreOwner];

export const LegacyEvent = {
  None: 0,
  RouteReady: 1,
  Throw: 2,
  Bank: 3,
  HumPierced: 4,
  PealSilenced: 5,
  ChoirLink: 6,
  ChoirBroken: 7,
  RelaySeated: 8,
  ReturnPass: 9,
  Catch: 10,
  PerfectCatch: 11,
  Miss: 12,
  RouteMiss: 13
} as const;

export type LegacyEvent = (typeof LegacyEvent)[keyof typeof LegacyEvent];

export interface LegacyState {
  readonly schemaVersion: 2;
  readonly tick: number;
  readonly seed: number;
  readonly rngState: number;
  readonly rngSequence: number;
  readonly phase: LegacyPhase;
  readonly phaseTicks: number;
  readonly coreOwner: LegacyCoreOwner;
  readonly playerX: number;
  readonly playerY: number;
  readonly coreX: number;
  readonly coreY: number;
  readonly coreVx: number;
  readonly coreVy: number;
  readonly routePreviewTicks: number;
  readonly banked: number;
  readonly humCleared: number;
  readonly pealCleared: number;
  readonly choirHits: number;
  readonly connectedRelay: number;
  readonly relaySeatTicks: number;
  readonly catchWindowTicks: number;
  readonly catchQuality: number;
  readonly perfectCatch: number;
  readonly missedCatch: number;
  readonly routeMissed: number;
  readonly chain: number;
  readonly charge: number;
  readonly score: number;
  readonly overrayTriggered: number;
  readonly overrayTicks: number;
  readonly lastEvent: LegacyEvent;
  readonly eventSequence: number;
}

export interface ReplayInputSegment {
  readonly fromTick: number;
  readonly toTick: number;
  readonly mask: number;
}

export interface LegacyReplayFixture {
  readonly seed: number;
  readonly totalTicks: number;
  readonly checkpointTicks: readonly number[];
  readonly inputSegments: readonly ReplayInputSegment[];
}

export interface LegacyReplayResult {
  readonly state: LegacyState;
  readonly serialized: string;
  readonly finalHash: string;
  readonly checkpointHashes: Readonly<Record<string, string>>;
}

export const LEGACY_REPLAY: LegacyReplayFixture = {
  seed: LEGACY_SEED,
  totalTicks: LEGACY_DURATION_TICKS,
  checkpointTicks: [0, 120, 228, 301, 332, 359, 449, 493, 673, 1800],
  inputSegments: [
    { fromTick: 0, toTick: 59, mask: LegacyInput.Right },
    { fromTick: 60, toTick: 119, mask: LegacyInput.Left },
    { fromTick: 180, toTick: 299, mask: LegacyInput.Aim },
    { fromTick: 300, toTick: 300, mask: LegacyInput.Throw },
    { fromTick: 320, toTick: 359, mask: LegacyInput.Right },
    { fromTick: 360, toTick: 399, mask: LegacyInput.Left },
    { fromTick: 492, toTick: 492, mask: LegacyInput.Catch }
  ]
};

export function createLegacyState(seed = LEGACY_SEED): LegacyState {
  return {
    schemaVersion: 2,
    tick: 0,
    seed,
    rngState: seed,
    rngSequence: 0,
    phase: LegacyPhase.Held,
    phaseTicks: 0,
    coreOwner: LegacyCoreOwner.Player,
    playerX: 1_800,
    playerY: 5_200,
    coreX: 1_800,
    coreY: 5_200,
    coreVx: 0,
    coreVy: 0,
    routePreviewTicks: 0,
    banked: 0,
    humCleared: 0,
    pealCleared: 0,
    choirHits: 0,
    connectedRelay: 0,
    relaySeatTicks: 0,
    catchWindowTicks: 0,
    catchQuality: 0,
    perfectCatch: 0,
    missedCatch: 0,
    routeMissed: 0,
    chain: 0,
    charge: 0,
    score: 0,
    overrayTriggered: 0,
    overrayTicks: 0,
    lastEvent: LegacyEvent.None,
    eventSequence: 0
  };
}

function clamp(value: number, minimum: number, maximum: number): number {
  if (value < minimum) {
    return minimum;
  }
  if (value > maximum) {
    return maximum;
  }
  return value;
}

function squaredDistance(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return dx * dx + dy * dy;
}

function isWithin(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  radius: number
): boolean {
  return squaredDistance(x1, y1, x2, y2) <= radius * radius;
}

function isBinary(value: number): boolean {
  return value === 0 || value === 1;
}

export function assertLegacyState(state: LegacyState): void {
  serializeLegacyState(state);

  if (state.tick < 0 || state.phaseTicks < 0 || state.rngSequence < 0) {
    throw new RangeError("Legacy counters cannot be negative.");
  }
  if (
    state.phase < LegacyPhase.Held ||
    state.phase > LegacyPhase.Complete
  ) {
    throw new RangeError(`Invalid legacy phase: ${state.phase}`);
  }
  if (
    state.coreOwner < LegacyCoreOwner.Player ||
    state.coreOwner > LegacyCoreOwner.Relay
  ) {
    throw new RangeError(`Invalid Core owner: ${state.coreOwner}`);
  }
  if (
    state.playerX < PLAYER_MIN_X ||
    state.playerX > PLAYER_MAX_X ||
    state.playerY < PLAYER_MIN_Y ||
    state.playerY > PLAYER_MAX_Y
  ) {
    throw new RangeError("Player is outside the Mirror Corridor.");
  }
  if (
    !isBinary(state.banked) ||
    !isBinary(state.humCleared) ||
    !isBinary(state.pealCleared) ||
    !isBinary(state.connectedRelay) ||
    !isBinary(state.perfectCatch) ||
    !isBinary(state.missedCatch) ||
    !isBinary(state.routeMissed) ||
    !isBinary(state.overrayTriggered)
  ) {
    throw new RangeError("Legacy flags must be binary integers.");
  }
  if (state.choirHits < 0 || state.choirHits > CHOIR_NODES.length) {
    throw new RangeError("CHOIR hit count is outside its fixed node count.");
  }
  if (state.charge < 0 || state.charge > 100 || state.chain < 0) {
    throw new RangeError("Chain or Charge is outside its supported range.");
  }
  if (
    (state.phase === LegacyPhase.Held ||
      state.phase === LegacyPhase.Complete) &&
    state.coreOwner !== LegacyCoreOwner.Player
  ) {
    throw new Error("Held or complete Core must belong to the player.");
  }
  if (
    (state.phase === LegacyPhase.Outbound ||
      state.phase === LegacyPhase.Banked ||
      state.phase === LegacyPhase.Returning) &&
    state.coreOwner !== LegacyCoreOwner.Transit
  ) {
    throw new Error("A flying Core must have transit ownership.");
  }
  if (
    state.phase === LegacyPhase.RelaySeated &&
    state.coreOwner !== LegacyCoreOwner.Relay
  ) {
    throw new Error("A seated Core must belong to the Relay.");
  }
  if (state.perfectCatch === 1 && state.catchQuality !== 2) {
    throw new Error("PERFECT CATCH requires catch quality 2.");
  }
  if (state.overrayTriggered === 1 && state.perfectCatch !== 1) {
    throw new Error("OVERRAY requires a PERFECT CATCH.");
  }
}

export function stepLegacy(
  current: LegacyState,
  inputMask: number
): LegacyState {
  assertLegacyState(current);
  const random = nextXorShift32(current.rngState);

  let phase = current.phase;
  let phaseTicks = current.phaseTicks + 1;
  let coreOwner = current.coreOwner;
  let playerX = current.playerX;
  let playerY = current.playerY;
  let coreX = current.coreX;
  let coreY = current.coreY;
  let coreVx = current.coreVx;
  let coreVy = current.coreVy;
  let routePreviewTicks = current.routePreviewTicks;
  let banked = current.banked;
  let humCleared = current.humCleared;
  let pealCleared = current.pealCleared;
  let choirHits = current.choirHits;
  let connectedRelay = current.connectedRelay;
  let relaySeatTicks = current.relaySeatTicks;
  let catchWindowTicks = current.catchWindowTicks;
  let catchQuality = current.catchQuality;
  let perfectCatch = current.perfectCatch;
  let missedCatch = current.missedCatch;
  let routeMissed = current.routeMissed;
  let chain = current.chain;
  let charge = current.charge;
  let score = current.score;
  let overrayTriggered = current.overrayTriggered;
  let overrayTicks = current.overrayTicks > 0 ? current.overrayTicks - 1 : 0;
  let lastEvent = current.lastEvent;
  let eventSequence = current.eventSequence;

  const signal = (event: LegacyEvent): void => {
    lastEvent = event;
    eventSequence += 1;
  };
  const transition = (
    nextPhase: LegacyPhase,
    nextOwner: LegacyCoreOwner
  ): void => {
    phase = nextPhase;
    coreOwner = nextOwner;
    phaseTicks = 0;
  };
  const failRoute = (): void => {
    routeMissed = 1;
    coreX = playerX;
    coreY = playerY;
    coreVx = 0;
    coreVy = 0;
    transition(LegacyPhase.Complete, LegacyCoreOwner.Player);
    signal(LegacyEvent.RouteMiss);
  };

  const movementSpeed =
    current.coreOwner === LegacyCoreOwner.Player
      ? LEGACY_HELD_SPEED
      : LEGACY_FREE_SPEED;
  const horizontal =
    ((inputMask & LegacyInput.Right) !== 0 ? 1 : 0) -
    ((inputMask & LegacyInput.Left) !== 0 ? 1 : 0);
  const vertical =
    ((inputMask & LegacyInput.Down) !== 0 ? 1 : 0) -
    ((inputMask & LegacyInput.Up) !== 0 ? 1 : 0);
  playerX = clamp(
    playerX + horizontal * movementSpeed,
    PLAYER_MIN_X,
    PLAYER_MAX_X
  );
  playerY = clamp(
    playerY + vertical * movementSpeed,
    PLAYER_MIN_Y,
    PLAYER_MAX_Y
  );

  if (current.phase === LegacyPhase.Held) {
    coreX = playerX;
    coreY = playerY;

    if ((inputMask & LegacyInput.Aim) !== 0) {
      routePreviewTicks = clamp(
        routePreviewTicks + 1,
        0,
        LEGACY_ROUTE_READY_TICKS * 2
      );
      if (routePreviewTicks === LEGACY_ROUTE_READY_TICKS) {
        signal(LegacyEvent.RouteReady);
      }
    } else if ((inputMask & LegacyInput.Throw) === 0) {
      routePreviewTicks = clamp(routePreviewTicks - 2, 0, routePreviewTicks);
    }

    if (
      (inputMask & LegacyInput.Throw) !== 0 &&
      routePreviewTicks >= LEGACY_ROUTE_READY_TICKS
    ) {
      transition(LegacyPhase.Outbound, LegacyCoreOwner.Transit);
      coreVx = LEGACY_OUTBOUND_VX;
      coreVy = LEGACY_OUTBOUND_VY;
      routePreviewTicks = 0;
      signal(LegacyEvent.Throw);
    }
  } else if (current.phase === LegacyPhase.Outbound) {
    const previousY = coreY;
    coreX += coreVx;
    coreY += coreVy;

    if (previousY > MIRROR_Y && coreY <= MIRROR_Y) {
      if (coreX >= MIRROR_MIN_X && coreX <= MIRROR_MAX_X) {
        coreY = MIRROR_Y + (MIRROR_Y - coreY);
        coreVy = -coreVy;
        banked = 1;
        transition(LegacyPhase.Banked, LegacyCoreOwner.Transit);
        signal(LegacyEvent.Bank);
      } else {
        failRoute();
      }
    } else if (
      coreY < 0 ||
      coreX > LEGACY_WORLD_WIDTH ||
      coreX < 0
    ) {
      failRoute();
    }
  } else if (current.phase === LegacyPhase.Banked) {
    coreX += coreVx;
    coreY += coreVy;

    if (
      humCleared === 0 &&
      isWithin(coreX, coreY, HUM_X, HUM_Y, ENEMY_HIT_RADIUS)
    ) {
      humCleared = 1;
      chain += 1;
      charge += 15;
      score += 100;
      signal(LegacyEvent.HumPierced);
    }

    if (
      pealCleared === 0 &&
      isWithin(coreX, coreY, PEAL_X, PEAL_Y, ENEMY_HIT_RADIUS)
    ) {
      pealCleared = 1;
      chain += 1;
      charge += 15;
      score += 150;
      signal(LegacyEvent.PealSilenced);
    }

    if (choirHits < CHOIR_NODES.length) {
      const node = CHOIR_NODES[choirHits];
      if (
        node !== undefined &&
        isWithin(coreX, coreY, node[0], node[1], ENEMY_HIT_RADIUS)
      ) {
        choirHits += 1;
        if (choirHits === CHOIR_NODES.length) {
          chain += 1;
          charge += 20;
          score += 250;
          signal(LegacyEvent.ChoirBroken);
        } else {
          signal(LegacyEvent.ChoirLink);
        }
      }
    }

    if (coreX >= RELAY_X) {
      const relayDeltaY = coreY - RELAY_Y;
      if (
        relayDeltaY >= -RELAY_HIT_HALF_HEIGHT &&
        relayDeltaY <= RELAY_HIT_HALF_HEIGHT
      ) {
        coreX = RELAY_X;
        coreY = RELAY_Y;
        coreVx = 0;
        coreVy = 0;
        connectedRelay = 1;
        relaySeatTicks = 0;
        chain += 1;
        charge += 25;
        score += 300;
        transition(LegacyPhase.RelaySeated, LegacyCoreOwner.Relay);
        signal(LegacyEvent.RelaySeated);
      } else {
        failRoute();
      }
    } else if (
      coreY < 0 ||
      coreY > LEGACY_WORLD_HEIGHT ||
      coreX > LEGACY_WORLD_WIDTH
    ) {
      failRoute();
    }
  } else if (current.phase === LegacyPhase.RelaySeated) {
    coreX = RELAY_X;
    coreY = RELAY_Y;
    relaySeatTicks += 1;

    if (relaySeatTicks >= LEGACY_RELAY_SEAT_TICKS) {
      coreVx = LEGACY_RETURN_VX;
      coreVy = 0;
      transition(LegacyPhase.Returning, LegacyCoreOwner.Transit);
      signal(LegacyEvent.ReturnPass);
    }
  } else if (current.phase === LegacyPhase.Returning) {
    const deltaY = playerY - coreY;
    coreVx = LEGACY_RETURN_VX;
    coreVy = clamp(
      deltaY,
      -RETURN_TRACKING_SPEED,
      RETURN_TRACKING_SPEED
    );
    coreX += coreVx;
    coreY += coreVy;

    const inCatchRange = isWithin(
      coreX,
      coreY,
      playerX,
      playerY,
      LEGACY_CATCH_RADIUS
    );
    catchWindowTicks = inCatchRange ? catchWindowTicks + 1 : 0;

    if ((inputMask & LegacyInput.Catch) !== 0 && inCatchRange) {
      const isPerfect = isWithin(
        coreX,
        coreY,
        playerX,
        playerY,
        LEGACY_PERFECT_RADIUS
      );
      catchQuality = isPerfect ? 2 : 1;
      perfectCatch = isPerfect ? 1 : 0;
      chain += 1;
      charge = clamp(charge + (isPerfect ? 25 : 10), 0, 100);
      score += isPerfect ? 500 : 200;
      coreX = playerX;
      coreY = playerY;
      coreVx = 0;
      coreVy = 0;
      transition(LegacyPhase.Complete, LegacyCoreOwner.Player);

      if (isPerfect) {
        if (charge === 100) {
          overrayTriggered = 1;
          overrayTicks = 180;
        }
        signal(LegacyEvent.PerfectCatch);
      } else {
        signal(LegacyEvent.Catch);
      }
    } else if (coreX < 0) {
      missedCatch = 1;
      catchQuality = 3;
      chain = 0;
      charge = 0;
      coreX = playerX;
      coreY = playerY;
      coreVx = 0;
      coreVy = 0;
      transition(LegacyPhase.Complete, LegacyCoreOwner.Player);
      signal(LegacyEvent.Miss);
    }
  } else {
    coreX = playerX;
    coreY = playerY;
    coreVx = 0;
    coreVy = 0;
  }

  const next: LegacyState = {
    schemaVersion: 2,
    tick: current.tick + 1,
    seed: current.seed,
    rngState: random.state,
    rngSequence: current.rngSequence + 1,
    phase,
    phaseTicks,
    coreOwner,
    playerX,
    playerY,
    coreX,
    coreY,
    coreVx,
    coreVy,
    routePreviewTicks,
    banked,
    humCleared,
    pealCleared,
    choirHits,
    connectedRelay,
    relaySeatTicks,
    catchWindowTicks,
    catchQuality,
    perfectCatch,
    missedCatch,
    routeMissed,
    chain,
    charge,
    score,
    overrayTriggered,
    overrayTicks,
    lastEvent,
    eventSequence
  };
  assertLegacyState(next);
  return next;
}

export function serializeLegacyState(state: LegacyState): string {
  return serializeIntegerState(state.schemaVersion, [
    ["tick", state.tick],
    ["seed", state.seed],
    ["rng_state", state.rngState],
    ["rng_sequence", state.rngSequence],
    ["phase", state.phase],
    ["phase_ticks", state.phaseTicks],
    ["core_owner", state.coreOwner],
    ["player_x", state.playerX],
    ["player_y", state.playerY],
    ["core_x", state.coreX],
    ["core_y", state.coreY],
    ["core_vx", state.coreVx],
    ["core_vy", state.coreVy],
    ["route_preview_ticks", state.routePreviewTicks],
    ["banked", state.banked],
    ["hum_cleared", state.humCleared],
    ["peal_cleared", state.pealCleared],
    ["choir_hits", state.choirHits],
    ["connected_relay", state.connectedRelay],
    ["relay_seat_ticks", state.relaySeatTicks],
    ["catch_window_ticks", state.catchWindowTicks],
    ["catch_quality", state.catchQuality],
    ["perfect_catch", state.perfectCatch],
    ["missed_catch", state.missedCatch],
    ["route_missed", state.routeMissed],
    ["chain", state.chain],
    ["charge", state.charge],
    ["score", state.score],
    ["overray_triggered", state.overrayTriggered],
    ["overray_ticks", state.overrayTicks],
    ["last_event", state.lastEvent],
    ["event_sequence", state.eventSequence]
  ]);
}

export function hashLegacyState(state: LegacyState): string {
  return hashCanonical(serializeLegacyState(state));
}

export function legacyInputAtTick(
  fixture: LegacyReplayFixture,
  tick: number
): number {
  let mask = LegacyInput.None;
  for (const segment of fixture.inputSegments) {
    if (tick >= segment.fromTick && tick <= segment.toTick) {
      mask |= segment.mask;
    }
  }
  return mask;
}

function isCheckpoint(
  checkpointTicks: readonly number[],
  tick: number
): boolean {
  for (const checkpointTick of checkpointTicks) {
    if (checkpointTick === tick) {
      return true;
    }
  }
  return false;
}

export function runLegacyReplay(
  fixture: LegacyReplayFixture = LEGACY_REPLAY
): LegacyReplayResult {
  let state = createLegacyState(fixture.seed);
  const checkpoints: Record<string, string> = {};

  if (isCheckpoint(fixture.checkpointTicks, 0)) {
    checkpoints["0"] = hashLegacyState(state);
  }

  for (let tick = 0; tick < fixture.totalTicks; tick += 1) {
    state = stepLegacy(state, legacyInputAtTick(fixture, tick));
    if (isCheckpoint(fixture.checkpointTicks, state.tick)) {
      checkpoints[String(state.tick)] = hashLegacyState(state);
    }
  }

  const serialized = serializeLegacyState(state);
  return {
    state,
    serialized,
    finalHash: hashCanonical(serialized),
    checkpointHashes: checkpoints
  };
}
