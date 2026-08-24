import {
  LEGACY_CATCH_RADIUS,
  LEGACY_DURATION_TICKS,
  LEGACY_OUTBOUND_VX,
  LEGACY_OUTBOUND_VY,
  LEGACY_PERFECT_RADIUS,
  LEGACY_RELAY_SEAT_TICKS,
  LEGACY_REPLAY,
  LEGACY_ROUTE_READY_TICKS,
  LEGACY_WORLD_HEIGHT,
  LEGACY_WORLD_WIDTH,
  LegacyEvent,
  LegacyInput,
  LegacyPhase,
  createLegacyState,
  legacyInputAtTick,
  stepLegacy,
  type LegacyState
} from "@star-relay/legacy-1998";

const STEP_MS = 1000 / 60;
const MAX_FRAME_MS = 250;
const MANUAL_LIMIT_TICKS = 90 * 60;

type LegacyMode = "attract" | "manual";

export interface LegacyMountElements {
  readonly canvas: HTMLCanvasElement;
  readonly status: HTMLElement;
  readonly caption: HTMLElement;
  readonly restart: HTMLButtonElement;
  readonly mode: HTMLButtonElement;
  readonly modeLabel: HTMLElement;
  readonly screen: HTMLElement;
  readonly crt: HTMLButtonElement;
  readonly reducedFlash: HTMLButtonElement;
  readonly steps: readonly HTMLElement[];
}

export interface LegacyController {
  readonly getState: () => LegacyState;
  readonly getMode: () => LegacyMode;
}

export type LegacyOutcome =
  | "pending"
  | "route-miss"
  | "return-miss"
  | "catch"
  | "perfect"
  | "overray";

export function legacyOutcome(state: LegacyState): LegacyOutcome {
  if (state.routeMissed === 1) {
    return "route-miss";
  }
  if (state.missedCatch === 1) {
    return "return-miss";
  }
  if (state.overrayTriggered === 1) {
    return "overray";
  }
  if (state.perfectCatch === 1) {
    return "perfect";
  }
  if (state.catchQuality === 1) {
    return "catch";
  }
  return "pending";
}

function captionForEvent(event: LegacyEvent, state: LegacyState): string {
  if (event === LegacyEvent.PerfectCatch && state.overrayTriggered === 1) {
    return "〔五声が重なる〕 PERFECT CATCH — OVERRAY";
  }
  return CAPTIONS[event] ?? "〔Mirror Corridor ambience〕";
}

interface RenderOptions {
  readonly mode: LegacyMode;
  readonly reducedFlash: boolean;
  readonly gamepadActive: boolean;
}

interface ManualInput {
  readonly read: (state: LegacyState) => number;
  readonly reset: () => void;
  readonly hasGamepad: () => boolean;
}

const PHASE_LABELS: Readonly<Record<number, string>> = {
  [LegacyPhase.Held]: "CORE HELD",
  [LegacyPhase.Outbound]: "CORE OUTBOUND",
  [LegacyPhase.Banked]: "BANK ROUTE",
  [LegacyPhase.RelaySeated]: "RELAY SEATED",
  [LegacyPhase.Returning]: "RETURN PASS",
  [LegacyPhase.Complete]: "ROUTE COMPLETE"
};

const CAPTIONS: Readonly<Record<number, string>> = {
  [LegacyEvent.None]: "〔Coreの低い共鳴音〕 光を保持しています",
  [LegacyEvent.RouteReady]: "〔照準音が上昇〕 鏡を使うBANK経路を固定",
  [LegacyEvent.Throw]: "〔短い放電音〕 Coreを投射",
  [LegacyEvent.Bank]: "〔鏡面の反響〕 BANK — 経路が変化、直接加点なし",
  [LegacyEvent.HumPierced]: "〔低いHUMが途切れる〕 経路が敵を貫通",
  [LegacyEvent.PealSilenced]: "〔金属的なPEALが収束〕 Pulseを切断",
  [LegacyEvent.ChoirLink]: "〔分離した声部〕 CHOIR linkを切断",
  [LegacyEvent.ChoirBroken]: "〔三声が消える〕 CHOIRを分断",
  [LegacyEvent.RelaySeated]: "〔Relayが点灯〕 Coreを一時受領",
  [LegacyEvent.ReturnPass]: "〔RETURN cue〕 戻る光を枠内で受領",
  [LegacyEvent.Catch]: "〔受領音〕 CATCH — Chainを維持",
  [LegacyEvent.PerfectCatch]: "〔受領音が収束〕 PERFECT CATCH",
  [LegacyEvent.Miss]: "〔光が減衰〕 RETURN MISS — 最初から再試行",
  [LegacyEvent.RouteMiss]:
    "〔経路が消散〕 ROUTE MISS — 鏡とRelayの位置を確認"
};

