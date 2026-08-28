# STAR RELAY Archive-to-Playable

[日本語（正本）](README.md) | [English](README.en.md)

> The Japanese [README](README.md) is authoritative. This private demo
> repository traces thirty internally authored fixtures for a fictional 1998
> arcade game through evidence, reviewed interpretation, human decisions, and
> two deterministic Canvas 2D proofs. It contains no real historical material,
> answer key, or expected response. The repository remains private; the only
> public content is the owner-approved `pages/index.html` and
> `pages/game-guide/index.html`.

## What this repository is

STAR RELAY is a wholly fictional arcade game said to have shipped in 1998. This
repository is a demonstration and teaching environment for managing a mixed
archive in GitHub while connecting evidence, interpretation, proposals, human
decisions, and implementation through stable IDs.

```text
Archive -> Understand -> Imagine -> Decide -> Plan -> Build -> Learn
```

The implemented scope covers Phases 0–8: converted-archive fixtures, research
records, design and canon, GitHub collaboration surfaces, Copilot prompts and
agents, two playables, a Museum, Archive and Creative Lineage Explorers, offline
packaging, a private draft Release, and narrowly scoped GitHub Pages artifacts.

This repository is not:

- an archive of real games, companies, people, or hardware;
- a corpus produced by converting real Office or PDF originals;
- a home for answer keys, expected responses, or scored runs;
- a complete restoration or production game; or
- a license to publish or redistribute the whole repository.

## Quick start

[Node.js 22 or later](package.json) is required for the source demo. `npm test`
and the complete gate also require PowerShell 7 (`pwsh`) and Playwright
Chromium. Live GitHub reconciliation additionally requires GitHub CLI and
appropriate authentication, but the local/offline demo does not.

To run the five source views:

```powershell
npm ci
npm run dev
```

Open `http://127.0.0.1:4173`. The browser runtime does not require GitHub
sign-in, a GitHub token, or the GitHub API.

Install Chromium once in a checkout where you want to run browser tests:

```powershell
npx playwright install chromium
npm test
```

### Run the offline package

```powershell
npm run build
npm run package:offline
npm run serve:offline
```

Open the same `http://127.0.0.1:4173` URL. This serves the allowlisted
`dist/offline-demo-pack/` through a local server with security headers and no
required external requests. Follow the
[self-guided demo](demo/self-guided-demo.md) for the 20-minute route.

### Five-stop path

| Stop | View | What to observe |
|---:|---|---|
| 1 | Museum (`#museum`) | Fictional archive, layer separation, offline/private boundary |
| 2 | Archive Explorer (`#archive`) | IDs, paths, media families, and declared locators for 30 DRVs |
| 3 | Creative Lineage (`#lineage`) | Connections from Evidence to existing records, decisions, and delivery |
| 4 | Legacy / Mirror Corridor (`#legacy`) | Fixed 30-second replay and manual controls |
| 5 | SECOND HAND / Twin Span (`#second-hand`) | Local two-player, AI companion, latency fixtures, and handoff state |

### Playable controls

| View | Default controls | Supporting features |
|---|---|---|
| Mirror Corridor | Arrow keys move; hold `A` to preview a route, release to launch, and press `A` during Return to receive. Gamepad: left stick/D-pad + A | Attract/manual mode, restart, CRT, reduced flash |
| SECOND HAND P1 | `W`/`S` move, `A` selects DIRECT, `D` selects SHELTER, `F` sends/receives | Key remapping, captions, reduced flash, catch assist |
| SECOND HAND P2 | Up/down arrows move, left/right arrows select a route, `Enter` sends/receives | Local 2P / 1P + AI, delay/jitter/loss/seed controls |

SECOND HAND keeps playtest events in browser memory and downloads JSON only
after an explicit action. Apart from a random session ID, the log contains only
numeric enums and integers—never names, email addresses, free text, IP
addresses, device IDs, or telemetry uploads.

## Current inventory

| Record or surface | Current contents |
|---|---:|
| Synthetic DRVs | 30 across 8 categories; all `demo-safe` and `ai_eligible: true` |
| Claims | 14 |
| Unresolved Conflicts | 8 |
| Hypotheses | 3 |
| Human-reviewed Findings | 1 |
| Evidence packets | 7; each requires at least three assets |
| Playables | 2 |
| Core prompts / custom agents | 7 prompts / 4 agents |
| Role Lens prompts / agents | 11 prompts / 11 read-only agents |
| Evaluation scenarios | 10 workflow / 11 Role Lens |

