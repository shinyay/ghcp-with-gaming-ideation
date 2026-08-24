---
applyTo: "packages/**,apps/**,tests/**"
description: Playable code stays deterministic, integer-only in simulation, and never changes game meaning without an ADR.
---

# Playable path instructions

## ADRが先

rule、balance、勝敗条件、操作の意味を変える前に、受理済みADRが必要である。ADRが
無い変更は、リファクタリング、テスト追加、バグ修正に限る。ADRのIDをPRに書く。

「バグ修正」としてバランスを変えない。既存replay fixtureのcheckpoint hashが変わる
変更は、意味の変更として扱う。

## 決定論

- Simulationは60 Hz固定tickで更新する。
- Simulation stateは固定スケールのsafe integerだけで表す。
- Simulation層で`Math.random`、`Date`、`performance.now`、runtimeの`sin`、`cos`、
  `tan`、`atan2`、`pow`、`exp`、`log`を使わない。方向と反射角はcommit済みの整数
  lookup tableを使う。
- 距離判定は二乗距離で行い、runtime平方根を要求しない。
- 乱数が必要な場合は固定seedの明示的PRNGを使い、stateへseedとsequenceを含める。
- Map/Set/objectの暗黙の反復順に依存せず、stable IDによる明示順で処理する。
- Rendererとaudio層のfloatをSimulation stateへ戻さない。
- canonical serializationはfield順、integer width、array順を固定し、pointer、
  cache、render stateをhash対象へ含めない。

`npm run check:sim-apis`が禁止APIの静的検査を行う。検査を回避するためのalias、
動的参照、コメントによる抑制を書かない。

## Browser境界

BrowserコードからGitHub APIを呼ばない。GitHub tokenやcredentialをbrowserへ渡さない。
Lineage表示は静的データのみを使い、実行時にネットワークへ出ない。

## Playtestログ

列挙値と数値、random session IDだけを記録する。氏名、メール、自由記述、端末識別子、
IPアドレスを収集しない。schemaを緩めて自由記述fieldを追加しない。

## 検証

```powershell
npm run typecheck
npm run check:sim-apis
npm run test:node
npm run test:browser
```

replayに触れた場合は、Node.jsとChromiumの両方でcheckpoint hashが一致することを
確認する。hashが変わった場合は、意図した変更かをADRとPR本文で説明する。