function drawText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color = "#e9f5ff",
  align: CanvasTextAlign = "left"
): void {
  context.fillStyle = color;
  context.font = `700 ${size}px "Segoe UI", sans-serif`;
  context.textAlign = align;
  context.textBaseline = "middle";
  context.fillText(text, x, y);
}

function drawDiamond(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  fill: string,
  stroke = "#f7fbff"
): void {
  context.beginPath();
  context.moveTo(x, y - radius);
  context.lineTo(x + radius, y);
  context.lineTo(x, y + radius);
  context.lineTo(x - radius, y);
  context.closePath();
  context.fillStyle = fill;
  context.fill();
  context.strokeStyle = stroke;
  context.lineWidth = 2;
  context.stroke();
}

function drawEnemyLabel(
  context: CanvasRenderingContext2D,
  name: string,
  cue: string,
  x: number,
  y: number,
  cleared: boolean
): void {
  drawText(
    context,
    cleared ? `${name} / CUT` : name,
    x,
    y,
    13,
    cleared ? "#7390a6" : "#f7fbff",
    "center"
  );
  drawText(context, cue, x, y + 17, 9, "#92abc0", "center");
}

function drawCorridor(
  context: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  const background = context.createLinearGradient(0, 0, 0, height);
  background.addColorStop(0, "#07111f");
  background.addColorStop(0.55, "#091829");
  background.addColorStop(1, "#02060c");
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  context.strokeStyle = "#16354b";
  context.lineWidth = 1;
  const horizonY = 112;
  const centerX = width * 0.58;
  for (let index = -6; index <= 6; index += 1) {
    context.beginPath();
    context.moveTo(centerX + index * 20, horizonY);
    context.lineTo(centerX + index * 130, height);
    context.stroke();
  }
  for (let row = 0; row < 8; row += 1) {
    const progress = row / 8;
    const y = horizonY + progress * progress * (height - horizonY);
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }

  context.fillStyle = "#0c2638";
  context.fillRect(0, 78, width, 10);
  context.fillStyle = "#1d4a5d";
  for (let x = 18; x < width; x += 72) {
    context.fillRect(x, 80, 42, 5);
  }

  context.strokeStyle = "#24475d";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(0, 118);
  context.lineTo(width, 118);
  context.stroke();
}

function drawMirror(
  context: CanvasRenderingContext2D,
  x: (value: number) => number,
  y: (value: number) => number,
  banked: boolean
): void {
  const left = x(5_500);
  const right = x(7_900);
  const top = y(1_500);
  context.strokeStyle = banked ? "#f9d87b" : "#bcdded";
  context.lineWidth = 7;
  context.beginPath();
  context.moveTo(left, top);
  context.lineTo(right, top);
  context.stroke();
  context.strokeStyle = "#4d7086";
  context.lineWidth = 1;
  for (let hatch = left; hatch <= right; hatch += 18) {
    context.beginPath();
    context.moveTo(hatch, top - 9);
    context.lineTo(hatch + 10, top + 9);
    context.stroke();
  }
  drawText(context, "MIRROR // BANK", (left + right) / 2, top - 22, 11, "#f9d87b", "center");
}

