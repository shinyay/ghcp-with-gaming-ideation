# Copilot Space 手動設定手順

> English summary: Copilot Space has no supported creation API in this
> environment, so this document is the authoritative manual procedure.
> **No Space has been created by automation.** The reference repository must
> never be attached.

正本のmanifestは[copilot-space-manifest.yaml](copilot-space-manifest.yaml)です。
矛盾する場合はmanifestを優先します。

## 現状

| 項目 | 状態 |
|---|---|
| 自動作成 | 不可。REST / GraphQL / CLI / MCP に対応手段なし |
| このrepositoryのSpace | **未作成**（`verification.space_created: false`） |
| 手動作成 | 可能。以下の手順による |

作成していないSpaceを「作成済み」と記述しないでください。作成した場合は、
manifestの`verification`を実施者が埋めます。

## 自動化可否の再確認手順

環境が変わった場合、次を順に確認します。すべて失敗したら`manual_only`のままです。

```powershell
gh api /user/copilot/spaces 2>&1 | Select-Object -First 5
gh api graphql -f query='query { viewer { login } }' 2>&1 | Select-Object -First 3
gh extension list
```

- REST: Spaceのcollection endpointが存在するか（404 / 未文書化なら不可）
- GraphQL: Space関連のmutationがschemaに存在するか
- CLI / MCP: Space作成に対応するcommandやtoolがあるか

いずれかが利用可能になった場合は、manifestの`automation_status`と
`automation_reason_*`を更新し、[capability-report.md](capability-report.md)へ
実測結果を追記します。

## 手動作成手順

### 1. Spaceを作る

1. GitHub Copilotの Spaces から新規Spaceを作成します。
2. 名前に`STAR RELAY / Cleared Archive`を設定します。
3. 説明には**回答や結論を書かない**でください。「1998年版の変換済み資料と、
   その読み方の索引だけを対象にする」程度にとどめます。

### 2. Repositoryを追加する

- 追加するのは`shinyay/ghcp-with-gaming-ideation`だけです。
- `shinyay/ghcp-with-gaming-ideation-reference`を**追加しません**。
  Space、workspace、GitHub MCP、all-repository searchのいずれへも追加しません。

### 3. Sourceを絞る

manifestの`allowed_paths`だけを対象にします。

| 追加する | 追加しない |
|---|---|
| `governance/evidence-policy.md` | `research/findings/**` |
| `governance/classification-policy.md` | `design/**` |
| `governance/copilot-boundaries.md` | `canon/**` |
| `archive/README.md` | `evaluation/**` |
| `archive/catalog/**` | `packages/**`、`apps/**`、`tests/**` |
| `archive/derived/**` | |
| `archive/evidence-packets/**` | |
| `research/claims/**`、`research/conflicts/**`、`research/hypotheses/**` | |

除外側は「既存の人間の判断」「評価の枠組み」「実装成果物」です。これらをsourceへ
入れると、Copilotが**新しい問いの答え**としてそれらを引用してしまいます。

### 4. 代表Issueを追加する

manifestの`representative_issues`に挙げたものだけを追加します。Issue本文へ回答を
書かないでください。

### 5. 確認する

Space作成後、次を1回ずつ実行して結果を記録します。

| 確認 | 期待 |
|---|---|
| `archive/derived/`のDRVについて質問 | DRV IDとlocator付きで回答 |
| `research/findings/`の内容を尋ねる | sourceに無いため参照されない |
| 「どのDesign Betを採用すべきか」と尋ねる | 判断材料の提示までで止まる |
| reference repositoryの名前を含む質問 | 参照されない、citationが出ない |

最後の確認は[canary非混入チェック](capability-report.md#canary-isolation)と
同じ意図です。reference由来のcitationが1件でも出た場合は、Spaceのsource設定を
見直し、結果を記録してください。

### 6. 記録する

- manifestの`verification`を埋めます（`space_created`、`created_at`、
  `created_by`、`verified_by`）。
- [capability-report.md](capability-report.md)のsurface ledgerを更新します。
- 設定のscreenshotを、回答本文が写り込まない形で残します。

## Identity

Demo repositoryだけを閲覧できる別のGitHub identityが使える場合はそれを優先します。
使えない場合は、Space、local workspace、GitHub MCP、all-repository searchの対象を
Demo repositoryへ限定し、リハーサルでreference由来のcitationが出ないことを確認
します。

## 注意

Space のsource設定はアクセス制御ではありません。境界の正本は
[governance/classification-policy.md](../../governance/classification-policy.md)と
repository分離です。Spaceから外したからといって、そのcontentが保護されるわけでは
ありません。
