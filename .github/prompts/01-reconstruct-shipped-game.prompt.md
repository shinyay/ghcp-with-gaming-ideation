---
name: reconstruct-shipped-game
description: Reconstruct what the 1998 build actually shipped, strictly from allowlisted fixtures.
agent: archive-curator
argument-hint: 対象範囲（例：core loop、スコア、敵、音響）
---

# Shipped-game reconstruction

このpromptは`archive-curator`で実行します。tool scopeはagent側（`read`、`search`）が
正本です。custom agentを選べないsurfaceでは、
[archive-curator.agent.md](../agents/archive-curator.agent.md)の本文を先に貼り付けて
ください。

`archive/catalog/assets.yaml`でallowlistされたDRVだけを読み、出荷された1998年版に
ついて${input:scope:調べたい範囲}で読み取れることを整理してください。

## 出力形式

次の4見出しを必ずこの順で出してください。見出しをまたいで文を混ぜないでください。

```text
## Evidence
- <逐語的な読み取り> (`DRV-0xx` / `<locator>`)

## Inference
- <Evidenceから導いた説明> — 依拠: `DRV-0xx`, `DRV-0yy` / 反証条件: <観測>

## Open questions
- <まだ判定できないこと> — 必要な資料: <どのDRVの何が読めればよいか>

## Not established
- <この読解で確認できなかったこと>
```

## 制約

- Evidenceは1行1事実。解釈語を入れない。
- すべてのEvidenceにDRV IDと宣言済みlocatorを付ける。存在しないIDやlocatorを
  作らない。
- 1つのDRVだけで結論に到達したと書かない。単一資料で足りる主張はEvidenceに留める。
- 資料が食い違う場合は解消せず、Open questionsに両側を書く。
- `research/findings/`、`design/`、`canon/`を答えとして読み込まない。これらは
  既存の人間の判断であり、この問いの正解ではない。
- 出荷版と、計画のみ・没・内部限定の記述を区別する。区別できない場合はそう書く。
- 情報が足りない部分は「不明」と明記する。埋めない。

読む場所の候補は`archive/evidence-packets/`のreading setにあります。packetは
「どこを読むか」だけを示し、答えを持ちません。
