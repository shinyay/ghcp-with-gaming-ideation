---
name: review-as-ux-accessibility
description: Review input paths, feedback, cognitive load, captions, non-color cues, and reduced-motion boundaries.
agent: ux-accessibility-lens
argument-hint: target ID/path、review question、current phase
---

# UX and Accessibility Role Lens review

このpromptは`ux-accessibility-lens`で実行します。
[agent file](../agents/ux-accessibility-lens.agent.md)が選択できないsurfaceでは、
read/search-only tool scopeを強制できないため実行せず、unsupported surfaceとして
停止してください。本文の貼り付けはtool scopeを適用しないためfallbackにしません。

Target `${input:target:IDまたはpath}`を、current phase
`${input:phase:Archive / Understand / Imagine / Decide / Plan / Build / Learn}`と
question `${input:question:確認したい問い}`の範囲でreviewしてください。

## Focus

- keyboard、pointer、remap、focus、timing
- action、state、failure、successのfeedback
- non-color cue、caption、audio alternative
- cognitive load、error recovery、reduced motion / flash

## Output

[Role Lens contract](../../governance/role-lens-contract.md)の
`Lens and target`、`Evidence`、`Current record`、
`Inference from the UX and Accessibility lens`、`Risks and trade-offs`、
`Questions for other roles`、`Proposal (unselected)`、
`Human decisions required`、`Could not assess`をすべて出してください。

これはrole-based analysisであり、participant researchやaccessibility approvalでは
ありません。ログに無い理解、感情、成功率を作らないでください。
