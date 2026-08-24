import {
  EncounterPhase,
  type GameModeValue,
  type PlayerId,
  type SecondHandState
} from "./model";

export const PlaytestEventCode = {
  SessionStarted: 1,
  RouteSelected: 2,
  HandoffSent: 3,
  HandoffAccepted: 4,
  HandoffMissed: 5,
  RelayActivated: 6,
  PairlessStarted: 7,
  ReciprocalRequested: 8,
  PairlessReset: 9,
  MissionCompleted: 10,
  LatencyConfigured: 11,
  JitterConfigured: 12,
  LossConfigured: 13,
  CatchAssistConfigured: 14,
  SeedConfigured: 15
} as const;

export type PlaytestEventCodeValue =
  (typeof PlaytestEventCode)[keyof typeof PlaytestEventCode];
export type PlaytestActor = 0 | PlayerId;

export interface PlaytestEvent {
  readonly sequence: number;
  readonly tick: number;
  readonly code: PlaytestEventCodeValue;
  readonly actor: PlaytestActor;
  readonly value: number;
}

export interface PlaytestLog {
  readonly schemaVersion: 1;
  readonly sessionId: string;
  readonly events: readonly PlaytestEvent[];
}

const SESSION_ID = /^[0-9a-f]{32}$/;
const LOG_KEYS = ["events", "schemaVersion", "sessionId"] as const;
const EVENT_KEYS = ["actor", "code", "sequence", "tick", "value"] as const;
const EVENT_CODES = new Set<number>(Object.values(PlaytestEventCode));

function assertSafeInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value)) {
    throw new TypeError(`${label} must be a safe integer`);
  }
}

function assertExactKeys(
  value: object,
  expected: readonly string[],
  label: string
): void {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  if (
    actual.length !== sortedExpected.length ||
    actual.some((key, index) => key !== sortedExpected[index])
  ) {
    throw new TypeError(`${label} contains unknown or missing fields`);
  }
}

export function createPlaytestLog(
  sessionId: string,
  mode: GameModeValue
): PlaytestLog {
  if (!SESSION_ID.test(sessionId)) {
    throw new TypeError("sessionId must be 128 random bits encoded as lowercase hex");
  }
  return {
    schemaVersion: 1,
    sessionId,
    events: [
      {
        sequence: 1,
        tick: 0,
        code: PlaytestEventCode.SessionStarted,
        actor: 0,
        value: mode
      }
    ]
  };
}

export function appendPlaytestEvent(
  log: PlaytestLog,
  tick: number,
  code: PlaytestEventCodeValue,
  actor: PlaytestActor,
  value: number
): PlaytestLog {
  assertSafeInteger(tick, "tick");
  assertSafeInteger(code, "code");
  assertSafeInteger(actor, "actor");
  assertSafeInteger(value, "value");
  return {
    ...log,
    events: [
      ...log.events,
      {
        sequence: log.events.length + 1,
        tick,
        code,
        actor,
        value
      }
    ]
  };
}

export function appendTransitionEvents(
  log: PlaytestLog,
  previous: SecondHandState,
  current: SecondHandState
): PlaytestLog {
  let next = log;
  if (
    previous.selectedRoute !== current.selectedRoute &&
    current.selectedRoute !== 0
  ) {
    next = appendPlaytestEvent(
      next,
      current.tick,
      PlaytestEventCode.RouteSelected,
      current.owner,
      current.selectedRoute
    );
  }
  if (previous.pendingTarget === 0 && current.pendingTarget !== 0) {
    next = appendPlaytestEvent(
      next,
      current.tick,
      PlaytestEventCode.HandoffSent,
      current.owner,
      current.pendingRoute
    );
  }
  if (current.handoffSequence > previous.handoffSequence) {
    next = appendPlaytestEvent(
      next,
      current.tick,
      PlaytestEventCode.HandoffAccepted,
      current.owner,
      current.lastConvergenceTicks
    );
  }
  if (current.missCount > previous.missCount) {
    next = appendPlaytestEvent(
      next,
      current.tick,
      PlaytestEventCode.HandoffMissed,
      current.owner,
      current.missCount
    );
  }
  if (current.relayIndex > previous.relayIndex) {
    next = appendPlaytestEvent(
      next,
      current.tick,
      PlaytestEventCode.RelayActivated,
      current.owner,
      current.relayIndex
    );
  }
  if (
    previous.encounterPhase !== current.encounterPhase &&
    current.encounterPhase === EncounterPhase.PairlessOutbound
  ) {
    next = appendPlaytestEvent(
      next,
      current.tick,
      previous.encounterPhase === EncounterPhase.PairlessReturn
        ? PlaytestEventCode.PairlessReset
        : PlaytestEventCode.PairlessStarted,
      current.owner,
      current.pairlessAttempts
    );
  }
  if (
    previous.encounterPhase !== current.encounterPhase &&
    current.encounterPhase === EncounterPhase.PairlessReturn
  ) {
    next = appendPlaytestEvent(
      next,
      current.tick,
      PlaytestEventCode.ReciprocalRequested,
      current.owner,
      current.pairlessDeadlineTick - current.tick
    );
  }
  if (
    previous.encounterPhase !== current.encounterPhase &&
    current.encounterPhase === EncounterPhase.Complete
  ) {
    next = appendPlaytestEvent(
      next,
      current.tick,
      PlaytestEventCode.MissionCompleted,
      current.owner,
      current.missionCompletedTick
    );
  }
  return next;
}

export function assertPlaytestLogSafe(log: PlaytestLog): void {
  assertExactKeys(log, LOG_KEYS, "Playtest log");
  if (!SESSION_ID.test(log.sessionId)) {
    throw new TypeError("Playtest log has an invalid anonymous session ID");
  }
  if (log.schemaVersion !== 1) {
    throw new TypeError("Playtest log schema version is unsupported");
  }
  let previousTick = -1;
  for (let index = 0; index < log.events.length; index += 1) {
    const event = log.events[index]!;
    assertExactKeys(event, EVENT_KEYS, `Playtest event ${index + 1}`);
    const values = [
      event.sequence,
      event.tick,
      event.code,
      event.actor,
      event.value
    ];
    if (values.some((value) => !Number.isSafeInteger(value))) {
      throw new TypeError("Playtest events may contain numeric enums and integers only");
    }
    if (event.sequence !== index + 1) {
      throw new TypeError("Playtest event sequence must be contiguous and monotonic");
    }
    if (event.tick < previousTick || event.tick < 0) {
      throw new TypeError("Playtest event ticks must be non-negative and monotonic");
    }
    if (!EVENT_CODES.has(event.code)) {
      throw new TypeError("Playtest event code must be a declared numeric enum");
    }
    if (event.actor < 0 || event.actor > 2 || event.value < 0) {
      throw new TypeError("Playtest actor and value must use non-negative numeric fields");
    }
    previousTick = event.tick;
  }
}

export function serializePlaytestLog(log: PlaytestLog): string {
  assertPlaytestLogSafe(log);
  const projection: PlaytestLog = {
    schemaVersion: log.schemaVersion,
    sessionId: log.sessionId,
    events: log.events.map((event) => ({
      sequence: event.sequence,
      tick: event.tick,
      code: event.code,
      actor: event.actor,
      value: event.value
    }))
  };
  return `${JSON.stringify(projection, null, 2)}\n`;
}
