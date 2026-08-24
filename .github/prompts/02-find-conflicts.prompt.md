---
name: find-conflicts
description: Surface contradictions between archive fixtures without resolving them.
agent: archive-curator
argument-hint: 対象テーマ（例：速度定数、プレイ人数、音声cue）
---

# Conflict survey

このpromptは`archive-curator`で実行します。tool scopeはagent側（`read`、`search`）が
正本です。custom agentを選べないsurfaceでは、
[archive-curator.agent.md](../agents/archive-curator.agent.md)の本文を先に貼り付けて
ください。

`archive/catalog/assets.yaml`でallowlistされたDRVだけを読み、${input:theme:調べたい
テーマ}に関する資料間の不一致を洗い出してください。

## 手順

1. テーマに触れるDRVを列挙する。各DRVについて、どのlocatorを読んだかを書く。
2. 記述が食い違う組を探す。2件以上のDRVが同じ対象について異なることを述べている
   場合だけ候補にする。
3. 候補ごとに次を書く。

```text
### Conflict候補 <連番>
- Side A: <逐語的な読み取り> (`DRV-0xx` / `<locator>`)
- Side B: <逐語的な読み取り> (`DRV-0yy` / `<locator>`)
- 何が食い違うか: <観測レベルの記述のみ>
- 解消に必要な追加証拠: <どの資料の何が読めれば判定できるか>
- 現時点の状態: unresolved
```

## 禁止

- どちらが正しいかを決めない。「おそらく」「実質的に同じ」で片付けない。
- 「新しい資料が正しい」「公開資料は丸めた値」などの既定の優先規則を使わない。
- 不一致の**種類**を先に想定して当てはめない。読めた差分だけを書く。
- 同一DRV内の2箇所を対にして不一致としない。異なるDRVの対だけを扱う。
- `research/conflicts/`の既存レコードを答えとして読み込まない。自分の読み取りと
  一致しない場合も、既存レコードに合わせて書き換えない。差分は別途報告する。
- Findingへ昇格しない。ADRを書かない。

## 出力の最後に

- 読んだが不一致が見つからなかったDRVの一覧
- テーマに関係するが読めなかった（locator未宣言などの）箇所

不一致が見つからない場合は、見つからないと書いてください。件数を満たすために
弱い候補を作らないでください。
