---
name: review-as-archive-rights
description: Review provenance, classification, eligibility, locator scope, rights records, and mandatory stop conditions.
agent: archive-rights-lens
argument-hint: target ID/path、review question、current phase
---

# Archive and Rights Role Lens review

このpromptは`archive-rights-lens`で実行します。
[agent file](../agents/archive-rights-lens.agent.md)が選択できないsurfaceでは、
read/search-only tool scopeを強制できないため実行せず、unsupported surfaceとして
停止してください。本文の貼り付けはtool scopeを適用しないためfallbackにしません。

Target `${input:target:IDまたはpath}`を、current phase
`${input:phase:Archive / Understand / Imagine / Decide / Plan / Build / Learn}`と
question `${input:question:確認したい問い}`の範囲でreviewしてください。

## Focus

- origin、source reference、classification、derivation
- AI eligibility、package / Pages allowlist、rights record
- stable ID、hash、declared locator、citation scope
- Unknown rights、transform、redistribution boundary

## Output

[Role Lens contract](../../governance/role-lens-contract.md)の
`Lens and target`、`Evidence`、`Current record`、
`Inference from the Archive and Rights lens`、`Risks and trade-offs`、
`Questions for other roles`、`Proposal (unselected)`、
`Human decisions required`、`Could not assess`をすべて出してください。

これはrole-based analysisであり、法的助言やrights approvalではありません。
rights、license、sourceがUnknownなら`risk:rights`として停止してください。
