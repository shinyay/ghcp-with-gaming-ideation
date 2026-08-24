# STAR RELAY Archive-to-Playable

The Japanese [README](README.md) is authoritative.

STAR RELAY is a wholly fictional arcade game said to have shipped in 1998.
This private teaching repository demonstrates how GitHub and Copilot can connect
archive evidence, reviewed interpretation, a human decision, and a playable
proof without confusing those layers.

The current scope is intentionally limited to Phases 0–2:

- six demo-safe synthetic derived records;
- two unresolved conflicts and one reviewed finding;
- one complete stable-ID lineage to `VS-001`;
- a deterministic 30-second 1998 core-loop proof;
- a one-screen local two-player handoff proof; and
- a static, offline-safe lineage view.

No answer keys, complete corpus, real people, real products, fabricated Git
history, reactions, polls, or historical users belong here. GitHub Pages stays
unpublished, and browser code never depends on a GitHub token or API.

## Run locally

```powershell
npm ci
npm test
npm run build
npm run package:offline
npm run serve:offline
```

Open `http://127.0.0.1:4173`.
