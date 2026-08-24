# Locator grammar

Evidenceは必ずAsset IDとlocatorの組で参照する。locatorはasset recordの
`locator_grammar_version`が示す版で解釈する。

Evidence must always be cited as an Asset ID plus a locator. A locator is
interpreted under the version recorded in `locator_grammar_version`.

## sr-loc/v1

Phase 2 thin sliceで使用した最小文法。Markdown headingとJSON Pointerのみを扱う。

| Form | 意味 |
|---|---|
| `md:heading/<slug>` | Markdown見出しをkebab-case slug化したもの |
| `json:pointer/<pointer>` | RFC 6901 JSON Pointer。先頭の`/`を含める |

## sr-loc/v2

Phase 3 full corpus用。v1の2形式に加えて次を扱う。v1のlocatorはv2でも同じ意味で
解決できるが、既存assetのversionは書き換えない。

| Form | 意味 |
|---|---|
| `csv:row/<key>` | 先頭列の値が`<key>`と一致する行。その行の全列を含む |
| `csv:column/<name>` | header行の列名と、その列が全data行に持つ値 |
| `c:symbol/<identifier>` | C sourceに出現する識別子 |
| `c:define/<macro>` | C sourceの`#define <macro>` |

### 解決規則

- slug化は小文字化、英数字以外のASCIIを`-`へ置換、連続`-`の圧縮、前後`-`の除去。
  非ASCII文字はslugに含めない。
- CSV fixtureの`#`始まりの行はcommentとして無視する。
- `csv:row`のkeyは前後空白を除去して完全一致で比較する。
- `csv:column`はdata行が1件以上ある場合にのみ解決する。header名だけが存在して
  data行がない場合は解決しない。
- `c:symbol`と`c:define`は語境界付きで一致させる。

### Target validation

locatorのtargetは解決前に形式検査する。`c:symbol`と`c:define`のtargetは正規表現へ
渡るため、C識別子`[A-Za-z_][A-Za-z0-9_]*`だけを許可し、さらにescapeしてから使う。
`.*`のようなmetacharacterを含むtargetは、schemaと実行時の双方で拒否する。

| Scheme | 許可するtarget |
|---|---|
| `md:heading` | ASCII lower kebab-case slug |
| `json:pointer` | 空文字、または`/`で始まるRFC 6901 pointer |
| `csv:row` / `csv:column` | 空白とcommaを含まない非空文字列 |
| `c:symbol` / `c:define` | C識別子 |

### Citation scope

主張は、引用したlocatorが到達する範囲だけを述べる。1つのlocatorで足りない場合は
複数を引用する。ClaimとConflictの各sideは`locators`配列で複数引用できる。

`npm run validate:content`は、statementが名指しするCSV行key、CSV列名、C macroが
すべて引用済みであることを検査する。例えば`csv:row/EN-05`だけを引用して`EN-06`に
ついても述べることはできない。

### 制約

- locatorは実在する位置だけを指す。`npm run validate:content`が全locatorを解決する。
- locatorだけでは結論にならない。EvidenceとInferenceの分離は
  [governance/evidence-policy.md](../../governance/evidence-policy.md)に従う。
- 新しい形式を追加するときはgrammar versionを上げ、既存assetを再解釈しない。
