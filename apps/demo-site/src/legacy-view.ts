import {
  LEGACY_DURATION_TICKS,
  LEGACY_REPLAY,
  createLegacyState,
  legacyInputAtTick,
  stepLegacy,
  type LegacyState
} from "@star-relay/legacy-1998";

const STEP_MS = 1000 / 60;
const MAX_FRAME_MS = 250;

function drawLegacy(canvas: HTMLCanvasElement, state: LegacyState): void {
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
  context.lineWidth = 1;
  for (let gridX = 0; gridX <= canvas.width; gridX += 40) {
    context.beginPath();
    context.moveTo(gridX, 0);
    context.lineTo(gridX, canvas.height);
    context.stroke();
  }
  for (let gridY = 0; gridY <= canvas.height; gridY += 40) {
    context.beginPath();
    context.moveTo(0, gridY);
    context.lineTo(canvas.width, gridY);
    context.stroke();
  }

  context.strokeStyle = "#f5b942";
  context.lineWidth = 5;
  context.beginPath();
  context.moveTo(x(5600), y(1800));
  context.lineTo(x(7600), y(1800));
  context.stroke();

  context.fillStyle = "#ff4f91";
  context.beginPath();
  context.moveTo(x(8500), y(2700));
  context.lineTo(x(8800), y(3300));
  context.lineTo(x(8200), y(3300));
  context.closePath();
  context.fill();

  context.strokeStyle = "#f5b942";
  context.lineWidth = 3;
  context.strokeRect(x(11850), y(4900), x(500), y(900));

  if (state.routePreviewTicks > 0) {
    context.setLineDash([8, 8]);
    context.strokeStyle = "#7be7ff";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(x(state.playerX), y(state.playerY));
    context.lineTo(x(6800), y(1800));
    context.lineTo(x(12000), y(5300));
    context.stroke();
    context.setLineDash([]);
  }

  context.fillStyle = "#d7e3f4";
  context.beginPath();
  context.moveTo(x(state.playerX), y(state.playerY - 260));
  context.lineTo(x(state.playerX + 240), y(state.playerY + 220));
  context.lineTo(x(state.playerX - 240), y(state.playerY + 220));
  context.closePath();
  context.fill();

  context.strokeStyle =
    state.overrayTicks > 0 ? "#ffffff" : "#7be7ff";
  context.lineWidth = state.overrayTicks > 0 ? 6 : 4;
  context.beginPath();
  context.arc(x(state.coreX), y(state.coreY), 9, 0, Math.PI * 2);
  context.stroke();

  context.fillStyle = "#d7e3f4";
  context.font = "14px monospace";
  context.fillText(`TICK ${state.tick.toString().padStart(4, "0")}`, 16, 24);
  context.fillText(`CHAIN ${state.chain}`, 16, 44);
  context.fillText(`CHARGE ${state.charge}`, 16, 64);
  context.fillText(`SCORE ${state.score}`, 16, 84);
  context.fillText("MIRROR", x(6150), y(1500));
  context.fillText("HUM", x(8300), y(3600));
  context.fillText("RELAY", x(11600), y(6200));
}

function legacyStatus(state: LegacyState): string {
  if (state.overrayTicks > 0) {
    return "OVERRAY — PERFECT CATCH confirmed";
  }
  if (state.phase === 3) {
    return "RETURN PASS — catch inputを待機";
  }
  if (state.connectedRelay === 1) {
    return "Relay connected";
  }
  if (state.piercedEnemy === 1) {
    return "HUM pierced";
  }
  if (state.banked === 1) {
    return "BANK PASS";
  }
  if (state.phase === 1) {
    return "Core outbound";
  }
  if (state.routePreviewTicks > 0) {
    return "Route preview";
  }
  if (state.tick >= LEGACY_DURATION_TICKS) {
    return "30-second replay complete";
  }
  return "Core held";
}

export function mountLegacyProof(
  canvas: HTMLCanvasElement,
  status: HTMLElement,
  restart: HTMLButtonElement
): () => LegacyState {
  let state = createLegacyState(LEGACY_REPLAY.seed);
  let accumulator = 0;
  let lastFrame = 0;

  const reset = (): void => {
    state = createLegacyState(LEGACY_REPLAY.seed);
    accumulator = 0;
    lastFrame = 0;
    drawLegacy(canvas, state);
    status.textContent = legacyStatus(state);
  };

  restart.addEventListener("click", reset);

  const frame = (timestamp: number): void => {
    if (lastFrame === 0) {
      lastFrame = timestamp;
    }
    accumulator += Math.min(timestamp - lastFrame, MAX_FRAME_MS);
    lastFrame = timestamp;

    while (accumulator >= STEP_MS && state.tick < LEGACY_DURATION_TICKS) {
      const replayTick = state.tick;
      state = stepLegacy(
        state,
        legacyInputAtTick(LEGACY_REPLAY, replayTick)
      );
      accumulator -= STEP_MS;
    }

    drawLegacy(canvas, state);
    status.textContent = `${legacyStatus(state)} · tick ${state.tick}/${LEGACY_DURATION_TICKS}`;
    status.dataset["tick"] = String(state.tick);
    requestAnimationFrame(frame);
  };

  reset();
  requestAnimationFrame(frame);
  return () => state;
}