These counts describe repository structure. They are not expected answer counts
or expected classifications. See the [Archive README](archive/README.md) and
[Evidence packet README](archive/evidence-packets/README.md) before reading the
corpus.

## Keeping information layers separate

### Layer model

| Layer | Meaning | Copilot may | Humans retain |
|---|---|---|---|
| Evidence | What an allowlisted DRV explicitly states | Organize literal readings with a stable ID and declared locator | Source and rights confirmation |
| Inference | An explanation derived from multiple Evidence lines | State confidence, missing evidence, and falsifiers | Review and promotion to a Finding |
| Proposal | A future option | Produce distinct, evidence-backed Design Bets | Selection, ranking, and adoption |
| Decision | A human choice that fixes scope | Help draft an ADR skeleton after selection | Decision text, acceptance, and signature |

Evidence uses this form, with both the ID and locator already declared in
[`archive/catalog/assets.yaml`](archive/catalog/assets.yaml):

```text
- Evidence: <literal reading within the locator's scope> (`DRV-0xx` / `<declared-locator>`)
```

Conflicts keep both sides, a possible kind, status, and the evidence needed for
resolution. Copilot does not resolve a Conflict, promote an Inference to a
Finding, adopt an unselected Design Bet, or fill in an ADR Decision. See the
[evidence policy](governance/evidence-policy.md),
[decision policy](governance/decision-policy.md), and
[Copilot boundaries](governance/copilot-boundaries.md).

### Stable IDs and Creative Lineage

GitHub issue numbers, discussion numbers, Project item IDs, and commit SHAs are
resolvers, not domain identities. Records use stable families including `DRV`,
`CLM`, `CFL`, `HYP`, `FND`, `PDN`, `BET`, `ADR`, `VS`, `BLD`, and `PT`.

The repository contains one thin lineage:

```text
DRV -> CFL / FND -> PDN -> BET -> ADR -> VS -> ISSUE -> PLAYABLE
```

The record is
[`design/lineage/LINEAGE-001.json`](design/lineage/LINEAGE-001.json). The browser
uses the allowlisted
[`demo/offline-snapshots/lineage-snapshot.json`](demo/offline-snapshots/lineage-snapshot.json)
projection, not the GitHub API.

### Decision scope

[`ADR-001`](design/decisions/ADR-001-thin-proof.md) is limited to Phase 2. It
accepts a fixed 30-second replay of the 1998 core loop and a one-screen local
two-player SECOND HAND handoff.
[`VS-001`](design/vertical-slices/VS-001-thin-proof.md) defines the observable
acceptance contract.

The current UI also exposes later AI-companion and latency-fixture surfaces.
`ADR-001` and `VS-001` remain Phase 2-scoped. This README records both current
records and does not treat the later surfaces as an expansion of the
`ADR-001` Decision. Any future change to rules, balance, win conditions, or
control meaning requires a separate accepted ADR first.

## Sources of truth

| Information | Authoritative source | Projection or supporting view |
|---|---|---|
| Derived fixtures | [`archive/derived/`](archive/README.md) | Archive Explorer |
| Provenance, rights, eligibility, locators | [`archive/catalog/assets.yaml`](archive/catalog/assets.yaml) | Offline Archive snapshot |
| Claims, Conflicts, Findings, Hypotheses | [`research/`](research) | Issues, Project, Lineage UI |
| World and specification canon | [`canon/`](canon) | Playable descriptions |
| Play DNA, Bets, ADRs, Vertical Slices | [`design/`](design) | Discussions, Project, Lineage UI |
| Simulation | [`packages/`](packages) | Canvas 2D renderers |
| Static lineage | [`packages/lineage-model/`](packages/lineage-model) | Creative Lineage Explorer |
| GitHub desired state | [`ops/github/desired-state.yaml`](ops/github/desired-state.yaml) | Live objects / offline resolver |
| Wiki source | [`ops/github/wiki/`](ops/github/wiki) | GitHub Wiki output |
| Package inventory | [`ops/packaging/`](ops/packaging) | Generated manifests and ZIPs |
| Pages rights and path scope | [`governance/pages-publication-policy.md`](governance/pages-publication-policy.md) | Two public HTML files |

The Wiki, Project, Issues, and Discussions do not duplicate authoritative
repository bodies. Discussions hold dialogue, Issues hold work and acceptance,
Project holds coordinates and state, ADRs hold decisions, and Wiki source
provides navigation. See the
[information architecture](governance/information-architecture.md).

## Repository map

