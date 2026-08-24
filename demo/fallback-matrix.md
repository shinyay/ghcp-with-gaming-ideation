# Demo fallback matrix

> English summary: Deterministic fallbacks keep every critical demo step local.
> A recorded tier may be used only after a real, reviewed recording is registered.

| Demo moment | Live | Recorded | Static | Stop condition |
|---|---|---|---|---|
| Museum | local server | approved full-path recording | built `index.html` | build missing |
| Archive | interactive search | approved Archive clip | `archive-assets.json` | snapshot stale |
| Lineage | external links + local resolver | approved Lineage clip | `lineage-snapshot.json` | allowlist failure |
| Legacy | Canvas input | approved Legacy clip | replay hashes + tutorial | replay mismatch |
| SECOND HAND | local/AI input | approved handoff clip | latency fixtures | invariant failure |
| GitHub Issue/Discussion/Project | private live URLs | approved UI clip | `github-objects.json` | object ID mismatch |
| Wiki | Web UI page if initialized | approved Wiki clip | `ops/github/wiki/` | rights uncertainty |
| Release | private repository Release | approved package clip | `dist/release` manifest | tag not annotated |

Recorded fallback is currently unavailable; see
[recorded-static-protocol.md](recorded-static-protocol.md). Static fallback must
not be described as a recording.
