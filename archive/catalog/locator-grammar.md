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
| `csv:row/<key>` | 先頭列の値が`<key>`と一致する行 |
| `csv:column/<name>` | header行に存在する列名 |
| `c:symbol/<identifier>` | C sourceに出現する識別子 |
| `c:define/<macro>` | C sourceの`#define <macro>` |

### 解決規則

- slug化は小文字化、英数字以外のASCIIを`-`へ置換、連続`-`の圧縮、前後`-`の除去。
  非ASCII文字はslugに含めない。
- CSV fixtureの`#`始まりの行はcommentとして無視する。
- `csv:row`のkeyは前後空白を除去して完全一致で比較する。
- `c:symbol`と`c:define`は語境界付きで一致させる。

### 制約

- locatorは実在する位置だけを指す。`npm run validate:content`が全locatorを解決する。
- locatorだけでは結論にならない。EvidenceとInferenceの分離は
  [governance/evidence-policy.md](../../governance/evidence-policy.md)に従う。
- 新しい形式を追加するときはgrammar versionを上げ、既存assetを再解釈しない。