| Path | Responsibility |
|---|---|
| [`.github/`](.github/copilot-instructions.md) | Repository/path instructions, 18 prompts, 15 agents, 3 Actions workflows |
| [`archive/`](archive/README.md) | 30 directly authored fixtures, catalog, locator grammar, Evidence packets |
| [`research/`](research) | Claims, unresolved Conflicts, Hypotheses, reviewed Finding, enum-only playtest fixture |
| [`design/`](design) | Play DNA, Design Bet, ADR, Vertical Slice, lineage record |
| [`canon/`](canon) | Existing human-authored STAR RELAY 1998 and SECOND HAND canon |
| [`apps/demo-site/`](apps/demo-site) | Vite + Canvas 2D five-stop private/offline demo |
| [`packages/`](packages) | Deterministic simulations, canonical state, static lineage model |
| [`demo/`](demo/runbook.md) | Runbooks, workshops, fixtures, offline snapshots, reset/checkpoint records |
| [`evaluation/`](evaluation/README.md) | Answer-free structural rubrics and scenario manifests |
| [`governance/`](governance/information-architecture.md) | Classification, evidence, decisions, privacy, rights, publication |
| [`ops/`](ops/github/desired-state.yaml) | GitHub desired state, reconciliation scripts, allowlists, Wiki, packaging |
| [`schemas/`](schemas) | JSON Schema contracts for records and packages |
| [`scripts/`](scripts) | Validators, snapshot generation, packaging, verification, local servers |
| [`tests/`](tests) | Content, simulation, GitHub surface, packaging, browser/offline regression |
| [`pages/`](pages/index.html) | Exactly two owner-approved bilingual public HTML files plus an empty `.nojekyll` |

## Phase 0–8 entry points

| Phase | Main concern in this repository | Entry point |
|---:|---|---|
| 0 | Capability probes, classification, guardrails | [Phase 0–2 gate](demo/phase-2-gate.md), [capability report](ops/github/capability-report.md) |
| 1 | Canon, stable IDs, information architecture | [Information architecture](governance/information-architecture.md), [canon](canon) |
| 2 | Thin lineage, ADR, two deterministic proofs | [ADR-001](design/decisions/ADR-001-thin-proof.md), [VS-001](design/vertical-slices/VS-001-thin-proof.md) |
| 3 | 30-DRV corpus, locator v2, seven Evidence packets | [Phase 3 gate](demo/phase-3-gate.md), [archive](archive/README.md) |
| 4 | Live/fallback Issue, Discussion, Project, Wiki surfaces | [Desired state](ops/github/desired-state.yaml), [manual fallbacks](ops/github/manual-fallbacks.md) |
| 5 | Copilot instructions, prompts, agents, answer-free evaluation | [Phase 5 gate](demo/phase-5-gate.md), [evaluation](evaluation/README.md) |
| 6 | Legacy Mirror Corridor playable | [`packages/legacy-1998`](packages/legacy-1998), [`legacy-view.ts`](apps/demo-site/src/legacy-view.ts) |
| 7 | SECOND HAND Twin Span, latency, privacy-safe events | [Architecture note](packages/second-hand/ARCHITECTURE.md), [`packages/second-hand`](packages/second-hand) |
| 8 | Museum, offline path, deterministic Release packaging | [Runbook](demo/runbook.md), [final audit](governance/final-audit-report.md) |

Phase numbers organize repository implementation and gates. Dates in 1998 are
fixture metadata, never fabricated Git history.

## Application architecture

The root npm workspaces are `apps/*` and `packages/*`.

```text
@star-relay/game-core
  ├─> @star-relay/legacy-1998 ─┐
  └─> @star-relay/second-hand ─┼─> @star-relay/demo-site
@star-relay/lineage-model ─────┘
             ^
      committed snapshots
```

| Workspace | Responsibility |
|---|---|
| [`@star-relay/game-core`](packages/game-core/src/index.ts) | 60 Hz constant, safe-integer canonical serialization, FNV-1a hash, explicit xorshift32 PRNG |
| [`@star-relay/legacy-1998`](packages/legacy-1998/src/index.ts) | Fixed 1,800-tick replay, manual simulation, route prediction, checkpoint/final hashes |
| [`@star-relay/second-hand`](packages/second-hand/src/index.ts) | Atomic handoffs, local/AI input, seeded delay/jitter/loss queue, invariants, numeric event logs |
| [`@star-relay/lineage-model`](packages/lineage-model/src/index.ts) | Types and reference validation for the committed lineage snapshot |
| [`@star-relay/demo-site`](apps/demo-site/src/main.ts) | Museum, Archive, Lineage, two playable views, and a browser test bridge |

