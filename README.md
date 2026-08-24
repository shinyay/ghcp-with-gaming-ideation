# STAR RELAY Archive-to-Playable

> **日本語が正本です。** English summary: This private demo repository follows
> synthetic evidence trails from a fictional 1998 arcade game archive to two
> deliberately small Canvas 2D proofs. Thirty directly authored fixtures and
> seven cross-asset reading sets require you to combine sources; no single
> fixture carries a conclusion. It contains no answer keys, no expected
> responses, and no real historical material.

## このリポジトリについて

『STAR RELAY』は、1998年に稼働したという設定の**架空の**アーケードゲームです。
このリポジトリは、異種資料をGitHubで管理し、証拠・解釈・意思決定・実装をstable
IDで接続するデモです。現在の実装範囲はPhase 0〜8で、変換済み旧資産、GitHub /
Copilot surface、2つのplayable、Museum、Archive / Lineage Explorer、再現可能な
private Release packagingまでを含みます。

```text
Archive -> Understand -> Imagine -> Decide -> Plan -> Build -> Learn
```

### いま試せるもの

- 30件の`synthetic_fixture` DRV（文書、表、manual、QA、アート、音響、source、replay）
- 14件のClaim、8件の未解決Conflict、3件のHypothesis
- 7件のEvidence packet。各packetは3資産以上の横断読解を要求します
- 1件の人間レビュー済みFindingから`VS-001`までのCreative Lineage
- 60 Hz・整数state・固定replayで動く30秒の1998 core-loop proof
- 1画面・ローカル2人のCore handoff proof
- GitHub APIを呼ばないMuseum、Archive Explorer、Creative Lineage Explorer
- `Museum -> Archive -> Lineage -> Legacy -> SECOND HAND`のoffline path
- `demo-site.zip`、両playable zip、offline pack、manifest、SHA256SUMS
- 4つのcustom agentと7つのprompt fileを使う70分の
  [self-guided workshop](demo/self-guided-workshop.md)
- [60分runbook](demo/runbook.md)と[20分self-guided demo](demo/self-guided-demo.md)
- 構造と引用だけを見る[固定10シナリオの評価](evaluation/README.md)

Archiveの読み方は[archive/README.md](archive/README.md)と
[archive/evidence-packets/README.md](archive/evidence-packets/README.md)を参照して
ください。

## クイックスタート

前提はNode.js 22以上です。

```powershell
npm ci
npm run typecheck
npm test
npm run build
npm run package:offline
npm run package:release
npm run verify:release
npm run serve:offline
```

`http://127.0.0.1:4173`を開きます。実行中のbrowser codeはGitHub tokenやGitHub
APIを必要としません。

Phase 8の全gateは`npm run gate:phase8`です。Release workflowは既存のannotated
`vX.Y.Z-demo-reference` tagだけを受け取り、Private repositoryのdraft Releaseへ
allowlisted assetを添付します。Pages publicationは行いません。

## 情報の境界

- このrepositoryに置けるのは`demo-safe`かつ架空・自作の資料だけです。
- すべての初期fixtureは`origin_kind: synthetic_fixture`です。
- 正解、期待回答、完全な成果物は別のPrivate reference repositoryが所有します。
- `ai_eligible`、Copilot instructions、branch、labelはアクセス制御ではありません。
- Pagesは公開しません。ローカル実行とprivate repository内のartifactを使います。

詳細は[情報アーキテクチャ](governance/information-architecture.md)、
[証拠ポリシー](governance/evidence-policy.md)、
[Copilotの境界](governance/copilot-boundaries.md)、
[Capability report](ops/github/capability-report.md)を参照してください。

English guide: [README.en.md](README.en.md)
