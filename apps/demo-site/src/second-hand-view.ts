import {
  SecondHandInput,
  createSecondHandState,
  stepSecondHand,
  type SecondHandState
} from "@star-relay/second-hand";

const STEP_MS = 1000 / 60;
const MAX_FRAME_MS = 250;
const RELEVANT_KEYS = new Set(["KeyF", "KeyQ", "Enter"]);

function drawTriangle(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  filled: boolean
): void {
  context.beginPath();
  context.moveTo(centerX, centerY - 30);
  context.lineTo(centerX + 28, centerY + 26);
  context.lineTo(centerX - 28, centerY + 26);
  context.closePath();
  filled ? context.fill() : context.stroke();
}

function drawHandoff(
  canvas: HTMLCanvasElement,
  state: SecondHandState
): void {
  const context = canvas.getContext("2d");
  if (context === null) {
    throw new Error("Canvas 2D is unavailable");
  }

  const scaleX = canvas.width / 12800;
  const scaleY = canvas.height / 7200;
  const x = (value: number): number => value * scaleX;
  const y = (value: number): number => value * scaleY;

  context.fillStyle = "#07101f";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.strokeStyle = "#263a54";
  context.lineWidth = 2;
  context.setLineDash([6, 8]);
  context.beginPath();
  context.moveTo(x(state.p1X), y(state.p1Y));
  context.lineTo(x(state.p2X), y(state.p2Y));
  context.stroke();
  context.setLineDash([]);

  context.fillStyle = state.owner === 1 ? "#7be7ff" : "#263a54";
  context.strokeStyle = "#7be7ff";
  context.lineWidth = 4;
  drawTriangle(context, x(state.p1X), y(state.p1Y), state.owner === 1);

  context.fillStyle = state.owner === 2 ? "#f5b942" : "#263a54";
  context.strokeStyle = "#f5b942";
  context.lineWidth = 4;
  if (state.owner === 2) {
    context.fillRect(x(state.p2X) - 28, y(state.p2Y) - 28, 56, 56);
  } else {
    context.strokeRect(x(state.p2X) - 28, y(state.p2Y) - 28, 56, 56);
  }

  context.strokeStyle = "#ffffff";
  context.lineWidth = 5;
  context.beginPath();
  context.arc(x(state.coreX), y(state.coreY), 12, 0, Math.PI * 2);
  context.stroke();

  context.fillStyle = "#d7e3f4";
  context.font = "15px monospace";
  context.textAlign = "center";
  context.fillText("P1 △", x(state.p1X), y(state.p1Y) + 62);
  context.fillText("P2 □", x(state.p2X), y(state.p2Y) + 62);
  context.fillText(
    state.pendingTarget === 0
      ? `OWNER P${state.owner}`
      : `IN TRANSIT → P${state.pendingTarget}`,
    canvas.width / 2,
    54
  );
  context.fillText(
    `HANDOFF SEQUENCE ${state.handoffSequence}`,
    canvas.width / 2,
    canvas.height - 36
  );
  context.textAlign = "start";
}

function describeHandoff(state: SecondHandState): string {
  if (state.pendingTarget !== 0) {
    const remaining = state.readyTick - state.tick;
    if (remaining > 0) {
      return `P${state.owner}が送信 · P${state.pendingTarget}受領まで ${remaining} tick`;
    }
    return `P${state.pendingTarget}は受領可能`;
  }
  if (state.lastAcceptedTick > 0) {
    return `P${state.owner}が受領 · sequence ${state.handoffSequence}`;
  }
  return "P1がCoreを保持 · Fで送信";
}

export function mountSecondHandProof(
  canvas: HTMLCanvasElement,
  status: HTMLElement,
  resetButton: HTMLButtonElement
): () => SecondHandState {
  let state = createSecondHandState();
  let accumulator = 0;
  let lastFrame = 0;
  const heldKeys = new Set<string>();
  const pressedKeys = new Set<string>();

  const reset = (): void => {
    state = createSecondHandState();
    accumulator = 0;
    lastFrame = 0;
    heldKeys.clear();
    pressedKeys.clear();
    drawHandoff(canvas, state);
    status.textContent = describeHandoff(state);
  };

  const inputMask = (): number => {
    let mask = SecondHandInput.None;

    if (
      pressedKeys.has("KeyF") &&
      state.owner === 1 &&
      state.pendingTarget === 0
    ) {
      mask |= SecondHandInput.P1Send;
    }
    if (heldKeys.has("KeyQ") && state.pendingTarget === 1) {
      mask |= SecondHandInput.P1Accept;
    }
    if (pressedKeys.has("Enter")) {
      if (state.owner === 2 && state.pendingTarget === 0) {
        mask |= SecondHandInput.P2Send;
      }
    }
    if (heldKeys.has("Enter") && state.pendingTarget === 2) {
      mask |= SecondHandInput.P2Accept;
    }

    return mask;
  };

  window.addEventListener("keydown", (event) => {
    if (!RELEVANT_KEYS.has(event.code)) {
      return;
    }
    event.preventDefault();
    if (!heldKeys.has(event.code)) {
      pressedKeys.add(event.code);
    }
    heldKeys.add(event.code);
  });

  window.addEventListener("keyup", (event) => {
    if (!RELEVANT_KEYS.has(event.code)) {
      return;
    }
    event.preventDefault();
    heldKeys.delete(event.code);
  });

  resetButton.addEventListener("click", reset);
  canvas.addEventListener("click", () => canvas.focus());

  const frame = (timestamp: number): void => {
    if (lastFrame === 0) {
      lastFrame = timestamp;
    }
    accumulator += Math.min(timestamp - lastFrame, MAX_FRAME_MS);
    lastFrame = timestamp;

    while (accumulator >= STEP_MS) {
      state = stepSecondHand(state, inputMask());
      pressedKeys.clear();
      accumulator -= STEP_MS;
    }

    drawHandoff(canvas, state);
    status.textContent = `${describeHandoff(state)} · tick ${state.tick}`;
    status.dataset["owner"] = String(state.owner);
    status.dataset["sequence"] = String(state.handoffSequence);
    requestAnimationFrame(frame);
  };

  reset();
  requestAnimationFrame(frame);
  return () => state;
}