### Determinism and browser boundaries

- Simulations advance at a fixed 60 Hz and keep safe-integer state.
- Canonical serialization fixes field and array order and excludes renderer/cache state.
- Simulation code does not use `Math.random`, wall-clock APIs, or runtime trigonometry.
- Same-tick and out-of-order packets are resolved by explicit sequence rules.
- Renderer/input timing and floating-point values never flow back into simulation state.
- Browser code requires no GitHub API, GitHub token, CDN, or telemetry.

Run `npm run check:sim-apis` for the static API guard. Node and Chromium replay
agreement is covered by `npm run test:node` and `npm run test:browser`. See the
[playable instructions](.github/instructions/playable.instructions.md) for the
complete contract.

## From Archive to research

[`archive/catalog/assets.yaml`](archive/catalog/assets.yaml) registers paths,
hashes, classifications, eligibility, and locators for every DRV.

| Category | Count | Examples |
|---|---:|---|
| Documents | 8 | Proposals, minutes, specifications, technical memos |
| Spreadsheets | 6 | Master tables, stages/enemies, location tests |
| Manuals | 3 | Player/operator guides, instruction card |
| QA | 3 | Bug tracker and representative bug records |
| Art | 3 | Art bible, sprite/storyboard metadata |
| Audio | 2 | Sound direction and ROM map |
| Source | 4 | C89-style projections and symbol indexes |
| Replay | 1 | Deterministic event stream |

Recommended reading flow:

1. Select a question and reading set from an
   [Evidence packet](archive/evidence-packets/README.md).
2. Read each DRV through catalog-declared locators.
3. Separate literal Evidence from derived Inference.
4. Keep both sides of disagreement in
   [`research/conflicts/`](research/conflicts).
5. Promote only human-reviewed results to Findings.

`origin_kind: synthetic_fixture` and
`derivation_kind: directly_authored_fixture` make clear that no source
conversion was executed. The repository does not invent source or transform
hashes for originals and transformations that do not exist.

## Copilot experience

### Core workflow

| Stage | Prompt | Agent | Boundary |
|---|---|---|---|
| Understand | `01-reconstruct-shipped-game` / `02-find-conflicts` | `archive-curator` | Read/search only; never resolves a Conflict |
| Imagine | `03-extract-play-dna` / `04-create-design-bets` | `design-facilitator` | Produces options but never adopts one |
| Decide | `05-draft-decision` | `design-facilitator` | Drafts only after a human has chosen |
| Plan | `06-plan-slice` | `slice-planner` | Converts only a strictly `accepted` ADR |
| Learn | `07-synthesize-playtest` | `slice-planner` | Creates learning candidates, not Findings |
| Audit | Explicit agent selection | `provenance-auditor` | Read-only citation, rights, and lineage audit |

Of the four core agents, `archive-curator` and `provenance-auditor` are
read-only. `design-facilitator` and `slice-planner` have constrained `edit`
scope. No agent has `execute`. The eighteen prompt files do not declare tools;
they inherit the scope of their bound agent. Every agent requires explicit
selection.

### Cross-functional Role Lenses

Eleven `*-lens` agents apply professional analysis perspectives without
pretending to be people or colleagues. They cover Game Design / Creative,
Production / Project, Gameplay / QA, Art / Audio / UX, and Platform / Archive
Rights. Every lens is limited to `read` and `search`. They cannot approve,
manufacture team consensus, choose a Bet, accept an ADR, resolve a Conflict,
promote a Finding, or edit files.

See the [shared Role Lens contract](governance/role-lens-contract.md) and
[Role Lens workshop](demo/role-lens-workshop.md). File and metadata presence do
not prove runtime behavior or a completed human score. See the
[capability report](ops/github/capability-report.md) for observed status.

### Evaluation and Copilot Space

[Evaluation](evaluation/README.md) contains ten fixed workflow scenarios and
eleven fixed Role Lens scenarios. Automation validates bindings, links, stable
IDs, and forbidden fields; it does not read or score model response text.
Humans score structure, citation validity, and decision boundaries. Responses
and scored runs are not committed here.

No Copilot Space has been created. Because creation automation was not
available in the recorded probes,
[`copilot-space-manifest.yaml`](ops/github/copilot-space-manifest.yaml) and the
[manual setup guide](ops/github/copilot-space-setup.md) are authoritative.
Never add the whole repository as a Space source; add only the manifest's
individual file/folder allowlist entries.

