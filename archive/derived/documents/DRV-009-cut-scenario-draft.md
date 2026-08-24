---
id: DRV-009
origin_kind: synthetic_fixture
classification: demo-safe
fictional_source_created_at: 1997-09-30
---

# Cut scenario draft

この文書は架空の没シナリオfixtureである。採否欄は執筆時点の判断であり、実装結果を
示さない。実装状況はこの文書からは判断できない。

## Two-body protocol

Relay Networkの規約として草案に置かれた設定。

- 信号は1体では保持できない。送り手と受け手が同一の瞬間に触れているあいだだけ、
  移譲が成立する。
- 片方が先に離れると、移譲は完了せず、信号は元の側へ戻る。
- 完全な移譲が成立した瞬間だけ、Networkは新しい経路を開く。

採否: 不採用。物語表現としては最終稿から削除された。

## Adopted and dropped sections

| Section | 採否 | 備考 |
|---|---|---|
| 冒頭のRelay Network説明 | 採用 | 表現を短縮 |
| Two-body protocol | 不採用 | 物語からは削除 |
| 二体で封じられた監視者 | 不採用 | 敵設定の扱いは本稿の対象外 |
| 最終盤の同時保持描写 | 不採用 | 演出負荷を理由に削除 |
| PAIRLESSの独白 | 不採用 | 未使用 |

## Dialogue list

| Line ID | Speaker role | Line |
|---|---|---|
| L-014 | NAVIGATOR | 「一人では届かない。触れているあいだだけ、光は渡る」 |
| L-021 | NAVIGATOR | 「離すのが早い。二体で持て」 |
| L-033 | PAIRLESS | 「私はもう受け取る相手を持たない」 |
| L-047 | NAVIGATOR | 「同じ瞬間に持て。それが最後の合図になる」 |

## Limits of this draft

- 本稿の不採用は物語稿からの削除を意味する。system、敵挙動、ending条件への反映は
  本稿の記述範囲外である。
- 台詞の未使用は音声資料の有無を意味しない。
