# STAR RELAY Archive-to-Playable

[日本語（正本）](README.md) | [English](README.en.md)

> **日本語が正本です。** English summary: This private demo repository traces
> thirty internally authored fixtures for a fictional 1998 arcade game through
> evidence, reviewed interpretation, human decisions, and two deterministic
> Canvas 2D proofs. It contains no real historical material, answer key, or
> expected response. The repository remains private; the only public content is
> the owner-approved `pages/index.html` and `pages/game-guide/index.html`.

## このリポジトリについて

『STAR RELAY』は、1998年に稼働したという設定の**架空の**アーケードゲームです。この
repositoryは、異種のarchive fixtureをGitHubで管理し、証拠・解釈・提案・人間の判断・
実装をstable IDで接続するデモ兼教材です。

```text
Archive -> Understand -> Imagine -> Decide -> Plan -> Build -> Learn
```

現在の実装範囲はPhase 0〜8です。変換済み旧資産、research record、design/canon、
GitHub collaboration surface、Copilot prompt/agent、2つのplayable、Museum、Archive /
Creative Lineage Explorer、offline package、private draft Release、限定GitHub Pagesを
含みます。

このrepositoryは次のものではありません。

- 実在作品・企業・人物・hardwareの歴史archive
- Office/PDF原本を実際に変換したcorpus
- answer key、expected response、scored runの保管場所
- 完全な復刻版またはproduction game
- repository全体を公開・再配布するためのlicense

## 最短で試す

source demoの前提は[Node.js 22以上](package.json)です。`npm test`とcomplete gateには
PowerShell 7の`pwsh`とPlaywright Chromiumも必要です。live GitHub reconciliationには
別途GitHub CLIと適切な認証が必要ですが、local/offline demoには不要です。

sourceから5つのviewを起動するだけなら次を実行します。

```powershell
npm ci
npm run dev
```

`http://127.0.0.1:4173`を開きます。GitHubへのsign-in、GitHub token、GitHub APIは
不要です。

testを実行するcheckoutでは、初回だけChromiumも用意します。

```powershell
npx playwright install chromium
npm test
```

### Offline packageとして試す

```powershell
npm run build
npm run package:offline
npm run serve:offline
```

同じ`http://127.0.0.1:4173`で、allowlistから生成した
`dist/offline-demo-pack/`を配信します。外部network requestを必要とせず、security
header付きのlocal serverで動作します。20分の順路は
[self-guided demo](demo/self-guided-demo.md)を参照してください。

### 5-stop path

| Stop | View | 観測するもの |
|---:|---|---|
| 1 | Museum (`#museum`) | 架空archive、層の分離、offline/private境界 |
| 2 | Archive Explorer (`#archive`) | 30 DRVのID、path、media、宣言済みlocator |
| 3 | Creative Lineage (`#lineage`) | Evidenceから既存record、decision、deliveryまでの接続 |
| 4 | Legacy / Mirror Corridor (`#legacy`) | 30秒のfixed replayと手動操作 |
| 5 | SECOND HAND / Twin Span (`#second-hand`) | local 2P、AI companion、latency fixture、handoff state |

### Playableの操作

| View | 既定操作 | 補助機能 |
|---|---|---|
| Mirror Corridor | 矢印キーで移動、`A`長押しでroute、離して投射、Return中に`A`で受領。Gamepadは左stick/D-pad + A | Attract/manual切替、restart、CRT、low-flash |
| SECOND HAND P1 | `W`/`S`移動、`A` DIRECT、`D` SHELTER、`F`送信/受領 | key remap、caption、reduced flash、catch assist |
| SECOND HAND P2 | 矢印上下で移動、矢印左右でroute、`Enter`送信/受領 | Local 2P / 1P + AI切替、delay/jitter/loss/seed設定 |

SECOND HANDのplaytest eventはbrowser memoryにだけ保持し、明示操作時にJSONをlocal
downloadします。random session ID以外はnumeric enumと整数だけで、氏名、メール、
自由記述、IP address、device ID、telemetry uploadを含みません。

## 現在のinventory

