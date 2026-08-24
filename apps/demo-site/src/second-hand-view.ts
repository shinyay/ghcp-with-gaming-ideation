import {
  CaptionCode,
  EncounterPhase,
  GameMode,
  LATENCY_FIXTURES,
  PlaytestEventCode,
  RELAY_POINT_X,
  ROUTE_DEFINITIONS,
  RouteId,
  SecondHandInput,
  appendPlaytestEvent,
  appendTransitionEvents,
  createPlaytestLog,
  createSecondHandState,
  serializePlaytestLog,
  stepSecondHand,
  type GameModeValue,
  type PlaytestLog,
  type SecondHandConfig,
  type SecondHandState
} from "@star-relay/second-hand";

const STEP_MS = 1000 / 60;
const MAX_FRAME_MS = 250;
const CAPTION_HOLD_TICKS = 45;
const FOCUS_NAVIGATION_CODES = new Set([
  "Tab",
  "F6",
  "BrowserBack",
  "BrowserForward",
  "ContextMenu"
]);
const FIELD_WIDTH = 12_800;
const FIELD_HEIGHT = 7200;
const PLAYER_X = {
  1: 1920,
  2: 10_880
} as const;

type BindingAction =
  | "p1Up"
  | "p1Down"
  | "p1Direct"
  | "p1Shelter"
  | "p1Interact"
  | "p2Up"
  | "p2Down"
  | "p2Direct"
  | "p2Shelter"
  | "p2Interact";

interface BindingSpec {
  readonly action: BindingAction;
  readonly label: string;
  readonly defaultCode: string;
  readonly input: number;
}

const BINDING_SPECS: readonly BindingSpec[] = [
  {
    action: "p1Up",
    label: "P1 上へ移動",
    defaultCode: "KeyW",
    input: SecondHandInput.P1Up
  },
  {
    action: "p1Down",
    label: "P1 下へ移動",
    defaultCode: "KeyS",
    input: SecondHandInput.P1Down
  },
  {
    action: "p1Direct",
    label: "P1 DIRECT route",
    defaultCode: "KeyA",
    input: SecondHandInput.P1RouteDirect
  },
  {
    action: "p1Shelter",
    label: "P1 SHELTER route",
    defaultCode: "KeyD",
    input: SecondHandInput.P1RouteShelter
  },
  {
    action: "p1Interact",
    label: "P1 送信 / 受領",
    defaultCode: "KeyF",
    input: SecondHandInput.P1Interact
  },
  {
    action: "p2Up",
    label: "P2 上へ移動",
    defaultCode: "ArrowUp",
    input: SecondHandInput.P2Up
  },
  {
    action: "p2Down",
    label: "P2 下へ移動",
    defaultCode: "ArrowDown",
    input: SecondHandInput.P2Down
  },
  {
    action: "p2Direct",
    label: "P2 DIRECT route",
    defaultCode: "ArrowLeft",
    input: SecondHandInput.P2RouteDirect
  },
  {
    action: "p2Shelter",
    label: "P2 SHELTER route",
    defaultCode: "ArrowRight",
    input: SecondHandInput.P2RouteShelter
  },
  {
    action: "p2Interact",
    label: "P2 送信 / 受領",
    defaultCode: "Enter",
    input: SecondHandInput.P2Interact
  }
];

type Bindings = Record<BindingAction, string>;

interface CanvasPalette {
  readonly background: string;
  readonly surface: string;
  readonly border: string;
  readonly borderStrong: string;
  readonly text: string;
  readonly muted: string;
  readonly accent: string;
  readonly accentSoft: string;
  readonly success: string;
  readonly danger: string;
  readonly warning: string;
  readonly link: string;
}

export interface SecondHandController {
  readonly getState: () => SecondHandState;
  readonly getPlaytestLog: () => PlaytestLog;
}

function requireWithin<T extends Element>(
  root: ParentNode,
  selector: string,
  constructor: { new (): T }
): T {
  const element = root.querySelector(selector);
  if (!(element instanceof constructor)) {
    throw new Error(`Missing SECOND HAND element: ${selector}`);
  }
  return element;
}

