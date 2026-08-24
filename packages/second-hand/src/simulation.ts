import {
  hashCanonical,
  nextXorShift32,
  serializeIntegerState
} from "@star-relay/game-core";
import {
  CaptionCode,
  DEFAULT_SECOND_HAND_CONFIG,
  EncounterPhase,
  GameMode,
  PLAYER_ONE_INPUT_MASK,
  PLAYER_TWO_INPUT_MASK,
  ROUTE_DEFINITIONS,
  RouteId,
  SecondHandInput,
  type InputPacket,
  type PlayerId,
  type RouteDefinition,
  type RouteIdValue,
  type SecondHandConfig,
  type SecondHandState
} from "./model";

const P1_X = 1920;
const P2_X = 10_880;
const START_Y = 3600;
const MIN_Y = 900;
const MAX_Y = 6300;
const PLAYER_STEP = 140;
const CATCH_ASSIST_TOLERANCE = 620;
const CATCH_ASSIST_TICKS = 24;
const PAIRLESS_RETURN_TICKS = 300;
const MAX_DELAY_MS = 2000;
const MAX_JITTER_MS = 1000;

function assertIntegerInRange(
  value: number,
  minimum: number,
  maximum: number,
  label: string
): void {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new RangeError(`${label} must be an integer from ${minimum} to ${maximum}`);
  }
}

export function millisecondsToTicks(milliseconds: number): number {
  assertIntegerInRange(milliseconds, 0, MAX_DELAY_MS, "milliseconds");
  return Math.floor((milliseconds * 60 + 999) / 1000);
}

export function jitterMillisecondsToTicks(milliseconds: number): number {
  assertIntegerInRange(milliseconds, 0, MAX_JITTER_MS, "jitterMilliseconds");
  return Math.floor((milliseconds * 60 + 500) / 1000);
}

function normalizeSeed(seed: number): number {
  assertIntegerInRange(seed, 0, 0xffff_ffff, "seed");
  const normalized = seed >>> 0;
  return normalized === 0 ? DEFAULT_SECOND_HAND_CONFIG.seed : normalized;
}

function resolveConfig(config: Partial<SecondHandConfig>): SecondHandConfig {
  const resolved: SecondHandConfig = {
    mode: config.mode ?? DEFAULT_SECOND_HAND_CONFIG.mode,
    catchAssist: config.catchAssist ?? DEFAULT_SECOND_HAND_CONFIG.catchAssist,
    p1DelayMs: config.p1DelayMs ?? DEFAULT_SECOND_HAND_CONFIG.p1DelayMs,
    p2DelayMs: config.p2DelayMs ?? DEFAULT_SECOND_HAND_CONFIG.p2DelayMs,
    jitterMs: config.jitterMs ?? DEFAULT_SECOND_HAND_CONFIG.jitterMs,
    lossPermille:
      config.lossPermille ?? DEFAULT_SECOND_HAND_CONFIG.lossPermille,
    seed: config.seed ?? DEFAULT_SECOND_HAND_CONFIG.seed
  };

  if (
    resolved.mode !== GameMode.LocalTwoPlayer &&
    resolved.mode !== GameMode.AiCompanion
  ) {
    throw new RangeError("mode must be a supported numeric enum");
  }
  assertIntegerInRange(resolved.p1DelayMs, 0, MAX_DELAY_MS, "p1DelayMs");
  assertIntegerInRange(resolved.p2DelayMs, 0, MAX_DELAY_MS, "p2DelayMs");
  assertIntegerInRange(resolved.jitterMs, 0, MAX_JITTER_MS, "jitterMs");
  assertIntegerInRange(resolved.lossPermille, 0, 999, "lossPermille");
  normalizeSeed(resolved.seed);
  return resolved;
}

