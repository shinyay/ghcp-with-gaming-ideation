# ADR-DEMO-001 — Twin Spanのplaytest logをローカルへ書き出すCLIを追加する

> **これは訓練用fixtureです。** repositoryの実際の意思決定ではありません。
> `Status: accepted`はfixture dataであり、実在の承認を表しません。ゲーム設計の
> 決定でも、1998年版資料に関する主張でも、何かの問いに対する答えでもありません。
> 実ADRは`design/decisions/`にあります。詳細は[README.md](README.md)。

- Status: accepted
- Fixture: true
- Decided by: fixture data — 実在の承認者ではない
- Decided at: fixture data — 実在の日付ではない
- Scope: `06-plan-slice`の訓練入力に限る
- Design Bet: なし（ゲーム設計の賭けではない）
- Evidence: なし（Archiveの資料に依拠しない）

## Context

Twin Span sliceは、匿名・列挙値のみのplaytest eventをメモリ上に持つ。現在は実行中の
browser上でしか観測できず、複数回のlocal playtestを並べて比較する手段がない。

これはtoolingの不足であり、ゲームのrule、balance、勝敗条件、操作の意味とは無関係
である。

## Considered options

1. 何もしない。browserのdev toolsで都度読む。
2. 実行終了時に、既存のevent配列を既存のschemaのままJSON fileへ書き出すCLIを
   追加する。
3. 収集用のbackendを立てる。

## Decision

選択肢2を採る。既存のevent配列を、既存のschemaのまま、ローカルのJSON fileへ書き
出すCLIを追加する。event schemaもsimulationも変更しない。

## Consequences

### 得るもの

- 複数回のlocal playtestを、同じ形式で並べて比較できる
- `07-synthesize-playtest`の入力を手で用意せずに済む

### 失うもの

- 保守対象のCLIが1つ増える

### 影響を受けない範囲

Simulation、replay checkpoint hash、event schema、既存のtestは変更しない。決定論
方針（60 Hz固定tick、整数state、runtime乱数・時計・三角関数の禁止）に触れない。

## Reversal conditions

- 書き出したlogが列挙値以外を含むようになった場合
- CLIの存在がsimulationの決定論に影響した場合
- 実際にはlogを比較しない運用が定着した場合

## Open conflicts carried forward

なし。この決定はArchiveのConflictに触れない。

## この記録の使い方

`06-plan-slice`へこのIDを渡すと、Epic、Sub-issue、受入条件、検証方法が得られます。
出力は訓練用の練習であり、実装を承認するものではありません。
