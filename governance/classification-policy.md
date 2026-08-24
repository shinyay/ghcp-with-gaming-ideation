# 情報分類ポリシー

| Classification | Demo repository | Copilot demo | Offline package |
|---|---|---|---|
| `demo-safe` | 許可 | allowlist時のみ許可 | allowlist時のみ許可 |
| `reference-only` | 禁止 | 禁止 | 禁止 |
| `restricted/raw` | 禁止 | 禁止 | 禁止 |

`ai_eligible`、instruction、content exclusion、branch、labelはアクセス制御ではない。
Demo repositoryには`demo-safe`以外を物理的に置かない。

## Synthetic fixture rule

Phase 0〜2の全DRVは`origin_kind: synthetic_fixture`とする。架空の`source_created_at`
をGit commit dateや実在資料の作成日として扱わない。実原本から抽出したとは表現
しない。

## Playtest privacy

Eventへ保存できるのはrandom session ID、stable ID、列挙値、整数tick/sequenceだけ。
氏名、メール、自由記述、IP、位置、cookie、端末識別子を禁止する。