function drawRoute(
  context: CanvasRenderingContext2D,
  state: LegacyState,
  x: (value: number) => number,
  y: (value: number) => number
): void {
  const bounceX =
    state.playerX +
    ((state.playerY - 1_500) * LEGACY_OUTBOUND_VX) /
      -LEGACY_OUTBOUND_VY;
  const strength =
    state.routePreviewTicks / (LEGACY_ROUTE_READY_TICKS * 2);
  context.save();
  context.setLineDash([10, 10]);
  context.strokeStyle =
    state.routePreviewTicks >= LEGACY_ROUTE_READY_TICKS
      ? "#78efff"
      : `rgba(120, 239, 255, ${0.35 + strength * 0.55})`;
  context.lineWidth =
    state.routePreviewTicks >= LEGACY_ROUTE_READY_TICKS ? 3 : 2;
  context.beginPath();
  context.moveTo(x(state.playerX), y(state.playerY));
  context.lineTo(x(bounceX), y(1_500));
  context.lineTo(x(12_100), y(4_680));
  context.stroke();
  context.setLineDash([]);
  drawDiamond(context, x(bounceX), y(1_500), 7, "#07111f", "#78efff");
  drawText(
    context,
    state.routePreviewTicks >= LEGACY_ROUTE_READY_TICKS
      ? "ROUTE LOCKED"
      : "HOLD A",
    x(bounceX),
    y(1_500) - 34,
    10,
    "#78efff",
    "center"
  );
  context.restore();
}

function drawHum(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  cleared: boolean
): void {
  context.save();
  context.globalAlpha = cleared ? 0.24 : 1;
  context.beginPath();
  context.moveTo(x, y - 18);
  context.lineTo(x + 22, y + 15);
  context.lineTo(x - 22, y + 15);
  context.closePath();
  context.fillStyle = "#fa557f";
  context.fill();
  context.strokeStyle = "#ffd4df";
  context.lineWidth = 2;
  context.stroke();
  context.beginPath();
  context.arc(x, y, 31, Math.PI * 1.15, Math.PI * 1.85);
  context.stroke();
  context.restore();
  drawEnemyLabel(context, "HUM", "TRI-TONE", x, y + 43, cleared);
}

function drawPeal(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  cleared: boolean
): void {
  context.save();
  context.globalAlpha = cleared ? 0.24 : 1;
  drawDiamond(context, x, y, 20, "#f0ae3c", "#fff0bd");
  context.strokeStyle = "#f0ae3c";
  context.lineWidth = 2;
  context.beginPath();
  context.arc(x, y, 32, -0.9, 0.9);
  context.stroke();
  context.beginPath();
  context.arc(x, y, 40, -0.7, 0.7);
  context.stroke();
  context.restore();
  drawEnemyLabel(context, "PEAL", "PULSE", x, y + 51, cleared);
}

function drawChoir(
  context: CanvasRenderingContext2D,
  sx: (value: number) => number,
  sy: (value: number) => number,
  hits: number
): void {
  const nodes = [
    [10_100, 3_330],
    [10_650, 3_700],
    [11_200, 4_070]
  ] as const;
  context.strokeStyle = hits >= 3 ? "#3a5568" : "#a687ff";
  context.lineWidth = 2;
  context.beginPath();
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];
    if (node === undefined) {
      continue;
    }
    if (index === 0) {
      context.moveTo(sx(node[0]), sy(node[1]));
    } else {
      context.lineTo(sx(node[0]), sy(node[1]));
    }
  }
  context.stroke();

  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];
    if (node === undefined) {
      continue;
    }
    context.save();
    context.globalAlpha = index < hits ? 0.24 : 1;
    context.strokeStyle = "#c5b7ff";
    context.lineWidth = 2;
    context.strokeRect(sx(node[0]) - 12, sy(node[1]) - 12, 24, 24);
    context.restore();
  }
  const labelX = sx(10_650);
  const labelY = sy(3_700) + 48;
  drawEnemyLabel(context, "CHOIR", "3-LINK", labelX, labelY, hits >= 3);
}

function drawRelay(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  state: LegacyState
): void {
  context.save();
  context.translate(x, y);
  context.strokeStyle = state.connectedRelay === 1 ? "#f9d87b" : "#8da9ba";
  context.lineWidth = 4;
  context.strokeRect(-24, -45, 48, 90);
  context.lineWidth = 2;
  context.strokeRect(-13, -31, 26, 62);
  context.beginPath();
  context.moveTo(-38, -17);
  context.lineTo(-28, 0);
  context.lineTo(-38, 17);
  context.moveTo(38, -17);
  context.lineTo(28, 0);
  context.lineTo(38, 17);
  context.stroke();
  context.restore();
  drawText(context, "RELAY", x, y + 61, 12, "#f9d87b", "center");
  drawText(
    context,
    state.phase === LegacyPhase.RelaySeated
      ? `${state.relaySeatTicks}/${LEGACY_RELAY_SEAT_TICKS}`
      : "SEAT / RETURN",
    x,
    y + 77,
    9,
    "#92abc0",
    "center"
  );
}

