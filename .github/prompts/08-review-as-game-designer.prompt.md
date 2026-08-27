---
name: review-as-game-designer
description: Review one repository target through player verbs, agency, feedback, tension, failure, and learnability.
agent: game-designer-lens
argument-hint: target ID/path、review question、current phase
---

# Game Designer Role Lens review

このpromptは`game-designer-lens`で実行します。
[agent file](../agents/game-designer-lens.agent.md)が選択できないsurfaceでは、
read/search-only tool scopeを強制できないため実行せず、unsupported surfaceとして
停止してください。本文の貼り付けはtool scopeを適用しないためfallbackにしません。

Target `${input:target:IDまたはpath}`を、current phase
`${input:phase:Archive / Understand / Imagine / Decide / Plan / Build / Learn}`と
question `${input:question:確認したい問い}`の範囲でreviewしてください。

## Focus

- player verbs、choice、agency、feedback loop
- tension、failure、learning
- playerに見えるstate transition
- 捨てる価値、Falsified if、測れない体験

## Output

[Role Lens contract](../../governance/role-lens-contract.md)の
`Lens and target`、`Evidence`、`Current record`、
`Inference from the Game Designer lens`、`Risks and trade-offs`、
`Questions for other roles`、`Proposal (unselected)`、
`Human decisions required`、`Could not assess`をすべて出してください。

これはrole-based analysisであり、実在するDesignerの意見や承認ではありません。
Design Betの推薦、rule採用、balance変更を行わないでください。
