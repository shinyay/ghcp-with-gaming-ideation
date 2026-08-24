# Copilot boundaries

## Allowed

- `archive/catalog/assets.yaml`で`demo-safe`、`ai_eligible: true`のDRVを読む
- Evidence、Inference、Proposalを分離する
- Conflictを見つけ、追加調査を提案する
- ADRに従ってacceptance criteriaやcodeを作る

## Forbidden

- Reference repository、answer key、expected outputをsourceへ追加する
- 1資料だけから未確認の歴史を断定する
- Conflictを自動解消する
- 架空のreviewer、Git history、poll、reaction、user、playtest participantを作る
- BrowserへGitHub tokenを渡す、またはGitHub APIへ直接接続する
- `ai_eligible`をsecurity boundaryとして説明する

Copilot Space automationが使えない場合は
`ops/github/copilot-space-manifest.yaml`を手動fallbackとして使う。
