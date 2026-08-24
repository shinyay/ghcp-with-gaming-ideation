# Copilot boundaries

> English summary: Copilot organizes evidence and produces options. Humans
> resolve conflicts, choose bets, sign decisions, and promote findings.

## Allowed

- `archive/catalog/assets.yaml`で`demo-safe`、`ai_eligible: true`のDRVを読む
- Evidence、Inference、Proposalを分離する
- Conflictを見つけ、追加調査を提案する
- 互いに異なるDesign Betの選択肢を、由来Evidence付きで作る
- 人間が選択した後のADR草案を作る
- 受理済みADRに従ってacceptance criteriaやcodeを作る
- 自分の成果物の引用・権利・来歴を監査する

## Forbidden

- Reference repository、answer key、expected outputをsourceへ追加する、引用する、作る
- 1資料だけから未確認の歴史を断定する
- Conflictを自動解消する、既定の優先規則で片側を採る
- InferenceをFindingへ昇格する
- Design Betを推奨・順位付け・採用する
- ADRの`Decision`を自分で埋める、`accepted`にする、署名欄を埋める
- ADRなしでPlayableの意味（rule、balance、勝敗条件、操作の意味）を変える
- 架空のreviewer、Git history、poll、reaction、user、playtest participantを作る
- BrowserへGitHub tokenを渡す、またはGitHub APIへ直接接続する
- `ai_eligible`をsecurity boundaryとして説明する

権利・ライセンス・出所が不明な場合は停止し、`risk:rights`として報告する。

## 実装されているアセット

| 種別 | 場所 | 件数 |
|---|---|---|
| Repository instructions | `.github/copilot-instructions.md` | 1 |
| Path instructions | `.github/instructions/` | 4 |
| Prompt file | `.github/prompts/` | 7 |
| Custom agent | `.github/agents/` | 4 |

| Agent | 役割 | tools |
|---|---|---|
| Archive Curator | 資産、Claim、Conflictを整理する。決定しない | `read`, `search` |
| Design Facilitator | 根拠付きで異なるDesign Betを作る。選択しない | `read`, `search`, `edit` |
| Slice Planner | ADRをEpic/Sub-issues/acceptance criteriaへ変換する | `read`, `search`, `edit` |
| Provenance Auditor | PRと新文書の根拠・権利・lineageを検査する | `read`, `search` |

`execute`はどのagent、どのpromptにも与えていない。書き込み可能な2 agentは
`design/`配下の新規fileだけを対象にする。

規律が守られているかは[evaluation/](../evaluation/README.md)の固定10シナリオと
構造rubricで確認する。rubricは構造と引用の実在だけを見る。回答本文は採点しない。

## 検証

```powershell
npm run validate:copilot
```

## Space

Copilot Space automationが使えないため
`ops/github/copilot-space-manifest.yaml`と
[手動手順](../ops/github/copilot-space-setup.md)を正本とする。Spaceは未作成である。
reference repositoryをSpace、workspace、MCP、all-repository searchへ追加しない。

これらの指示はアクセス制御ではない。境界の正本は
[classification-policy.md](classification-policy.md)とrepository分離である。
