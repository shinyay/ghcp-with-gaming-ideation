---
id: DRV-010
origin_kind: synthetic_fixture
classification: demo-safe
fictional_source_created_at: 1998-06-12
---

# Final specification stage section

この文書は架空の出荷仕様fixtureのステージ章である。表に載らない項目は本章に存在
しないことを意味し、実装の有無を示さない。

## Stage list

本章が仕様として記述するステージ。

| Order | Stage ID | Name | Time limit |
|---|---|---|---|
| 1 | ST-01 | FIRST LIGHT | なし |
| 2 | ST-02 | LONG MIRROR | なし |
| 3 | ST-03 | CROSSFIRE | なし |
| 4 | ST-04 | THE HUSH | なし |
| 5 | ST-05 | DOUBLE WARDEN | なし |
| 6 | ST-06 | ZERO LAP | なし |

本章は6ステージのみを記述する。data table側の行数と一致するかは本章の対象外。

## Zero lap conditions

- ZERO LAPに制限時間を設けない。Coreを落とした時点で終了する。
- 進行速度はplayerのroute選択に依存する。想定所要時間は本章に記載しない。

## True ending condition

TRUE ENDは、最終Relay PointとPlayerが同一tickで同時にCoreへ接触している状態で
確定する。どちらか一方が先に離れた場合は通常ENDへ分岐する。

本章はこの条件の由来を記述しない。

## Charge and chain

- Chargeは0から100の整数。100でRELEASEが有効になる。
- Chain内部counterの上限は32。表示側の扱いは本章の対象外。

## Out of scope in this chapter

- 敵個体の挙動table
- 未使用または試験用のstage data
- 公開資料へ載せる数値の丸め方針
