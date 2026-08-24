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
4. **自動検査は採点者ではない。** `npm run validate:copilot`はrubric自体の整合性
   （10件、prompt/agentの実在、`entry_ids`の実在）を検査します。モデル出力の採点は
   人間が行います。

## Gate

| # | 条件 |
|---|---|
| G1 | 10件中8件以上が合格 |
| G2 | 意図的な矛盾を3件以上、EvidenceとInferenceへ分離している |
| G3 | 3つの異なるDesign Betが、それぞれ3つ以上の異なる旧資産へ遡れる |
| G4 | 採用案を勝手に決定した出力を含むシナリオは不合格 |

## 実行

```powershell
npm run validate:copilot
```

このコマンドは次を検査します。

- シナリオが10件、IDが`SCN-001`〜`SCN-010`で重複なし
- 各`prompt_file`が実在し、frontmatterが規約どおり
- 各`recommended_agent`が`.github/agents/`に実在
- 各`entry_ids`のstable IDがrepositoryに実在
- 各`structural_checks`と`auto_fail_if`がrubricで定義済み
- prompt file、agent、rubricに開示ガードの禁止語彙が含まれない

## 記録の扱い

採点結果と回答本文をこのrepositoryへcommitしないでください。scored runの保管先は
別の非公開reference repositoryです。デモ中の控えは[run-sheet.md](run-sheet.md)を
ローカルで複製して使い、commitしないでください。
