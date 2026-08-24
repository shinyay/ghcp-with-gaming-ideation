---
applyTo: "design/**,canon/**"
description: Design records stay proposals until a human signs an ADR; conflicts are carried forward, never silently resolved.
---

# Design と canon のpath instructions

## 採用は人間が行う

- `design/bets/`のDesign Betは**選択肢**である。Copilotが採用、推奨、順位付けを
  しない。「本命」「無難」「最有力」などの評価語を書かない。
- `design/decisions/`のADRの`Decision`欄には、人間が述べた文言だけを転記する。
  加筆・要約・言い換えをしない。
- `Status: accepted`、`Decided by`、`Decided at`を自分で埋めない。人間が署名する。
- ADRは`Reversal conditions`と、持ち越した未解決Conflictの一覧を持つ。

## 追跡可能性

- Design Betは**異なる3件以上のDRV**へ遡れること。同じ資料の再掲で件数を満たさない。
- Play DNAは**異なる2件以上のDRV**を引用し、Invariantを定数値ではなく関係で書き、
  反証条件を持つ。
- Vertical Sliceは由来ADR IDを持ち、受入条件を観測可能な形で書く。
- `design/lineage/`のnodeは実在するrepository pathを指す。切れたID参照を残さない。

すべての引用は`archive/catalog/assets.yaml`で宣言済みのlocatorを使う。存在しない
ID、存在しないlocatorを作らない。

## canon の扱い

`canon/`は世界設定と仕様の正本である。ここに書かれた内容は「1998年の資料から読み
取れた事実」ではない。Evidenceとして引用しない。canonを変更する場合は、影響する
ADRとVertical Sliceを併記する。

`canon/`と`archive/derived/`が食い違う場合、canonを正として資料を書き換えない。
`research/conflicts/`へConflictとして残す。

## 分離

Reference repository、answer key、expected output、scored runをここへ複製しない。
完成見本を`design/`へ置かない。架空のreviewer、承認者、投票結果を作らない。

## 検証

変更後は`npm run validate:content`を実行し、lineage path、locator、schemaが通ることを
確認する。