export function createSecondHandState(
  config: Partial<SecondHandConfig> = {}
): SecondHandState {
  const resolved = resolveConfig(config);
  const state: SecondHandState = {
    schemaVersion: 2,
    tick: 0,
    mode: resolved.mode,
    catchAssist: resolved.catchAssist ? 1 : 0,
    owner: 1,
    handoffSequence: 0,
    pendingTarget: 0,
    pendingSequence: 0,
    selectedRoute: RouteId.None,
    pendingRoute: RouteId.None,
    handoffStartedTick: 0,
    readyTick: 0,
    expireTick: 0,
    lastAcceptedTick: 0,
    lastConvergenceTicks: 0,
    p1Y: START_Y,
    p2Y: START_Y,
    coreX: P1_X,
    coreY: START_Y,
    relayIndex: 0,
    relayActivatedMask: 0,
    encounterPhase: EncounterPhase.RelayRun,
    pairlessOriginOwner: 0,
    pairlessDeadlineTick: 0,
    pairlessAttempts: 0,
    missCount: 0,
    missionCompletedTick: 0,
    captionCode: CaptionCode.Ready,
    p1DelayTicks: millisecondsToTicks(resolved.p1DelayMs),
    p2DelayTicks: millisecondsToTicks(resolved.p2DelayMs),
    jitterTicks: jitterMillisecondsToTicks(resolved.jitterMs),
    lossPermille: resolved.lossPermille,
    prngState: normalizeSeed(resolved.seed),
    packetSequence: 0,
    p1DeliveredSequence: 0,
    p2DeliveredSequence: 0,
    deliveredPacketCount: 0,
    droppedPacketCount: 0,
    stalePacketCount: 0,
    maxQueueDepth: 0,
    inputQueue: []
  };
  assertSecondHandInvariants(state);
  return state;
}

function routeById(routeId: RouteIdValue): RouteDefinition | undefined {
  if (routeId === RouteId.Direct) {
    return ROUTE_DEFINITIONS[0];
  }
  if (routeId === RouteId.Shelter) {
    return ROUTE_DEFINITIONS[1];
  }
  return undefined;
}

function playerX(player: PlayerId): number {
  return player === 1 ? P1_X : P2_X;
}

function playerY(state: SecondHandState, player: PlayerId): number {
  return player === 1 ? state.p1Y : state.p2Y;
}

