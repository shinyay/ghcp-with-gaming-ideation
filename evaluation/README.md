# 構造評価

> English summary: Ten fixed scenarios exercise the seven prompt files and four
> custom agents. Scoring covers structure and citation validity only. No
> expected answers, no answer keys, and no scored runs live in this repository.

## 中身

| File | 役割 |
|---|---|
| [scenario-manifest.json](scenario-manifest.json) | 固定10シナリオ。structural checkとauto-failの定義 |
| [structural-rubric.md](structural-rubric.md) | 採点基準。構造と引用の実在のみを見る |
| [run-sheet.md](run-sheet.md) | 1回の実行を控えるためのテンプレート |

Schemaは[schemas/copilot-scenario.schema.json](../schemas/copilot-scenario.schema.json)です。

## 設計方針

1. **答えを持たない。** manifestとrubricは、期待される回答文、分類名、分類数を
   一切含みません。答えの形を示す記述も禁止です。
2. **構造だけを見る。** 層分離、引用の実在、射程、Conflict保全、決定の出所、
   反証条件の有無を判定します。
3. **勝手な決定は即不合格。** 採用案を自分で決めた出力は、他がどれだけ良くても
   そのシナリオを落とします。
4. **採点は人間が行う。** モデル出力を読んで採点する自動処理はこのrepositoryに
   ありません。

## 自動検査が見るもの / 見ないもの

`npm run validate:copilot-metadata`は**設定のmetadata検査**です。prompt file、
custom agent、instructions、シナリオ、rubric、Space manifestの整合性だけを読みます。

| 検査する | 検査しない |
|---|---|
| シナリオが10件、IDが`SCN-001`〜`SCN-010`で重複なし | モデルが何と答えたか |
| 各`prompt_file`が実在し、frontmatterが規約どおり | 引用されたIDが実在したか |
| 各prompt fileのbind先と`recommended_agent`が一致 | 層が分離されていたか |
| 各`recommended_agent`が`.github/agents/`に実在 | Conflictを裁定しなかったか |
| 各`entry_ids`のstable IDがrepositoryに実在 | 勝手に採用しなかったか |
| 各`structural_checks`と`auto_fail_if`がrubricで定義済み | Betが3資産へ遡れたか |
| 文中のrepository内linkが解決する | |
| Space manifestがrepository sourceを禁止している | |
| prompt、agent、rubricに開示ガードの禁止語彙が無い | |

**CIは振る舞いのgateではありません。** 右列は人間が
[structural-rubric.md](structural-rubric.md)を使って手で採点します。採点結果と
answer keyは別の非公開reference repositoryが持ちます。

## Gate

| # | 条件 | 判定者 |
|---|---|---|
| G1 | 10件中8件以上が合格 | 人間 |
| G2 | 意図的な矛盾を3件以上、EvidenceとInferenceへ分離している | 人間 |
| G3 | 3つの異なるDesign Betが、それぞれ3つ以上の異なる旧資産へ遡れる | 人間 |
| G4 | 採用案を勝手に決定した出力を含むシナリオは不合格 | 人間 |

## 実行

```powershell
npm run validate:copilot-metadata
```

## 記録の扱い

採点結果と回答本文をこのrepositoryへcommitしないでください。scored runの保管先は
別の非公開reference repositoryです。デモ中の控えは[run-sheet.md](run-sheet.md)を
ローカルで複製して使い、commitしないでください。
