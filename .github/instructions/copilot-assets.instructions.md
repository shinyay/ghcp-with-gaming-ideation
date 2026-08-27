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
- frontmatterは`name`、`description`、`agent`、`argument-hint`を使う。
- `agent`には**このrepositoryのcustom agent slug**を書く。`ask`、`agent`、`plan`の
  ような汎用値は、利用者が選んだcustom agentを上書きし、agent側のtool scopeと
  禁止事項を捨ててしまう。
- prompt fileは`tools`を**宣言しない**。tool scopeはbindしたagent側が持つ。二重に
  宣言すると、広い方が勝つ事故が起きる。
- `mode`は退役key。使わない。
- 出力見出し（Evidence / Inference / Proposal など）を明示的に指定する。
- 停止条件を書く。前提が欠けたときに何を報告して止めるかを明記する。
- custom agentを選べないsurface向けに、対応するagent fileへのlinkを本文に置く。

## Custom agent

- 場所は`.github/agents/`、拡張子は`.agent.md`。
- `description`は必須。`tools`と`disable-model-invocation`を明示する。
- `name`はfile slugと一致させる。prompt側の`agent`がslugで解決できるようにする。
- Archive CuratorとProvenance Auditorは読み取り専用とし、`tools`を
  `["read", "search"]`に限定する。`edit`と`execute`を与えない。
- `*-lens`の職種別Role Lens Agentはすべて読み取り専用とし、`tools`を
  `["read", "search"]`に限定する。
- Role Lensは架空の人物、team member、reviewer、approverとして書かない。
  `governance/role-lens-contract.md`の共通出力と禁止事項を持たせる。
- Role Lensにrole approval、team consensus、Bet選択、ADR受理を行わせない。
- 書き込み可能なagentには、書き込んでよいdirectoryを本文で限定する。
- 各agentに「しないこと」の節を置き、決定・昇格・Conflict解消の禁止を書く。

## Space manifest と手順書

`ops/github/copilot-space-manifest.yaml`はSpaceの**設計意図**である。実際に作成
されていないSpaceを、作成済みとして記述しない。自動化の可否は
`automation_status`で表す。

Spaceはpath allowlistを強制しない。repository sourceを1件追加すると
`excluded_paths`を含む全体が回答材料になる。したがって
`repository_source_allowed: false`を維持し、`allowed_sources`をfile / folderとして
列挙する。`excluded_paths`は「除外設定として登録するもの」ではなく「追加しないもの」
の一覧である。

Reference repositoryをsourceへ追加しない。除外対象として名前を書く場合は
`forbidden_repositories`のように、除外であることが明らかな位置に書く。

## 評価アセット

`evaluation/`は構造と引用の実在だけを採点対象にする。採点そのものは人間が行う。
自動検査を「振る舞いのgate」として記述しない。

## 実測の記述

`ops/github/capability-report.md`には、実際に確認できた結果だけを書く。branchに
fileが存在することを、UI上で有効化された機能として報告しない。確認手段が無い
場合は「確認手段なし」と書く。

API有無のprobeは、対象APIそのものを叩く。疎通確認（`viewer { login }`など）を
機能の有無の根拠にしない。

## 検証

変更後は`npm run validate:copilot-metadata`を実行する。これは設定のmetadata検査で
あり、モデル出力を読まない。
