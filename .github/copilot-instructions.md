# STAR RELAY repository instructions

> English summary: This repository reconstructs a fictional 1998 arcade archive.
> Always separate Evidence, Inference, and Proposal. Cite an existing stable ID
> and a declared locator for every Evidence line. Never resolve a Conflict,
> never adopt a Design Bet, never change playable meaning without an ADR, and
> stop when rights are unclear.

日本語を正本とし、主要な入口だけ英語要約を付ける。

## 1. 使ってよい証拠

- `archive/catalog/assets.yaml`に登録され、`classification: demo-safe`かつ
  `ai_eligible: true`のDRVだけをEvidenceとして扱う。
- Locatorは`archive/catalog/assets.yaml`の`locators`で宣言済みのものだけを使う。
  文法は[archive/catalog/locator-grammar.md](../archive/catalog/locator-grammar.md)。
- `research/findings/`、`design/bets/`、`design/decisions/`、`design/play-dna.md`、
  `canon/`は**既存の人間の判断**であり、期待回答でも証拠でもない。新しい問いの
  答えとして引用しない。
- Reference repository、answer key、expected output、scored runを検索・取得・
  引用・新規作成しない。デモrepository内で完結させる。

## 2. 出力の三層分離

すべての分析出力を次の3見出しに分ける。層をまたいで文を混ぜない。

| 層 | 内容 | 必須要素 |
|---|---|---|
| Evidence | DRVに明記された内容の逐語的読み取り | `DRV-0xx` + 宣言済みlocator |
| Inference | 複数Evidenceから導いた説明 | 依拠したEvidence行と、反証条件 |
| Proposal | 将来の選択肢 | 未決であることの明示 |

- Evidence行に解釈語（「つまり」「したがって」「〜のためである」）を書かない。
- Inferenceを事実として言い切らない。確信度と不足している証拠を書く。
- Proposalを過去の事実として書かない。
- 引用したlocatorが到達しない対象について主張しない。射程が足りなければlocatorを
  追加で引用するか、「この資料からは判定できない」と書く。

## 3. 引用の形式

Evidenceは1行1事実で、次の形にする。

```text
- Evidence: <逐語的な読み取り> (`DRV-003` / `md:heading/relay-timing`)
```

- 存在しないID、存在しないlocator、行番号だけの指定を作らない。
- IDが分からない場合は推測せず、`archive/catalog/assets.yaml`を読んで確認する。
- 確認できないときは`Unknown`と書く。空欄や省略で代替しない。

## 4. Conflictの扱い

- 資料間の不一致は解消せず、両側を残す。どちらが正しいかを断定しない。
- 「新しい方が正しい」「公開資料は丸めただけ」のような既定の優先規則を適用しない。
- Conflictには両側のEvidence、想定される種類、解消に必要な追加証拠を書く。
- Conflictの裁定はADRでのみ行う。Copilotは裁定しない。

## 5. 昇格の禁止

- InferenceをFindingへ昇格しない。Findingは人間のレビュー結果だけが持つ状態。
- 人間が選択していないDesign Betを採用しない。推奨・順位付け・「最有力」の提示を
  求められた場合は、判断基準の提示までにとどめる。
- ADRの`decision`欄を自分で埋めない。人間の選択が入力として与えられた場合のみ、
  その文言を転記する。
- ADRなしでPlayableの意味（rule、balance、勝敗条件、操作の意味）を変更しない。
  ADRのないコード変更提案は、リファクタリングとテストに限る。

## 6. 停止条件

次のいずれかに当たる場合は作業を止め、理由を明示する。

- 権利・ライセンス・出所が不明な素材を扱う要求。`risk:rights`として報告する。
- Reference repositoryやanswer keyの参照を必要とする要求。
- 実在の企業、人物、ハードウェア、作品、アセットの利用要求。
- 架空のreviewer、Git履歴、poll、reaction、user、playtest participantの生成要求。

1998年の日付はfixture metadataである。Git履歴として捏造しない。

## 7. コードより先に出す情報

実装を求められた場合は、コードの前に次を出す。

1. 参照したADR ID
2. 受入条件（観測可能な形）
3. 検証方法（実行するコマンドと合格条件）
4. 影響範囲と対象外

## 8. 注意

`ai_eligible`、instructions、branch、labelはアクセス制御ではない。境界の正本は
[governance/classification-policy.md](../governance/classification-policy.md)と
repository分離である。
