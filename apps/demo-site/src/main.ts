import "./styles.css";
import { runLegacyReplay } from "@star-relay/legacy-1998";
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
const legacyRestart = requireElement("#legacy-restart", HTMLButtonElement);
mountLegacyProof(legacyCanvas, legacyStatus, legacyRestart);

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
  getSecondHandState: secondHand.getState,
  getPlaytestLog: secondHand.getPlaytestLog
};
