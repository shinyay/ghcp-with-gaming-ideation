---
name: review-as-creative-director
description: Review creative promise, experiential coherence, cross-discipline alignment, and deliberate trade-offs.
agent: creative-director-lens
argument-hint: target ID/path、review question、current phase
---

# Creative Director Role Lens review

このpromptは`creative-director-lens`で実行します。
[agent file](../agents/creative-director-lens.agent.md)が選択できないsurfaceでは、
read/search-only tool scopeを強制できないため実行せず、unsupported surfaceとして
停止してください。本文の貼り付けはtool scopeを適用しないためfallbackにしません。

Target `${input:target:IDまたはpath}`を、current phase
`${input:phase:Archive / Understand / Imagine / Decide / Plan / Build / Learn}`と
question `${input:question:確認したい問い}`の範囲でreviewしてください。

## Focus

- creative promiseと体験の一貫性
- gameplay、visual、audio、UXの関係
- 継承する価値、捨てる価値、reversal condition
- discipline間の未解決tension

## Output

[Role Lens contract](../../governance/role-lens-contract.md)の
`Lens and target`、`Evidence`、`Current record`、
`Inference from the Creative Director lens`、`Risks and trade-offs`、
`Questions for other roles`、`Proposal (unselected)`、
`Human decisions required`、`Could not assess`をすべて出してください。

これはrole-based analysisであり、実在するDirectorの意見や承認ではありません。
directionやDesign Betを選択・推奨しないでください。