function drawPlayer(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  held: boolean
): void {
  context.save();
  context.translate(x, y);
  context.strokeStyle = held ? "#e9f5ff" : "#a4bed0";
  context.fillStyle = held ? "#d6e8f4" : "#6f8ea3";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(25, 0);
  context.lineTo(-18, -17);
  context.lineTo(-8, 0);
  context.lineTo(-18, 17);
  context.closePath();
  context.fill();
  context.stroke();
  context.beginPath();
  context.moveTo(-8, -8);
  context.lineTo(-28, -8);
  context.moveTo(-8, 8);
  context.lineTo(-28, 8);
  context.stroke();
  context.restore();
}

function drawCore(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  state: LegacyState,
  reducedFlash: boolean
): void {
  context.save();
  context.shadowBlur = reducedFlash ? 8 : state.overrayTicks > 0 ? 28 : 16;
  context.shadowColor = state.overrayTicks > 0 ? "#ffffff" : "#78efff";
  context.fillStyle = state.overrayTicks > 0 ? "#ffffff" : "#78efff";
  context.beginPath();
  context.arc(x, y, state.overrayTicks > 0 ? 9 : 7, 0, Math.PI * 2);
  context.fill();
  context.shadowBlur = 0;
  context.strokeStyle = state.overrayTicks > 0 ? "#f9d87b" : "#dffbff";
  context.lineWidth = 2;
  context.beginPath();
  context.arc(x, y, 13, 0, Math.PI * 2);
  context.stroke();
  context.restore();
}

function drawHud(
  context: CanvasRenderingContext2D,
  state: LegacyState,
  options: RenderOptions,
  width: number
): void {
  context.fillStyle = "rgba(2, 7, 13, 0.86)";
  context.fillRect(0, 0, width, 64);
  drawText(context, "STAR RELAY // MIRROR CORRIDOR", 22, 20, 13, "#f9d87b");
  drawText(
    context,
    options.mode === "attract" ? "ATTRACT / FIXTURE" : "PLAYER / LIVE",
    22,
    43,
    10,
    "#92abc0"
  );

  drawText(context, "SCORE", 357, 18, 9, "#92abc0");
  drawText(context, state.score.toString().padStart(6, "0"), 357, 40, 18);
  drawText(context, "CHAIN", 500, 18, 9, "#92abc0");
  drawText(context, String(state.chain), 500, 40, 18, "#78efff");
  drawText(context, "CHARGE", 596, 18, 9, "#92abc0");
  for (let index = 0; index < 10; index += 1) {
    const charged = state.charge >= (index + 1) * 10;
    context.fillStyle = charged ? "#f9d87b" : "#213849";
    context.fillRect(596 + index * 21, 33, 16, 12);
  }
  drawText(
    context,
    `${state.charge.toString().padStart(3, "0")}%`,
    831,
    40,
    13,
    state.charge === 100 ? "#ffffff" : "#d6e8f4",
    "right"
  );
  drawText(
    context,
    PHASE_LABELS[state.phase] ?? "UNKNOWN",
    width - 20,
    18,
    10,
    "#92abc0",
    "right"
  );
  drawText(
    context,
    `TICK ${state.tick.toString().padStart(4, "0")}`,
    width - 20,
    43,
    12,
    "#d6e8f4",
    "right"
  );
}

