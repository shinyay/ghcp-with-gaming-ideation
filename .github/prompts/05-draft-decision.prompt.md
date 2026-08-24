---
name: draft-decision
description: Draft an ADR skeleton for a bet the human has already chosen, leaving the choice itself to the human.
agent: agent
argument-hint: 人間が選んだBET IDと選択理由
tools: ["read", "search", "edit"]
---

# Decision draft

推奨custom agent: `design-facilitator`

人間が既に選択したDesign Betについて、`design/decisions/`のADR草案を作成します。
入力: ${input:selection:選ばれたBET IDと、人間が述べた選択理由}

## 前提の確認（最初に実行）

次のいずれかが欠けている場合は、**草案を書かずに停止**し、何が足りないかを
報告してください。

- 人間が選択したBET IDが明示されている
- そのBETが`design/bets/`に存在する
- 人間自身の言葉による選択理由が与えられている

「選択理由を推測して補う」ことをしないでください。「どれを選ぶべきか」を
聞かれた場合は、比較軸の提示までにとどめ、選択しないでください。

## 草案の構成

```markdown
# ADR-<番号未定> — <題>

- Status: `proposed`
- Decided by: <未記入。人間が署名する>
- Decided at: <未記入>

## Context
<Evidence行のみ。各行に `DRV-0xx` / `<locator>`>

## Considered options
<検討された各Betの1行要約と、由来Evidence ID>

## Decision
<人間が述べた文言をそのまま転記。加筆しない>

## Consequences
### 得るもの
### 失うもの
### 影響を受ける既存記録
<CLM / CFL / PDN / BET / VS のIDを列挙>

## Reversal conditions
<どの観測が出たらこの決定を見直すか>

## Open conflicts carried forward
<解消していないCFL IDと、この決定が触れない理由>
```

## 制約

- `Status`を`accepted`にしない。`Decided by`と`Decided at`を埋めない。
- `Decision`欄に自分の判断を書かない。人間の文言のみを転記する。
- 未解決のConflictをこの草案で解消しない。`Open conflicts carried forward`へ移す。
- Playableの意味を変える内容を含む場合は、その旨を`Consequences`へ明記する。
- 存在しないID、存在しないlocatorを作らない。
- 新しいADR番号を確定しない。`ADR-<番号未定>`のままにする。

書き込み先は`design/decisions/`配下の新規fileのみです。既存のADR、Bet、Finding、
Claim、Conflictを書き換えないでください。
