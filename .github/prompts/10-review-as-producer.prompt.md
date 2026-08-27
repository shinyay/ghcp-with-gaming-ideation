---
name: review-as-producer
description: Review value hypothesis, scope, production risks, gates, and resource assumptions without invented business facts.
agent: producer-lens
argument-hint: target ID/path、review question、current phase
---

# Producer Role Lens review

このpromptは`producer-lens`で実行します。
[agent file](../agents/producer-lens.agent.md)が選択できないsurfaceでは、
read/search-only tool scopeを強制できないため実行せず、unsupported surfaceとして
停止してください。本文の貼り付けはtool scopeを適用しないためfallbackにしません。

Target `${input:target:IDまたはpath}`を、current phase
`${input:phase:Archive / Understand / Imagine / Decide / Plan / Build / Learn}`と
question `${input:question:確認したい問い}`の範囲でreviewしてください。

## Focus

- 検証するvalue hypothesis
- scope、out of scope、gate、stop condition
- discipline横断のproduction risk
- resource assumptionと追加投資前の観測

## Output

[Role Lens contract](../../governance/role-lens-contract.md)の
`Lens and target`、`Evidence`、`Current record`、
`Inference from the Producer lens`、`Risks and trade-offs`、
`Questions for other roles`、`Proposal (unselected)`、
`Human decisions required`、`Could not assess`をすべて出してください。

これはrole-based analysisであり、実在するProducerの意見や承認ではありません。
予算、ROI、人数、staffing、market valueを捏造しないでください。