function tutorialLine(state: LegacyState, mode: LegacyMode): string {
  if (state.phase === LegacyPhase.Complete) {
    if (state.routeMissed === 1) {
      return "ROUTE LOST // MIRRORまたはRELAYの枠から外れた";
    }
    if (state.missedCatch === 1) {
      return "RETURN LOST // 戻る光を受領できなかった";
    }
    if (state.overrayTriggered === 1) {
      return "ROUTE COMPLETE // LIGHT THROWN · RETURN RECEIVED · CHAIN HELD";
    }
    if (state.perfectCatch === 1) {
      return "PERFECT CATCH // CHARGE不足のためOVERRAY未発動";
    }
    return "CATCH // ROUTE COMPLETE · PERFECT枠は内側";
  }
  if (state.phase === LegacyPhase.Returning) {
    return mode === "manual"
      ? "RETURN // Aを押して二重枠の中心で受領"
      : "RETURN // RECEIVE INSIDE THE DOUBLE BRACKET";
  }
  if (state.phase === LegacyPhase.RelaySeated) {
    return "RELAY SEAT // 経路の終点がCoreを受け取り、返送する";
  }
  if (state.phase === LegacyPhase.Banked) {
    return "PATH AS WEAPON // HUM · PEAL · CHOIRを線で切る";
  }
  if (state.phase === LegacyPhase.Outbound) {
    return "BANK // 鏡で経路を折る。BANK自体には直接報酬なし";
  }
  if (state.routePreviewTicks > 0) {
    return state.routePreviewTicks >= LEGACY_ROUTE_READY_TICKS
      ? "ROUTE LOCKED // Aを離して投射"
      : "A HOLD // 点線を鏡からRelayへ接続";
  }
  return mode === "manual"
    ? "MOVE // Core保持中は低速。矢印キーで重さを確認"
    : "HOLD / FREE // Coreを放すと移動速度が上がる";
}

function drawCompletion(
  context: CanvasRenderingContext2D,
  state: LegacyState,
  reducedFlash: boolean
): void {
  const outcome = legacyOutcome(state);
  const routeLost = outcome === "route-miss";
  const returnLost = outcome === "return-miss";
  const overray = outcome === "overray";
  const outcomeTitle = routeLost
    ? "ROUTE LOST"
    : returnLost
      ? "RETURN LOST"
      : overray
        ? "OVERRAY"
        : state.perfectCatch === 1
          ? "PERFECT CATCH"
          : "CATCH";
  const outcomeDetail = routeLost
    ? "MIRROR / RELAY HITBOX MISSED"
    : returnLost
      ? "RESTART THE MIRROR ROUTE"
      : overray
        ? "PERFECT CATCH // CHARGE 100"
        : `ROUTE COMPLETE // CHARGE ${state.charge}`;
  const outcomeColor =
    routeLost || returnLost ? "#fa557f" : overray ? "#f9d87b" : "#78efff";

  context.fillStyle = "rgba(2, 7, 13, 0.88)";
  context.fillRect(166, 124, 628, 286);
  context.strokeStyle = outcomeColor;
  context.lineWidth = 2;
  context.strokeRect(166, 124, 628, 286);
  drawText(
    context,
    outcomeTitle,
    196,
    163,
    38,
    routeLost || returnLost ? "#fa557f" : "#ffffff"
  );
  drawText(
    context,
    outcomeDetail,
    198,
    203,
    12,
    "#92abc0"
  );
  const lessons = [
    ["◆", "HOLD", "Core保持中は低速"],
    ["⌁", "BANK", "鏡は経路を変える"],
    ["▣", "RELAY", "経路そのものが攻撃"],
    ["◇", "RETURN", "受領でChainを維持"]
  ] as const;
  for (let index = 0; index < lessons.length; index += 1) {
    const lesson = lessons[index];
    if (lesson === undefined) {
      continue;
    }
    const lessonX = 198 + (index % 2) * 290;
    const lessonY = 260 + Math.floor(index / 2) * 66;
    drawText(context, lesson[0], lessonX, lessonY, 20, "#78efff");
    drawText(context, lesson[1], lessonX + 36, lessonY - 9, 12, "#f7fbff");
    drawText(context, lesson[2], lessonX + 36, lessonY + 12, 10, "#92abc0");
  }
  if (!reducedFlash && overray && state.overrayTicks > 0) {
    context.strokeStyle = "rgba(255, 255, 255, 0.55)";
    context.lineWidth = 6;
    context.strokeRect(156, 114, 648, 306);
  }
}

