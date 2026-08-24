---
applyTo: "archive/**,research/**"
description: Evidence and research records must stay citable, neutral, and single-source-insufficient.
---

# Archive と research のpath instructions

## 変えてはいけない属性

`origin_kind: synthetic_fixture`、`derivation_kind: directly_authored_fixture`、
`classification: demo-safe`を維持する。`src_sha256`とtransform execution fieldは、
再現可能なsourceと実行可能なtransformが揃うまで`null`のままにする。存在しない
入力や未実行の変換へhashやversionを割り当てない。

1998年の日付はfixture metadataである。Git履歴として再現しない。commit日時、author
日時をfixtureの年に合わせない。

## Locator

`archive/catalog/assets.yaml`の`locators`で宣言済みのものだけを引用する。未宣言の
locatorが必要な場合は、先にcatalogへ追加してから引用する。文法は
[locator-grammar.md](../../archive/catalog/locator-grammar.md)を正本とする。行番号
だけをcanonical locatorにしない。既存assetの`locator_grammar_version`は、grammarを
拡張しても書き換えない。

## 引用の射程

statementは、引用したlocatorが到達する範囲だけを述べる。CSV行key、CSV列名、C macro
を名指しする場合は、その行・列・macroのlocatorを引用する。`npm run validate:content`
が射程超過を拒否する。

## 層の分離

- Evidence packetは「どこを読むか」の索引である。結論、期待回答、Findingの本文を
  書かない。問いに、期待される答えの形や分類を先に書かない。
- Claimは単一資産の逐語的な読み取り。`does_not_establish`で射程を明示する。
- Conflictは両側のEvidence、種類、status、必要な追加証拠を保持する。自動で解消
  しない。片側を削除しない。
- Hypothesisは反証条件を必須とし、候補Evidenceを2件以上持つ。
- Findingは2つ以上の異なる資産のlocatorと、review status、method、timestampを持つ。
  推測をFindingへ昇格しない。

単一資産だけで結論に到達できる構成を作らない。完成済みのFinding、Play DNA、
Design Bet、ADRの**回答**をこのrepositoryへ追加しない。

## 捏造の禁止

架空のreviewer、承認者、poll、reaction、user、playtest participantを作らない。
`research/playtests/`のイベントはrandom session IDと列挙値・数値のみとし、氏名、
メール、自由記述、端末識別子、IPアドレスを持たない。

## 検証

変更後は`npm run validate:content`を実行し、locator解決、射程、schema、開示ガードが
通ることを確認する。