| 種別 | 現在の内容 |
|---|---:|
| Synthetic DRV | 30件、8 category、全件`demo-safe` / `ai_eligible: true` |
| Claim | 14件 |
| 未解決Conflict | 8件 |
| Hypothesis | 3件 |
| Human-reviewed Finding | 1件 |
| Evidence packet | 7件、各packetは3資産以上の横断読解 |
| Playable | 2件 |
| Core prompt / custom agent | 7 prompt / 4 agent |
| Role Lens prompt / agent | 11 prompt / 11 read-only agent |
| Evaluation scenario | workflow 10件 / Role Lens 11件 |

件数はrepositoryの構造を示すinventoryであり、回答数や期待される分類数ではありません。
Archiveの読み方は[archive README](archive/README.md)と
[Evidence packet README](archive/evidence-packets/README.md)を参照してください。

## 情報を混ぜないためのモデル

### 層の分離

| 層 | 内容 | Copilotができること | 人間に残すこと |
|---|---|---|---|
| Evidence | allowlisted DRVに明記された内容 | stable IDと宣言済みlocatorで逐語的に整理 | source/rightsの確認 |
| Inference | 複数Evidenceから導く説明 | 確信度、不足証拠、反証条件を明示 | reviewしてFindingへ昇格 |
| Proposal | 将来の選択肢 | 異なるDesign Betを根拠付きで作る | 選択、順位付け、採用 |
| Decision | scopeを固定する人間の判断 | 選択後のADR skeletonを補助 | Decision文、受理、署名 |

Evidenceは次の形を使います。IDもlocatorも
[`archive/catalog/assets.yaml`](archive/catalog/assets.yaml)に存在するものだけを指定
します。

```text
- Evidence: <locatorが到達する範囲の逐語的な読み取り> (`DRV-0xx` / `<declared-locator>`)
```

Conflictは片側を削除せず、両側、想定kind、status、解消に必要な追加証拠を残します。
InferenceをFindingへ自動昇格せず、未選択のDesign Betを採用せず、ADRのDecisionを
Copilotが埋めません。詳細は
[evidence policy](governance/evidence-policy.md)、
[decision policy](governance/decision-policy.md)、
[Copilot boundaries](governance/copilot-boundaries.md)を参照してください。

### Stable IDとCreative Lineage

GitHub Issue番号、Discussion番号、Project item ID、commit SHAはidentityではなく
resolverです。domain recordは`DRV`、`CLM`、`CFL`、`HYP`、`FND`、`PDN`、`BET`、
`ADR`、`VS`、`BLD`、`PT`などのstable IDで接続します。

現在のthin lineageは次の1本です。

```text
DRV -> CFL / FND -> PDN -> BET -> ADR -> VS -> ISSUE -> PLAYABLE
```

実体は[`design/lineage/LINEAGE-001.json`](design/lineage/LINEAGE-001.json)、browser用の
allowlisted projectionは
[`demo/offline-snapshots/lineage-snapshot.json`](demo/offline-snapshots/lineage-snapshot.json)
です。Creative Lineage Explorerは静的snapshotだけを読み、browserからGitHub APIを
呼びません。

### Decision scope

[`ADR-001`](design/decisions/ADR-001-thin-proof.md)はPhase 2限定で、1998 core loopの
30秒fixed replayとSECOND HANDの1画面local 2P handoffを受理しています。
[`VS-001`](design/vertical-slices/VS-001-thin-proof.md)がその観測可能な受入条件です。

現在のUIには、後続のAI companion modeとlatency fixtureも実装されています。一方、
`ADR-001`と`VS-001`のscopeはPhase 2限定のままです。このREADMEは両方の現在recordを
残し、後続surfaceを`ADR-001`のDecision拡張とは扱いません。rule、balance、勝敗条件、
操作の意味を今後変更する場合は、別の受理済みADRが先に必要です。

## Source of truth