function drawLegacy(
  canvas: HTMLCanvasElement,
  state: LegacyState,
  options: RenderOptions
): void {
  const context = canvas.getContext("2d");
  if (context === null) {
    throw new Error("Canvas 2D is unavailable");
  }

  const scaleX = canvas.width / LEGACY_WORLD_WIDTH;
  const scaleY = canvas.height / LEGACY_WORLD_HEIGHT;
  const x = (value: number): number => value * scaleX;
  const y = (value: number): number => value * scaleY;

  drawCorridor(context, canvas.width, canvas.height);

  if (
    !options.reducedFlash &&
    state.overrayTicks > 0 &&
    ((state.overrayTicks >> 3) & 1) === 1
  ) {
    context.fillStyle = "rgba(255, 255, 255, 0.1)";
    context.fillRect(0, 64, canvas.width, canvas.height - 64);
  }

  drawMirror(context, x, y, state.banked === 1);

  if (state.routePreviewTicks > 0) {
    drawRoute(context, state, x, y);
  }

  if (
    state.phase >= LegacyPhase.Banked &&
    state.phase <= LegacyPhase.RelaySeated
  ) {
    context.strokeStyle = "rgba(120, 239, 255, 0.28)";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(x(7_380), y(1_500));
    context.lineTo(x(12_100), y(4_680));
    context.stroke();
  }

  drawHum(context, x(8_300), y(2_120), state.humCleared === 1);
  drawPeal(context, x(9_400), y(2_860), state.pealCleared === 1);
  drawChoir(context, x, y, state.choirHits);
  drawRelay(context, x(12_100), y(4_680), state);

  if (state.phase === LegacyPhase.Returning) {
    context.save();
    context.setLineDash([5, 7]);
    context.strokeStyle = "#f9d87b";
    context.lineWidth = 2;
    context.beginPath();
    context.arc(
      x(state.playerX),
      y(state.playerY),
      LEGACY_CATCH_RADIUS * scaleX,
      0,
      Math.PI * 2
    );
    context.stroke();
    context.setLineDash([]);
    context.strokeStyle = "#78efff";
    context.beginPath();
    context.arc(
      x(state.playerX),
      y(state.playerY),
      LEGACY_PERFECT_RADIUS * scaleX,
      0,
      Math.PI * 2
    );
    context.stroke();
    context.restore();
    drawText(
      context,
      "PERFECT",
      x(state.playerX),
      y(state.playerY) - 34,
      9,
      "#78efff",
      "center"
    );
  }

  const coreHeld =
    state.phase === LegacyPhase.Held ||
    state.phase === LegacyPhase.Complete;
  drawPlayer(context, x(state.playerX), y(state.playerY), coreHeld);
  drawCore(
    context,
    x(state.coreX),
    y(state.coreY),
    state,
    options.reducedFlash
  );

  context.fillStyle = "rgba(2, 7, 13, 0.9)";
  context.fillRect(0, canvas.height - 50, canvas.width, 50);
  drawText(
    context,
    tutorialLine(state, options.mode),
    22,
    canvas.height - 25,
    12,
    "#e9f5ff"
  );
  if (options.gamepadActive) {
    drawText(
      context,
      "GAMEPAD",
      canvas.width - 20,
      canvas.height - 25,
      10,
      "#78efff",
      "right"
    );
  }

  drawHud(context, state, options, canvas.width);

  if (state.phase === LegacyPhase.Complete) {
    drawCompletion(context, state, options.reducedFlash);
  }
}

function createManualInput(canvas: HTMLCanvasElement): ManualInput {
  const keys = new Set<string>();
  let previousAction = false;
  let gamepadActive = false;

  canvas.addEventListener("keydown", (event) => {
    if (
      event.code === "ArrowUp" ||
      event.code === "ArrowDown" ||
      event.code === "ArrowLeft" ||
      event.code === "ArrowRight" ||
      event.code === "KeyA" ||
      event.code === "Space"
    ) {
      event.preventDefault();
      keys.add(event.code);
    }
  });
  window.addEventListener("keyup", (event) => {
    keys.delete(event.code);
  });
  canvas.addEventListener("blur", () => {
    keys.clear();
    previousAction = false;
  });
  canvas.addEventListener("pointerdown", () => canvas.focus());

  const pressed = (
    gamepad: Gamepad | null,
    buttonIndex: number
  ): boolean => gamepad?.buttons[buttonIndex]?.pressed === true;

  const read = (state: LegacyState): number => {
    const gamepads = navigator.getGamepads();
    let gamepad: Gamepad | null = null;
    for (let index = 0; index < gamepads.length; index += 1) {
      const candidate = gamepads[index];
      if (candidate?.connected === true) {
        gamepad = candidate;
        break;
      }
    }
    const axisX = gamepad?.axes[0] ?? 0;
    const axisY = gamepad?.axes[1] ?? 0;
    gamepadActive = gamepad !== null;

    let mask = LegacyInput.None;
    if (keys.has("ArrowUp") || axisY < -0.35 || pressed(gamepad, 12)) {
      mask |= LegacyInput.Up;
    }
    if (keys.has("ArrowDown") || axisY > 0.35 || pressed(gamepad, 13)) {
      mask |= LegacyInput.Down;
    }
    if (keys.has("ArrowLeft") || axisX < -0.35 || pressed(gamepad, 14)) {
      mask |= LegacyInput.Left;
    }
    if (keys.has("ArrowRight") || axisX > 0.35 || pressed(gamepad, 15)) {
      mask |= LegacyInput.Right;
    }

    const action =
      keys.has("KeyA") || keys.has("Space") || pressed(gamepad, 0);
    if (state.phase === LegacyPhase.Held) {
      if (action) {
        mask |= LegacyInput.Aim;
      } else if (previousAction) {
        mask |= LegacyInput.Throw;
      }
    } else if (state.phase === LegacyPhase.Returning && action) {
      mask |= LegacyInput.Catch;
    }
    previousAction = action;
    return mask;
  };

  return {
    read,
    reset: () => {
      keys.clear();
      previousAction = false;
      gamepadActive = false;
    },
    hasGamepad: () => gamepadActive
  };
}

