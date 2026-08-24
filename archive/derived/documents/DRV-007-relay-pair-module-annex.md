---
id: DRV-007
origin_kind: synthetic_fixture
classification: demo-safe
fictional_source_created_at: 1996-04-18
---

# Relay Pair module annex

この文書は架空の企画fixtureの付録であり、出荷仕様や実在資料ではない。実装されたか
どうかはこの付録から判断できない。

## Planned module list

企画時点で予定していたmodule割り当て。symbol IDは社内採番の想定値である。

| Symbol ID | Planned name | Owner module | Role in this proposal |
|---|---|---|---|
| SYM-1996-011 | p2_input | p2 | Player 2の入力読み取り |
| SYM-1996-014 | p2_aim | p2 | Player 2が受領位置を選ぶための照準計算 |
| SYM-1996-017 | p2_catch | p2 | Player 2の受領判定 |
| SYM-1996-021 | relay_owner | core | Coreのowner管理 |

## Screen assumptions

企画は横384pxの表示領域を前提とする。左右分担のためのmarginをそれぞれ48px確保する。
この前提が最終的に維持されたかは、この付録には記録がない。

## Unresolved in this annex

- Cabinet形状、coin運用、基板選定はこの付録の対象外。
- module一覧の採否、改名、統廃合はこの付録に記録がない。
- 本annexを2人用が出荷されたEvidenceとして使わない。
