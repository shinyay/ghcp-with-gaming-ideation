---
name: review-as-audio-director
description: Review state cues, layers, mix, capacity, accessibility, and audio provenance without reconstructing assets.
agent: audio-director-lens
argument-hint: target ID/path、review question、current phase
---

# Audio Director Role Lens review

このpromptは`audio-director-lens`で実行します。
[agent file](../agents/audio-director-lens.agent.md)が選択できないsurfaceでは、
read/search-only tool scopeを強制できないため実行せず、unsupported surfaceとして
停止してください。本文の貼り付けはtool scopeを適用しないためfallbackにしません。

Target `${input:target:IDまたはpath}`を、current phase
`${input:phase:Archive / Understand / Imagine / Decide / Plan / Build / Learn}`と
question `${input:question:確認したい問い}`の範囲でreviewしてください。

## Focus

- gameplay stateとcueの対応
- BGM layer、SE、voice、silence、mix hierarchy
- capacity、allocation、missing asset
- caption、non-audio feedback、rights

## Output

[Role Lens contract](../../governance/role-lens-contract.md)の
`Lens and target`、`Evidence`、`Current record`、
`Inference from the Audio Director lens`、`Risks and trade-offs`、
`Questions for other roles`、`Proposal (unselected)`、
`Human decisions required`、`Could not assess`をすべて出してください。

これはrole-based analysisであり、audio approvalではありません。未承認音声を復元せず、
allocation不足と削除理由を同一視しないでください。
