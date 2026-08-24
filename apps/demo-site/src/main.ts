import "./styles.css";
import {
  predictLegacyRoute,
  runLegacyReplay,
  type LegacyRoutePrediction,
  type LegacyState
} from "@star-relay/legacy-1998";
import type {
  PlaytestLog,
  SecondHandState
} from "@star-relay/second-hand";
import { renderLineage } from "./lineage-view";
import { mountLegacyProof } from "./legacy-view";
import { mountSecondHandProof } from "./second-hand-view";

interface DemoBridge {
  readonly legacy: {
    readonly finalHash: string;
    readonly checkpointHashes: Readonly<Record<string, string>>;
    readonly tick: number;
  };
  readonly getLegacyState: () => LegacyState;
  readonly getLegacyMode: () => "attract" | "manual";
  readonly predictLegacyRoute: (
    playerX: number,
    playerY: number
  ) => LegacyRoutePrediction;
  readonly getSecondHandState: () => SecondHandState;
  readonly getPlaytestLog: () => PlaytestLog;
}

declare global {
  interface Window {
    __STAR_RELAY_DEMO__: DemoBridge;
  }
}

function requireElement<T extends Element>(
  selector: string,
  constructor: { new (): T }
): T {
  const element = document.querySelector(selector);
  if (!(element instanceof constructor)) {
    throw new Error(`Missing required element: ${selector}`);
  }
  return element;
}

const legacyCanvas = requireElement("#legacy-canvas", HTMLCanvasElement);
const legacyStatus = requireElement("#legacy-status", HTMLElement);
const legacyCaption = requireElement("#legacy-caption-copy", HTMLElement);
const legacyRestart = requireElement("#legacy-restart", HTMLButtonElement);
const legacyMode = requireElement("#legacy-mode", HTMLButtonElement);
const legacyModeLabel = requireElement("#legacy-mode-label", HTMLElement);
const legacyScreen = requireElement("#legacy-screen", HTMLElement);
const legacyCrt = requireElement("#legacy-crt", HTMLButtonElement);
const legacyFlash = requireElement("#legacy-flash", HTMLButtonElement);
const legacySteps = Array.from(
  document.querySelectorAll<HTMLElement>("[data-legacy-step]")
);
if (legacySteps.length !== 4) {
  throw new Error("Mirror Corridor requires four tutorial steps.");
}
const legacyController = mountLegacyProof({
  canvas: legacyCanvas,
  status: legacyStatus,
  caption: legacyCaption,
  restart: legacyRestart,
  mode: legacyMode,
  modeLabel: legacyModeLabel,
  screen: legacyScreen,
  crt: legacyCrt,
  reducedFlash: legacyFlash,
  steps: legacySteps
});

const secondHandRoot = requireElement("#second-hand", HTMLElement);
const secondHand = mountSecondHandProof(secondHandRoot);

const lineageList = requireElement("#lineage-list", HTMLOListElement);
renderLineage(lineageList);

const replay = runLegacyReplay();
document.documentElement.dataset["legacyHash"] = replay.finalHash;
window.__STAR_RELAY_DEMO__ = {
  legacy: {
    finalHash: replay.finalHash,
    checkpointHashes: replay.checkpointHashes,
    tick: replay.state.tick
  },
  getLegacyState: legacyController.getState,
  getLegacyMode: legacyController.getMode,
  predictLegacyRoute,
  getSecondHandState: secondHand.getState,
  getPlaytestLog: secondHand.getPlaytestLog
};
