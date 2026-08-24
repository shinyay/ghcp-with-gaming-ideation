---
name: create-design-bets
description: Produce three genuinely distinct Design Bets, each traceable to at least three archive assets.
agent: ask
argument-hint: 制約条件（例：ローカル2人、5〜10分、Canvas 2D）
tools: ["read", "search"]
---

# Design Bet generation

推奨custom agent: `design-facilitator`

制約${input:constraints:与える制約}のもとで、現代版の方向性としての**Design Bet**を
ちょうど3つ作ってください。3つは互いに本質的に異なる賭けでなければなりません。

## 「異なる」の判定基準

3つのBetは、次の3軸すべてで異なること。1軸でも同じ場合は作り直してください。

1. **中心的な緊張** — プレイヤーが毎秒解いている問題そのもの
2. **プレイヤー同士（またはAIとの）関係** — 誰が誰に何を委ねるか
3. **失敗の形** — 負けたとき何が起きたと感じるか

見た目、テーマ、モード数、対象プラットフォームの違いは**異なる根拠にならない**。

## 各Betに必要な要素

```text
### Bet候補 <連番> — <短い名前>
- 賭けの主張: <1文。「もし〜なら〜が成立する」の形>
- 中心的な緊張: <1文>
- プレイヤー関係: <1文>
- 失敗の形: <1文>
- 由来Evidence（3件以上、すべて異なるDRV）:
  - <逐語的な読み取り> (`DRV-0xx` / `<locator>`)
  - <逐語的な読み取り> (`DRV-0yy` / `<locator>`)
  - <逐語的な読み取り> (`DRV-0zz` / `<locator>`)
- 継承するPlay DNA: <PDN IDまたは候補名。無い場合は「なし」>
- 捨てるもの: <この賭けが意図的に諦める価値>
- Falsified if: <どのplaytest観測が出たら賭けが外れたと判断するか>
- 最小の検証手段: <数分で確認できる形>
```

## 制約

- 各Betは**異なる3件以上のDRV**へ遡れること。同じDRVの再掲で件数を満たさない。
- 由来Evidenceは逐語的な読み取りにする。Bet側の主張をEvidence欄へ書かない。
- `design/bets/`の既存Betをそのまま再掲しない。既存`BET-00x`と重なる場合は
  重なる範囲を明示する。
- 推奨しない。順位を付けない。「本命」「無難」などの評価語を使わない。
- 新しいBET IDを採番しない。IDは人間の選択後に与える。
- ADRを書かない。実装計画を書かない。

## 出力の最後に

3軸それぞれについて、3つのBetがどう異なるかを表で示してください。1軸でも同じ値が
並んだ場合は、その旨を明記してください。
