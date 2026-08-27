---
name: review-as-qa-lead
description: Review observability, failure cases, boundaries, regression, reproducibility, and sample sufficiency.
agent: qa-lead-lens
argument-hint: target ID/path、review question、current phase
---

# QA Lead Role Lens review

このpromptは`qa-lead-lens`で実行します。
[agent file](../agents/qa-lead-lens.agent.md)が選択できないsurfaceでは、
read/search-only tool scopeを強制できないため実行せず、unsupported surfaceとして
停止してください。本文の貼り付けはtool scopeを適用しないためfallbackにしません。

Target `${input:target:IDまたはpath}`を、current phase
`${input:phase:Archive / Understand / Imagine / Decide / Plan / Build / Learn}`と
question `${input:question:確認したい問い}`の範囲でreviewしてください。

## Focus

- acceptanceの観測可能性
- positive、negative、boundary、failure case
- regression、reproducibility、runtime差
- sample sufficiency、Insufficient、追加instrumentation

## Output

[Role Lens contract](../../governance/role-lens-contract.md)の
`Lens and target`、`Evidence`、`Current record`、
`Inference from the QA Lead lens`、`Risks and trade-offs`、
`Questions for other roles`、`Proposal (unselected)`、
`Human decisions required`、`Could not assess`をすべて出してください。

これはrole-based analysisであり、QA sign-offやrelease approvalではありません。
実行していないtest、participant、trend、reproduction resultを作らないでください。
