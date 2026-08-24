---
id: DRV-016
origin_kind: synthetic_fixture
classification: demo-safe
fictional_source_created_at: 1996-11-10
---

# Location test summary notes

この文書は架空のロケテスト集計fixtureである。来場者の氏名、属性、発言、反応は
収集も再現もしていない。記録は列挙値の集計と、設置側の観察memoに限る。

## Rating aggregate

`receive_rating`は1から5の列挙値で、5が最良。

| Cabinet mode | Sessions | receive_rating 平均 | 4以上の割合 |
|---|---|---|---|
| 2P | 8 | 4.6 | 100% |
| 1P | 4 | 2.8 | 0% |

受領表現に関する評価は、2P構成のほうが高い値で記録されている。この集計は採否の
理由を記録していない。

## Failure cause codes

| Code | 分類 | 件数 |
|---|---|---|
| FC-01 | 時間切れによる打ち切り | 1 |
| FC-02 | 戻りCoreの受領失敗 | 2 |
| FC-03 | Mirror反射位置の誤認 | 1 |

## Operation notes

設置運用の観察memo。体験評価とは別項目として記録する。

- 2P構成は1筐体に2組の操作パネルを仮設して実施した。仮設パネルは常設品ではない。
- 2P構成では1クレジットあたりの占有時間が1P構成より長く、待機列の回転が落ちた。
- 会場担当は、仮設パネルの固定と配線の取り回しに毎日調整が必要だと記録している。
- 表示は会場備品のmonitorを使用した。有効表示幅の前提は本集計に記録がない。

## Not recorded here

- 出荷構成の決定、決定者、決定日
- 筐体の量産仕様と発注内容
- 表示幅、基板、ROMに関する技術判断
