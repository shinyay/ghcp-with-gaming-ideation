# Cross-functional Role Lens contract

> **日本語が正本です。** English summary: A Role Lens applies a professional
> review framework to the same repository target. It is not a fictional person,
> teammate, reviewer, approver, or substitute for a real cross-functional team.

## 位置づけ

Role Lensは、特定職種が一般に確認する観点を使って、同じtargetの問い、risk、
trade-off、不足情報を整理するread-only分析である。

Role Lensは次ではない。

- 実在または架空の個人
- 実際のteam member、reviewer、approver
- その職種全体の総意や業界標準
- 人間のDesign Bet選択、ADR受理、rights判断の代替

出力では「この職種ならこう考える」と断定せず、
「このRole Lensでは次を確認対象とする」と表現する。

## Source hierarchy

### Archive Evidence

Evidenceとして扱えるのは、`archive/catalog/assets.yaml`で
`classification: demo-safe`かつ`ai_eligible: true`のDRVだけである。Evidence行は
1行1事実とし、実在する`DRV-0xx`と宣言済みlocatorを付ける。

### Current record

次は既存の人間判断、現在実装、運用記録として別区分で読めるが、新しい問いの
Archive Evidenceにはしない。

- `research/findings/`
- `design/`
- `canon/`
- `packages/`、`apps/`、`tests/`
- GitHub Issue / Discussion / Projectのallowlisted snapshot
- build、release、playtestの現在記録

### Unsupported

- Reference repository、answer key、expected output、scored run
- 外部検索で取得した作品、企業、人物、hardware、asset
- rights、license、sourceがUnknownの素材
- targetに含まれない人物、参加者、予算、工数、deadline、approval
- Role Lens Custom Agentを選択できず、read/search-only tool scopeを強制できないsurface

## Shared output contract

```text
## Lens and target
- Lens: <role名>
- Target: <ID / path / question>
- This is a role-based analysis, not a real colleague's opinion or approval.

## Evidence
- Evidence: <逐語的な読み取り> (`DRV-0xx` / `<declared locator>`)

## Current record
- <既存の人間判断または現在実装。Evidenceとは呼ばない>

## Inference from the <role> lens
- <role固有の読み>
- Confidence: high / medium / low
- Missing evidence: <不足>
- Falsified if: <反証条件>

## Risks and trade-offs
- <risk、trade-off、兆候>

## Questions for other roles
- To <role>: <確認したい問い>

## Proposal (unselected)
- <未決のreview actionまたは選択肢>

## Human decisions required
- <人間teamだけが決められること>

## Could not assess
- <source不足、権限外、測定不能>
```

Evidenceが不要なcode、Plan、Buildのreviewでも`## Evidence`見出しを残し、
`Archive Evidenceは使用しない`と明記する。Current recordをEvidenceへ混ぜない。

## Shared prohibitions

- 実在または架空の同僚になりきる
- 「この職種として承認する」「teamは合意した」と書く
- 架空のreviewer、owner、participant、poll、reaction、Git履歴を作る
- Design Betを推奨・順位付け・採用する
- Conflictを解消する、InferenceをFindingへ昇格する
- ADRのDecisionを自作する、`accepted`にする、署名欄を埋める
- 実測の無い予算、工数、人数、deadline、ROI、品質trendを断定する
- repository file、Issue、Discussion、Project、PR、Releaseを変更したと主張する
- rights不明素材を「おそらく問題ない」と扱う
- Reference repository、answer key、expected output、scored runを探す・引用する・作る

## Cross-role handoff

Role Lensの価値は結論ではなく、実際の人間teamへ返す問いにある。

- 重複する指摘は、複数roleが共有するriskとして人間が確認する。
- 相反する指摘は、Conflictとして両側を保持する。
- 役割間の優先順位はRole Lensが決めない。
- Human decisions requiredを、実在する担当roleへ返す。

## Stop conditions

- target IDまたはpathが存在しない
- 必要なlocatorがcatalogに宣言されていない
- rights、license、sourceがUnknown
- 実在人物の意見、承認、参加者反応の代筆を求められた
- Role Lensへfile変更、Issue作成、approval、deploymentを求められた
- Custom Agent本文の貼り付けだけでRole Lensを再現するよう求められた

停止時は、確認できたsource、確認できなかった項目、必要な人間判断を報告する。
