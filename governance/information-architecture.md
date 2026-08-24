# 情報アーキテクチャ

> English summary: Stable IDs identify domain records; GitHub object numbers are
> resolvers, not identities. Repository files are authoritative unless the table
> below explicitly assigns another source of truth.

## Stable ID

GitHub Issue番号、Discussion番号、Project item ID、commit SHAとは独立したIDを使う。
番号は各prefix内で3桁から開始し、一度公開したIDを別の意味へ再利用しない。

| Prefix | Record | Phase 0〜2での利用 |
|---|---|---|
| `SRC` | 将来の原本 | planned metadataのみ |
| `DRV` | 変換済み表現 | 6件 |
| `CFL` | 保持する矛盾 | 2件 |
| `FND` | review済み発見 | 1件 |
| `PDN` | Play DNA | 1件 |
| `BET` | Design Bet | 1件のthin stub |
| `ADR` | 人間の判断 | thin proofの範囲決定 |
| `VS` | Vertical Slice | `VS-001`のみ |
| `BLD` | Build | package manifest |
| `PT` | Playtest/probe | 自動probeのみ |
| `LRN` | Learning | Phase 2では作らない |

GitHub objectは`ops/github/surface-probe-results.json`でstable IDへ解決する。Live objectが
作れない場合もoffline objectが同じIDを維持する。

## Source of truth

| 情報 | 正本 | 補助表示 |
|---|---|---|
| Derived fixture | `archive/derived/` | Demo UI |
| Provenance/rights | `archive/catalog/assets.yaml` | Package manifest |
| Conflict/Finding | `research/` | Issue、Project、Lineage UI |
| Design intent | `design/` | Discussion、Lineage UI |
| GitHub desired state | `ops/github/desired-state.yaml` | Capability report |
| Simulation | `packages/` | Canvas 2D renderer |
| Static lineage | `packages/lineage-model/` | Demo UI |
| Wiki source | `ops/github/wiki/` | GitHub Wiki output |

Wiki、Project、Issue、Discussionへ本文を複製しない。会話はDiscussion、作業はIssue、
座標と状態はProject、判断はADRに限定する。

## Phase 2 lineage

```text
DRV-001 + DRV-003
  -> CFL-001
  -> FND-001
  -> PDN-001
  -> BET-002
  -> ADR-001
  -> VS-001
  -> ISSUE-001
  -> apps/demo-site (legacy + local handoff)
```

これは構造を証明する1本だけのthin lineageであり、complete corpusやanswer keyでは
ない。
