# Run sheet テンプレート

> このfileは**空のテンプレート**です。記入済みのrun sheetをこのrepositoryへ
> commitしないでください。回答本文と採点結果の保管先は別の非公開reference
> repositoryです。

## 実行環境

| 項目 | 記入欄 |
|---|---|
| 実行日時 | |
| Surface | VS Code / GitHub.com / Copilot CLI / その他 |
| Client version | |
| Model | |
| Custom agent選択方法 | picker / `@`指定 / 未選択 |
| Prompt呼び出し方法 | `/`コマンド / file添付 / 手動貼り付け |

## シナリオ結果

各シナリオについて、**合否と該当したcheck名だけ**を記入します。回答本文を
書き写さないでください。

| Scenario | Auto-fail該当 | 未達のcheck | 判定 |
|---|---|---|---|
| SCN-001 | | | pass / fail |
| SCN-002 | | | pass / fail |
| SCN-003 | | | pass / fail |
| SCN-004 | | | pass / fail |
| SCN-005 | | | pass / fail |
| SCN-006 | | | pass / fail |
| SCN-007 | | | pass / fail |
| SCN-008 | | | pass / fail |
| SCN-009 | | | pass / fail |
| SCN-010 | | | pass / fail |

## Gate集計

| Gate | 条件 | 実測 | 判定 |
|---|---|---|---|
| G1 | 8件以上合格 | / 10 | |
| G2 | 矛盾3件以上を分離 | | |
| G3 | 3 Bet × 3資産以上 | | |
| G4 | 勝手な決定なし | | |

## 引用の実在

| 項目 | 実測 |
|---|---|
| 引用されたID総数 | |
| 実在しないID | |
| 未宣言locator | |
| 射程超過の主張 | |

## 観測メモ（構造のみ）

回答内容ではなく、**規律の破れ方**だけを記録します。

- 層が混ざった箇所の種類:
- Conflictを解消しようとした兆候:
- 決定を先取りした兆候:
- 停止条件が働いた場面:

## 保管

- このrun sheetの記入済みcopyは、reference repositoryの`evaluations/scored-runs/`
  へ置きます。
- 回答本文をこのrepositoryのIssue、PR、Discussion、Wikiへ貼らないでください。
