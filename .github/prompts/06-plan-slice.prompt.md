---
name: plan-slice
description: Turn an accepted ADR into a vertical slice plan with observable acceptance criteria.
agent: slice-planner
argument-hint: 対象のADR IDと、スライスに割ける時間
---

# Vertical slice plan

このpromptは`slice-planner`で実行します。tool scopeはagent側が正本です。
custom agentを選べないsurfaceでは、
[slice-planner.agent.md](../agents/slice-planner.agent.md)の本文を先に貼り付けて
ください。

受理済みADR ${input:adr:ADR ID}を、Epic、Sub-issue、受入条件へ変換します。

## 前提の確認（最初に実行）

`design/decisions/`に該当ADRが存在し、`Status`が`accepted`であることを確認して
ください。存在しない、または`proposed`のままの場合は、**計画を書かずに停止**し、
「ADRが未受理のためPlayableの意味を変える計画は作れない」と報告してください。

ADRが無い状態で、rule、balance、勝敗条件、操作の意味を変える計画を提案しない
でください。

## 出力構成

```markdown
## Epic
- 由来ADR: `ADR-00x`
- 検証したい賭け: <ADRのDecisionから1文>
- このスライスで確認できること / できないこと

## Sub-issues
### S1 — <題>
- 目的:
- 受入条件（観測可能な形で3件以内）:
  - [ ] <入力> のとき <観測できる結果> になる
- 検証方法: <実行するコマンドと合格条件>
- 依存: <他のSub-issue ID。無ければ none>
- 対象外:

## Verification plan
| 項目 | コマンド | 合格条件 |
|---|---|---|

## Out of scope
## Risks
| Risk | 兆候 | 中止条件 |
|---|---|---|
```

## 制約

- 受入条件は観測可能な形にする。「正しく動く」「自然に感じる」を使わない。
- 各Sub-issueは1つのSub-issueだけで検証可能にする。相互依存の輪を作らない。
- 決定論方針（60 Hz固定tick、整数state、runtime乱数・時計・三角関数の禁止）に
  反する計画を出さない。制約は
  [.github/instructions/playable.instructions.md](../instructions/playable.instructions.md)。
- 実装コードをこのプロンプトで書かない。計画とacceptance criteriaまで。
- 見積り時間を確定値として書かない。時間はレンジと前提で書く。
- ADRに無い意思決定を計画に紛れ込ませない。必要になった場合は
  `要ADR: <内容>`として分けて出す。

書き込み先は`design/vertical-slices/`配下の新規fileのみです。
