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
| `archive-curator` | 資産、Claim、Conflictを整理する。決定しない | `read`, `search` |
| `design-facilitator` | 根拠付きで異なるDesign Betを作る。選択しない | `read`, `search`, `edit` |
| `slice-planner` | ADRをEpic/Sub-issues/acceptance criteriaへ変換する | `read`, `search`, `edit` |
| `provenance-auditor` | PRと新文書の根拠・権利・lineageを検査する | `read`, `search` |

`execute`はどのagentにも与えていない。書き込み可能な2 agentは`design/`配下の
新規fileだけを対象にする。prompt fileはtool scopeを宣言せず、bindしたcustom agent
側のscopeが正本である。

## 人間しかできない操作

| 操作 | 理由 |
|---|---|
| BET IDの採番と`design/bets/`への保存 | 選択肢を記録へ格上げする宣言だから |
| ADRの受理（`accepted`）と署名欄の記入 | 「これで行く」と言えるのは人間だけだから |
| Conflictの裁定 | どちらを採るかは証拠ではなく判断だから |
| 評価の採点 | 出力を読んで合否を決めるのは人間だから |

規律が守られているかは[evaluation/](../evaluation/README.md)の固定10シナリオと
構造rubricで確認する。rubricは構造と引用の実在だけを見る。回答本文は採点しない。

## 検証

```powershell
npm run validate:copilot-metadata
```

これは**設定のmetadata検査**であり、モデル出力を読まない。振る舞いの採点は人間が
rubricで行う。CIは振る舞いのgateではない。

## Space

Copilot Space automationが使えないため
`ops/github/copilot-space-manifest.yaml`と
[手動手順](../ops/github/copilot-space-setup.md)を正本とする。Spaceは未作成である。

Spaceはpath allowlistを強制しない。したがって**repository sourceを追加しない**。
manifestの`allowed_sources`をfile / folderとして1件ずつ追加する。reference
repositoryをSpace、workspace、MCP、all-repository searchへ追加しない。

これらの指示はアクセス制御ではない。境界の正本は
[classification-policy.md](classification-policy.md)とrepository分離である。
