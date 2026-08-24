# 変換済み旧資産アーカイブ

> **日本語が正本です。** English summary: 30 directly authored synthetic fixtures
> stand in for a fictional 1998 arcade archive. Nothing here was extracted from
> an Office original, and no fixture states a cross-asset conclusion on its own.

## 位置づけ

このdirectoryは、架空のアーケードゲーム『STAR RELAY』の旧資産が変換済みで残って
いる状態を再現します。Office/PDF原本は存在せず、変換Actionsも実行していません。
すべてのfileは`origin_kind: synthetic_fixture`かつ
`derivation_kind: directly_authored_fixture`です。

`src_sha256`、`transform_id`、`transform_version`、`transform_config_sha256`は
`null`のままです。将来の取り込み段階まで、実行していない変換のhashを作りません。

## 構成

| Directory | 内容 | 件数 |
|---|---|---|
| `derived/documents/` | 企画書、議事録、没シナリオ、仕様書、技術memo | 8 |
| `derived/spreadsheets/` | RELAY_MASTER各sheet、ロケテスト集計 | 6 |
| `derived/manuals/` | 取扱説明書、営業運営manual、インストカード | 3 |
| `derived/qa/` | バグ表と代表バグ個票 | 3 |
| `derived/art/` | アートバイブル、sprite metadata、絵コンテ metadata | 3 |
| `derived/audio/` | サウンド指示書、sound ROM配置表 | 2 |
| `derived/source/` | C89風source、symbol索引 | 4 |
| `derived/replay/` | replay event streamとexpected outcome | 1 |
| `evidence-packets/` | 横断読解の索引。結論は含まない | 7 |
| `catalog/` | asset manifest、想定原本、権利、timeline、QA索引、locator文法 | - |
| `transforms/` | 将来の変換契約とfixtureのみ | - |

## Catalog

| File | 役割 |
|---|---|
| [catalog/assets.yaml](catalog/assets.yaml) | 全DRVのmanifest。path、hash、locator、eligibility |
| [catalog/planned-originals.yaml](catalog/planned-originals.yaml) | 将来作成しうる原本slot。実在しない |
| [catalog/rights-and-ai-eligibility.yaml](catalog/rights-and-ai-eligibility.yaml) | 権利根拠とAI利用可否 |
| [catalog/timeline.json](catalog/timeline.json) | 架空のsource date。Git履歴ではない |
| [catalog/qa-index.yaml](catalog/qa-index.yaml) | バグIDから資産とlocatorへの相互参照 |
| [catalog/locator-grammar.md](catalog/locator-grammar.md) | `sr-loc/v1`と`sr-loc/v2`の定義 |

## 読み方

1. [evidence-packets/](evidence-packets/README.md)から目的のpacketを選ぶ。
2. `reading_set`のAsset IDとlocatorを順に開く。
3. 読めた内容だけをEvidenceとして記録する。
4. 導いた内容はInferenceとして分けて書き、原資料へ書き戻さない。
5. Conflictは`research/conflicts/`に残し、自動で解消しない。

単一資産だけで結論に到達できないよう構成しています。各packetは3資産以上、
2 category以上、2原本以上を要求し、`npm run validate:content`が検証します。

## 禁止事項

- 完成済みFinding、Play DNA、Design Bet、ADRの回答をこのdirectoryへ置かない。
- 1998年の日付をGit履歴として作らない。日付はmetadataとしてのみ扱う。
- 実在の企業、人物、hardware、作品、素材を参照しない。
- 氏名、連絡先、端末識別子、来場者の発言や反応を記録しない。
- 権利状態が不明な資料を追加しない。停止して`risk:rights`として扱う。

## 検証

```powershell
npm run validate:content
npm run test:node
```

検証内容は、catalogとfileの一対一対応、`derived_sha256`の一致、全locatorの解決、
研究記録がcatalog宣言済みlocatorのみを引用すること、evidence packetの横断要件、
timelineとcatalogの日付一致、開示ガードの語彙です。
