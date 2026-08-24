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

## Locator grammar

Locatorは`locator_grammar_version`が示す版で解釈する。定義は
[archive/catalog/locator-grammar.md](../archive/catalog/locator-grammar.md)を正本と
する。

| Version | 対応形式 |
|---|---|
| `sr-loc/v1` | `md:heading/<slug>`、`json:pointer/<pointer>` |
| `sr-loc/v2` | v1に加えて`csv:row`、`csv:column`、`c:symbol`、`c:define` |

Heading slugはASCII lower kebab-caseで固定する。JSON pointerはRFC 6901相当だが、
prefixを含める。行番号だけをcanonical locatorにしない。既存assetのversionは
grammarを拡張しても書き換えない。

`npm run validate:content`は全locatorを実際のfileに対して解決し、研究記録が
catalogで宣言済みのlocatorだけを引用していることを検査する。

## Evidence packet

Evidence packetは「どこを読むか」の索引であり、結論を含まない。`conclusion`、
`answer`、`finding`、`expected_finding`、`expected_response`の各fieldはschemaで
禁止する。

各packetは3資産以上、2 category以上、2原本以上を要求する。単一資産だけで結論に
到達できる構成を作らない。

## Claim、Conflict、Hypothesis

- **Claim** は単一資産の逐語的な読み取り。`does_not_establish`で射程を明示する。
- **Conflict** は両側のEvidence、conflict kind、status、必要な追加証拠を保持する。
  自動で解消しない。
- **Hypothesis** は反証条件を必須とする。候補Evidenceは2件以上を挙げる。

### Citation scope

主張は、引用したlocatorが到達する範囲だけを述べる。1つのlocatorが足りない場合は
複数を引用する。ClaimとConflictの各sideは`locators`配列を持つ。

`npm run validate:content`は、statementが名指しするCSV行key、CSV列名、C macroが
すべて引用済みであることを検査し、引用範囲を超えた主張を拒否する。

## Review

Findingは最低2つの異なる資産のlocator、review status、review method、review
timestampを持つ。`FND-001`は構造検証用の唯一のreviewed fixtureで、complete
finding setや期待回答ではない。推測をFindingへ昇格させない。

## Directly authored fixtures

Phase 0〜2のDRVは原本変換の成果ではなく、`derivation_kind:
directly_authored_fixture`である。Reproducible sourceとtransform executableがない間は
`src_sha256`と全transform execution fieldを`null`にする。存在しない入力や未実行の
変換へhash/versionを割り当てない。`derived_sha256`だけは実在するfixture fileの
`utf8-nfc-lf-v1` projection（Unicode NFC、LF改行）を検証する。Checkout時のCRLF/LF
差をprovenance差として扱わない。
