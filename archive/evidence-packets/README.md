# Evidence packets

Evidence packetは「どこを読むか」を示す索引です。結論、期待回答、Findingの本文は
含みません。結論はこのrepositoryへ書き戻さず、人間のレビューを経てFindingへ昇格
させます。

Evidence packets are reading sets. They state the question and the locations,
never the answer. Conclusions are not stored in this demo repository.

## 構造

| Field | 内容 |
|---|---|
| `question_ja` / `question_en` | 何を判断しようとしているか |
| `sufficiency` | 常に`cross-asset`。単一資産では判断できない |
| `reading_set` | Asset IDとlocatorの組。3件以上、2資産以上 |
| `single_asset_is_insufficient` | 常に`true` |
| `falsified_if` | どの観測が出れば前提が崩れるか |
| `out_of_scope` | このpacketで扱わない事項 |

`conclusion`、`answer`、`finding`、`expected_finding`、`expected_response`の各fieldは
schemaで禁止しています。

## Packets

| ID | 主題 |
|---|---|
| EVP-001 | 画面幅と速度定数の関係 |
| EVP-002 | 2人同時プレイがtargetから外れた要因 |
| EVP-003 | Return Passが呼ぶaim処理の来歴 |
| EVP-004 | 没設定の二体規約とsystem規則の対応 |
| EVP-005 | 公開資料と内部資料の数値差の分類 |
| EVP-006 | ZERO LAPの150という数値の性質 |
| EVP-007 | RETURN音声cueが鳴らない理由 |

## 使い方

1. packetの`reading_set`を順に開く。
2. 各locatorで読めた内容をEvidenceとして書き出す。
3. Evidenceから導いた内容はInferenceとして分けて書く。
4. Conflictがあれば`research/conflicts/`へ残し、自動で解消しない。
5. 人間がレビューしたものだけをFindingへ昇格させる。

`npm run validate:content`は、全locatorが実在すること、各packetが3件以上かつ
2資産以上を要求すること、禁止fieldを持たないことを検査します。