| 情報 | 正本 | 補助表示・projection |
|---|---|---|
| Derived fixture | [`archive/derived/`](archive/README.md) | Archive Explorer |
| Provenance、rights、eligibility、locator | [`archive/catalog/assets.yaml`](archive/catalog/assets.yaml) | offline Archive snapshot |
| Claim、Conflict、Finding、Hypothesis | [`research/`](research) | Issue、Project、Lineage UI |
| World/specification canon | [`canon/`](canon) | playable説明 |
| Play DNA、Bet、ADR、Vertical Slice | [`design/`](design) | Discussion、Project、Lineage UI |
| Simulation | [`packages/`](packages) | Canvas 2D renderer |
| Static lineage | [`packages/lineage-model/`](packages/lineage-model) | Creative Lineage Explorer |
| GitHub desired state | [`ops/github/desired-state.yaml`](ops/github/desired-state.yaml) | live object / offline resolver |
| Wiki source | [`ops/github/wiki/`](ops/github/wiki) | GitHub Wiki output |
| Package inventory | [`ops/packaging/`](ops/packaging) | generated manifest / ZIP |
| Pages rightsとpath scope | [`governance/pages-publication-policy.md`](governance/pages-publication-policy.md) | public 2 HTML |

Wiki、Project、Issue、Discussionへ正本本文を複製しません。会話はDiscussion、作業と
acceptanceはIssue、状態はProject、判断はADR、navigationはWiki sourceという役割分担
です。詳細は
[information architecture](governance/information-architecture.md)を参照してください。

## Repository map

| Path | 役割 |
|---|---|
| [`.github/`](.github/copilot-instructions.md) | repository/path instructions、18 prompt、15 agent、3 Actions workflow |
| [`archive/`](archive/README.md) | 30 directly-authored fixture、catalog、locator grammar、Evidence packet |
| [`research/`](research) | Claim、未解決Conflict、Hypothesis、人間review済みFinding、enum-only playtest fixture |
| [`design/`](design) | Play DNA、Design Bet、ADR、Vertical Slice、lineage record |
| [`canon/`](canon) | STAR RELAY 1998とSECOND HANDの既存human-authored canon |
| [`apps/demo-site/`](apps/demo-site) | Vite + Canvas 2Dの5-stop private/offline demo |
| [`packages/`](packages) | deterministic simulation、canonical state、static lineage model |
| [`demo/`](demo/runbook.md) | runbook、workshop、fixture、offline snapshot、reset/checkpoint資料 |
| [`evaluation/`](evaluation/README.md) | answer-free structural rubricとscenario manifest |
| [`governance/`](governance/information-architecture.md) | classification、evidence、decision、privacy、rights、publication policy |
| [`ops/`](ops/github/desired-state.yaml) | GitHub desired state、reconciliation script、allowlist、Wiki、package設定 |
| [`schemas/`](schemas) | JSON Schemaによるrecord/package contract |
| [`scripts/`](scripts) | validator、snapshot生成、build/package、release検証、local server |
| [`tests/`](tests) | content、simulation、GitHub surface、packaging、browser/offline regression |
| [`pages/`](pages/index.html) | owner-approvedのbilingual self-contained public HTML 2件と空の`.nojekyll`だけ |

## Phase 0〜8の入口

| Phase | Repository上の主な関心 | 入口 |
|---:|---|---|
| 0 | capability probe、classification、guardrail | [Phase 0–2 gate](demo/phase-2-gate.md)、[capability report](ops/github/capability-report.md) |
| 1 | canon、stable ID、information architecture | [information architecture](governance/information-architecture.md)、[canon](canon) |
| 2 | thin lineage、ADR、2つのdeterministic proof | [ADR-001](design/decisions/ADR-001-thin-proof.md)、[VS-001](design/vertical-slices/VS-001-thin-proof.md) |
| 3 | 30 DRV corpus、locator v2、7 Evidence packet | [Phase 3 gate](demo/phase-3-gate.md)、[archive](archive/README.md) |
| 4 | Issue / Discussion / Project / Wikiのlive/fallback surface | [desired state](ops/github/desired-state.yaml)、[manual fallbacks](ops/github/manual-fallbacks.md) |
| 5 | Copilot instructions、prompt、agent、answer-free evaluation | [Phase 5 gate](demo/phase-5-gate.md)、[evaluation](evaluation/README.md) |
| 6 | Legacy Mirror Corridor playable | [`packages/legacy-1998`](packages/legacy-1998)、[`legacy-view.ts`](apps/demo-site/src/legacy-view.ts) |
| 7 | SECOND HAND Twin Span、latency、privacy-safe event | [architecture note](packages/second-hand/ARCHITECTURE.md)、[`packages/second-hand`](packages/second-hand) |
| 8 | Museum、offline path、deterministic Release packaging | [runbook](demo/runbook.md)、[final audit](governance/final-audit-report.md) |

