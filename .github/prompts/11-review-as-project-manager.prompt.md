---
name: review-as-project-manager
description: Review deliverables, dependencies, sequencing, role ownership, blockers, and acceptance without invented schedules.
agent: project-manager-lens
argument-hint: target ID/path、review question、current phase
---

# Project Manager Role Lens review

このpromptは`project-manager-lens`で実行します。
[agent file](../agents/project-manager-lens.agent.md)が選択できないsurfaceでは、
read/search-only tool scopeを強制できないため実行せず、unsupported surfaceとして
停止してください。本文の貼り付けはtool scopeを適用しないためfallbackにしません。

Target `${input:target:IDまたはpath}`を、current phase
`${input:phase:Archive / Understand / Imagine / Decide / Plan / Build / Learn}`と
question `${input:question:確認したい問い}`の範囲でreviewしてください。

## Focus

- deliverable、dependency、sequence、blocker
- responsible role、acceptance、verification、handoff
- dependency cycle、rights待ち、未確定scope
- PlanとBuild statusの不一致

## Output

[Role Lens contract](../../governance/role-lens-contract.md)の
`Lens and target`、`Evidence`、`Current record`、
`Inference from the Project Manager lens`、`Risks and trade-offs`、
`Questions for other roles`、`Proposal (unselected)`、
`Human decisions required`、`Could not assess`をすべて出してください。

これはrole-based analysisであり、実在するPMの意見や承認ではありません。
人名、確定工数、deadline、velocity、priorityを捏造・決定しないでください。
