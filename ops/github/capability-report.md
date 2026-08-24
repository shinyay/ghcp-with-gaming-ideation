# Phase 0 capability report

Probe time: `2026-08-24T23:33:00+09:00`  
Repository: `shinyay/ghcp-with-gaming-ideation`  
Client: GitHub CLI `2.96.0`, Node.js `22.16.0`

## Verified baseline

| Capability | Evidence | Status |
|---|---|---|
| Demo repository privacy | REST `private=true`, `visibility=private` | Verified |
| Reference repository privacy | REST metadata only; content was not read | Verified |
| Pages | REST Pages endpoint returned HTTP 404 / not configured | Unpublished |
| Issues | REST `has_issues=true` | Available |
| Discussions | REST `has_discussions=true`; GraphQL categories readable | Available |
| Wiki | REST `has_wiki=true` | Available |
| Actions | REST `enabled=true`, `allowed_actions=all` | Available |
| Rulesets | REST returned an empty list | Not applied; owner-safe fallback selected |
| Viewer permission | GraphQL `viewerPermission=ADMIN` | Available |

## Surface probe ledger

| Surface | Live result | URL or fallback |
|---|---|---|
| Issue | Created for `ISSUE-001` / `VS-001` | <https://github.com/shinyay/ghcp-with-gaming-ideation/issues/1> |
| Discussion | Created without poll, seeded reaction, or fictional user | <https://github.com/shinyay/ghcp-with-gaming-ideation/discussions/2> |
| Project | Existing empty private Project #6 renamed and one Issue added | <https://github.com/users/shinyay/projects/6> |
| Wiki | Enabled setting, but `.wiki.git` clone returned `Repository not found` before first-page initialization | `ops/github/wiki/Home.md` |
| Draft Release | Created against an annotated capability tag in the private repository | <https://github.com/shinyay/ghcp-with-gaming-ideation/releases/tag/untagged-c9e3b04896773fa57cd0> |
| Custom agent | Branch file SHA verified; runtime activation has no CLI/API probe | `.github/agents/archive-curator.agent.md` |
| Prompt file | Branch file SHA verified; runtime picker has no CLI/API probe | `.github/prompts/01-reconstruct-shipped-game.prompt.md` |
| Issue Form | Branch file SHA verified; not active until present on default branch | structured live Issue fallback above |
| Copilot Space | No supported creation API/tool was available | `copilot-space-manifest.yaml` |

Exact machine-readable outcomes are in `surface-probe-results.json`. A setting or
branch-hosted file is not reported as an activated UI surface. No Pages site was
created.

## Guardrail decision

No remote ruleset was applied automatically because the repository has one
owner and the current ruleset list is empty. The desired state requires an
unconditional repository-administrator bypass and is documented in
[ruleset-guidance.md](ruleset-guidance.md). This preserves recovery access while
all implementation work remains off `main`.

## Canary isolation

Status: `passed_final`.

- Supplied canary SHA-256 fingerprint:
  `f247ccb83de2f6c306b7b781661254617ae10cdf0610aee402d31eb0b72645e5`
- Demo worktree and packaged artifact matches: `0`
- Exact pushed demo branch matches: `0`
- Demo-repository-scoped code search matches: `0`
- Demo-repository-scoped Issue search matches: `0`
- Demo-repository Discussion matches: `0`
- Reference content read during check: none

The literal canary is intentionally not committed. This check will be repeated
after any future source expansion.

## Automated gate

The Linux `validate-thin-slice` workflow passed typecheck, simulation API guard,
schema/provenance checks, Node replay/handoff tests, Chromium hash equivalence,
production build, allowlisted packaging, and packaged offline smoke:
<https://github.com/shinyay/ghcp-with-gaming-ideation/actions/runs/32742854205>.

## Phase 5 re-probe

Probe time: `2026-08-25T02:41:00+09:00`
Client: Copilot CLI `github-app` `1.0.80` on Windows, GitHub CLI `2.96.0`

### Copilot customization surfaces

Observed for the branch state at session start, not inferred from docs.

| Surface | Live result | Evidence |
|---|---|---|
| Repository instructions | Discovered and applied | `.github/copilot-instructions.md` body was injected into the session verbatim |
| Path instructions | Discovered and applied | The session listed each `.instructions.md` file with its `applyTo` glob |
| Custom agent | Discovered and selectable | `archive-curator` appeared in the agent list carrying its frontmatter `description` |
| Prompt file | **Not surfaced** | `.github/prompts/01-reconstruct-shipped-game.prompt.md` was present on the branch but was offered neither as a slash command nor as a tool |

Agents and prompts added during the session are not re-read by the same
session, so the three new agents and six new prompt files are unobserved here.
Re-probe on a later session or another surface before claiming otherwise.

The prompt-file gap has a documented fallback: paste the prompt body into chat.
See `demo/self-guided-workshop.md`.

### Copilot Space automation

Re-confirmed that no supported creation surface exists.

| Probe | Result |
|---|---|
| REST `/user/copilot/spaces` | HTTP 404 Not Found |
| REST `/copilot/spaces` | HTTP 404 Not Found |
| GraphQL `__type(name: "CopilotSpace")` | `null` |
| GraphQL mutations matching Copilot Space | 0 |
| `gh extension list` | empty |

`copilot-space-manifest.yaml` therefore records `automation_status: manual_only`
and `verification.space_created: false`. **No Space was created.** The manual
procedure is [copilot-space-setup.md](copilot-space-setup.md).

### Canary isolation re-run

Status: `passed_phase_5`. Repeated after the reference answer keys existed.

- Canary SHA-256 fingerprint (unchanged):
  `f247ccb83de2f6c306b7b781661254617ae10cdf0610aee402d31eb0b72645e5`
- Demo worktree matches: `0`
- Packaged offline artifact matches: `0` (10 files)
- Pushed demo branch matches: `0`
- Demo-repository-scoped code search matches: `0`
- Demo-repository-scoped Issue search matches: `0`
- Demo-repository Discussion matches: `0`
- Reference content copied into the demo repository: none

The only `REFCANARY-` occurrence in the demo repository is the prefix inside
`governance/disclosure-guard.json`, which is the guard list itself rather than a
concrete token.
