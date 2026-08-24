# VS-001 — Active receiving thin proof

## Acceptance criteria

- 6件のDRV、2件のopen Conflict、1件のreviewed Findingがschemaを通る。
- `DRV-001`から`FND-001`、`ADR-001`、このslice、Issue、Playableを辿れる。
- Legacy replayは1800 tick、fixed seed、canonical hashを持つ。
- Node.jsとChromiumのfinal/checkpoint hashが一致する。
- Local 2PでCore ownerが常に1人、accepted handoff sequenceが単調増加する。
- BrowserにGitHub API/token dependencyがなく、offline packageがallowlistだけを含む。

## Out of scope

Complete corpus、AI partner、latency simulation、PAIRLESS、full Wiki/Project views、
online backend、historical user/poll/reaction fixtures。
