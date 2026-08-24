# Phase 3 gate evidence

Captured: `2026-08-25`
Branch: `shinyay-star-relay-full-archive`
Base: `main` at `0f2991b17648e7db80e0e9ba2315f5082c4e096a`

このgate記録は構造と検査結果だけを残す。7件の発見の結論、期待回答、Findingの本文は
記載しない。結論はこのrepositoryに存在しない。

## 成果物

| 区分 | 件数 | 正本 |
|---|---|---|
| 変換済み旧資産 DRV | 30 | `archive/catalog/assets.yaml` |
| 想定原本 SRC slot | 22 | `archive/catalog/planned-originals.yaml` |
| Claim | 14 | `research/claims/` |
| Conflict | 8 | `research/conflicts/` |
| Hypothesis | 3 | `research/hypotheses/` |
| Finding | 1 | `research/findings/`（Phase 2から変更なし） |
| Evidence packet | 7 | `archive/evidence-packets/` |
| Timeline entry | 30 | `archive/catalog/timeline.json` |
| QA索引 record | 4 | `archive/catalog/qa-index.yaml` |

### 資産の内訳

| Category | 件数 | 内容 |
|---|---|---|
| `documents` | 8 | 1996企画書と付録、1997議事録とnotes、没シナリオ、最終仕様2章、技術memo |
| `spreadsheets` | 6 | RELAY_MASTER 4 sheet、ロケテストsessionと集計 |
| `manuals` | 3 | 取扱説明書、営業運営manual、インストカード |
| `qa` | 3 | バグ表、代表バグ個票2件 |
| `art` | 3 | アートバイブル、sprite metadata、絵コンテmetadata |
| `audio` | 2 | サウンド指示書、sound ROM配置表 |
| `source` | 4 | C89風source 2件、symbol索引2件 |
| `replay` | 1 | ZERO LAP event streamとexpected outcome |

## Gate

| Gate | Evidence | Result |
|---|---|---|
| 7つの発見を複数資産から再現できる | `EVP-001`〜`EVP-007`。全`reading_set` locatorが実ファイルに対して解決する | Pass |
| 単一資産だけで結論が過剰に露出しない | 各packetは3資産以上、2 category以上、2原本以上を要求。どのassetも単独では全signalを供給しない | Pass |
| 事実、推測、矛盾を分離できる | Claimは単一資産の逐語読解で`does_not_establish`必須。Conflictは両側保持で`status: open`。Hypothesisは反証条件必須 | Pass |
| 完成回答を含まない | Evidence packet schemaが`conclusion`、`answer`、`finding`、`expected_finding`、`expected_response`を禁止。Finding数はPhase 2から不変 | Pass |
| 来歴を偽装しない | 全30件が`synthetic_fixture` / `directly_authored_fixture`。`src_sha256`と全transform execution fieldは`null` | Pass |
| 1998年の日付をGit履歴にしない | `timeline.json`の`date_semantics`は`fictional-metadata-only`。commit日時は実時刻のみ | Pass |
| Thin sliceの決定性を維持する | Phase 2のreplay、handoff、lineage、offline testを変更せずに保持。Phase 6 playableのtestも変更していない | Pass |
| PIIと実在IPを含まない | 氏名、連絡先、端末識別子、来場者の発言と反応を収集しない。role表記と列挙値のみ | Pass |

## Evidence packet

| ID | 問い | 読解資産数 | Category数 | 原本数 |
|---|---|---:|---:|---:|
| EVP-001 | 旧sheet速度と実装定数の関係 | 4 | 3 | 4 |
| EVP-002 | 2人同時プレイがtargetから外れた要因の切り分け | 5 | 4 | 5 |
| EVP-003 | Return Passが呼ぶaim処理の来歴 | 4 | 2 | 4 |
| EVP-004 | 没設定の二体規約とsystem規則の対応 | 4 | 3 | 4 |
| EVP-005 | 公開資料と内部資料の数値差の分類 | 7 | 4 | 6 |
| EVP-006 | ZERO LAPの150という数値の性質 | 5 | 4 | 5 |
| EVP-007 | RETURN音声cueが鳴らない理由 | 4 | 3 | 4 |

## Locator grammar

`sr-loc/v2`を追加し、`csv:row`、`csv:column`、`c:symbol`、`c:define`を扱えるように
した。既存6件のassetは`sr-loc/v1`のまま解釈し、`derived_sha256`を変更していない。
定義は`archive/catalog/locator-grammar.md`。

## 自動検査

| Check | Result |
|---|---|
| TypeScript strict typecheck | Pass |
| Simulation forbidden-API scan | Pass |
| Content / schema / provenance / locator validation | Pass |
| Node tests | 52 pass |
| Chromium dev-server smoke | 5 pass |
| Vite production build | Pass |
| Allowlisted package + build-manifest schema | Pass |
| Packaged offline Chromium smoke | 1 pass |

Phase 6のMirror Corridor playableを取り込んだ後の統合gateも同じ結果である。
`archive/derived/spreadsheets/DRV-004-relay-master.json`に登録された速度表と
`packages/legacy-1998`の定数が一致することをtestで固定した。playableの挙動は
変更していない。

Linux Actions workflow (`validate-thin-slice`):

| Commit | 内容 | Run |
|---|---|---|
| `644d5a0806d3003a7245bc1158a73318471b60ef` | Full corpus | <https://github.com/shinyay/ghcp-with-gaming-ideation/actions/runs/32750580898> |
| `b37b21715bfb3ebedf822877b83eeae4d596eb41` | Corpus + Phase 6 playable統合後 | <https://github.com/shinyay/ghcp-with-gaming-ideation/actions/runs/32751428416> |

`npm run validate:content`が追加で検査する項目:

- catalogと`archive/derived`の一対一対応
- `derived_sha256`と`utf8-nfc-lf-v1` projectionの一致
- 全asset locatorの実解決
- Claim、Conflict、Finding、Hypothesis、Evidence packetがcatalog宣言済みlocatorのみを引用
- Evidence packetの横断要件と禁止field
- timelineとcatalogの日付一致
- QA索引のbug IDがtracker CSVに実在
- 開示ガード語彙の不在

## 意図的に据え置いた範囲

Office原本、変換pipeline本体、GitHub collaboration surfaceの拡張、完全Wiki、
全Project view、完成Archive Explorer、AI相棒、PAIRLESS、答え、期待回答、
reference成果物はこのPhaseの対象外である。
