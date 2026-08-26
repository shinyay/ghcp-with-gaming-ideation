# GitHub Pages限定公開ポリシー

> **日本語が正本です。** English summary: The repository owner approved public
> display of exactly two generated HTML files on this repository's official
> GitHub Pages site. The repository remains private, and no broader content or
> redistribution license is granted.

## Decision

- Status: approved
- Decided by: repository owner `@shinyay`
- Decided at: 2026-08-27
- Decision: 次の2つのHTML Artifactに限り、公式GitHub Pages siteで公開展示する。
- Playable meaning: 変更なし
- Referenced ADR: なし

## Public allowlist

| Public route | Repository path | 内容 |
|---|---|---|
| `/ghcp-with-gaming-ideation/` | `pages/index.html` | Archive-to-Playable Workflow Presentation |
| `/ghcp-with-gaming-ideation/game-guide/` | `pages/game-guide/index.html` | STAR RELAY Field & Archive Guide |

`.nojekyll`はGitHub Pagesの処理制御用であり、公開contentを追加するものではない。

## Rights scope

許諾するのは、上記2 pathを公式GitHub Pages siteで表示し、その表示に必要な配信と
browser cacheを行うことだけである。

次は許諾しない。

- HTMLの改変または派生物作成
- 他site、package、repositoryへの再配布
- 商用利用
- Archive corpus、source code、snapshot、Issue / Discussion / Project dataの公開
- Reference repository、answer key、expected output、scored runの公開または参照
- 実在企業、人物、hardware、作品、assetを示す表現

## Publication boundary

- Repository visibilityは`private`のまま維持する。
- Pages artifactは`pages/index.html`、`pages/game-guide/index.html`、`.nojekyll`
  以外を含めない。
- 両HTMLはself-containedとし、GitHub API、token、CDN、外部asset、telemetryへ依存しない。
- Public HTML内の資料は`demo-safe`かつsynthetic fixtureだけに由来する。
- Pages公開とprivate draft Releaseの公開状態を同一視しない。

## Validation

公開前に次を満たす。

1. `npm run validate:pages`が終了コード`0`となる。
2. allowlistのSHA-256が公開HTMLと一致する。
3. 2 routeが同一originで相互に移動できる。
4. browser外部requestが`0`件である。
5. Reference-only content、PII、credential、session-local pathを含まない。
6. GitHub Pages sourceがGitHub Actionsで、repository visibilityが`private`のままである。

## Stop conditions

- Private repositoryのPages利用権限が無い場合。repositoryをpublicへ変更して回避しない。
- allowlist外fileがPages artifactへ含まれる場合。
- rights、license、sourceがUnknownの素材が追加された場合。`risk:rights`として停止する。
- Public routeまたはscopeを変更する要求。新しい人間のdecisionを要求する。