function phaseStatus(state: LegacyState): string {
  const outcome = legacyOutcome(state);
  if (outcome === "route-miss") {
    return "ROUTE LOST / RESTART";
  }
  if (outcome === "return-miss") {
    return "RETURN LOST / RESTART";
  }
  if (outcome === "overray") {
    return "PERFECT CATCH / OVERRAY";
  }
  if (outcome === "perfect") {
    return "PERFECT CATCH / ROUTE COMPLETE";
  }
  if (outcome === "catch") {
    return "CATCH / ROUTE COMPLETE";
  }
  if (state.phase === LegacyPhase.Returning) {
    return "RETURN PASS / CATCH WINDOW";
  }
  if (state.phase === LegacyPhase.RelaySeated) {
    return "RELAY SEATED";
  }
  if (state.choirHits === 3) {
    return "CHOIR CUT";
  }
  if (state.pealCleared === 1) {
    return "PEAL SILENCED";
  }
  if (state.humCleared === 1) {
    return "HUM PIERCED";
  }
  if (state.banked === 1) {
    return "BANK ROUTE";
  }
  if (state.phase === LegacyPhase.Outbound) {
    return "CORE OUTBOUND";
  }
  if (state.routePreviewTicks >= LEGACY_ROUTE_READY_TICKS) {
    return "ROUTE LOCKED";
  }
  if (state.routePreviewTicks > 0) {
    return "ROUTE PREVIEW";
  }
  return "CORE HELD";
}

function updateMissionSteps(
  steps: readonly HTMLElement[],
  state: LegacyState
): void {
  for (const step of steps) {
    const name = step.dataset["legacyStep"];
    let stepState = "pending";
    if (name === "held") {
      stepState =
        state.phase === LegacyPhase.Held ? "active" : "complete";
    } else if (name === "bank") {
      stepState =
        state.banked === 1
          ? "complete"
          : state.phase === LegacyPhase.Outbound ||
              state.routePreviewTicks > 0
            ? "active"
            : "pending";
    } else if (name === "relay") {
      stepState =
        state.connectedRelay === 1
          ? "complete"
          : state.phase === LegacyPhase.Banked
            ? "active"
            : "pending";
    } else if (name === "catch") {
      stepState =
        state.routeMissed === 1 || state.missedCatch === 1
          ? "failed"
          : state.catchQuality === 1 || state.catchQuality === 2
            ? "complete"
            : state.phase === LegacyPhase.Returning
              ? "active"
              : "pending";
    }
    step.dataset["state"] = stepState;
  }
}

