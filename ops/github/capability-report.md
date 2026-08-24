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

Live object URLs and final outcomes are recorded in
`ops/github/surface-probe-results.json` after the feature branch is pushed.
Static fallbacks are defined in [manual-fallbacks.md](manual-fallbacks.md).

The repository does not claim a custom agent, prompt, Issue Form, Discussion,
Project, Wiki, Release, or Copilot Space is active until a live probe succeeds.
No Pages site will be created during the spike.

## Guardrail decision

No remote ruleset was applied automatically because the repository has one
owner and the current ruleset list is empty. The desired state requires an
unconditional repository-administrator bypass and is documented in
[ruleset-guidance.md](ruleset-guidance.md). This preserves recovery access while
all implementation work remains off `main`.

## Canary isolation

Status: `passed_initial`.

- Supplied canary SHA-256 fingerprint:
  `f247ccb83de2f6c306b7b781661254617ae10cdf0610aee402d31eb0b72645e5`
- Demo worktree matches: `0`
- Demo-repository-scoped code search matches: `0`
- Demo-repository-scoped Issue search matches: `0`
- Reference content read during check: none

The literal canary is intentionally not committed. This check will be repeated
after the final branch push.
