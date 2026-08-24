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
import { mountArchiveExplorer } from "./archive-view";
import { mountCreativeLineage } from "./creative-lineage-view";
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

mountArchiveExplorer({
  search: requireElement("#archive-search", HTMLInputElement),
  media: requireElement("#archive-media", HTMLSelectElement),
  clear: requireElement("#archive-clear", HTMLButtonElement),
  list: requireElement("#archive-results", HTMLElement),
  count: requireElement("#archive-count", HTMLElement),
  empty: requireElement("#archive-empty", HTMLElement)
});

const lineageList = requireElement("#lineage-list", HTMLOListElement);
mountCreativeLineage({
  list: lineageList,
  count: requireElement("#lineage-count", HTMLElement),
  filters: Array.from(
    document.querySelectorAll<HTMLButtonElement>("[data-lineage-stage]")
  )
});

const main = requireElement("main", HTMLElement);
const lineageSection = requireElement("#lineage", HTMLElement);
const legacySection = requireElement("#legacy", HTMLElement);
const secondHandRoot = requireElement("#second-hand", HTMLElement);
main.insertBefore(lineageSection, secondHandRoot);
main.insertBefore(legacySection, secondHandRoot);

const secondHand = mountSecondHandProof(secondHandRoot);

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