Phase番号はrepositoryの実装・gateの整理です。1998年の日付はfixture metadataであり、
Git履歴ではありません。

## Application architecture

rootのnpm workspacesは`apps/*`と`packages/*`です。

```text
@star-relay/game-core
  ├─> @star-relay/legacy-1998 ─┐
  └─> @star-relay/second-hand ─┼─> @star-relay/demo-site
@star-relay/lineage-model ─────┘
             ^
      committed snapshots
```

| Workspace | 責務 |
|---|---|
| [`@star-relay/game-core`](packages/game-core/src/index.ts) | 60 Hz定数、safe-integer canonical serializer、FNV-1a hash、明示的xorshift32 PRNG |
| [`@star-relay/legacy-1998`](packages/legacy-1998/src/index.ts) | 1800 tickのfixed replay、manual simulation、route prediction、checkpoint/final hash |
| [`@star-relay/second-hand`](packages/second-hand/src/index.ts) | atomic handoff、local/AI input、seeded delay/jitter/loss queue、invariant、numeric playtest log |
| [`@star-relay/lineage-model`](packages/lineage-model/src/index.ts) | commit済みlineage snapshotの型とreference validation |
| [`@star-relay/demo-site`](apps/demo-site/src/main.ts) | Museum、Archive、Lineage、2 playableのDOM/Canvas表示とtest bridge |

### Determinismとbrowser boundary

- Simulationは60 Hz固定tickで更新し、stateはsafe integerだけを使います。
- Canonical serializationはfield順とarray順を固定し、renderer/cacheをhashへ含めません。
- Simulation層では`Math.random`、時刻API、runtime三角関数などの禁止APIを使いません。
- 同tick packetとout-of-order packetは明示sequenceで処理します。
- Renderer/input/audio側のfloatやbrowser時刻をsimulation stateへ戻しません。
- Browser codeはGitHub API、GitHub token、CDN、telemetryを必要としません。

静的検査は`npm run check:sim-apis`、Node/Chromium間のreplay整合は
`npm run test:node`と`npm run test:browser`で確認します。詳細な規則は
[playable instructions](.github/instructions/playable.instructions.md)を参照してください。

## Archiveからresearchまで

[`archive/catalog/assets.yaml`](archive/catalog/assets.yaml)は全DRVのpath、hash、
classification、eligibility、locatorを登録します。30件は次の8 categoryです。

| Category | 件数 | 例 |
|---|---:|---|
| Documents | 8 | 企画、議事録、仕様、技術memo |
| Spreadsheets | 6 | master table、stage/enemy、location test |
| Manuals | 3 | player/operator guide、instruction card |
| QA | 3 | bug tracker、代表bug record |
| Art | 3 | art bible、sprite/storyboard metadata |
| Audio | 2 | sound direction、ROM map |
| Source | 4 | C89風projection、symbol index |
| Replay | 1 | deterministic event stream |

推奨する読み方は次のとおりです。

1. [Evidence packet](archive/evidence-packets/README.md)から問いとreading setを選ぶ。
2. 各DRVをcatalog宣言済みlocatorで読む。
3. 逐語的な内容をEvidence、導いた説明をInferenceへ分ける。
4. 不一致は[`research/conflicts/`](research/conflicts)へ両側とも残す。
5. 人間がreviewしたものだけをFindingへ昇格する。

`origin_kind: synthetic_fixture`と
`derivation_kind: directly_authored_fixture`は、原本変換を実行していないことを示します。
存在しない原本や未実行transformにhash/versionを作りません。

## Copilot experience