function readCssColor(name: string): string {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  if (value.length === 0) {
    throw new Error(`Missing theme color: ${name}`);
  }
  return value;
}

function readPalette(): CanvasPalette {
  return {
    background: readCssColor("--cp-bg-elevated"),
    surface: readCssColor("--cp-surface"),
    border: readCssColor("--cp-border"),
    borderStrong: readCssColor("--cp-border-strong"),
    text: readCssColor("--cp-text"),
    muted: readCssColor("--cp-text-muted"),
    accent: readCssColor("--cp-accent"),
    accentSoft: readCssColor("--cp-accent-soft"),
    success: readCssColor("--cp-success"),
    danger: readCssColor("--cp-danger"),
    warning: readCssColor("--cp-warning"),
    link: readCssColor("--cp-link")
  };
}

function createDefaultBindings(): Bindings {
  const bindings = {} as Bindings;
  for (const spec of BINDING_SPECS) {
    bindings[spec.action] = spec.defaultCode;
  }
  return bindings;
}

function displayKey(code: string): string {
  if (code.startsWith("Key")) {
    return code.slice(3);
  }
  if (code.startsWith("Digit")) {
    return code.slice(5);
  }
  return code.replace("Arrow", "");
}

function randomSessionId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let sessionId = "";
  for (const byte of bytes) {
    sessionId += byte.toString(16).padStart(2, "0");
  }
  return sessionId;
}

function drawTriangle(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  size: number
): void {
  context.beginPath();
  context.moveTo(centerX, centerY - size);
  context.lineTo(centerX + size, centerY + size);
  context.lineTo(centerX - size, centerY + size);
  context.closePath();
}

function drawPlayer(
  context: CanvasRenderingContext2D,
  player: 1 | 2,
  centerX: number,
  centerY: number,
  ownsCore: boolean,
  palette: CanvasPalette
): void {
  context.save();
  context.lineWidth = ownsCore ? 6 : 4;
  context.strokeStyle = player === 1 ? palette.link : palette.accent;
  context.fillStyle = ownsCore ? palette.accentSoft : palette.surface;
  if (player === 1) {
    drawTriangle(context, centerX, centerY, 30);
    context.fill();
    context.stroke();
  } else {
    context.fillRect(centerX - 30, centerY - 30, 60, 60);
    context.strokeRect(centerX - 30, centerY - 30, 60, 60);
  }
  if (ownsCore) {
    context.fillStyle = palette.text;
    context.beginPath();
    context.arc(centerX, centerY, 7, 0, Math.PI * 2);
    context.fill();
  }
  context.fillStyle = palette.text;
  context.font = '700 15px Consolas, "Courier New", monospace';
  context.textAlign = "center";
  context.fillText(
    ownsCore ? `P${player} / SENDER` : `P${player} / RECEIVER`,
    centerX,
    centerY + 58
  );
  context.restore();
}

function drawPairless(
  context: CanvasRenderingContext2D,
  state: SecondHandState,
  x: number,
  y: number,
  palette: CanvasPalette
): void {
  const active = state.encounterPhase >= EncounterPhase.PairlessOutbound;
  const resolved = state.encounterPhase === EncounterPhase.Complete;
  context.save();
  context.strokeStyle = resolved
    ? palette.success
    : active
      ? palette.warning
      : palette.borderStrong;
  context.fillStyle = active ? palette.accentSoft : palette.surface;
  context.lineWidth = active ? 5 : 3;
  context.fillRect(x - 72, y - 54, 58, 108);
  context.strokeRect(x - 72, y - 54, 58, 108);
  context.fillRect(x + 14, y - 54, 58, 108);
  context.strokeRect(x + 14, y - 54, 58, 108);
  context.fillStyle = palette.text;
  context.font = '700 16px Consolas, "Courier New", monospace';
  context.textAlign = "center";
  context.fillText(resolved ? "PAIR" : "PAIRLESS", x, y + 86);
  context.fillText(resolved ? "✓" : "↔", x, y + 7);
  context.restore();
}

