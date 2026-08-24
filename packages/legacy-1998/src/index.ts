import {
  FIXED_TICKS_PER_SECOND,
  hashCanonical,
  nextXorShift32,
  serializeIntegerState
} from "@star-relay/game-core";

export const LEGACY_DURATION_TICKS = 30 * FIXED_TICKS_PER_SECOND;
export const LEGACY_SEED = 0x5a17c0de;

export const LegacyInput = {
  None: 0,
  Aim: 1 << 0,
  Throw: 1 << 1,
  Catch: 1 << 2
} as const;

export type LegacyPhase = 0 | 1 | 2 | 3;

export interface LegacyState {
  readonly schemaVersion: 1;
  readonly tick: number;
  readonly seed: number;
  readonly rngState: number;
  readonly rngSequence: number;
  readonly phase: LegacyPhase;
  readonly playerX: number;
  readonly playerY: number;
  readonly coreX: number;
  readonly coreY: number;
  readonly coreVx: number;
  readonly coreVy: number;
  readonly routePreviewTicks: number;
  readonly banked: number;
  readonly piercedEnemy: number;
  readonly connectedRelay: number;
  readonly perfectCatch: number;
  readonly chain: number;
  readonly charge: number;
  readonly score: number;
  readonly overrayTriggered: number;
  readonly overrayTicks: number;
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
  checkpointTicks: [0, 30, 60, 120, 1800],
  inputSegments: [
    { fromTick: 0, toTick: 29, mask: LegacyInput.Aim },
    { fromTick: 30, toTick: 30, mask: LegacyInput.Throw },
    { fromTick: 110, toTick: 150, mask: LegacyInput.Catch }
  ]
};

export function createLegacyState(seed = LEGACY_SEED): LegacyState {
  return {
    schemaVersion: 1,
    tick: 0,
    seed,
    rngState: seed,
    rngSequence: 0,
    phase: 0,
    playerX: 2000,
    playerY: 5000,
    coreX: 2000,
    coreY: 5000,
    coreVx: 0,
    coreVy: 0,
    routePreviewTicks: 0,
    banked: 0,
    piercedEnemy: 0,
    connectedRelay: 0,
    perfectCatch: 0,
    chain: 0,
    charge: 0,
    score: 0,
    overrayTriggered: 0,
    overrayTicks: 0
  };
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

export function stepLegacy(
  current: LegacyState,
  inputMask: number
): LegacyState {
  const random = nextXorShift32(current.rngState);
  let phase = current.phase;
  let coreX = current.coreX;
  let coreY = current.coreY;
  let coreVx = current.coreVx;
  let coreVy = current.coreVy;
  let routePreviewTicks = current.routePreviewTicks;
  let banked = current.banked;
  let piercedEnemy = current.piercedEnemy;
  let connectedRelay = current.connectedRelay;
  let perfectCatch = current.perfectCatch;
  let chain = current.chain;
  let charge = current.charge;
  let score = current.score;
  let overrayTriggered = current.overrayTriggered;
  let overrayTicks = current.overrayTicks > 0 ? current.overrayTicks - 1 : 0;

  if (phase === 0) {
    if ((inputMask & LegacyInput.Aim) !== 0) {
      routePreviewTicks =
        routePreviewTicks < 60 ? routePreviewTicks + 1 : routePreviewTicks;
    }

    if (
      (inputMask & LegacyInput.Throw) !== 0 &&
      routePreviewTicks >= 12
    ) {
      phase = 1;
      coreVx = 180;
      coreVy = -120;
      routePreviewTicks = 0;
    } else {
      coreX = current.playerX;
      coreY = current.playerY;
    }
  }

  if (phase === 1) {
    coreX += coreVx;
    coreY += coreVy;

    if (coreY <= 1800) {
      coreY = 1800 + (1800 - coreY);
      coreVy = -coreVy;
      banked = 1;
      phase = 2;
    }
  } else if (phase === 2) {
    coreX += coreVx;
    coreY += coreVy;

    if (
      piercedEnemy === 0 &&
      squaredDistance(coreX, coreY, 8500, 3000) <= 450 * 450
    ) {
      piercedEnemy = 1;
      chain += 1;
      charge += 30;
      score += 100;
    }

    if (coreX >= 12000) {
      connectedRelay = 1;
      chain += 1;
      charge += 50;
      score += 200;
      phase = 3;
      coreVx = -240;
      coreVy = coreY > current.playerY ? -8 : 8;
    }
  } else if (phase === 3) {
    coreX += coreVx;
    coreY += coreVy;

    if (
      squaredDistance(coreX, coreY, current.playerX, current.playerY) <=
        320 * 320 &&
      (inputMask & LegacyInput.Catch) !== 0
    ) {
      phase = 0;
      coreX = current.playerX;
      coreY = current.playerY;
      coreVx = 0;
      coreVy = 0;
      perfectCatch = 1;
      chain += 1;
      charge += 20;
      score += 500;
      if (charge >= 100) {
        overrayTriggered = 1;
        overrayTicks = 180;
      }
    }
  }

  return {
    schemaVersion: 1,
    tick: current.tick + 1,
    seed: current.seed,
    rngState: random.state,
    rngSequence: current.rngSequence + 1,
    phase,
    playerX: current.playerX,
    playerY: current.playerY,
    coreX,
    coreY,
    coreVx,
    coreVy,
    routePreviewTicks,
    banked,
    piercedEnemy,
    connectedRelay,
    perfectCatch,
    chain,
    charge,
    score,
    overrayTriggered,
    overrayTicks
  };
}

export function serializeLegacyState(state: LegacyState): string {
  return serializeIntegerState(state.schemaVersion, [
    ["tick", state.tick],
    ["seed", state.seed],
    ["rng_state", state.rngState],
    ["rng_sequence", state.rngSequence],
    ["phase", state.phase],
    ["player_x", state.playerX],
    ["player_y", state.playerY],
    ["core_x", state.coreX],
    ["core_y", state.coreY],
    ["core_vx", state.coreVx],
    ["core_vy", state.coreVy],
    ["route_preview_ticks", state.routePreviewTicks],
    ["banked", state.banked],
    ["pierced_enemy", state.piercedEnemy],
    ["connected_relay", state.connectedRelay],
    ["perfect_catch", state.perfectCatch],
    ["chain", state.chain],
    ["charge", state.charge],
    ["score", state.score],
    ["overray_triggered", state.overrayTriggered],
    ["overray_ticks", state.overrayTicks]
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

export function runLegacyReplay(
  fixture: LegacyReplayFixture = LEGACY_REPLAY
): LegacyReplayResult {
  let state = createLegacyState(fixture.seed);
  const checkpoints: Record<string, string> = {};
  const checkpointSet = new Set(fixture.checkpointTicks);

  if (checkpointSet.has(0)) {
    checkpoints["0"] = hashLegacyState(state);
  }

  for (let tick = 0; tick < fixture.totalTicks; tick += 1) {
    state = stepLegacy(state, legacyInputAtTick(fixture, tick));
    if (checkpointSet.has(state.tick)) {
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