export function mountLegacyProof(
  elements: LegacyMountElements
): LegacyController {
  const {
    canvas,
    status,
    caption,
    restart,
    mode: modeButton,
    modeLabel,
    screen,
    crt,
    reducedFlash: reducedFlashButton,
    steps
  } = elements;
  const manualInput = createManualInput(canvas);
  let state = createLegacyState(LEGACY_REPLAY.seed);
  let mode: LegacyMode = "attract";
  let accumulator = 0;
  let lastFrame = 0;
  let captionInitialized = false;
  const captionQueue: LegacyEvent[] = [];
  let reducedFlash = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  let crtEnabled = false;

  const syncControls = (): void => {
    modeButton.textContent =
      mode === "attract" ? "自分でプレイ" : "ATTRACTに戻る";
    modeButton.setAttribute("aria-pressed", String(mode === "manual"));
    modeLabel.textContent = mode === "attract" ? "ATTRACT" : "PLAYER";
    crt.textContent = `CRT: ${crtEnabled ? "ON" : "OFF"}`;
    crt.setAttribute("aria-pressed", String(crtEnabled));
    reducedFlashButton.textContent = `低フラッシュ: ${
      reducedFlash ? "ON" : "OFF"
    }`;
    reducedFlashButton.setAttribute("aria-pressed", String(reducedFlash));
    screen.dataset["crt"] = String(crtEnabled);
    screen.dataset["reducedFlash"] = String(reducedFlash);
  };

  const updateUi = (): void => {
    drawLegacy(canvas, state, {
      mode,
      reducedFlash,
      gamepadActive: manualInput.hasGamepad()
    });
    if (!captionInitialized) {
      caption.textContent = captionForEvent(LegacyEvent.None, state);
      captionInitialized = true;
    }
    const nextCaption = captionQueue.shift();
    if (nextCaption !== undefined) {
      caption.textContent = captionForEvent(nextCaption, state);
    }
    status.textContent = `${mode.toUpperCase()} · ${phaseStatus(state)} · CHAIN ${
      state.chain
    } · CHARGE ${state.charge}% · SCORE ${state.score
      .toString()
      .padStart(6, "0")} · ${state.tick} tick`;
    status.dataset["tick"] = String(state.tick);
    status.dataset["mode"] = mode;
    status.dataset["phase"] = String(state.phase);
    status.dataset["banked"] = String(state.banked);
    status.dataset["hum"] = String(state.humCleared);
    status.dataset["peal"] = String(state.pealCleared);
    status.dataset["choir"] = String(state.choirHits);
    status.dataset["relay"] = String(state.connectedRelay);
    status.dataset["catch"] = String(state.catchQuality);
    status.dataset["missedCatch"] = String(state.missedCatch);
    status.dataset["routeMissed"] = String(state.routeMissed);
    status.dataset["chain"] = String(state.chain);
    status.dataset["charge"] = String(state.charge);
    status.dataset["score"] = String(state.score);
    status.dataset["overray"] = String(state.overrayTriggered);
    status.dataset["outcome"] = legacyOutcome(state);
    updateMissionSteps(steps, state);
  };

  const reset = (): void => {
    state = createLegacyState(LEGACY_REPLAY.seed);
    accumulator = 0;
    lastFrame = 0;
    captionInitialized = false;
    captionQueue.length = 0;
    manualInput.reset();
    syncControls();
    updateUi();
  };

  restart.addEventListener("click", () => {
    reset();
    if (mode === "manual") {
      canvas.focus();
    }
  });
  modeButton.addEventListener("click", () => {
    mode = mode === "attract" ? "manual" : "attract";
    reset();
    if (mode === "manual") {
      canvas.focus();
    }
  });
  crt.addEventListener("click", () => {
    crtEnabled = !crtEnabled;
    syncControls();
  });
  reducedFlashButton.addEventListener("click", () => {
    reducedFlash = !reducedFlash;
    syncControls();
    updateUi();
  });

  const frame = (timestamp: number): void => {
    if (lastFrame === 0) {
      lastFrame = timestamp;
    }
    accumulator += Math.min(timestamp - lastFrame, MAX_FRAME_MS);
    lastFrame = timestamp;

    const tickLimit =
      mode === "attract" ? LEGACY_DURATION_TICKS : MANUAL_LIMIT_TICKS;
    while (accumulator >= STEP_MS && state.tick < tickLimit) {
      const input =
        mode === "attract"
          ? legacyInputAtTick(LEGACY_REPLAY, state.tick)
          : manualInput.read(state);
      const previousEventSequence = state.eventSequence;
      state = stepLegacy(state, input);
      if (state.eventSequence !== previousEventSequence) {
        captionQueue.push(state.lastEvent);
      }
      accumulator -= STEP_MS;
    }

    updateUi();
    requestAnimationFrame(frame);
  };

  reset();
  requestAnimationFrame(frame);
  return {
    getState: () => state,
    getMode: () => mode
  };
}
