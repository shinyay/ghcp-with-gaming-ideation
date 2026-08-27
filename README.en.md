# STAR RELAY Archive-to-Playable

The Japanese [README](README.md) is authoritative.

STAR RELAY is a wholly fictional arcade game said to have shipped in 1998.
This private teaching repository demonstrates how GitHub and Copilot can connect
archive evidence, reviewed interpretation, a human decision, and a playable
proof without confusing those layers.

The current scope covers Phases 0–8:

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
- production Museum, Archive Explorer, and Creative Lineage Explorer views;
- an offline five-stop path from Museum through both playables;
- deterministic ZIP packaging, a build manifest, and `SHA256SUMS`;
- seven core prompt files and four phase agents that keep evidence, inference,
  proposal, and decision apart;
- eleven read-only professional Role Lens agents and eleven bound prompts for
  cross-functional review without fictional colleagues or approvals; and
- ten fixed workflow scenarios plus eleven fixed Role Lens scenarios scored on
  structure and citation validity only.

## Copilot experience

Repository and path instructions require an existing stable ID and a declared
locator behind every evidence line, keep contradictions open, forbid adopting a
design bet, and require an accepted decision record before playable meaning
changes. Archive Curator and Provenance Auditor are read-only; no agent or
prompt is granted shell execution.

The [self-guided workshop](demo/self-guided-workshop.md) is a 70-minute solo
path from archive to three distinct design bets and one planned slice.
The [Role Lens workshop](demo/role-lens-workshop.md) applies two to four
professional analysis lenses to the same target and returns questions to real
human team members.
The [Phase 8 runbook](demo/runbook.md) provides the 60-minute presenter path;
the [self-guided demo](demo/self-guided-demo.md) is the 20-minute local path.

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
history. The repository remains private. GitHub Pages publishes only
`pages/index.html` and `pages/game-guide/index.html`; no other repository
content is included. Browser code never depends on a GitHub token or API.

## Run locally

```powershell
npm ci
npm test
npm run build
npm run package:offline
npm run package:release
npm run verify:release
npm run serve:offline
```

Open `http://127.0.0.1:4173`.

`npm run gate:phase8` runs the complete local gate. The Release workflow accepts
only an existing annotated `vX.Y.Z-demo-reference` tag, uploads allowlisted
assets to a draft Release in this private repository, and remains separate from
the limited GitHub Pages deployment.

```powershell
npm run validate:pages
npm run serve:pages
```

The Pages rights and path allowlist are defined in
[`governance/pages-publication-policy.md`](governance/pages-publication-policy.md)
and [`NOTICE.md`](NOTICE.md).
