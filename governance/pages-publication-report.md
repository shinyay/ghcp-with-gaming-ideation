# GitHub Pages限定公開レポート

> **日本語が正本です。** English summary: The two owner-approved HTML
> artifacts are live on GitHub Pages. The repository remains private, the
> deployment contains only the allowlisted files, and public hashes matched the
> deployment-time LF-normalized manifest. A later Role Lens source update is
> pending locally and has not been deployed.

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

## Pending source update

2026-08-27にWorkflow PresentationへCross-functional Role Lens説明を追加し、
`pages/index.html`の次回公開候補hashを更新した。

| State | Value |
|---|---|
| Next source LF bytes | 199692 |
| Next source SHA-256 | `5a9706eab25b70350348b6e9d2d7fe9d0850aeb9b6f985c7d2619704b435718d` |
| `deploy-pages` workflow | `disabled_manually` |
| Public site | 上記初回deploymentのまま |

ユーザーから再公開指示があるまでworkflowを有効化・実行しない。したがって現在の
repository allowlistは次回候補、上のpublic response hashはlive siteの実測として
区別する。

## Inference

- Inference: 2 HTML限定の公開scopeは維持されていると考えられる。確信度は高い。
  根拠はPages upload rootが`pages/`であること、allowlistが2 HTMLと`.nojekyll`だけを
  許可すること、公開時点のresponse hashがmanifestと一致したことである。
  allowlist外pathがdeployment artifactへ現れるか、hashが不一致になれば反証される。
- Inference: RepositoryをPrivateのまま維持しながら、説明用HTMLだけを公開できている。
  確信度は高い。GitHub APIまたはrepository visibilityが変更された場合に反証される。

## Proposal

- Proposal: custom domain、追加route、public Releaseは未決であり、今回の許諾scopeに
  含まれない。必要な場合は新しい人間の権利判断、NOTICE、allowlist、validationを要求する。
- Proposal: Role Lensを含む更新版Workflow Presentationの再公開は未決である。
  `deploy-pages`を再有効化するにはユーザーの明示指示を要求する。

## Deployment note

初回runはPages siteのenablementより先に`configure-pages`へ到達して失敗した。
Repository owner tokenでPages sourceをGitHub Actionsへ設定した後、private repositoryの
configure jobに必要なjob-local `pages: write`を追加し、follow-up PRのchecksを通して
mainへmergeした。最終runは全jobが成功した。
