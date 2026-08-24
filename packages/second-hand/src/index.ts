import {
  hashCanonical,
  serializeIntegerState
} from "@star-relay/game-core";

export type PlayerId = 1 | 2;
export type PendingTarget = 0 | PlayerId;

export const SecondHandInput = {
  None: 0,
  P1Send: 1 << 0,
  P1Accept: 1 << 1,
  P2Send: 1 << 2,
  P2Accept: 1 << 3
} as const;

export interface SecondHandState {
  readonly schemaVersion: 1;
  readonly tick: number;
  readonly owner: PlayerId;
  readonly handoffSequence: number;
  readonly pendingTarget: PendingTarget;
  readonly pendingSequence: number;
  readonly readyTick: number;
  readonly lastAcceptedTick: number;
  readonly p1X: number;
  readonly p1Y: number;
  readonly p2X: number;
  readonly p2Y: number;
  readonly coreX: number;
  readonly coreY: number;
}

export interface HandoffFixtureResult {
  readonly state: SecondHandState;
  readonly hashes: readonly string[];
  readonly owners: readonly PlayerId[];
  readonly sequences: readonly number[];
}

export function createSecondHandState(): SecondHandState {
  return {
    schemaVersion: 1,
    tick: 0,
    owner: 1,
    handoffSequence: 0,
    pendingTarget: 0,
    pendingSequence: 0,
    readyTick: 0,
    lastAcceptedTick: 0,
    p1X: 2200,
    p1Y: 3600,
    p2X: 10600,
    p2Y: 3600,
    coreX: 2200,
    coreY: 3600
  };
}

function advanceToward(current: number, target: number, step: number): number {
  if (current < target) {
    const advanced = current + step;
    return advanced > target ? target : advanced;
  }
  if (current > target) {
    const advanced = current - step;
    return advanced < target ? target : advanced;
  }
  return current;
}

export function stepSecondHand(
  current: SecondHandState,
  inputMask: number
): SecondHandState {
  const tick = current.tick + 1;
  let owner = current.owner;
  let handoffSequence = current.handoffSequence;
  let pendingTarget = current.pendingTarget;
  let pendingSequence = current.pendingSequence;
  let readyTick = current.readyTick;
  let lastAcceptedTick = current.lastAcceptedTick;
  let coreX = current.coreX;
  let coreY = current.coreY;

  if (pendingTarget === 0) {
    const p1Requested =
      owner === 1 && (inputMask & SecondHandInput.P1Send) !== 0;
    const p2Requested =
      owner === 2 && (inputMask & SecondHandInput.P2Send) !== 0;

    if (p1Requested || p2Requested) {
      pendingTarget = owner === 1 ? 2 : 1;
      pendingSequence = handoffSequence + 1;
      readyTick = tick + 30;
    } else {
      coreX = owner === 1 ? current.p1X : current.p2X;
      coreY = owner === 1 ? current.p1Y : current.p2Y;
    }
  }

  if (pendingTarget !== 0) {
    const targetX = pendingTarget === 1 ? current.p1X : current.p2X;
    const targetY = pendingTarget === 1 ? current.p1Y : current.p2Y;
    coreX = advanceToward(coreX, targetX, 280);
    coreY = advanceToward(coreY, targetY, 280);

    const receiverAccepted =
      (pendingTarget === 1 &&
        (inputMask & SecondHandInput.P1Accept) !== 0) ||
      (pendingTarget === 2 &&
        (inputMask & SecondHandInput.P2Accept) !== 0);

    if (
      receiverAccepted &&
      tick >= readyTick &&
      coreX === targetX &&
      coreY === targetY
    ) {
      owner = pendingTarget;
      handoffSequence = pendingSequence;
      pendingTarget = 0;
      pendingSequence = 0;
      readyTick = 0;
      lastAcceptedTick = tick;
    }
  }

  return {
    schemaVersion: 1,
    tick,
    owner,
    handoffSequence,
    pendingTarget,
    pendingSequence,
    readyTick,
    lastAcceptedTick,
    p1X: current.p1X,
    p1Y: current.p1Y,
    p2X: current.p2X,
    p2Y: current.p2Y,
    coreX,
    coreY
  };
}

export function serializeSecondHandState(state: SecondHandState): string {
  return serializeIntegerState(state.schemaVersion, [
    ["tick", state.tick],
    ["owner", state.owner],
    ["handoff_sequence", state.handoffSequence],
    ["pending_target", state.pendingTarget],
    ["pending_sequence", state.pendingSequence],
    ["ready_tick", state.readyTick],
    ["last_accepted_tick", state.lastAcceptedTick],
    ["p1_x", state.p1X],
    ["p1_y", state.p1Y],
    ["p2_x", state.p2X],
    ["p2_y", state.p2Y],
    ["core_x", state.coreX],
    ["core_y", state.coreY]
  ]);
}

export function hashSecondHandState(state: SecondHandState): string {
  return hashCanonical(serializeSecondHandState(state));
}

export function coreOwnerCount(state: SecondHandState): number {
  return Number(state.owner === 1) + Number(state.owner === 2);
}

export function handoffFixtureInput(tick: number): number {
  if (tick === 4) {
    return SecondHandInput.P1Send;
  }
  if (tick >= 34 && tick <= 50) {
    return SecondHandInput.P2Accept;
  }
  if (tick === 69) {
    return SecondHandInput.P2Send;
  }
  if (tick >= 99 && tick <= 115) {
    return SecondHandInput.P1Accept;
  }
  return SecondHandInput.None;
}

export function runHandoffFixture(totalTicks = 180): HandoffFixtureResult {
  let state = createSecondHandState();
  const hashes: string[] = [hashSecondHandState(state)];
  const owners: PlayerId[] = [state.owner];
  const sequences: number[] = [state.handoffSequence];

  for (let tick = 0; tick < totalTicks; tick += 1) {
    state = stepSecondHand(state, handoffFixtureInput(tick));
    hashes.push(hashSecondHandState(state));
    owners.push(state.owner);
    sequences.push(state.handoffSequence);
  }

  return { state, hashes, owners, sequences };
}
