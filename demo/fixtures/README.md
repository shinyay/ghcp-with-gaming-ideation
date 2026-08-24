# 訓練用fixture

> English summary: Synthetic, clearly labelled training fixtures. These are not
> repository decisions, not archive evidence, and not answers to any ideation
> question. They exist so a planning exercise can run reproducibly.

このdirectoryのfileは**訓練用のfixture**です。次のいずれでもありません。

- `design/decisions/`の実際の意思決定記録
- `archive/derived/`の1998年版資料
- `research/`のClaim、Conflict、Finding
- 何かの問いに対する答え、期待回答、完成見本

## なぜ必要か

`06-plan-slice`は`Status: accepted`のADRを要求します。これは仕様どおりで、緩めては
いけません。一方で次の2つを同時に満たす必要があります。

1. **workshopが止まらない。** 工程5.5でADRを受理**しない**のは正しい結果です。
   その場合でも工程6〜8を体験できる必要があります。
2. **評価が再現する。** `SCN-009`は固定10シナリオの1つです。採点者が、事前に
   workshopを完走しなくても同じ条件で実行できなければなりません。

`ADR-001`はこの用途に使えません。`Status: Accepted for Phase 2 only`はscope限定を
status欄へ書き込んだ形であり、`accepted`と厳密一致しません。**これを`accepted`と
みなす実装にしないでください。** 一致しないことを利用して、`06-plan-slice`が
正しく停止することを確認できます（workshop工程6の「わざと試すこと」）。

## 中身

| File | 用途 |
|---|---|
| [ADR-DEMO-001-playtest-log-export.md](ADR-DEMO-001-playtest-log-export.md) | `06-plan-slice`のfallback入力。tooling決定であり、ゲーム設計の決定ではない |

## 規則

- fixtureの`Status: accepted`は**fixture data**です。実在の承認を表しません。
  `Decided by`に実在の人物名を書かないでください。
- ゲームのrule、balance、勝敗条件、操作の意味を変える内容を、ここへ書かないで
  ください。それは`design/decisions/`の実ADRが扱います。
- 1998年版の資料に関する主張を書かないでください。ここはArchiveではありません。
- Copilot Spaceのsourceへ追加しないでください。ADRの形をしているため、実際の
  意思決定と混同されます。
