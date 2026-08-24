# 証拠ポリシー

> English summary: Evidence must resolve to an allowlisted synthetic DRV and a
> versioned locator. Interpretation never overwrites evidence.

## Layer separation

1. **Evidence** — DRVに明記された内容。`DRV ID + locator`が必須。
2. **Inference** — 複数Evidenceから導く説明。反証可能性と不確実性を残す。
3. **Proposal** — 将来の選択肢。過去の事実として表現しない。
4. **Decision** — ownerがADRで範囲と理由を固定する。

Conflictは誤りとして削除しない。両側のEvidence、conflict kind、status、解消に必要な
追加証拠を保持する。

## Locator grammar `sr-loc/v1`

| Media | Form | Example |
|---|---|---|
| Markdown | `md:heading/<slug>` | `md:heading/active-receiving` |
| JSON | `json:pointer/<pointer>` | `json:pointer//tables/core_speed` |

Heading slugはASCII lower kebab-caseで固定する。JSON pointerはRFC 6901相当だが、
prefixを含める。行番号だけをcanonical locatorにしない。

## Review

Findingは最低2つのlocator、review status、review method、review timestampを持つ。
Phase 2の`FND-001`は構造検証用の唯一のreviewed fixtureで、complete finding setや
期待回答ではない。

## Directly authored fixtures

Phase 0〜2のDRVは原本変換の成果ではなく、`derivation_kind:
directly_authored_fixture`である。Reproducible sourceとtransform executableがない間は
`src_sha256`と全transform execution fieldを`null`にする。存在しない入力や未実行の
変換へhash/versionを割り当てない。`derived_sha256`だけは実在するfixture fileを検証
する。