## Commands

### Development and focused validation

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite source server on `127.0.0.1:4173` |
| `npm run typecheck` | Type-check without emitting files |
| `npm run check:sim-apis` | Statically reject forbidden simulation APIs |
| `npm run validate:content` | Validate catalog/hash/locator/schema/research citation/disclosure contracts |
| `npm run generate:demo-snapshots` | Regenerate allowlisted demo snapshots |
| `npm run validate:demo-snapshots` | Compare committed snapshots with generated projections |
| `npm run validate:copilot-metadata` | Validate prompt/agent/instruction/scenario/Space metadata |
| `npm run validate:pages` | Validate Pages paths, hashes, CSP, links, dependencies, and rights scope |
| `npm run test:github-powershell` | Run GitHub reconciliation regressions |

### Tests

| Command | Purpose |
|---|---|
| `npm run test:node` | Content, lineage, GitHub surface, simulation, privacy, package contracts |
| `npm run test:browser` | Playwright interaction, accessibility, and network regressions for source views |
| `npm run test:pages` | Japanese/English toggle, persistence, ARIA/meta, responsive layout, and zero external requests across both Pages routes |
| `npm run test:offline-source` | Source offline-server continuity and security headers |
| `npm run test:offline` | Extracted Release package, five views, hashes, and zero external requests |
| `npm test` | Simulation/content/snapshot/Copilot/PowerShell/Node/browser/Pages suite |

`npm test` does not include `typecheck`, Release packaging, or the two offline
suites. `npm run gate:phase8` is the complete local gate.

Running `test:offline-source` by itself requires `build` and `package:offline`
first. Running `test:offline` by itself requires `package:release`.
`gate:phase8` includes the required artifact-generation order.

### Build, package, and reset

| Command | Purpose |
|---|---|
| `npm run build` | Build Vite output into `dist/demo-site/` |
| `npm run package:offline` | Create `dist/offline-demo-pack/` plus its manifest and checksums |
| `npm run serve:offline` | Serve the source-checkout offline package on port 4173 |
| `npm run package:release` | Create four deterministic ZIPs, build manifest, and `SHA256SUMS` |
| `npm run verify:release` | Verify Release inventory, sizes, hashes, and entry points |
| `npm run prepare:offline-release` | Extract the generated offline Release ZIP for smoke testing |
| `npm run serve:offline-release` | Serve the extracted offline Release package |
| `npm run verify:release-tag` | Validate an annotated `vX.Y.Z-demo-reference` tag |
| `npm run gate:phase8` | Run the complete gate from type-check through offline smoke tests |
| `npm run demo:reset` | Rebuild local generated packages without changing GitHub objects or tags |
| `npm run serve:pages` | Preview allowlisted Pages source on `127.0.0.1:4174` |

`package:release`, and therefore `gate:phase8` and `demo:reset`, requires a
**clean, committed working tree**. Do not weaken an allowlist or packaging
script to bypass this contract while editing documentation.

## GitHub workflows and collaboration surfaces

| Workflow | Trigger | Work |
|---|---|---|
| `validate-playable-slices` | Pushes to `main` / `shinyay-*`, pull requests | Install, type-check, regular tests, Release packaging/verification, offline smoke |
| `package-private-release` | Manual dispatch with an existing annotated tag | Phase 8 gate, temporary artifact, repository-access-controlled draft Release |
| `deploy-pages` | Allowlisted-path push to `main` or manual dispatch | Pages validation, artifact upload, two-route deployment |

[`ops/github/desired-state.yaml`](ops/github/desired-state.yaml) defines desired
Issues, Discussions, Project, Wiki, snapshots, Release, and Pages state.
PowerShell reconciliation defaults to create-missing/preserve-existing and
requires explicit confirmation for destructive reset. Browser views use the
allowlisted resolvers in
[`demo/offline-snapshots/`](demo/offline-snapshots), not live GitHub calls.

Configuration files are not evidence that a UI feature or runtime behavior was
observed. Uncreated surfaces such as a first Wiki page or Copilot Space use
repository fallbacks. See the
[capability report](ops/github/capability-report.md) and
[manual fallbacks](ops/github/manual-fallbacks.md).

## Offline packaging and private Release

[`ops/packaging/allowlist.json`](ops/packaging/allowlist.json) explicitly names
offline-pack sources. Packaging rejects symlinks, target escapes, and forbidden
tokens, then records each file's SHA-256 and byte count in
`build-manifest.json` and `SHA256SUMS`.

