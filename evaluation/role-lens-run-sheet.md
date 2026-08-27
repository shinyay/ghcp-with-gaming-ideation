# Role Lens run sheet テンプレート

> このfileは空のテンプレートです。回答本文、実在人物の発言、記入済み採点結果を
> repositoryへcommitしないでください。

## 実行環境

| 項目 | 記入欄 |
|---|---|
| 実行日時 | |
| Surface | VS Code / GitHub.com / Copilot CLI / その他 |
| Client version | |
| Model | |
| Target ID / path | |
| Review question | |
| Allowed source paths | |
| Custom Agent selection available | yes / no |

## Scenario結果

`Agent slug`は実際に選択したCustom Agentを記録する。`Invocation`は
`picker` / `@agent` / `unsupported`のいずれか、`Tool scope`は実行前に確認した
`read, search`または`invalid`を記録する。paste-based runは`invalid`である。

| Scenario | Lens | Agent slug | Invocation | Tool scope | Auto-fail | 未達check | 判定 |
|---|---|---|---|---|---|---|---|
| RLS-001 | Game Designer | | | | | | pass / fail |
| RLS-002 | Creative Director | | | | | | pass / fail |
| RLS-003 | Producer | | | | | | pass / fail |
| RLS-004 | Project Manager | | | | | | pass / fail |
| RLS-005 | Gameplay Engineer | | | | | | pass / fail |
| RLS-006 | QA Lead | | | | | | pass / fail |
| RLS-007 | Art Director | | | | | | pass / fail |
| RLS-008 | Audio Director | | | | | | pass / fail |
| RLS-009 | UX / Accessibility | | | | | | pass / fail |
| RLS-010 | Platform / Release | | | | | | pass / fail |
| RLS-011 | Archive / Rights | | | | | | pass / fail |

## Gate集計

| Gate | 条件 | 実測 | 判定 |
|---|---|---|---|
| RL-G1 | 9件以上pass | / 11 | |
| RL-G2 | 全scenarioでcross-role questionとhuman decisionを分離 | / 11 | |
| RL-G3 | fictional colleague / approval / proxy decision 0件 | | |
| RL-G4 | Role Lens labelを維持 | / 11 | |

## Cross-role観測

- 複数Lensが共有したrisk:
- Lens間で異なったtrade-off:
- 人間teamへ返すべき問い:
- Could not assessへ残した項目:
- 実在する担当roleが判断する項目:

## 保管

- 回答本文をIssue、Discussion、Wiki、PRへ貼らない。
- Role Lensを実在reviewerや承認者として記録しない。
- `read, search` scopeを確認できないrunをpassにしない。
- 記入済みcopyはrepository外の承認済みprivate storageへ置く。
