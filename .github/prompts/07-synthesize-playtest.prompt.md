---
name: synthesize-playtest
description: Turn anonymous enum-only playtest events into falsifiable learning candidates.
agent: slice-planner
argument-hint: 対象のPT IDと、検証したかった賭け
---

# Playtest synthesis

このpromptは`slice-planner`で実行します。tool scopeはagent側が正本です。
custom agentを選べないsurfaceでは、
[slice-planner.agent.md](../agents/slice-planner.agent.md)の本文を先に貼り付けて
ください。

`research/playtests/`の匿名イベントログ ${input:pt:PT ID}から、学習候補を作成します。
ログはrandom session IDと列挙値・数値だけを持ちます。

## 出力構成

```text
## Observed
- <集計できた事実> — 件数: <n> / 対象: `PT-00x`

## Learning candidates
### L1 — <短い名前>
- 依拠: <Observedの行>
- 何を示唆するか: <1文。断定しない>
- どのBET/ADRを見直す対象か: `BET-00x` / `ADR-00x`
- Falsified if: <どの追加観測が出たら棄却するか>
- 追加で必要なデータ: <何を、どれだけ>

## Insufficient
- <サンプル数または分布の理由で判断できない項目>
```

## 制約

- participant、氏名、自由記述、端末情報を作らない。ログに無いものを補完しない。
- 1セッション、1イベントから傾向を断定しない。件数が少ない場合は`Insufficient`へ
  送る。件数を必ず併記する。
- 「楽しかった」「難しすぎた」など、列挙値に無い主観を生成しない。
- 学習をFindingへ昇格しない。ADRを書き換えない。BETを採否しない。
- 集計値をArchiveのDRVへ書き戻さない。Playtestは新しい観測であり、1998年の資料
  ではない。
- 統計的検定の結果を、実行していないのに書かない。

## 出力の最後に

このログでは原理的に測れない事柄（例：ログに列挙値が存在しない観点）を列挙して
ください。
