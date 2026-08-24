export type BinaryFlag = 0 | 1;
export type PlayerId = 1 | 2;

export const GameMode = {
  LocalTwoPlayer: 1,
  AiCompanion: 2
} as const;

export type GameModeValue = (typeof GameMode)[keyof typeof GameMode];

export const RouteId = {
  None: 0,
  Direct: 1,
  Shelter: 2
} as const;

export type RouteIdValue = (typeof RouteId)[keyof typeof RouteId];

export const EncounterPhase = {
  RelayRun: 1,
  PairlessOutbound: 2,
  PairlessReturn: 3,
  Complete: 4
} as const;

export type EncounterPhaseValue =
  (typeof EncounterPhase)[keyof typeof EncounterPhase];

export const CaptionCode = {
  Ready: 1,
  DirectSelected: 2,
  ShelterSelected: 3,
  HandoffSent: 4,
  CatchWindow: 5,
  HandoffMissed: 6,
  RelayActivated: 7,
  PairlessAwoke: 8,
  ReciprocalReturn: 9,
  PairlessReset: 10,
  MissionComplete: 11
} as const;

export type CaptionCodeValue =
  (typeof CaptionCode)[keyof typeof CaptionCode];

export const SecondHandInput = {
  None: 0,
  P1Up: 1 << 0,
  P1Down: 1 << 1,
  P1RouteDirect: 1 << 2,
  P1RouteShelter: 1 << 3,
  P1Interact: 1 << 4,
  P2Up: 1 << 5,
  P2Down: 1 << 6,
  P2RouteDirect: 1 << 7,
  P2RouteShelter: 1 << 8,
  P2Interact: 1 << 9
} as const;

export const PLAYER_ONE_INPUT_MASK =
  SecondHandInput.P1Up |
  SecondHandInput.P1Down |
  SecondHandInput.P1RouteDirect |
  SecondHandInput.P1RouteShelter |
  SecondHandInput.P1Interact;

export const PLAYER_TWO_INPUT_MASK =
  SecondHandInput.P2Up |
  SecondHandInput.P2Down |
  SecondHandInput.P2RouteDirect |
  SecondHandInput.P2RouteShelter |
  SecondHandInput.P2Interact;

export interface RouteDefinition {
  readonly id: Exclude<RouteIdValue, 0>;
  readonly y: number;
  readonly coreStep: number;
  readonly transitTicks: number;
  readonly catchTolerance: number;
  readonly catchWindowTicks: number;
}

export const ROUTE_DEFINITIONS: readonly RouteDefinition[] = [
  {
    id: RouteId.Direct,
    y: 2200,
    coreStep: 224,
    transitTicks: 40,
    catchTolerance: 420,
    catchWindowTicks: 18
  },
  {
    id: RouteId.Shelter,
    y: 5000,
    coreStep: 160,
    transitTicks: 56,
    catchTolerance: 860,
    catchWindowTicks: 36
  }
];

export const RELAY_POINT_X = [3200, 5000, 7800, 9600] as const;

export interface SecondHandConfig {
  readonly mode: GameModeValue;
  readonly catchAssist: boolean;
  readonly p1DelayMs: number;
  readonly p2DelayMs: number;
  readonly jitterMs: number;
  readonly lossPermille: number;
  readonly seed: number;
}

export const DEFAULT_SECOND_HAND_CONFIG: SecondHandConfig = {
  mode: GameMode.LocalTwoPlayer,
  catchAssist: true,
  p1DelayMs: 0,
  p2DelayMs: 0,
  jitterMs: 0,
  lossPermille: 0,
  seed: 1_592_594_596
};

export interface InputPacket {
  readonly deliverTick: number;
  readonly sequence: number;
  readonly player: PlayerId;
  readonly mask: number;
}

export interface SecondHandState {
  readonly schemaVersion: 2;
  readonly tick: number;
  readonly mode: GameModeValue;
  readonly catchAssist: BinaryFlag;
  readonly owner: PlayerId;
  readonly handoffSequence: number;
  readonly pendingTarget: 0 | PlayerId;
  readonly pendingSequence: number;
  readonly selectedRoute: RouteIdValue;
  readonly pendingRoute: RouteIdValue;
  readonly handoffStartedTick: number;
  readonly readyTick: number;
  readonly expireTick: number;
  readonly lastAcceptedTick: number;
  readonly lastConvergenceTicks: number;
  readonly p1Y: number;
  readonly p2Y: number;
  readonly coreX: number;
  readonly coreY: number;
  readonly relayIndex: number;
  readonly relayActivatedMask: number;
  readonly encounterPhase: EncounterPhaseValue;
  readonly pairlessOriginOwner: 0 | PlayerId;
  readonly pairlessDeadlineTick: number;
  readonly pairlessAttempts: number;
  readonly missCount: number;
  readonly missionCompletedTick: number;
  readonly captionCode: CaptionCodeValue;
  readonly p1DelayTicks: number;
  readonly p2DelayTicks: number;
  readonly jitterTicks: number;
  readonly lossPermille: number;
  readonly prngState: number;
  readonly packetSequence: number;
  readonly p1DeliveredSequence: number;
  readonly p2DeliveredSequence: number;
  readonly deliveredPacketCount: number;
  readonly droppedPacketCount: number;
  readonly stalePacketCount: number;
  readonly maxQueueDepth: number;
  readonly inputQueue: readonly InputPacket[];
}

export interface LatencyFixture {
  readonly latencyMs: 50 | 100 | 150 | 200;
  readonly p1DelayMs: number;
  readonly p2DelayMs: number;
  readonly jitterMs: number;
  readonly lossPermille: number;
  readonly seed: number;
  readonly minReceiveTicks: number;
  readonly maxReceiveTicks: number;
  readonly maxMissionTicks: number;
  readonly expectedCompletionTick: number;
  readonly expectedDeliveredPackets: number;
  readonly expectedDroppedPackets: number;
  readonly expectedStalePackets: number;
  readonly expectedMaxQueueDepth: number;
  readonly expectedRawIntentTicks: readonly number[];
  readonly expectedAcceptedTicks: readonly number[];
  readonly expectedConvergenceTicks: readonly number[];
}
