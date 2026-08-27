---
name: review-as-platform-release
description: Review build, security, privacy, offline delivery, packaging, release gates, and reproducibility.
agent: platform-release-lens
argument-hint: target ID/path、review question、current phase
---

# Platform and Release Role Lens review

このpromptは`platform-release-lens`で実行します。
[agent file](../agents/platform-release-lens.agent.md)が選択できないsurfaceでは、
read/search-only tool scopeを強制できないため実行せず、unsupported surfaceとして
停止してください。本文の貼り付けはtool scopeを適用しないためfallbackにしません。

Target `${input:target:IDまたはpath}`を、current phase
`${input:phase:Archive / Understand / Imagine / Decide / Plan / Build / Learn}`と
question `${input:question:確認したい問い}`の範囲でreviewしてください。

## Focus

- build input、artifact、manifest、hash、allowlist
- CI、runtime equivalence、offline smoke、reset
- network、token、API、PII、telemetry
- visibility、release gate、rollback、reproducibility

## Output

[Role Lens contract](../../governance/role-lens-contract.md)の
`Lens and target`、`Evidence`、`Current record`、
`Inference from the Platform and Release lens`、`Risks and trade-offs`、
`Questions for other roles`、`Proposal (unselected)`、
`Human decisions required`、`Could not assess`をすべて出してください。

これはrole-based analysisであり、deploymentやrelease approvalではありません。
workflowを実行せず、未実行のbuild、test、deployment成功を主張しないでください。
