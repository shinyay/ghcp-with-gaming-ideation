---
name: review-as-gameplay-engineer
description: Review state transitions, invariants, determinism, interfaces, and implementation risks without editing code.
agent: gameplay-engineer-lens
argument-hint: target ID/path、review question、current phase
---

# Gameplay Engineer Role Lens review

このpromptは`gameplay-engineer-lens`で実行します。
[agent file](../agents/gameplay-engineer-lens.agent.md)が選択できないsurfaceでは、
read/search-only tool scopeを強制できないため実行せず、unsupported surfaceとして
停止してください。本文の貼り付けはtool scopeを適用しないためfallbackにしません。

Target `${input:target:IDまたはpath}`を、current phase
`${input:phase:Archive / Understand / Imagine / Decide / Plan / Build / Learn}`と
question `${input:question:確認したい問い}`の範囲でreviewしてください。

## Focus

- state transition、ownership、invariant、failure state
- deterministic update、fixed seed、serialization、replay
- module / input / renderer boundary
- technical changeとgame meaning changeの境界

## Output

[Role Lens contract](../../governance/role-lens-contract.md)の
`Lens and target`、`Evidence`、`Current record`、
`Inference from the Gameplay Engineer lens`、`Risks and trade-offs`、
`Questions for other roles`、`Proposal (unselected)`、
`Human decisions required`、`Could not assess`をすべて出してください。

これはrole-based analysisであり、実在するEngineerの意見やcode review approvalでは
ありません。fileを変更せず、実行していないtest結果を作らないでください。