function otherPlayer(player: PlayerId): PlayerId {
  return player === 1 ? 2 : 1;
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

function moveAlongSpan(
  current: number,
  up: boolean,
  down: boolean
): number {
  if (up === down) {
    return current;
  }
  if (up) {
    const moved = current - PLAYER_STEP;
    return moved < MIN_Y ? MIN_Y : moved;
  }
  const moved = current + PLAYER_STEP;
  return moved > MAX_Y ? MAX_Y : moved;
}

function routeInputFor(
  player: PlayerId,
  inputMask: number
): RouteIdValue {
  const direct =
    player === 1
      ? SecondHandInput.P1RouteDirect
      : SecondHandInput.P2RouteDirect;
  const shelter =
    player === 1
      ? SecondHandInput.P1RouteShelter
      : SecondHandInput.P2RouteShelter;
  if ((inputMask & direct) !== 0) {
    return RouteId.Direct;
  }
  if ((inputMask & shelter) !== 0) {
    return RouteId.Shelter;
  }
  return RouteId.None;
}

function interactionFor(player: PlayerId, inputMask: number): boolean {
  const interaction =
    player === 1
      ? SecondHandInput.P1Interact
      : SecondHandInput.P2Interact;
  return (inputMask & interaction) !== 0;
}

function clearPending(state: {
  pendingTarget: 0 | PlayerId;
  pendingSequence: number;
  pendingRoute: RouteIdValue;
  handoffStartedTick: number;
  readyTick: number;
  expireTick: number;
}): void {
  state.pendingTarget = 0;
  state.pendingSequence = 0;
  state.pendingRoute = RouteId.None;
  state.handoffStartedTick = 0;
  state.readyTick = 0;
  state.expireTick = 0;
}

function advanceGame(
  current: SecondHandState,
  deliveredInputMask: number
): SecondHandState {
  const tick = current.tick + 1;
  let owner = current.owner;
  let handoffSequence = current.handoffSequence;
  let pendingTarget = current.pendingTarget;
  let pendingSequence = current.pendingSequence;
  let selectedRoute = current.selectedRoute;
  let pendingRoute = current.pendingRoute;
  let handoffStartedTick = current.handoffStartedTick;
  let readyTick = current.readyTick;
  let expireTick = current.expireTick;
  let lastAcceptedTick = current.lastAcceptedTick;
  let lastConvergenceTicks = current.lastConvergenceTicks;
  let p1Y = moveAlongSpan(
    current.p1Y,
    (deliveredInputMask & SecondHandInput.P1Up) !== 0,
    (deliveredInputMask & SecondHandInput.P1Down) !== 0
  );
  let p2Y = moveAlongSpan(
    current.p2Y,
    (deliveredInputMask & SecondHandInput.P2Up) !== 0,
    (deliveredInputMask & SecondHandInput.P2Down) !== 0
  );
  let coreX = current.coreX;
  let coreY = current.coreY;
  let relayIndex = current.relayIndex;
  let relayActivatedMask = current.relayActivatedMask;
  let encounterPhase = current.encounterPhase;
  let pairlessOriginOwner = current.pairlessOriginOwner;
  let pairlessDeadlineTick = current.pairlessDeadlineTick;
  let pairlessAttempts = current.pairlessAttempts;
  let missCount = current.missCount;
  let missionCompletedTick = current.missionCompletedTick;
  let captionCode = current.captionCode;

  const pending = {
    get pendingTarget(): 0 | PlayerId {
      return pendingTarget;
    },
    set pendingTarget(value: 0 | PlayerId) {
      pendingTarget = value;
    },
    get pendingSequence(): number {
      return pendingSequence;
    },
    set pendingSequence(value: number) {
      pendingSequence = value;
    },
    get pendingRoute(): RouteIdValue {
      return pendingRoute;
    },
    set pendingRoute(value: RouteIdValue) {
      pendingRoute = value;
    },
    get handoffStartedTick(): number {
      return handoffStartedTick;
    },
    set handoffStartedTick(value: number) {
      handoffStartedTick = value;
    },
    get readyTick(): number {
      return readyTick;
    },
    set readyTick(value: number) {
      readyTick = value;
    },
    get expireTick(): number {
      return expireTick;
    },
    set expireTick(value: number) {
      expireTick = value;
    }
  };

  if (
    encounterPhase === EncounterPhase.PairlessReturn &&
    pairlessDeadlineTick > 0 &&
    tick > pairlessDeadlineTick
  ) {
    clearPending(pending);
    selectedRoute = RouteId.None;
    encounterPhase = EncounterPhase.PairlessOutbound;
    pairlessOriginOwner = owner;
    pairlessDeadlineTick = 0;
    pairlessAttempts += 1;
    captionCode = CaptionCode.PairlessReset;
    coreX = playerX(owner);
    coreY = owner === 1 ? p1Y : p2Y;
  }

  if (
    pendingTarget === 0 &&
    encounterPhase !== EncounterPhase.Complete
  ) {
    const requestedRoute = routeInputFor(owner, deliveredInputMask);
    if (requestedRoute !== RouteId.None) {
      selectedRoute = requestedRoute;
      captionCode =
        requestedRoute === RouteId.Direct
          ? CaptionCode.DirectSelected
          : CaptionCode.ShelterSelected;
    }

    const route = routeById(selectedRoute);
    if (route !== undefined && interactionFor(owner, deliveredInputMask)) {
      pendingTarget = otherPlayer(owner);
      pendingSequence = handoffSequence + 1;
      pendingRoute = route.id;
      handoffStartedTick = tick;
      readyTick = tick + route.transitTicks;
      expireTick =
        readyTick +
        route.catchWindowTicks +
        (current.catchAssist === 1 ? CATCH_ASSIST_TICKS : 0);
      coreX = playerX(owner);
      coreY = owner === 1 ? p1Y : p2Y;
      captionCode = CaptionCode.HandoffSent;
    }
  }

  if (pendingTarget !== 0) {
    const route = routeById(pendingRoute);
    if (route === undefined) {
      throw new Error("Pending handoff must have a route");
    }
    const targetX = playerX(pendingTarget);
    const targetY = route.y;
    coreX = advanceToward(coreX, targetX, route.coreStep);
    coreY = advanceToward(coreY, targetY, route.coreStep);

    if (tick === readyTick) {
      captionCode = CaptionCode.CatchWindow;
    }

    const receiverY = pendingTarget === 1 ? p1Y : p2Y;
    const tolerance =
      route.catchTolerance +
      (current.catchAssist === 1 ? CATCH_ASSIST_TOLERANCE : 0);
    const aligned =
      receiverY >= targetY - tolerance && receiverY <= targetY + tolerance;
    const accepted =
      interactionFor(pendingTarget, deliveredInputMask) &&
      tick > readyTick &&
      tick <= expireTick &&
      coreX === targetX &&
      coreY === targetY &&
      aligned;

    if (accepted) {
      const previousOwner = owner;
      owner = pendingTarget;
      handoffSequence = pendingSequence;
      lastAcceptedTick = tick;
      lastConvergenceTicks = tick - handoffStartedTick;
      selectedRoute = RouteId.None;
      clearPending(pending);

      if (encounterPhase === EncounterPhase.RelayRun) {
        relayIndex += 1;
        relayActivatedMask |= 1 << (relayIndex - 1);
        captionCode = CaptionCode.RelayActivated;
        if (relayIndex === 4) {
          encounterPhase = EncounterPhase.PairlessOutbound;
          pairlessOriginOwner = owner;
          pairlessAttempts = 1;
          captionCode = CaptionCode.PairlessAwoke;
        }
      } else if (encounterPhase === EncounterPhase.PairlessOutbound) {
        pairlessOriginOwner =
          pairlessOriginOwner === 0 ? previousOwner : pairlessOriginOwner;
        encounterPhase = EncounterPhase.PairlessReturn;
        pairlessDeadlineTick = tick + PAIRLESS_RETURN_TICKS;
        captionCode = CaptionCode.ReciprocalReturn;
      } else if (encounterPhase === EncounterPhase.PairlessReturn) {
        if (owner === pairlessOriginOwner) {
          encounterPhase = EncounterPhase.Complete;
          pairlessDeadlineTick = 0;
          missionCompletedTick = tick;
          captionCode = CaptionCode.MissionComplete;
        } else {
          encounterPhase = EncounterPhase.PairlessOutbound;
          pairlessOriginOwner = owner;
          pairlessDeadlineTick = 0;
          pairlessAttempts += 1;
          captionCode = CaptionCode.PairlessReset;
        }
      }
    } else if (tick > expireTick) {
      clearPending(pending);
      selectedRoute = RouteId.None;
      missCount += 1;
      captionCode = CaptionCode.HandoffMissed;
      coreX = playerX(owner);
      coreY = owner === 1 ? p1Y : p2Y;
      if (encounterPhase === EncounterPhase.PairlessReturn) {
        encounterPhase = EncounterPhase.PairlessOutbound;
        pairlessOriginOwner = owner;
        pairlessDeadlineTick = 0;
        pairlessAttempts += 1;
        captionCode = CaptionCode.PairlessReset;
      }
    }
  }

  if (pendingTarget === 0) {
    coreX = playerX(owner);
    coreY = owner === 1 ? p1Y : p2Y;
  }

  const next: SecondHandState = {
    ...current,
    tick,
    owner,
    handoffSequence,
    pendingTarget,
    pendingSequence,
    selectedRoute,
    pendingRoute,
    handoffStartedTick,
    readyTick,
    expireTick,
    lastAcceptedTick,
    lastConvergenceTicks,
    p1Y,
    p2Y,
    coreX,
    coreY,
    relayIndex,
    relayActivatedMask,
    encounterPhase,
    pairlessOriginOwner,
    pairlessDeadlineTick,
    pairlessAttempts,
    missCount,
    missionCompletedTick,
    captionCode
  };
  assertSecondHandInvariants(next);
  return next;
}

function insertPacket(
  queue: readonly InputPacket[],
  packet: InputPacket
): InputPacket[] {
  const inserted: InputPacket[] = [];
  let added = false;
  for (const queued of queue) {
    if (
      !added &&
      (packet.deliverTick < queued.deliverTick ||
        (packet.deliverTick === queued.deliverTick &&
          packet.sequence < queued.sequence))
    ) {
      inserted.push(packet);
      added = true;
    }
    inserted.push(queued);
  }
  if (!added) {
    inserted.push(packet);
  }
  return inserted;
}

interface ScheduledInputs {
  readonly queue: readonly InputPacket[];
  readonly prngState: number;
  readonly packetSequence: number;
  readonly droppedPacketCount: number;
}

function schedulePlayerInput(
  state: SecondHandState,
  scheduled: ScheduledInputs,
  player: PlayerId,
  mask: number
): ScheduledInputs {
  const lossStep = nextXorShift32(scheduled.prngState);
  const jitterStep = nextXorShift32(lossStep.state);
  const packetSequence = scheduled.packetSequence + 1;
  if (lossStep.value % 1000 < state.lossPermille) {
    return {
      queue: scheduled.queue,
      prngState: jitterStep.state,
      packetSequence,
      droppedPacketCount: scheduled.droppedPacketCount + 1
    };
  }

  const jitterRange = state.jitterTicks * 2 + 1;
  const jitter =
    jitterRange === 1
      ? 0
      : (jitterStep.value % jitterRange) - state.jitterTicks;
  const baseDelay = player === 1 ? state.p1DelayTicks : state.p2DelayTicks;
  const adjustedDelay = baseDelay + jitter;
  const delay = adjustedDelay < 0 ? 0 : adjustedDelay;
  const packet: InputPacket = {
    deliverTick: state.tick + 1 + delay,
    sequence: packetSequence,
    player,
    mask
  };
  return {
    queue: insertPacket(scheduled.queue, packet),
    prngState: jitterStep.state,
    packetSequence,
    droppedPacketCount: scheduled.droppedPacketCount
  };
}

function collectDeliveredInputs(
  queue: readonly InputPacket[],
  tick: number,
  currentP1Sequence: number,
  currentP2Sequence: number
): {
  readonly deliveredMask: number;
  readonly deliveredPacketCount: number;
  readonly p1DeliveredSequence: number;
  readonly p2DeliveredSequence: number;
  readonly stalePacketCount: number;
  readonly queue: readonly InputPacket[];
} {
  let p1Mask = 0;
  let p2Mask = 0;
  let p1DeliveredSequence = currentP1Sequence;
  let p2DeliveredSequence = currentP2Sequence;
  let deliveredPacketCount = 0;
  let stalePacketCount = 0;
  const remaining: InputPacket[] = [];
  for (const packet of queue) {
    if (packet.deliverTick <= tick) {
      if (packet.player === 1) {
        if (packet.sequence > p1DeliveredSequence) {
          p1Mask = packet.mask;
          p1DeliveredSequence = packet.sequence;
        } else {
          stalePacketCount += 1;
        }
      } else {
        if (packet.sequence > p2DeliveredSequence) {
          p2Mask = packet.mask;
          p2DeliveredSequence = packet.sequence;
        } else {
          stalePacketCount += 1;
        }
      }
      deliveredPacketCount += 1;
    } else {
      remaining.push(packet);
    }
  }
  return {
    deliveredMask: p1Mask | p2Mask,
    deliveredPacketCount,
    p1DeliveredSequence,
    p2DeliveredSequence,
    stalePacketCount,
    queue: remaining
  };
}

function routeChoiceFor(state: SecondHandState): 1 | 2 {
  const decisionIndex =
    state.relayIndex + state.handoffSequence + state.pairlessAttempts;
  return decisionIndex % 2 === 0 ? RouteId.Direct : RouteId.Shelter;
}

function movementBitToward(
  player: PlayerId,
  currentY: number,
  targetY: number
): number {
  if (currentY < targetY) {
    return player === 1 ? SecondHandInput.P1Down : SecondHandInput.P2Down;
  }
  if (currentY > targetY) {
    return player === 1 ? SecondHandInput.P1Up : SecondHandInput.P2Up;
  }
  return SecondHandInput.None;
}

export function deriveCompanionInput(
  state: SecondHandState,
  player: PlayerId
): number {
  if (state.encounterPhase === EncounterPhase.Complete) {
    return SecondHandInput.None;
  }

  const routeDirect =
    player === 1
      ? SecondHandInput.P1RouteDirect
      : SecondHandInput.P2RouteDirect;
  const routeShelter =
    player === 1
      ? SecondHandInput.P1RouteShelter
      : SecondHandInput.P2RouteShelter;
  const interact =
    player === 1
      ? SecondHandInput.P1Interact
      : SecondHandInput.P2Interact;
  const currentY = playerY(state, player);

  if (state.pendingTarget === player) {
    const route = routeById(state.pendingRoute);
    if (route === undefined) {
      return SecondHandInput.None;
    }
    return movementBitToward(player, currentY, route.y) | interact;
  }

  if (state.pendingTarget !== 0) {
    return SecondHandInput.None;
  }

  if (state.owner === player) {
    if (state.selectedRoute === RouteId.None) {
      return routeChoiceFor(state) === RouteId.Direct
        ? routeDirect
        : routeShelter;
    }
    return interact;
  }

  const selected = routeById(state.selectedRoute);
  return selected === undefined
    ? SecondHandInput.None
    : movementBitToward(player, currentY, selected.y);
}

export function stepSecondHand(
  current: SecondHandState,
  inputMask: number
): SecondHandState {
  assertIntegerInRange(inputMask, 0, PLAYER_ONE_INPUT_MASK | PLAYER_TWO_INPUT_MASK, "inputMask");
  const rawInput =
    current.mode === GameMode.AiCompanion
      ? (inputMask & PLAYER_ONE_INPUT_MASK) | deriveCompanionInput(current, 2)
      : inputMask;
  let scheduled: ScheduledInputs = {
    queue: current.inputQueue,
    prngState: current.prngState,
    packetSequence: current.packetSequence,
    droppedPacketCount: current.droppedPacketCount
  };
  scheduled = schedulePlayerInput(
    current,
    scheduled,
    1,
    rawInput & PLAYER_ONE_INPUT_MASK
  );
  scheduled = schedulePlayerInput(
    current,
    scheduled,
    2,
    rawInput & PLAYER_TWO_INPUT_MASK
  );
  const maxQueueDepth =
    scheduled.queue.length > current.maxQueueDepth
      ? scheduled.queue.length
      : current.maxQueueDepth;
  const delivered = collectDeliveredInputs(
    scheduled.queue,
    current.tick + 1,
    current.p1DeliveredSequence,
    current.p2DeliveredSequence
  );
  return advanceGame(
    {
      ...current,
      prngState: scheduled.prngState,
      packetSequence: scheduled.packetSequence,
      p1DeliveredSequence: delivered.p1DeliveredSequence,
      p2DeliveredSequence: delivered.p2DeliveredSequence,
      deliveredPacketCount:
        current.deliveredPacketCount + delivered.deliveredPacketCount,
      droppedPacketCount: scheduled.droppedPacketCount,
      stalePacketCount:
        current.stalePacketCount + delivered.stalePacketCount,
      maxQueueDepth,
      inputQueue: delivered.queue
    },
    delivered.deliveredMask
  );
}

export function coreOwnerCount(
  state: Pick<SecondHandState, "owner">
): number {
  return Number(state.owner === 1) + Number(state.owner === 2);
}

export function assertSecondHandInvariants(state: SecondHandState): void {
  if (coreOwnerCount(state) !== 1) {
    throw new Error("Exactly one player must own the Core");
  }
  const numericValues = [
    state.schemaVersion,
    state.tick,
    state.mode,
    state.catchAssist,
    state.owner,
    state.handoffSequence,
    state.pendingTarget,
    state.pendingSequence,
    state.selectedRoute,
    state.pendingRoute,
    state.handoffStartedTick,
    state.readyTick,
    state.expireTick,
    state.lastAcceptedTick,
    state.lastConvergenceTicks,
    state.p1Y,
    state.p2Y,
    state.coreX,
    state.coreY,
    state.relayIndex,
    state.relayActivatedMask,
    state.encounterPhase,
    state.pairlessOriginOwner,
    state.pairlessDeadlineTick,
    state.pairlessAttempts,
    state.missCount,
    state.missionCompletedTick,
    state.captionCode,
    state.p1DelayTicks,
    state.p2DelayTicks,
    state.jitterTicks,
    state.lossPermille,
    state.prngState,
    state.packetSequence,
    state.p1DeliveredSequence,
    state.p2DeliveredSequence,
    state.deliveredPacketCount,
    state.droppedPacketCount,
    state.stalePacketCount,
    state.maxQueueDepth
  ];
  for (const value of numericValues) {
    if (!Number.isSafeInteger(value)) {
      throw new TypeError("SECOND HAND state must contain safe integers only");
    }
  }
  if (state.handoffSequence < 0 || state.relayIndex < 0 || state.relayIndex > 4) {
    throw new Error("Progress counters are outside their valid range");
  }
  if (
    state.pendingTarget === 0 &&
    (state.pendingSequence !== 0 ||
      state.pendingRoute !== RouteId.None ||
      state.readyTick !== 0 ||
      state.expireTick !== 0)
  ) {
    throw new Error("Idle Core cannot retain pending handoff metadata");
  }
  if (
    state.pendingTarget !== 0 &&
    state.pendingSequence !== state.handoffSequence + 1
  ) {
    throw new Error("Pending handoff sequence must follow the accepted sequence");
  }
  let previousDeliverTick = -1;
  let previousSequence = -1;
  for (const packet of state.inputQueue) {
    const packetValues = [
      packet.deliverTick,
      packet.sequence,
      packet.player,
      packet.mask
    ];
    if (packetValues.some((value) => !Number.isSafeInteger(value))) {
      throw new TypeError("Latency packets must contain safe integers only");
    }
    if (
      packet.deliverTick < previousDeliverTick ||
      (packet.deliverTick === previousDeliverTick &&
        packet.sequence <= previousSequence)
    ) {
      throw new Error("Latency packets must use explicit delivery ordering");
    }
    previousDeliverTick = packet.deliverTick;
    previousSequence = packet.sequence;
  }
}

export function serializeSecondHandState(state: SecondHandState): string {
  const queue: number[] = [];
  for (const packet of state.inputQueue) {
    queue.push(
      packet.deliverTick,
      packet.sequence,
      packet.player,
      packet.mask
    );
  }
  return serializeIntegerState(state.schemaVersion, [
    ["tick", state.tick],
    ["mode", state.mode],
    ["catch_assist", state.catchAssist],
    ["owner", state.owner],
    ["handoff_sequence", state.handoffSequence],
    ["pending_target", state.pendingTarget],
    ["pending_sequence", state.pendingSequence],
    ["selected_route", state.selectedRoute],
    ["pending_route", state.pendingRoute],
    ["handoff_started_tick", state.handoffStartedTick],
    ["ready_tick", state.readyTick],
    ["expire_tick", state.expireTick],
    ["last_accepted_tick", state.lastAcceptedTick],
    ["last_convergence_ticks", state.lastConvergenceTicks],
    ["p1_y", state.p1Y],
    ["p2_y", state.p2Y],
    ["core_x", state.coreX],
    ["core_y", state.coreY],
    ["relay_index", state.relayIndex],
    ["relay_activated_mask", state.relayActivatedMask],
    ["encounter_phase", state.encounterPhase],
    ["pairless_origin_owner", state.pairlessOriginOwner],
    ["pairless_deadline_tick", state.pairlessDeadlineTick],
    ["pairless_attempts", state.pairlessAttempts],
    ["miss_count", state.missCount],
    ["mission_completed_tick", state.missionCompletedTick],
    ["caption_code", state.captionCode],
    ["p1_delay_ticks", state.p1DelayTicks],
    ["p2_delay_ticks", state.p2DelayTicks],
    ["jitter_ticks", state.jitterTicks],
    ["loss_permille", state.lossPermille],
    ["prng_state", state.prngState],
    ["packet_sequence", state.packetSequence],
    ["p1_delivered_sequence", state.p1DeliveredSequence],
    ["p2_delivered_sequence", state.p2DeliveredSequence],
    ["delivered_packet_count", state.deliveredPacketCount],
    ["dropped_packet_count", state.droppedPacketCount],
    ["stale_packet_count", state.stalePacketCount],
    ["max_queue_depth", state.maxQueueDepth],
    ["input_queue", queue]
  ]);
}

export function hashSecondHandState(state: SecondHandState): string {
  return hashCanonical(serializeSecondHandState(state));
}
