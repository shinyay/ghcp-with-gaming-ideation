---
name: extract-play-dna
description: Propose portable Play DNA candidates with cross-asset evidence and falsifiers.
agent: ask
argument-hint: 何を移植可能性の観点で見たいか
tools: ["read", "search"]
---

# Play DNA extraction

推奨custom agent: `design-facilitator`

allowlistされたDRVから、1998年版を1998年版たらしめている**移植可能な性質**の候補を
提案してください。ハードウェア、当時の運用、当時の商習慣に依存する事情は移植可能な
性質ではありません。

## 各候補に必要な要素

```text
### PDN候補 <連番> — <短い名前>
- Evidence: <逐語的な読み取り> (`DRV-0xx` / `<locator>`)
- Evidence: <逐語的な読み取り> (`DRV-0yy` / `<locator>`)
- Invariant: <実装が変わっても保たれるべき関係を1文で>
- Portable quality: <プレイヤーが観測できる形で>
- Not implied: <この候補が説明しないこと>
- Falsified if: <どの観測が出たらこの候補を捨てるか>
```

## 制約

- 各候補は**異なる2件以上のDRV**を引用する。1資料だけの候補は出さない。
- Invariantは数値の再現ではなく関係で書く。特定の定数値をInvariantにしない。
- `design/play-dna.md`の既存PDNを答えとして再掲しない。既存PDNと重なる場合は
  「既存`PDN-00x`と重なる」と明示し、重なる範囲を書く。
- 当時の制約が原因の性質と、設計意図による性質を区別する。区別できない場合は
  Open questionに送る。
- 採用・順位付け・推奨をしない。候補の並びは評価順ではないと明記する。
- 新しいPDN IDを採番しない。IDは人間がレビュー後に与える。

## 出力の最後に

- 候補どうしが重複していないかの自己点検（どこが異なるかを1行ずつ）
- 移植可能性を判断できなかった観察の一覧