### Core workflow

| Stage | Prompt | Agent | 境界 |
|---|---|---|---|
| Understand | `01-reconstruct-shipped-game` / `02-find-conflicts` | `archive-curator` | read/searchのみ。Conflictを解消しない |
| Imagine | `03-extract-play-dna` / `04-create-design-bets` | `design-facilitator` | 選択肢を作るが採用しない |
| Decide | `05-draft-decision` | `design-facilitator` | 人間が選んだ後のskeletonだけ |
| Plan | `06-plan-slice` | `slice-planner` | 厳密に`accepted`のADRだけを計画へ変換 |
| Learn | `07-synthesize-playtest` | `slice-planner` | eventをLearning候補にするがFindingへ昇格しない |
| Audit | agentを明示選択 | `provenance-auditor` | citation、rights、lineageをread-only監査 |

4つのcore agentのうち`archive-curator`と`provenance-auditor`はread-onlyです。
`design-facilitator`と`slice-planner`だけが限定的な`edit`を持ち、どのagentにも
`execute`はありません。18 prompt fileはtool scopeを持たず、bind先agentのscopeを
使います。全agentはexplicit selectionを要求します。

### Cross-functional Role Lens

11個の`*-lens` agentは、人物や同僚を演じず、専門職の分析観点だけを適用します。
Game Design / Creative、Production / Project、Gameplay / QA、Art / Audio / UX、
Platform / Archive Rightsを対象とし、すべて`read`と`search`だけです。承認、team
consensus、Bet選択、ADR受理、Conflict裁定、Finding昇格、file変更は行いません。

共通contractは
[role-lens contract](governance/role-lens-contract.md)、手順は
[Role Lens workshop](demo/role-lens-workshop.md)です。fileとmetadataの存在はruntime
behaviorやhuman scoreの実施を証明しません。現在の実測範囲は
[capability report](ops/github/capability-report.md)を参照してください。

### EvaluationとCopilot Space

[evaluation](evaluation/README.md)は、固定10 workflow scenarioと固定11 Role Lens
scenarioを持ちます。自動validatorはbinding、link、stable ID、禁止fieldなどのmetadataを
検査しますが、モデルの回答本文を読みません。構造・引用・human decision gateの採点は
人間が行い、回答本文とscored runはこのrepositoryへcommitしません。

Copilot Spaceは作成済みではありません。API automationが確認できないため、
[`copilot-space-manifest.yaml`](ops/github/copilot-space-manifest.yaml)と
[手動手順](ops/github/copilot-space-setup.md)が正本です。Spaceへrepository全体を
sourceとして追加せず、manifestのfile/folder allowlistだけを個別に使います。

## Commands

### 開発と個別検証

| Command | 内容 |
|---|---|
| `npm run dev` | Vite source serverを`127.0.0.1:4173`で起動 |
| `npm run typecheck` | TypeScriptをemitなしで検査 |
| `npm run check:sim-apis` | simulation sourceの禁止APIを静的検査 |
| `npm run validate:content` | catalog/hash/locator/schema/research citation/disclosure guardを検査 |
| `npm run generate:demo-snapshots` | allowlistからdemo snapshotを再生成 |
| `npm run validate:demo-snapshots` | commit済みsnapshotが生成結果と一致するか検査 |
| `npm run validate:copilot-metadata` | prompt/agent/instruction/scenario/Space metadataを検査 |
| `npm run validate:pages` | Pages tree、hash、CSP、link、外部依存、rights scopeを検査 |
| `npm run test:github-powershell` | GitHub reconciliation scriptのregression |

### Test

| Command | 内容 |
|---|---|
| `npm run test:node` | content、lineage、GitHub surface、simulation、privacy、package contract |
| `npm run test:browser` | source demoのPlaywright操作・accessibility・network regression |
| `npm run test:pages` | Pages 2 routeの日本語/English toggle、選択保持、ARIA/meta、responsive、外部request 0 |
| `npm run test:offline-source` | source版offline serverの継続性とsecurity header |
| `npm run test:offline` | 展開済みoffline Release packageの5 view、hash、外部request 0 |
| `npm test` | simulation/content/snapshot/Copilot/PowerShell/Node/browser/Pagesの通常suite |

