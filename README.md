# STAR RELAY Archive-to-Playable

> **日本語が正本です。** English summary: This private demo repository follows one
> synthetic evidence trail from a fictional 1998 arcade game archive to two
> deliberately small Canvas 2D proofs. It contains no answer keys or real
> historical material.

## このリポジトリについて

『STAR RELAY』は、1998年に稼働したという設定の**架空の**アーケードゲームです。
このリポジトリは、異種資料をGitHubで管理し、証拠・解釈・意思決定・実装をstable
IDで接続するデモの開始点です。現在の実装範囲はPhase 0〜2のthin vertical proofに
限定されています。

```text
Archive -> Understand -> Imagine -> Decide -> Plan -> Build -> Learn
```

### いま試せるもの

- 6件の`synthetic_fixture` DRVと、2件の未解決Conflict
- 1件の人間レビュー済みFindingから`VS-001`までのCreative Lineage
- 60 Hz・整数state・固定replayで動く30秒の1998 core-loop proof
- 1画面・ローカル2人のCore handoff proof
- GitHub APIを呼ばない静的Lineage表示とoffline package

## クイックスタート

前提はNode.js 22以上です。

```powershell
npm ci
npm run typecheck
npm test
npm run build
npm run package:offline
npm run serve:offline
```

`http://127.0.0.1:4173`を開きます。実行中のbrowser codeはGitHub tokenやGitHub
APIを必要としません。

## 情報の境界

- このrepositoryに置けるのは`demo-safe`かつ架空・自作の資料だけです。
- すべての初期fixtureは`origin_kind: synthetic_fixture`です。
- 正解、期待回答、完全な成果物は別のPrivate reference repositoryが所有します。
- `ai_eligible`、Copilot instructions、branch、labelはアクセス制御ではありません。
- Pagesは公開しません。ローカル実行とprivate repository内のartifactを使います。

詳細は[情報アーキテクチャ](governance/information-architecture.md)、
[証拠ポリシー](governance/evidence-policy.md)、
[Capability report](ops/github/capability-report.md)を参照してください。

English guide: [README.en.md](README.en.md)
