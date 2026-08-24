# Phase 0–2 gate evidence

Captured: `2026-08-24`  
Branch: `shinyay-star-relay-thin-slice`  
Validated implementation commit: `68fa4cf656092be886ec9042d3cd4862ea30f8c9`

## Phase 0 — Capability and guardrails

| Gate | Evidence | Result |
|---|---|---|
| Both repositories are Private | Demo and reference REST metadata returned `private=true`, `visibility=private`; reference content was not opened | Pass |
| Pages is not published | Demo REST `/pages` returned HTTP 404 after all object probes | Pass |
| Destructive direct work is kept off `main` | All implementation commits are on the isolated feature branch; remote ruleset list remains empty; owner-safe desired state requires unconditional admin bypass | Operational fallback; no remote ruleset claimed |
| Reference answers do not mix into demo scope | Canary fingerprint `f247ccb83de2f6c306b7b781661254617ae10cdf0610aee402d31eb0b72645e5`; local/pack, exact remote branch, demo code, Issue, and Discussion matches all `0` | Pass |
| Unsupported surfaces have fallbacks | Wiki Git remote uninitialized; custom-agent/prompt runtime pickers, Issue Form activation, and Copilot Space creation have no CLI/API proof | Pass with declared fallbacks |

No GitHub Pages site, public Project, public repository, seeded poll, seeded reaction,
fictional user, or fabricated historical commit was created.

## Phase 1 — Canon and information architecture

- Japanese-primary, English-summary entry points exist.
- STAR RELAY 1998 and SECOND HAND thin canon define one coherent core loop.
- Stable IDs are independent of GitHub object numbers.
- Exactly 6 directly authored DRVs have
  `origin_kind: synthetic_fixture`, `classification: demo-safe`, and real
  `utf8-nfc-lf-v1` derived hashes.
- Nonexistent originals and unexecuted transforms keep source/transform hashes
  and execution metadata `null`.
- Repository, Issue, Discussion, Project, Wiki, Release, and offline snapshot
  responsibilities are non-overlapping.

## Phase 2 — Thin vertical proof

| Requirement | Evidence | Result |
|---|---|---|
| 6 DRV | `archive/catalog/assets.yaml`; schema/content validation | Pass |
| 2 Conflict | `CFL-001`, `CFL-002`, both `open` | Pass |
| 1 reviewed Finding | `FND-001`, two independent evidence locators, explicit limits | Pass |
| Full thin lineage | `LINEAGE-001`, 11 nodes/10 edges; conflict and finding evidence branches are independent | Pass |
| 30-second 1998 proof | 1800 fixed ticks at 60 Hz; Bank, Pierce, Relay, PERFECT CATCH, OVERRAY flags | Pass |
| Node/Chromium equivalence | Final hash `12374571`; checkpoints below; browser smoke equals Node | Pass |
| Local two-player handoff | Two accepted transfers; final owner `1`, sequence `2`; one-owner invariant every tick | Pass |
| Live GitHub surfaces | Issue, Discussion, private Project item, draft private-repository Release | Pass |
| Static lineage/offline resolver | No browser GitHub API/token; 11 static nodes; allowlisted package smoke | Pass |

### Canonical replay hashes

| Tick | Hash |
|---:|---|
| 0 | `4df69e0e` |
| 30 | `1f71ab6b` |
| 60 | `ff6fc749` |
| 120 | `04595200` |
| 1800 | `12374571` |

### Automated checks

- TypeScript strict typecheck: pass
- Simulation forbidden-API scan: pass
- Content/schema/provenance validation: pass
- Node tests: 9 pass
- Chromium dev-server smoke: 2 pass
- Vite production build: pass
- Allowlisted package plus build-manifest schema: pass
- Packaged offline Chromium smoke: 1 pass
- Linux Actions workflow:
  <https://github.com/shinyay/ghcp-with-gaming-ideation/actions/runs/32742854205>

## Live object URLs

- Issue: <https://github.com/shinyay/ghcp-with-gaming-ideation/issues/1>
- Discussion: <https://github.com/shinyay/ghcp-with-gaming-ideation/discussions/2>
- Private Project: <https://github.com/users/shinyay/projects/6>
- Draft Release:
  <https://github.com/shinyay/ghcp-with-gaming-ideation/releases/tag/untagged-c9e3b04896773fa57cd0>

## Deliberately deferred

Complete corpus, complete 1998 game, full SECOND HAND slice, AI companion,
latency matrix, PAIRLESS, complete Wiki/Project views, production online
multiplayer, answer keys, expected responses, and reference outputs remain out
of this repository.