`npm test`は`typecheck`、Release packaging、2つのoffline suiteを含みません。それらを
含むcomplete local gateは`npm run gate:phase8`です。

`test:offline-source`を単独実行する場合は先に`build`と`package:offline`、
`test:offline`を単独実行する場合は先に`package:release`が必要です。
`gate:phase8`はこのartifact生成順を含みます。

### Build、package、reset

| Command | 内容 |
|---|---|
| `npm run build` | Vite outputを`dist/demo-site/`へ生成 |
| `npm run package:offline` | explicit allowlistから`dist/offline-demo-pack/`とmanifest/checksumを生成 |
| `npm run serve:offline` | source checkoutのoffline packageをport 4173で配信 |
| `npm run package:release` | 4つのdeterministic ZIP、build manifest、`SHA256SUMS`を生成 |
| `npm run verify:release` | Release artifactのinventory、size、hash、entrypointを検証 |
| `npm run prepare:offline-release` | generated Release ZIPをsmoke用に展開 |
| `npm run serve:offline-release` | 展開したoffline packageを配信 |
| `npm run verify:release-tag` | annotated `vX.Y.Z-demo-reference` tagを検証 |
| `npm run gate:phase8` | typecheckからoffline smokeまでのcomplete gate |
| `npm run demo:reset` | local generated packageを再構築・検証。GitHub objectやtagは変更しない |
| `npm run serve:pages` | allowlisted Pages sourceを`127.0.0.1:4174`でpreview |

`package:release`と、それを含む`gate:phase8`および`demo:reset`は
**cleanでcommit済みのtree**を要求します。README編集中のdirty treeでRelease gateを
回避するためにallowlistやscriptを変更しないでください。

## GitHub workflowsとcollaboration surface

| Workflow | Trigger | 実行内容 |
|---|---|---|
| `validate-playable-slices` | `main` / `shinyay-*` push、pull request | install、typecheck、通常test、Release package/verify、offline smoke |
| `package-private-release` | manual `workflow_dispatch` + 既存annotated tag | Phase 8 gate、temporary artifact、repository-access-controlled draft Release |
| `deploy-pages` | allowlisted pathの`main` pushまたはmanual | Pages validation、artifact upload、2 route deployment |

[`ops/github/desired-state.yaml`](ops/github/desired-state.yaml)はIssue、Discussion、Project、
Wiki、snapshot、Release、Pagesのdesired stateです。PowerShell scriptは
create-missing / preserve-existingを基本とし、破壊的resetには明示確認を要求します。
Browserはlive GitHub objectを直接読まず、
[`demo/offline-snapshots/`](demo/offline-snapshots)のallowlisted resolverを使用します。

GitHub UI/APIで確認できたことと、repositoryに設定fileが存在するだけのことを区別します。
Wiki first pageやCopilot Spaceなど未作成のsurfaceは、repository内fallbackを使います。
実測は[capability report](ops/github/capability-report.md)、運用手順は
[manual fallbacks](ops/github/manual-fallbacks.md)を参照してください。

## Offline packageとprivate Release

[`ops/packaging/allowlist.json`](ops/packaging/allowlist.json)がoffline packへ入るsourceを
明示します。Symlink、target escape、forbidden tokenを拒否し、各fileのSHA-256とbytesを
`build-manifest.json`、`SHA256SUMS`へ記録します。

[`release-allowlist.json`](ops/packaging/release-allowlist.json)は次の4 artifactだけを
作ります。

| Artifact | Start anchor | 用途 |
|---|---|---|
| `demo-site.zip` | `#museum` | 5-stop site全体 |
| `star-relay-1998-playable.zip` | `#legacy` | Legacyへの直接入口 |
| `second-hand-vertical-slice.zip` | `#second-hand` | SECOND HANDへの直接入口 |
| `offline-demo-pack.zip` | `#museum` | snapshot、runbook、local serverを含むoffline pack |

