# 最終引継ぎチェックリスト

> **日本語が正本です。** English summary: Automated checks are complete, but
> every unchecked item below requires real human or GitHub evidence. Do not mark
> Wiki, Space, recordings, external usability, Copilot scoring, or the draft
> Release as published/final without that evidence.

正本の監査結果は[最終監査報告](final-audit-report.md)を参照する。checkを付けるときは、
実在するURL、run sheet、commit、workflow run、file hashのいずれかを併記する。
reviewer、participant、recording、reaction、approvalを作らない。

## Evidence

- Evidence: Coreを投げる側だけでなく、受ける側も移動とtimingを選ぶ。 (`DRV-001` / `md:heading/active-receiving`)
- Evidence: CoreはMirrorで反射し、敵を貫通してRelay Pointへ接続した後、Playerへ戻る。 (`DRV-003` / `md:heading/core-loop`)

## Inference

- Inference: 上のEvidence 2行はArchiveからplayableへ進むデモ導線の入口として使用できる。
  確信度は中。出荷版のplayer構成や新しいDesign Betの採否はこの2行から判定できず、
  それらを示す追加Evidenceまたは人間のdecisionがあれば限定・反証される。
- Inference: 自動gateの合格だけでは人間の理解、Copilot response品質、live GitHub
  surfaceの操作性を保証できない。確信度は高い。manual acceptanceの実測が不足しており、
  以下の実在記録が揃った場合にのみFinal Completionへ更新できる。

## Proposal

以下は未決のhandoff作業である。`[ ]`は未実施または証跡不足を意味する。

### 自動baseline

- [x] `cc789032dfe8b209baf06ec247fb42b1bbf74b8d`で
  `npm run gate:phase8`終了コード0
- [x] Node 110、browser 11、source offline server 1、展開済みoffline pack 1がpass
- [x] 30/30 assetが`demo-safe`、`synthetic_fixture`、AI/package eligible
- [x] playtest fixtureが追加field禁止schemaに適合し、禁止privacy key 0
- [x] local Release artifact 4件のsizeとSHA-256を検証
- [x] checkpoint 4件がannotated tagでmanifestと一致
- [x] repositoryはPrivate、Pages endpointは404
- [x] canary guard prefixのpackage match 0、Issue match 0、Discussion match 0
- [x] annotated tag `v0.1.0-demo-reference`が監査済みソフトウェア基準commit
  `d3ae5d58fcf484dce8a7b93102311bd0c4655d54`を指す
- [x] release workflow run `32784690666`が成功
- [x] repository-access-controlled draft Releaseにmanifest、checksums、4 ZIPの
  計6 assetが存在
- [x] draft Release作成後もrepositoryはPrivate、Pages endpointは404

### Manual acceptance

- [ ] 初見外部参加者5名以上でArchiveからFindingまでを実施し、4名以上が5分以内に
  完了した実測run sheetを保存する。
- [ ] 初見外部参加者5名以上で1998 playableを実施し、4名以上が本質4点中3点以上を
  説明できた実測run sheetを保存する。
- [ ] 初見外部参加者5名以上でSECOND HANDを実施し、4名以上が5〜10分で完走して
  保持者と受領者の役割差を説明できた実測run sheetを保存する。
- [ ] 固定10 Copilot scenarioを実行し、client、model、実行日、許可sourceを記録する。
- [ ] 10 scenarioを人間が構造rubricで採点し、8件以上合格、Conflict分離3件以上、
  無断decision 0件を確認する。回答本文とscored runはdemo repositoryへcommitしない。
- [ ] prompt fileと4 custom agentを使用予定clientで再確認する。未対応surfaceでは
  `demo/self-guided-workshop.md`のpaste fallbackを受け入れるか記録する。
- [ ] owner bypassを含む現在のno-ruleset運用を人間が承認するか、rulesetを設定して
  recovery pathを実機確認する。

### GitHub surface

- [ ] Wikiを使用する場合、Web UIでfirst pageを実在作成し、
  `ops/github/publish-wiki.ps1`後の全source hash一致を記録する。
- [ ] Wikiを作成しない場合、`ops/github/wiki/` fallbackを使用する判断を記録する。
- [ ] Copilot Spaceを使用する場合、`ops/github/copilot-space-setup.md`に従い、
  10件のfile/folder sourceを個別追加してsource inventoryを保存する。
- [ ] Spaceへrepository source、excluded tree、reference repositoryが無いことを
  人間が確認する。
- [ ] Spaceを作成しない場合、`manual_only` / `space_created: false`とlocal fallbackを
  維持する判断を記録する。

### Recording・release

- [ ] recorded fallbackが必要な場合だけ、実在recordingのrights review、filename、
  duration、capture date、SHA-256、approval referenceを記録する。
- [ ] recordingを用意しない場合、`not-recorded`表示とstatic fallbackを維持する。
- [x] Repository ownerが`pages/index.html`と`pages/game-guide/index.html`に限る
  GitHub Pages公開展示を許諾し、`NOTICE.md`と
  `governance/pages-publication-policy.md`へscopeを記録した。
- [x] 対象commitを確認し、annotated `v0.1.0-demo-reference` tagを作成した。
- [x] `package-private-release`をmanual dispatchし、同じtag、successful run、
  private draft Release、manifest、checksum、4 ZIPを確認した。
- [x] draft Release作成後にrepository visibilityがPrivate、Pagesが未公開であることを
  再確認した。
- [ ] manual acceptanceとhuman sign-off後に、draft Releaseを公開するかdraftのまま
  維持するかを決定する。

### Pages限定公開

- [ ] `npm run validate:pages`がallowlist、hash、CSP、link、禁止contentを検証する。
- [ ] Repository visibilityがPrivateのまま、Pages sourceをGitHub Actionsへ設定する。
- [ ] `deploy-pages` workflowが成功し、rootと`/game-guide/`がHTTP 200を返す。
- [ ] Public browser smokeで外部request 0、same-origin相互navigationを確認する。
- [ ] `gh api repos/shinyay/ghcp-with-gaming-ideation/pages`のbuild typeとURLを記録する。

### Deferred Phase

- [ ] Office/Cowork原本の作成方針とrightsを人間が決定する。
- [ ] 実原本を作成した場合だけsource checksumを登録する。
- [ ] Office/PDF/image extraction Actionsを実装する。
- [ ] transform version/config hashとsemantic diff gateを実装する。
- [ ] golden corpusとの差分を人間がreviewする。

### Human sign-off

次の値は実施者が実測後に記入する。現時点ではすべて`Unknown`である。

| Field | Value |
|---|---|
| Reviewer | `Unknown` |
| Reviewed at | `Unknown` |
| Manual acceptance result | `Unknown` |
| Copilot scored-run reference | `Unknown` |
| Usability run-sheet reference | `Unknown` |
| Wiki decision/evidence | `Unknown` |
| Space decision/evidence | `Unknown` |
| Recording decision/evidence | `Unknown` |
| Release decision/evidence | `Unknown` |
