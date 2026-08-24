---
applyTo: "archive/**,research/**,design/**"
---

# Evidence paths

`origin_kind: synthetic_fixture`と`classification: demo-safe`を維持する。
EvidenceはAsset IDとlocatorへ遡れること。InferenceとProposalを原資料の本文へ
書き戻さない。Conflictの両側を保持し、reviewerの実在を装う値を作らない。

Locatorはcatalogの`locators`で宣言済みのものだけを引用する。未宣言のlocatorを
使う場合は、先に`archive/catalog/assets.yaml`へ追加する。文法は
`archive/catalog/locator-grammar.md`を参照する。

Evidence packetへ結論、期待回答、Findingの本文を書かない。単一資産だけで結論に
到達できる構成を作らない。完成済みFinding、Play DNA、Design Bet、ADRの回答を
このrepositoryへ追加しない。

1998年の日付はfixture metadataである。Git履歴として再現しない。