workflowは既存のannotated `vX.Y.Z-demo-reference` tagだけを受け取り、Private repositoryの
access controlを継承する**draft Release**へ6 asset（4 ZIP、manifest、checksums）を
添付します。GitHub PagesへRelease packageを公開しません。可変のrun、commit、hashは
[final audit report](governance/final-audit-report.md)を参照してください。

## GitHub Pagesの限定公開境界

Repository visibilityは**privateのまま維持**します。Public displayとして許諾される
contentは次の2 HTMLだけです。

| Public route | Repository path | 内容 |
|---|---|---|
| <https://shinyay.github.io/ghcp-with-gaming-ideation/> | `pages/index.html` | Archive-to-Playable Workflow Presentation |
| <https://shinyay.github.io/ghcp-with-gaming-ideation/game-guide/> | `pages/game-guide/index.html` | STAR RELAY Field & Archive Guide |

両HTMLは日本語を既定とし、utility barの「日本語 | English」で全表示文、Evidence /
Inference / Proposal、ARIA、meta、SVG説明、動的statusを切り替えます。選択した`ja`または
`en`だけをbrowserのlocal storageへ保存し、reloadと2 route間で共有します。英語表示は
日本語正本のtranslationであり、DRV IDとlocatorは変えません。

`pages/.nojekyll`はGitHub Pagesの処理設定に必要な空fileであり、公開contentを追加する
ものではありません。`pages/`へ他のfileやrouteを追加しません。

両HTMLはself-containedで、GitHub API、token、CDN、外部asset、telemetryへ依存せず、
外部requestを禁止するCSPを持ちます。Archive、research、design、canon、source、
snapshot、package、Issue/Discussion/Project dataはPagesへ含めません。

Pages source、live deployment、後続の未公開source更新を同一視しないでください。現在の
公開状態、deployment時点のhash、pending sourceは
[Pages publication report](governance/pages-publication-report.md)、権利と停止条件は
[Pages publication policy](governance/pages-publication-policy.md)と
[NOTICE](NOTICE.md)が正本です。公開pathやscopeの変更には、新しい人間の権利判断が
必要です。

## Workshop、runbook、評価の入口

| 目的 | 文書 |
|---|---|
| 20分で5-stop demoを一人で辿る | [Self-guided demo](demo/self-guided-demo.md) |
| 60分のpresenter進行 | [Phase 8 runbook](demo/runbook.md)、[cue sheet](demo/60-minute-cue-sheet.md) |
| 70分でArchiveから未決のDesign Betとslice planningを体験 | [Self-guided workshop](demo/self-guided-workshop.md) |
| 複数の専門職観点を比較し、人間へ質問を返す | [Role Lens workshop](demo/role-lens-workshop.md) |
| network/Copilot failure時の代替 | [Fallback matrix](demo/fallback-matrix.md) |
| answer-free scenarioとhuman rubric | [Evaluation README](evaluation/README.md) |
| 実装・content・packageの過去時点監査 | [Final audit report](governance/final-audit-report.md) |

## Contributionと停止条件

変更前に[CONTRIBUTING](CONTRIBUTING.md)と対象pathの
`.github/instructions/`を確認してください。

- feature branchとpull requestを使い、`main`へ直接作業しない。
- Demo repositoryへ`demo-safe`以外を追加しない。
- Evidenceにはexisting DRV IDとdeclared locatorを付ける。
- Conflictを自動解消せず、InferenceをFindingへ昇格しない。
- 人間が選んでいないDesign Betを採用せず、ADRを代理受理しない。
- Playable meaningを変える前に、scopeを満たす受理済みADRを用意する。
- Playtest eventへPII、自由記述、端末識別子、network送信を追加しない。
- Packageとsnapshotはexplicit allowlist以外を含めない。
- 権利、license、sourceが不明なら作業を止め、`risk:rights`として報告する。
- Reference repository、answer key、expected output、scored runを検索・取得・引用・作成
  しない。

Classificationのsecurity boundaryは
[classification policy](governance/classification-policy.md)とrepository分離です。
`ai_eligible`、instructions、branch、labelはアクセス制御ではありません。

English guide: [README.en.md](README.en.md)
