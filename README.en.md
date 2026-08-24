# STAR RELAY Archive-to-Playable

The Japanese [README](README.md) is authoritative.

STAR RELAY is a wholly fictional arcade game said to have shipped in 1998.
This private teaching repository demonstrates how GitHub and Copilot can connect
archive evidence, reviewed interpretation, a human decision, and a playable
proof without confusing those layers.

The current scope covers Phases 0–7:

- thirty demo-safe synthetic derived records spanning documents, spreadsheets,
  manuals, QA records, art metadata, audio metadata, C89-style source, and a
  replay stream;
- fourteen single-source claims, eight unresolved conflicts, three falsifiable
  hypotheses, and one reviewed finding;
- seven evidence packets, each of which names a question and a reading set but
  never an answer;
- one complete stable-ID lineage to `VS-001`;
- a deterministic 30-second 1998 core-loop proof;
- a one-screen local two-player handoff proof;
- a static, offline-safe lineage view;
- seven prompt files and four custom agents that keep evidence, inference,
  proposal, and decision apart; and
- ten fixed evaluation scenarios scored on structure and citation validity
  only.

## Copilot experience

Repository and path instructions require an existing stable ID and a declared
locator behind every evidence line, keep contradictions open, forbid adopting a
design bet, and require an accepted decision record before playable meaning
changes. Archive Curator and Provenance Auditor are read-only; no agent or
prompt is granted shell execution.

The [self-guided workshop](demo/self-guided-workshop.md) is a 60-minute solo
path from archive to three distinct design bets and one planned slice.

Scoring covers structure only: sections present, citations that resolve,
contradictions left open, decisions left to the human. Expected answers,
answer keys, and scored runs live in a separate private reference repository.
See [evaluation/](evaluation/README.md).

Copilot Space has no supported creation API here, so no Space was created. The
manual procedure is in `ops/github/copilot-space-setup.md`.

Every packet requires at least three distinct assets drawn from at least two
archive categories and two planned originals, so no single fixture answers a
question by itself. Validation resolves every locator against the real file and
rejects research records that cite locators the catalog does not declare.

No answer keys, expected responses, completed findings, real people, real
products, fabricated Git history, reactions, polls, or historical users belong
here. The 1998 dates are fixture metadata and are never written into Git
history. GitHub Pages stays unpublished, and browser code never depends on a
GitHub token or API.

## Run locally

```powershell
npm ci
npm test
npm run build
npm run package:offline
npm run serve:offline
```

Open `http://127.0.0.1:4173`.
