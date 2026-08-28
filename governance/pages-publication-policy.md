# GitHub Pages限定公開ポリシー

> **日本語が正本です。** English summary: The repository owner approved public
> display of exactly two generated HTML files on this repository's official
> GitHub Pages site, including an in-file Japanese/English presentation toggle.
> The repository remains private, and no additional route, public content, or
> broader redistribution license is granted.

## Decision

- Status: approved
- Decided by: repository owner `@shinyay`
- Decided at: 2026-08-27
- Decision: 次の2つのHTML Artifactに限り、公式GitHub Pages siteで公開展示する。
- Playable meaning: 変更なし
- Referenced ADR: なし

## Bilingual presentation amendment

- Status: approved
- Decided by: repository owner `@shinyay`
- Decided at: 2026-08-28
- Decision: 「GitHub Pagesは日本語で作成していますが、英語と日本語をトグルで
  切り替えられるようにしてください。」
- Confirmed scope: 既存2 HTMLの両方で「日本語 | English」を表示し、日本語を既定と
  する。全表示文、Evidence / Inference / Proposal、ARIA、meta、SVG説明、動的statusを
  切り替え、選択した`ja`または`en`だけをbrowser内の
  `star-relay-pages-language-v1`へ保存する。
- Publication action: source、test、allowlistの更新まで。workflowの再有効化とlive再公開は
  別の人間指示を必要とする。
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
browser cacheを行うこと、および同じ2 HTML内で日本語正本と英語translationを切り替える
表示・inline code・language preferenceを実装することだけである。Language preferenceは
`ja`または`en`だけをlocal browser storage key
`star-relay-pages-language-v1`へ保存し、PII、cookie、telemetryを含めない。

次は許諾しない。

- 上記bilingual presentationの範囲を超えるHTMLの改変または派生物作成
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
- 日本語をdefaultとし、英語は日本語正本のtranslationであることを表示する。
- Language toggleは同一2 routeだけで動作し、別言語file、route、runtime translation
  serviceを追加しない。
- Pages公開とprivate draft Releaseの公開状態を同一視しない。

## Validation

公開前に次を満たす。

1. `npm run validate:pages`が終了コード`0`となる。
2. allowlistのSHA-256が公開HTMLと一致する。
3. 2 routeが同一originで相互に移動できる。
4. browser外部requestが`0`件である。
5. Reference-only content、PII、credential、session-local pathを含まない。
6. GitHub Pages sourceがGitHub Actionsで、repository visibilityが`private`のままである。
7. 日本語default、英語toggle、reloadと2 route間の選択保持、localized ARIA/meta、
   keyboard操作、mobile overflow、browser外部request `0`件を自動testで確認する。

## Stop conditions

- Private repositoryのPages利用権限が無い場合。repositoryをpublicへ変更して回避しない。
- allowlist外fileがPages artifactへ含まれる場合。
- rights、license、sourceがUnknownの素材が追加された場合。`risk:rights`として停止する。
- Public routeまたはscopeを変更する要求。新しい人間のdecisionを要求する。
- 既存2 HTML以外へtranslation catalog、JavaScript、CSS、assetを分離する要求。