[`release-allowlist.json`](ops/packaging/release-allowlist.json) permits exactly
four ZIP artifacts:

| Artifact | Start anchor | Purpose |
|---|---|---|
| `demo-site.zip` | `#museum` | Full five-stop site |
| `star-relay-1998-playable.zip` | `#legacy` | Direct Legacy entry |
| `second-hand-vertical-slice.zip` | `#second-hand` | Direct SECOND HAND entry |
| `offline-demo-pack.zip` | `#museum` | Snapshots, runbook, and local server |

The workflow accepts only an existing annotated
`vX.Y.Z-demo-reference` tag. It attaches six assets—four ZIPs, a manifest, and
checksums—to a **draft Release** protected by Private repository access. Release
packages are never published through GitHub Pages. Mutable run, commit, and
hash records belong in the
[final audit report](governance/final-audit-report.md).

## Narrow GitHub Pages boundary

Repository visibility remains **private**. The only content approved for public
display is:

| Public route | Repository path | Content |
|---|---|---|
| <https://shinyay.github.io/ghcp-with-gaming-ideation/> | `pages/index.html` | Archive-to-Playable Workflow Presentation |
| <https://shinyay.github.io/ghcp-with-gaming-ideation/game-guide/> | `pages/game-guide/index.html` | STAR RELAY Field & Archive Guide |

Both HTML files default to Japanese. The `日本語 | English` control in each
utility bar switches all visible copy, Evidence / Inference / Proposal, ARIA,
metadata, SVG descriptions, and dynamic status text. Only the selected `ja` or
`en` code is stored in browser local storage and shared across reloads and the
two routes. English is a translation of the authoritative Japanese text; DRV
IDs and locators do not change.

`pages/.nojekyll` is an empty processing-control file, not additional public
content. Do not add any other file or route to `pages/`.

Both HTML files are self-contained. They use a CSP that forbids external
requests and do not depend on the GitHub API, tokens, CDNs, external assets, or
telemetry. Archive, research, design, canon, source, snapshots, packages, and
Issue/Discussion/Project data are not part of Pages.

Do not treat Pages source, the live deployment, and a later undeployed source
update as the same state. The
[Pages publication report](governance/pages-publication-report.md) records
deployment-time hashes and pending source state. The
[Pages publication policy](governance/pages-publication-policy.md) and
[NOTICE](NOTICE.md) are authoritative for rights and stop conditions. Any
change to the public route or scope requires a new human rights decision.

Validate and preview the approved source without changing it:

```powershell
npm run validate:pages
npm run serve:pages
```

Open `http://127.0.0.1:4174`.

## Workshops, runbooks, and evaluation

| Goal | Document |
|---|---|
| Follow the five-stop demo alone in 20 minutes | [Self-guided demo](demo/self-guided-demo.md) |
| Present the 60-minute path | [Phase 8 runbook](demo/runbook.md), [cue sheet](demo/60-minute-cue-sheet.md) |
| Move from Archive to undecided Design Bets and slice planning in 70 minutes | [Self-guided workshop](demo/self-guided-workshop.md) |
| Compare professional lenses and return questions to real humans | [Role Lens workshop](demo/role-lens-workshop.md) |
| Continue when network or Copilot surfaces fail | [Fallback matrix](demo/fallback-matrix.md) |
| Inspect answer-free scenarios and human rubrics | [Evaluation README](evaluation/README.md) |
| Read the time-bounded implementation/content/package audit | [Final audit report](governance/final-audit-report.md) |

## Contributing and stop conditions

Read [CONTRIBUTING](CONTRIBUTING.md) and the applicable
`.github/instructions/` file before changing a scoped path.

- Use a feature branch and pull request; do not work directly on `main`.
- Add only `demo-safe` material to the demo repository.
- Give every Evidence line an existing DRV ID and declared locator.
- Never resolve a Conflict automatically or promote an Inference to a Finding.
- Never adopt an unselected Design Bet or accept an ADR on a human's behalf.
- Obtain an in-scope accepted ADR before changing playable meaning.
- Never add PII, free text, device identifiers, or network upload to playtest events.
- Keep packages and snapshots limited to explicit allowlists.
- Stop and report `risk:rights` if rights, license, or source are unclear.
- Do not search for, retrieve, cite, or create a reference repository, answer
  key, expected output, or scored run.

The security boundary is the
[classification policy](governance/classification-policy.md) plus repository
separation. `ai_eligible`, instructions, branches, and labels are not access
controls.
