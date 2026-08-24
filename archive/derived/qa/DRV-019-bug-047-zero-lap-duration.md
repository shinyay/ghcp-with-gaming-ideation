---
id: DRV-019
origin_kind: synthetic_fixture
classification: demo-safe
fictional_source_created_at: 1998-08-27
---

# BUG-047 ZERO LAP duration measurement

この文書は架空のQA個票fixtureである。測定者の氏名は記録せず、role表記のみとする。

## Report

- Area: gameplay
- Stage: ST-06
- Severity: info
- Status: closed
- Resolution: not_a_bug

## Measurement method

- 到達順路を固定せず、QA roleが通常進行でST-06をclearするまでのwall clock時間を計測。
- 60Hz固定更新のbuildで10回実施。中断、continue、demo modeは除外。
- 計測値はclear確定frameまでとする。

## Runs

| Run | Duration (s) |
|---|---|
| R-01 | 141.2 |
| R-02 | 147.6 |
| R-03 | 152.0 |
| R-04 | 158.4 |
| R-05 | 149.2 |
| R-06 | 155.8 |
| R-07 | 144.6 |
| R-08 | 151.0 |
| R-09 | 153.4 |
| R-10 | 150.8 |

- 試行数: 10
- 合計: 1504.0 s
- 平均: 150.4 s
- 最短: 141.2 s
- 最長: 158.4 s

## Disposition

制限時間が存在しないため、所要時間のばらつきは不具合ではないと判定した。
平均値は進行設計の参考としてのみ記録する。

## Not established here

- この平均値が公開資料へ転記されたかどうか
- 転記時の丸め方針
- 制限時間の有無に関する仕様上の記述
