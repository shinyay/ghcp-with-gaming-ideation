# Cross-functional Role Lens workshop

> **日本語が正本です。** English summary: Apply two to four read-only
> professional review lenses to the same repository target, compare questions
> and risks, and return unresolved decisions to real human team members. A Role
> Lens is not a fictional colleague, reviewer, approver, or consensus.

所要時間: 35〜45分。回答本文や採点済みrunをrepositoryへcommitしない。

## 目的

同じID、path、questionを複数のRole Lensで読み、次を比較する。

- 各職種が最初に確認すること
- 共通して検出したrisk
- 職種間で異なるtrade-off
- 他職種へ返す質問
- 人間teamだけが決められること
- source不足で判断できないこと

Role Lensは実在または架空の人物ではない。実際のteam memberとの会話を置き換えず、
cross-functional reviewの準備をする。

## 準備（5分）

```powershell
npm ci
npm run validate:content
npm run validate:copilot-metadata
```

確認する。

1. `.github/agents/`にCore Agent 4件とRole Lens Agent 11件がある。
2. `.github/prompts/`にCore prompt 7件とRole Lens prompt 11件がある。
3. Role Lens Agentのtoolsが`read`と`search`だけである。
4. Custom Agentが選べないsurfaceでは、read/search-only tool scopeを強制できないため
   Role Lens runを行わない。本文貼り付けは有効なfallbackではない。

共通contractは
[governance/role-lens-contract.md](../governance/role-lens-contract.md)。

## 1. Targetを1つ選ぶ（5分）

次を記録する。

| Field | Value |
|---|---|
| Target | stable IDまたはrepository path |
| Current phase | Archive / Understand / Imagine / Decide / Plan / Build / Learn |
| Review question | 1文 |
| Allowed sources | demo repository内の具体path |
| Human decision owner | 人名ではなくrole |

存在しないID、未宣言locator、rights不明素材なら停止する。

## 2. Lensを2〜4件選ぶ（3分）

目的に応じて組み合わせる。

| Review theme | Lens example |
|---|---|
| mechanicの価値とtestability | Game Designer × QA Lead |
| directionとproduction scope | Creative Director × Producer |
| delivery順序とtechnical risk | Project Manager × Gameplay Engineer |
| readabilityとinput feedback | Art Director × UX / Accessibility |
| audio cueとprovenance | Audio Director × Archive / Rights |
| packageとrelease boundary | Platform / Release × Archive / Rights |

全11件を同時に使う必要はない。問いに関係するLensだけを選ぶ。

## 3. 同じTargetへRole promptを実行する（10〜15分）

各Lensへ**同じTarget、phase、question**を渡す。Lensごとにquestionを書き換えない。

例:

```text
Target: VS-001
Current phase: Plan
Question: active receivingの意味を変えずに、Build前に不足している受入条件は何か。
```

出力で次の9節を確認する。

1. Lens and target
2. Evidence
3. Current record
4. Inference from the role lens
5. Risks and trade-offs
6. Questions for other roles
7. Proposal (unselected)
8. Human decisions required
9. Could not assess

「この職種として承認する」「teamは合意した」「この案を採るべき」があれば失敗。

## 4. Cross-role comparison（10分）

回答本文を統合した「正解」を作らず、構造だけを比較する。

| Comparison | 記入内容 |
|---|---|
| Shared risks | 2 Lens以上が指摘したrisk |
| Different trade-offs | Lens間で重みが異なる項目 |
| Missing evidence | どのLensも判断できなかったsource |
| Questions to humans | 実際のteamへ返す問い |
| Decision boundary | Role Lensが決めなかったこと |

相反する指摘は片側へ統合せず、両方を保持する。

## 5. Human handoff（5分）

Role Lens outputをrecordへ昇格しない。実際の人間teamへ次だけを渡す。

- Targetとsource
- Shared risks
- Roleごとのquestions
- Could not assess
- 必要なhuman decision
- 追加Evidenceまたは検証方法

人間が決めた後だけ、既存workflowに従ってFinding、BET、ADR、Issue、Planへ進める。

## 代表演習

### Designer × QA

- Target: `HYP-001`
- Question: 能動的受領の価値を、どのplayer choiceと観測で反証可能にできるか。
- 注意: HypothesisをFindingへ昇格しない。

### Director × Producer

- Target: `BET-002`
- Question: creative promiseとthin-slice scopeの間に、どのtrade-offが残るか。
- 注意: Betを採用・推奨しない。

### Engineer × UX

- Target: `VS-001`
- Question: owner一意性とreceiver feedbackを保ちながら、どのinput pathが不足しているか。
- 注意: 操作意味の変更は`要ADR`。

### Audio × Archive / Rights

- Target: `CFL-007`
- Question: RETURN cueの計画、allocation、rightsを、何を追加で読めば判断できるか。
- 注意: cue欠落理由を断定せず、音声を復元しない。

### PM × Platform

- Target: `VS-001`
- Question: Buildとoffline deliveryの前に、どのdependency、gate、verificationが不足するか。
- 注意: 工数、deadline、deployment成功を捏造しない。

## 評価

[Role Lens rubric](../evaluation/role-lens-rubric.md)と空の
[run sheet](../evaluation/role-lens-run-sheet.md)を使う。

自動validatorはagent、prompt、scenario、rubric、linkだけを検査する。
Role Lens responseの合否は人間が判断する。

## 停止条件

- 実在する同僚の意見や承認の代筆を求められた
- fictional reviewer、participant、team consensusの生成を求められた
- targetまたはsourceが存在しない
- rights、license、sourceがUnknown
- Role Lensにfile変更、Issue作成、approval、deploymentを求めた
- Role Lens Custom Agentを選択できず、read/search-only tool scopeを確認できない
