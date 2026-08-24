# Copilot Space 手動設定手順

> English summary: Copilot Space has no supported creation API in this
> environment, so this document is the authoritative manual procedure.
> **No Space has been created.** Add each allowlisted file or folder as its own
> source. Never add a repository source, and never attach the reference
> repository.

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

## 最重要: repository sourceを追加しない

Copilot Spaceは**path allowlistを強制しません**。repository sourceを1件でも
追加すると、repository全体が回答材料になります。この教材では
`research/findings/`、`design/`、`canon/`、`evaluation/`が回答材料に混ざり、
Copilotが**新しい問いの答え**としてそれらを引用してしまいます。

したがって、manifestの`allowed_sources`を**1件ずつ file / folder source として
追加**します。`repository_source_allowed: false`はこの制約を表します。

manifestの`excluded_paths`は「除外設定として登録するもの」ではありません。
**追加しないもの**の一覧です。Space側に除外機能は存在しません。

## 自動化可否の確認手順

環境が変わった場合、次を順に実行します。すべて未対応なら`manual_only`のままです。
`viewer { login }`のような疎通確認は、Space APIの有無を何も示しません。実行
しないでください。

```powershell
# 1. REST collection endpoint の有無
gh api /user/copilot/spaces 2>&1 | Select-Object -First 3
gh api /copilot/spaces 2>&1 | Select-Object -First 3

# 2. GraphQL に Copilot Space 型が存在するか
$t = 'query { __type(name: "CopilotSpace") { name } }'
gh api graphql -f query=$t

# 3. Space を作成できる mutation が存在するか
$m = 'query { __schema { mutationType { fields { name } } } }'
gh api graphql -f query=$m --jq '.data.__schema.mutationType.fields[].name' |
  Select-String -Pattern 'copilotspace' -SimpleMatch

# 4. CLI extension の有無
gh extension list
```

判定:

| Probe | 対応ありと言える条件 |
|---|---|
| 1 | HTTP 200が返る。404は未対応 |
| 2 | 型名が返る。`null`は未対応 |
| 3 | Space作成に対応するmutation名が出る。0件は未対応 |
| 4 | Space操作に対応するextensionが列挙される |

`__type`が`null`、mutation 0件、REST 404のいずれかである間は、自動化できると
記述しないでください。いずれかが利用可能になった場合は、manifestの
`automation_status`と`automation_reason_*`を更新し、
[capability-report.md](capability-report.md)へ実測結果と実行日時を追記します。

### 直近の実測

`2026-08-25`時点の結果は次の通りです。

| Probe | 結果 |
|---|---|
| REST `/user/copilot/spaces` | HTTP 404 Not Found |
| REST `/copilot/spaces` | HTTP 404 Not Found |
| GraphQL `__type(name: "CopilotSpace")` | `null` |
| GraphQL mutation名にCopilot Space該当 | 0件 |
| `gh extension list` | 空 |

## 手動作成手順

### 1. Spaceを作る

1. GitHub Copilotの Spaces から新規Spaceを作成します。
2. 名前に`STAR RELAY / Cleared Archive`を設定します。
3. 説明には**回答や結論を書かない**でください。「1998年版の変換済み資料と、
   その読み方の索引だけを対象にする」程度にとどめます。

### 2. Sourceを1件ずつ追加する

source追加時に`shinyay/ghcp-with-gaming-ideation`を**repositoryとして選ばない**で
ください。file / folder を指定して、次の10件を個別に追加します。

| # | 種別 | Path |
|---|---|---|
| 1 | file | `governance/evidence-policy.md` |
| 2 | file | `governance/classification-policy.md` |
| 3 | file | `governance/copilot-boundaries.md` |
| 4 | file | `archive/README.md` |
| 5 | folder | `archive/catalog` |
| 6 | folder | `archive/derived` |
| 7 | folder | `archive/evidence-packets` |
| 8 | folder | `research/claims` |
| 9 | folder | `research/conflicts` |
| 10 | folder | `research/hypotheses` |

**追加しないもの**（Space側に除外機能は無いため、追加しないことでのみ守られます）:

`research/findings`、`design`、`canon`、`evaluation`、`packages`、`apps`、`tests`、
そして`shinyay/ghcp-with-gaming-ideation-reference`。

reference repositoryはSpace、workspace、GitHub MCP、all-repository searchの
いずれへも追加しません。

### 3. 代表Issueを追加する

manifestの`representative_issues`に挙げたものだけを追加します。Issue本文へ回答を
書かないでください。

### 4. 確認する

Space作成後、次を1回ずつ実行して結果を記録します。手順2を誤ってrepository source
で行った場合、2番目と3番目がここで失敗します。

| 確認 | 期待 |
|---|---|
| `archive/derived/`のDRVについて質問 | DRV IDとlocator付きで回答 |
| `research/findings/`の内容を尋ねる | sourceに無いため参照されない |
| `design/bets/`の内容を尋ねる | sourceに無いため参照されない |
| 「どのDesign Betを採用すべきか」と尋ねる | 判断材料の提示までで止まる |
| reference repositoryの名前を含む質問 | 参照されない、citationが出ない |

最後の確認は[canary非混入チェック](capability-report.md#canary-isolation)と
同じ意図です。reference由来のcitationが1件でも出た場合、または除外treeが参照された
場合は、sourceを削除し、結果を記録してからやり直してください。

### 5. 記録する

- manifestの`verification`を埋めます（`space_created`、`created_at`、
  `created_by`、`verified_by`）。
- [capability-report.md](capability-report.md)のsurface ledgerを更新します。
- 追加したsourceの一覧を、手順2の表と突き合わせて記録します。
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
ありません。source選択が守るのは**回答材料の範囲**だけです。