function phaseLabel(state: SecondHandState): string {
  switch (state.encounterPhase) {
    case EncounterPhase.RelayRun:
      return `RELAY ${state.relayIndex + 1} / 4`;
    case EncounterPhase.PairlessOutbound:
      return "PAIRLESS / OUTBOUND";
    case EncounterPhase.PairlessReturn:
      return "PAIRLESS / RETURN";
    case EncounterPhase.Complete:
      return "TWIN SPAN CLEAR";
  }
}

function drawTwinSpan(
  canvas: HTMLCanvasElement,
  state: SecondHandState,
  reducedFlash: boolean
): void {
  const context = canvas.getContext("2d");
  if (context === null) {
    throw new Error("Canvas 2D is unavailable");
  }
  const palette = readPalette();
  const scaleX = canvas.width / FIELD_WIDTH;
  const scaleY = canvas.height / FIELD_HEIGHT;
  const x = (value: number): number => value * scaleX;
  const y = (value: number): number => value * scaleY;
  const recentCatch =
    !reducedFlash &&
    state.lastAcceptedTick > 0 &&
    state.tick - state.lastAcceptedTick < 12;

  context.fillStyle = recentCatch ? palette.accentSoft : palette.background;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.strokeStyle = palette.border;
  context.lineWidth = 1;
  for (let gridX = 0; gridX <= FIELD_WIDTH; gridX += 800) {
    context.beginPath();
    context.moveTo(x(gridX), 0);
    context.lineTo(x(gridX), canvas.height);
    context.stroke();
  }
  for (let gridY = 0; gridY <= FIELD_HEIGHT; gridY += 900) {
    context.beginPath();
    context.moveTo(0, y(gridY));
    context.lineTo(canvas.width, y(gridY));
    context.stroke();
  }

  for (const route of ROUTE_DEFINITIONS) {
    const selected =
      state.selectedRoute === route.id || state.pendingRoute === route.id;
    context.strokeStyle =
      route.id === RouteId.Direct ? palette.link : palette.accent;
    context.lineWidth = selected ? 7 : 3;
    context.setLineDash(
      route.id === RouteId.Direct ? [] : selected ? [18, 8] : [10, 12]
    );
    context.beginPath();
    context.moveTo(x(900), y(route.y));
    context.lineTo(x(11_900), y(route.y));
    context.stroke();
    context.setLineDash([]);
    context.fillStyle = palette.text;
    context.font = '700 14px Consolas, "Courier New", monospace';
    context.textAlign = "left";
    context.fillText(
      route.id === RouteId.Direct
        ? "A / DIRECT — FAST · NARROW"
        : "B / SHELTER — SLOW · WIDE",
      x(980),
      y(route.y) - 12
    );
  }

  for (let index = 0; index < RELAY_POINT_X.length; index += 1) {
    const pointX = RELAY_POINT_X[index]!;
    const active = (state.relayActivatedMask & (1 << index)) !== 0;
    context.fillStyle = active ? palette.success : palette.surface;
    context.strokeStyle = active ? palette.success : palette.borderStrong;
    context.lineWidth = active ? 5 : 3;
    context.beginPath();
    context.arc(x(pointX), y(3600), 22, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.fillStyle = active ? palette.background : palette.text;
    context.font = '700 13px Consolas, "Courier New", monospace';
    context.textAlign = "center";
    context.fillText(String(index + 1), x(pointX), y(3600) + 5);
  }

  drawPairless(context, state, x(6400), y(3600), palette);

  if (state.pendingTarget !== 0) {
    context.strokeStyle = palette.warning;
    context.lineWidth = 3;
    context.setLineDash([6, 8]);
    context.beginPath();
    context.moveTo(x(PLAYER_X[state.owner]), y(state.coreY));
    context.lineTo(x(PLAYER_X[state.pendingTarget]), y(state.coreY));
    context.stroke();
    context.setLineDash([]);
  }

  drawPlayer(
    context,
    1,
    x(PLAYER_X[1]),
    y(state.p1Y),
    state.owner === 1,
    palette
  );
  drawPlayer(
    context,
    2,
    x(PLAYER_X[2]),
    y(state.p2Y),
    state.owner === 2,
    palette
  );

  context.strokeStyle = palette.text;
  context.fillStyle = palette.background;
  context.lineWidth = 5;
  context.beginPath();
  context.arc(x(state.coreX), y(state.coreY), 14, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  context.fillStyle = palette.text;
  context.font = '700 16px Consolas, "Courier New", monospace';
  context.textAlign = "left";
  context.fillText(phaseLabel(state), 20, 28);
  context.textAlign = "right";
  context.fillText(
    `OWNER P${state.owner} · SEQ ${state.handoffSequence}`,
    canvas.width - 20,
    28
  );
  context.textAlign = "start";
}

function describeCaption(state: SecondHandState): string {
  const route =
    state.pendingRoute === RouteId.Direct ? "DIRECT" : "SHELTER";
  switch (state.captionCode) {
    case CaptionCode.Ready:
      return "送信者はrouteを選び、受領者は同じspanへ移動してください。";
    case CaptionCode.DirectSelected:
      return "DIRECTを選択。速いCoreを狭い受領域で受け取ります。";
    case CaptionCode.ShelterSelected:
      return "SHELTERを選択。遠回りですが受領域とcatch windowが広がります。";
    case CaptionCode.HandoffSent:
      return `${route}へ送信。受領者が位置とタイミングを合わせます。`;
    case CaptionCode.CatchWindow:
      return `受領可能。P${state.pendingTarget}が受領操作を入力してください。`;
    case CaptionCode.HandoffMissed:
      return "受領不成立。ownerは送信者のままです。routeを選び直してください。";
    case CaptionCode.RelayActivated:
      return `Relay Point ${state.relayIndex} 接続。役割を交換しました。`;
    case CaptionCode.PairlessAwoke:
      return "PAIRLESS出現。往路だけでは解決しません。";
    case CaptionCode.ReciprocalReturn:
      return "RETURNを要求。制限内に元のownerへCoreを返してください。";
    case CaptionCode.PairlessReset:
      return "相互受領が途切れました。PAIRLESSの往復をやり直します。";
    case CaptionCode.MissionComplete:
      return "相互handoff成立。PAIRLESSは二つの声へ分かれ、Twin Spanが開通しました。";
  }
}

function parseIntegerInput(input: HTMLInputElement): number | undefined {
  input.setCustomValidity("");
  if (!input.checkValidity()) {
    input.reportValidity();
    return undefined;
  }
  const value = input.valueAsNumber;
  if (!Number.isSafeInteger(value)) {
    input.setCustomValidity("整数を入力してください。");
    input.reportValidity();
    return undefined;
  }
  return value;
}

export function mountSecondHandProof(
  root: HTMLElement
): SecondHandController {
  const canvas = requireWithin(root, "#handoff-canvas", HTMLCanvasElement);
  const status = requireWithin(root, "#handoff-status", HTMLElement);
  const caption = requireWithin(root, "#handoff-caption", HTMLElement);
  const resetButton = requireWithin(
    root,
    "#handoff-reset",
    HTMLButtonElement
  );
  const settings = requireWithin(
    root,
    "#second-hand-settings",
    HTMLFormElement
  );
  const p1LatencyInput = requireWithin(
    root,
    "#latency-p1",
    HTMLInputElement
  );
  const p2LatencyInput = requireWithin(
    root,
    "#latency-p2",
    HTMLInputElement
  );
  const jitterInput = requireWithin(
    root,
    "#latency-jitter",
    HTMLInputElement
  );
  const lossInput = requireWithin(
    root,
    "#latency-loss",
    HTMLInputElement
  );
  const seedInput = requireWithin(
    root,
    "#latency-seed",
    HTMLInputElement
  );
  const catchAssistInput = requireWithin(
    root,
    "#catch-assist",
    HTMLInputElement
  );
  const reducedFlashInput = requireWithin(
    root,
    "#reduced-flash",
    HTMLInputElement
  );
  const captionsInput = requireWithin(
    root,
    "#captions-enabled",
    HTMLInputElement
  );
  const inputMap = requireWithin(root, "#input-map", HTMLElement);
  const resetBindingsButton = requireWithin(
    root,
    "#reset-bindings",
    HTMLButtonElement
  );
  const exportButton = requireWithin(
    root,
    "#export-playtest",
    HTMLButtonElement
  );
  const sessionIdElement = requireWithin(
    root,
    "#playtest-session",
    HTMLElement
  );
  const eventCountElement = requireWithin(
    root,
    "#playtest-event-count",
    HTMLElement
  );
  const tickElement = requireWithin(root, "#handoff-tick", HTMLElement);
  const fixtureRows = requireWithin(
    root,
    "#latency-fixture-rows",
    HTMLTableSectionElement
  );
  const modeButtons = Array.from(
    root.querySelectorAll<HTMLButtonElement>("[data-second-hand-mode]")
  );
  if (modeButtons.length !== 2) {
    throw new Error("SECOND HAND requires local and AI mode buttons");
  }

  let mode: GameModeValue = GameMode.LocalTwoPlayer;
  let state = createSecondHandState({ mode });
  let playtestLog = createPlaytestLog(randomSessionId(), mode);
  let bindings = createDefaultBindings();
  let pendingBinding: BindingAction | undefined;
  let accumulator = 0;
  let lastFrame = 0;
  let lastStatusText = "";
  let lastCaptionText = "";
  let lastSessionId = "";
  let lastEventCount = -1;
  let activeCaption = "";
  let activeCaptionUntilTick = 0;
  const captionQueue: string[] = [];
  const heldKeys = new Set<string>();
  const bindingButtons = new Map<BindingAction, HTMLButtonElement>();

  const updateBindingButtons = (): void => {
    for (const [action, button] of bindingButtons) {
      const keyText =
        pendingBinding === action ? "キーを押す…" : displayKey(bindings[action]);
      button.textContent = keyText;
      const actionLabel = button.dataset["bindingLabel"];
      if (actionLabel === undefined) {
        throw new Error(`Missing binding label for ${action}`);
      }
      button.setAttribute("aria-label", `${actionLabel}: ${keyText}`);
      button.setAttribute("aria-pressed", String(pendingBinding === action));
    }
  };

  const cancelPendingBinding = (): void => {
    if (pendingBinding !== undefined) {
      pendingBinding = undefined;
      updateBindingButtons();
    }
  };

  for (const spec of BINDING_SPECS) {
    const label = document.createElement("span");
    label.textContent = spec.label;
    const button = document.createElement("button");
    button.id = `binding-${spec.action}`;
    button.type = "button";
    button.className = "binding-button";
    button.dataset["bindingLabel"] = spec.label;
    button.addEventListener("click", () => {
      pendingBinding = spec.action;
      updateBindingButtons();
      button.focus();
    });
    const row = document.createElement("div");
    row.className = "binding-row";
    row.append(label, button);
    inputMap.append(row);
    bindingButtons.set(spec.action, button);
  }
  updateBindingButtons();

  for (const fixture of LATENCY_FIXTURES) {
    const row = document.createElement("tr");
    const values = [
      `${fixture.latencyMs} ms`,
      `${fixture.jitterMs} ms`,
      `${fixture.lossPermille}‰`,
      String(fixture.seed),
      `${fixture.maxReceiveTicks} tick`
    ];
    for (const value of values) {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.append(cell);
    }
    fixtureRows.append(row);
  }

  const currentConfig = (): SecondHandConfig | undefined => {
    for (const input of [
      p1LatencyInput,
      p2LatencyInput,
      jitterInput,
      lossInput,
      seedInput
    ]) {
      input.setCustomValidity("");
    }
    if (!settings.reportValidity()) {
      return undefined;
    }
    const p1DelayMs = parseIntegerInput(p1LatencyInput);
    const p2DelayMs = parseIntegerInput(p2LatencyInput);
    const jitterMs = parseIntegerInput(jitterInput);
    const lossPermille = parseIntegerInput(lossInput);
    const seed = parseIntegerInput(seedInput);
    if (
      p1DelayMs === undefined ||
      p2DelayMs === undefined ||
      jitterMs === undefined ||
      lossPermille === undefined ||
      seed === undefined
    ) {
      return undefined;
    }
    return {
      mode,
      catchAssist: catchAssistInput.checked,
      p1DelayMs,
      p2DelayMs,
      jitterMs,
      lossPermille,
      seed
    };
  };

  const refreshModeButtons = (): void => {
    for (const button of modeButtons) {
      const buttonMode = Number(button.dataset["secondHandMode"]);
      button.setAttribute("aria-pressed", String(buttonMode === mode));
    }
  };

  const enqueueCaption = (captionState: SecondHandState): void => {
    if (!captionsInput.checked) {
      return;
    }
    const text = describeCaption(captionState);
    const queued = captionQueue[captionQueue.length - 1];
    if (text !== activeCaption && text !== queued) {
      captionQueue.push(text);
    }
  };

  const refreshText = (): void => {
    const pendingText =
      state.pendingTarget === 0
        ? "待機"
        : `P${state.pendingTarget}へ転送`;
    const statusText = [
      `P${state.owner} OWNER`,
      `Relay ${state.relayIndex}/4`,
      `Sequence ${state.handoffSequence}`,
      pendingText
    ].join(" · ");
    if (statusText !== lastStatusText) {
      status.textContent = statusText;
      lastStatusText = statusText;
    }
    status.dataset["owner"] = String(state.owner);
    status.dataset["sequence"] = String(state.handoffSequence);
    status.dataset["relay"] = String(state.relayIndex);
    status.dataset["phase"] = String(state.encounterPhase);
    status.dataset["complete"] = String(
      state.encounterPhase === EncounterPhase.Complete
    );
    if (
      captionsInput.checked &&
      (activeCaption.length === 0 || state.tick >= activeCaptionUntilTick)
    ) {
      activeCaption = captionQueue.shift() ?? describeCaption(state);
      activeCaptionUntilTick = state.tick + CAPTION_HOLD_TICKS;
    } else if (!captionsInput.checked) {
      activeCaption = "";
      activeCaptionUntilTick = 0;
      captionQueue.length = 0;
    }
    const captionText = activeCaption;
    if (captionText !== lastCaptionText) {
      caption.textContent = captionText;
      lastCaptionText = captionText;
    }
    tickElement.textContent = `tick ${state.tick} · queue ${state.inputQueue.length}`;
    if (playtestLog.sessionId !== lastSessionId) {
      sessionIdElement.textContent = playtestLog.sessionId;
      lastSessionId = playtestLog.sessionId;
    }
    if (playtestLog.events.length !== lastEventCount) {
      eventCountElement.textContent = String(playtestLog.events.length);
      lastEventCount = playtestLog.events.length;
    }
  };

  const reset = (): boolean => {
    const config = currentConfig();
    if (config === undefined) {
      return false;
    }
    state = createSecondHandState(config);
    playtestLog = createPlaytestLog(randomSessionId(), mode);
    playtestLog = appendPlaytestEvent(
      playtestLog,
      0,
      PlaytestEventCode.LatencyConfigured,
      1,
      config.p1DelayMs
    );
    playtestLog = appendPlaytestEvent(
      playtestLog,
      0,
      PlaytestEventCode.LatencyConfigured,
      2,
      config.p2DelayMs
    );
    playtestLog = appendPlaytestEvent(
      playtestLog,
      0,
      PlaytestEventCode.JitterConfigured,
      0,
      config.jitterMs
    );
    playtestLog = appendPlaytestEvent(
      playtestLog,
      0,
      PlaytestEventCode.LossConfigured,
      0,
      config.lossPermille
    );
    playtestLog = appendPlaytestEvent(
      playtestLog,
      0,
      PlaytestEventCode.CatchAssistConfigured,
      0,
      config.catchAssist ? 1 : 0
    );
    playtestLog = appendPlaytestEvent(
      playtestLog,
      0,
      PlaytestEventCode.SeedConfigured,
      0,
      config.seed
    );
    accumulator = 0;
    lastFrame = 0;
    lastStatusText = "";
    lastCaptionText = "";
    lastSessionId = "";
    lastEventCount = -1;
    activeCaption = "";
    activeCaptionUntilTick = 0;
    captionQueue.length = 0;
    enqueueCaption(state);
    heldKeys.clear();
    refreshModeButtons();
    drawTwinSpan(canvas, state, reducedFlashInput.checked);
    refreshText();
    return true;
  };

  const inputMask = (): number => {
    let mask = SecondHandInput.None;
    for (const spec of BINDING_SPECS) {
      if (heldKeys.has(bindings[spec.action])) {
        mask |= spec.input;
      }
    }
    return mask;
  };

  window.addEventListener("keydown", (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }
    if (pendingBinding !== undefined) {
      if (event.code === "Escape") {
        event.preventDefault();
        cancelPendingBinding();
        return;
      }
      if (FOCUS_NAVIGATION_CODES.has(event.code)) {
        cancelPendingBinding();
        return;
      }
      event.preventDefault();
      const oldCode = bindings[pendingBinding];
      const conflict = BINDING_SPECS.find(
        (spec) =>
          spec.action !== pendingBinding &&
          bindings[spec.action] === event.code
      );
      if (conflict !== undefined) {
        bindings = { ...bindings, [conflict.action]: oldCode };
      }
      bindings = { ...bindings, [pendingBinding]: event.code };
      pendingBinding = undefined;
      updateBindingButtons();
      canvas.focus();
      return;
    }
    if (document.activeElement !== canvas) {
      return;
    }
    if (event.code === "Escape" || FOCUS_NAVIGATION_CODES.has(event.code)) {
      return;
    }
    if (!Object.values(bindings).includes(event.code)) {
      return;
    }
    event.preventDefault();
    heldKeys.add(event.code);
  });

  window.addEventListener("keyup", (event) => {
    if (heldKeys.has(event.code)) {
      heldKeys.delete(event.code);
      if (document.activeElement === canvas) {
        event.preventDefault();
      }
    }
  });

  resetBindingsButton.addEventListener("click", () => {
    bindings = createDefaultBindings();
    cancelPendingBinding();
    heldKeys.clear();
    updateBindingButtons();
  });

  for (const button of modeButtons) {
    button.addEventListener("click", () => {
      const requestedMode = Number(button.dataset["secondHandMode"]);
      if (
        requestedMode !== GameMode.LocalTwoPlayer &&
        requestedMode !== GameMode.AiCompanion
      ) {
        throw new Error("Unsupported SECOND HAND mode button");
      }
      const previousMode = mode;
      mode = requestedMode;
      if (reset()) {
        canvas.focus();
      } else {
        mode = previousMode;
        refreshModeButtons();
      }
    });
  }

  settings.addEventListener("submit", (event) => {
    event.preventDefault();
    if (reset()) {
      canvas.focus();
    }
  });
  resetButton.addEventListener("click", () => {
    if (reset()) {
      canvas.focus();
    }
  });
  captionsInput.addEventListener("change", () => {
    activeCaption = "";
    activeCaptionUntilTick = 0;
    captionQueue.length = 0;
    lastCaptionText = "";
    enqueueCaption(state);
    refreshText();
  });
  reducedFlashInput.addEventListener("change", () => {
    drawTwinSpan(canvas, state, reducedFlashInput.checked);
  });
  canvas.addEventListener("click", () => canvas.focus());
  exportButton.addEventListener("click", () => {
    const blob = new Blob([serializePlaytestLog(playtestLog)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `second-hand-playtest-${playtestLog.sessionId}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  });

  const frame = (timestamp: number): void => {
    if (lastFrame === 0) {
      lastFrame = timestamp;
    }
    accumulator += Math.min(timestamp - lastFrame, MAX_FRAME_MS);
    lastFrame = timestamp;

    while (accumulator >= STEP_MS) {
      const previous = state;
      state = stepSecondHand(state, inputMask());
      playtestLog = appendTransitionEvents(playtestLog, previous, state);
      if (state.captionCode !== previous.captionCode) {
        enqueueCaption(state);
      }
      accumulator -= STEP_MS;
    }

    drawTwinSpan(canvas, state, reducedFlashInput.checked);
    refreshText();
    requestAnimationFrame(frame);
  };

  if (!reset()) {
    throw new Error("Default SECOND HAND settings must be valid");
  }
  requestAnimationFrame(frame);
  return {
    getState: () => state,
    getPlaytestLog: () => playtestLog
  };
}
