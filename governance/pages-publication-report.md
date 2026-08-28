# GitHub Pages限定公開レポート

> **日本語が正本です。** English summary: The two owner-approved HTML
> artifacts are live on GitHub Pages. The repository remains private, the
> deployment contains only the allowlisted files, and public hashes matched the
> deployment-time LF-normalized manifest. A complete Japanese/English source
> update is validated locally and pending; it has not been deployed.

- Publication ID: `PAGES-001`
- Verified at: 2026-08-27
- Repository: `shinyay/ghcp-with-gaming-ideation`
- Repository visibility: `PRIVATE`
- Main commit: `fcf6f1d54535612ac42b05fc3529f72deacff977`
- Successful workflow run: `33016148364`
- Build type: `workflow`
- HTTPS enforced: `true`

## Evidence

以下は現在のGitHub / browser運用記録であり、1998年ArchiveのEvidenceではない。

| Check | Observed |
|---|---|
| Pages API | `public: true`, `build_type: workflow` |
| Repository visibility | `PRIVATE` |
| Root route | HTTP 200 |
| Game Guide route | HTTP 200 |
| Desktop browser | 2 route、相互navigation、overflow 0、console error 0 |
| Mobile browser | 2 route、相互navigation、overflow 0、console error 0 |
| External requests | 0 |
| Workflow jobs | validate / upload / deploy success |

| Public route | Canonical LF bytes | SHA-256 |
|---|---:|---|
| `https://shinyay.github.io/ghcp-with-gaming-ideation/` | 188307 | `20efbf56515b288a1a92eba8de00ebb4d24985118bfcd1280b192c9c97ab162a` |
| `https://shinyay.github.io/ghcp-with-gaming-ideation/game-guide/` | 126199 | `1ddf8688bb51cde6928ad5d584397d8bf1c2a82af4e1a0534f5fde545f70d2c5` |

公開responseをUTF-8 / LFへ正規化したhashは
公開時点の`ops/github/pages-allowlist.json`と一致した。

## Pending bilingual source update

2026-08-28にrepository ownerは、既存2 HTML内で日本語正本と英語translationを切り替える
source更新を指示した。Workflow PresentationのRole Lens説明を含む現在sourceとGame Guideの
全表示文、Evidence / Inference / Proposal、ARIA、meta、SVG説明、動的statusをbilingual化
した。日本語がdefaultで、選択した`ja`または`en`だけを
`star-relay-pages-language-v1`へ保存する。

| State | Value |
|---|---|
| Next Workflow source LF bytes | 334871 |
| Next Workflow source SHA-256 | `9b62f83621e697d1860a246c2d98ea9925f9daf8048e761a39ff39a16499faf0` |
| Next Game Guide source LF bytes | 236878 |
| Next Game Guide source SHA-256 | `708230cc8a98407c2c24baeb8c63492ff7508023ac0b6c5e939eaa1124e3e01c` |
| Language contract | `ja` / `en`、default `ja`、同一origin内だけで選択保持 |
| Local static validation | `npm run validate:pages` success |
| Local browser validation | desktop / mobile Chromium、4 passed、external request 0 |
| `deploy-pages` workflow | `disabled_manually` |
| Public site | 上記初回deploymentのまま |

今回の依頼はsource、test、allowlist更新までである。ユーザーから別の再公開指示があるまで
workflowを有効化・実行しない。したがって現在のrepository allowlistは次回候補、上の
public response hashはlive siteの実測として区別する。

## Inference

- Inference: 2 HTML限定の公開scopeは維持されていると考えられる。確信度は高い。
  根拠はPages upload rootが`pages/`であること、allowlistが2 HTMLと`.nojekyll`だけを
  許可すること、公開時点のresponse hashがmanifestと一致したことである。
  allowlist外pathがdeployment artifactへ現れるか、hashが不一致になれば反証される。
- Inference: RepositoryをPrivateのまま維持しながら、説明用HTMLだけを公開できている。
  確信度は高い。GitHub APIまたはrepository visibilityが変更された場合に反証される。
- Inference: pending bilingual sourceは公開file数とroute数を増やさず、同じ2 HTML内だけで
  languageを切り替える構成である。確信度は高い。Pages treeへ別言語file、script、CSS、
  assetが追加された場合、またはbrowser外部requestが発生した場合に反証される。

## Proposal

- Proposal: custom domain、追加route、public Releaseは未決であり、今回の許諾scopeに
  含まれない。必要な場合は新しい人間の権利判断、NOTICE、allowlist、validationを要求する。
- Proposal: Role Lensとbilingual表示を含む更新版2 HTMLの再公開は未決である。
  `deploy-pages`を再有効化するにはユーザーの明示指示を要求する。

## Deployment note

初回runはPages siteのenablementより先に`configure-pages`へ到達して失敗した。
Repository owner tokenでPages sourceをGitHub Actionsへ設定した後、private repositoryの
configure jobに必要なjob-local `pages: write`を追加し、follow-up PRのchecksを通して
mainへmergeした。最終runは全jobが成功した。
