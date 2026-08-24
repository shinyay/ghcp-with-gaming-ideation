# GitHub collaboration runbook

日本語を正本とします。このrunbookはGitHub surfaceを再現する手順と、公開APIで
構成できない項目の正確なfallbackを記録します。

> English summary: Run the scripts in order. Custom Discussion categories and the
> first Wiki page have no supported API path, so their explicit UI fallbacks are
> recorded instead of being reported as successful.

## 前提

- `gh auth status`が`repo`と`project` scopeを持つ`@shinyay`を示す
- repositoryは`shinyay/ghcp-with-gaming-ideation`
- private User Project #6を再利用し、新規Projectを作らない
- `ops/github/surfaces.json`がseed objectの機械可読な正本
- `ops/github/wiki/`がWikiの唯一のsource
- Pagesは作成も公開もしない

## 再現手順

```powershell
./ops/github/seed-labels.ps1
./ops/github/seed-issues.ps1
./ops/github/seed-discussions.ps1
./ops/github/configure-project.ps1
./ops/github/publish-wiki.ps1
./ops/github/export-demo-snapshot.ps1
```

一括実行は次を使用します。

```powershell
./ops/github/run-phase4.ps1
```

各scriptはtitleまたはstable ID markerで既存objectを解決し、重複を作らず更新します。
`seed-issues.ps1`はIssue #15を親としてIssue #16～#24をsub-issueへ接続します。

## Source of Truth

| Surface | 責務 | 複製しないもの |
|---|---|---|
| Repository | Evidence、Conflict、decision、実装 | なし。ここが正本 |
| Issues | 作業、問い、受入条件 | 最終Finding、Play DNA、Design Bet、ADR answer |
| Discussions | 対話、比較、Q&A | 決定本文、架空comment／vote／reaction |
| Project | status、stage、discipline、gate | Issue本文、ADR本文 |
| Wiki | museum navigation | 仕様、Finding、Design Bet、ADR本文 |

## Discussion category fallback

GitHub GraphQL schemaには`createDiscussion`と`updateDiscussion`がありますが、
Discussion categoryを作成または更新するmutationはありません。REST APIもcategory
作成を提供しません。そのため、custom categoryがUIで作成されるまで次を使います。

| Desired category | Live category |
|---|---|
| Announcements | Announcements |
| Archive Lab | General |
| Design Lab | Ideas |
| Playtests & Feedback | General |
| Q&A | Q&A |

手動で作成する場合はrepositoryの**Discussions → Categories → Edit**から上表のdesired
categoryを作り、`./ops/github/seed-discussions.ps1`を再実行します。scriptはdesired slugを
優先し、存在しない場合だけfallback slugを使います。

## Wiki first-page fallback

`publish-wiki.ps1`は次を順番に実行します。

1. repository設定でWikiをenableにする
2. `shinyay/ghcp-with-gaming-ideation.wiki.git`をcloneする
3. cloneできない場合はlocal Wiki repositoryを初期化して`master`をpushする
4. push後にfresh cloneし、全Markdownのfilename＋SHA-256をsourceと比較する

GitHubが最初のWiki pageをWeb UIで作るまで`.wiki.git`を公開しない場合、scriptは
`wiki-publish-state.json`へ
`github_wiki_first_page_initialization_requires_web_ui`を記録します。この場合だけ、
repositoryの**Wiki → Create the first page**で`Home`を一度作成し、直後にscriptを
再実行します。UI上のpageを正本として編集せず、再実行で`ops/github/wiki/`の内容へ
置き換えます。

## Issue Forms activation

Issue Formsはdefault branch上の`.github/ISSUE_TEMPLATE/`だけがlive UIへ反映されます。
feature branchではYAMLを検証し、merge後に次を選択できることを確認します。

- Archive question
- Experiment or learning loop
- Demo-safe implementation

## Snapshot contract

`export-demo-snapshot.ps1`は`ops/github/snapshot-allowlist.json`のstable IDだけをqueryし、
live titleとdesired titleの一致を確認してから
`demo/offline-snapshots/github-objects.json`を書きます。

許可する情報はstable ID、GitHub node ID／number、URL、承認済みtitle、status、
category／label／Project field optionなどのenumだけです。author、body、comment、
reaction、token、timestamp、自由記述は出力しません。snapshotはoffline packageの
`github-objects/`へallowlist copyされます。

## その他のfallback

| Surface | Live path | Deterministic fallback |
|---|---|---|
| Custom agent | `.github/agents/archive-curator.agent.md`をclientで選択 | 同fileを明示instructionとして添付 |
| Prompt file | prompt pickerから実行 | file本文とallowed pathsをchatへ渡す |
| Issue Form | default branchでformを選択 | 同formの項目を通常Issueへ転記 |
| Discussion | live Discussion | allowlisted snapshotのstable IDとURL |
| Project | private User Project #6 | allowlisted snapshotのfield enumとitem URL |
| Wiki | output-only Wiki | `ops/github/wiki/` |
| Release | private repositoryのdraft Release | local offline package |
| Copilot Space | cleared archive source | `copilot-space-manifest.yaml`で手動設定 |

Fallbackは成功を装いません。利用不能なsurfaceはstatusと理由を記録し、同じstable IDで
repository内のsourceへ解決します。
