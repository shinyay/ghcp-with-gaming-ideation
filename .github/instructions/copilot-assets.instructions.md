---
applyTo: ".github/prompts/**,.github/agents/**,evaluation/**,ops/github/**"
description: Copilot experience assets must stay answer-free, least-tool-scoped, and honest about what was actually verified.
---

# Copilot体験アセットのpath instructions

## 答えを埋め込まない

prompt file、custom agent、evaluation rubricに、期待される回答、期待される分類・
分類数、正解の要約を書かない。「4種類に分かれる」「主因は容量である」のような、
答えの形を先に示す記述を含めない。

評価は**構造と引用の実在**だけを見る。回答文そのものを採点対象にしない。答えの
本文はこのrepositoryに存在しない。

## Prompt file

- 場所は`.github/prompts/`、拡張子は`.prompt.md`。
- frontmatterは`name`、`description`、`agent`、`argument-hint`、`tools`を使う。
  `agent`は`ask`、`agent`、`plan`、またはcustom agent名。
- 分析のみのpromptは`tools: ["read", "search"]`にする。file生成が必要なpromptだけ
  `"edit"`を加える。`execute`と`web`を既定で与えない。
- 出力見出し（Evidence / Inference / Proposal など）を明示的に指定する。
- 停止条件を書く。前提が欠けたときに何を報告して止めるかを明記する。

## Custom agent

- 場所は`.github/agents/`、拡張子は`.agent.md`。
- `description`は必須。`name`、`tools`、`disable-model-invocation`を明示する。
- Archive CuratorとProvenance Auditorは読み取り専用とし、`tools`を
  `["read", "search"]`に限定する。`edit`と`execute`を与えない。
- 書き込み可能なagentには、書き込んでよいdirectoryを本文で限定する。
- 各agentに「しないこと」の節を置き、決定・昇格・Conflict解消の禁止を書く。

## Space manifest と手順書

`ops/github/copilot-space-manifest.yaml`はSpaceの**設計意図**である。実際に作成
されていないSpaceを、作成済みとして記述しない。自動化の可否は
`automation_status`で表す。

Reference repositoryをsourceへ追加しない。除外対象として名前を書く場合は
`forbidden_repositories`のように、除外であることが明らかな位置に書く。

## 実測の記述

`ops/github/capability-report.md`には、実際に確認できた結果だけを書く。branchに
fileが存在することを、UI上で有効化された機能として報告しない。確認手段が無い
場合は「確認手段なし」と書く。

## 検証

変更後は`npm run validate:copilot`を実行する。
