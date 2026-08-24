---
id: DRV-011
origin_kind: synthetic_fixture
classification: demo-safe
fictional_source_created_at: 1997-11-14
---

# Hardware and ROM budget memo

この文書は架空の技術memo fixtureである。数値は架空の基板前提であり、実在の
hardwareを指さない。

## Display change

- 旧前提: 有効表示幅384px
- 新前提: 有効表示幅320px
- 変更理由: monitor調達先の変更とoverscan確保
- 指示: 「表示幅が変わっても、光が画面を横切るのに要する時間は変えないこと」

換算率、係数、具体的な速度値はこのmemoに記載しない。数値の対応はdata table側と
実装側を突き合わせて確認すること。

## Field layout impact

- 320px前提では左右分割配置に必要なmarginを確保できない。
- 分割表示を前提とした画面設計は再検討が必要になる。
- 再検討の結論は本memoの範囲外。

## ROM budget

| Region | Capacity | Note |
|---|---|---|
| Program ROM | 4 Mbit | 変更なし |
| Character ROM | 8 Mbit | 変更なし |
| Sound ROM | 2 Mbit | 増設不可 |

- Sound ROMは基板の実装枠が埋まっており、追加は不可。
- 最終allocationでは、音声系の追加分が容量上限に収まらない見込み。
- どのcueを落とすかは音響側の判断に委ねる。本memoでは特定しない。

## Fixed point convention

- 座標と速度は固定小数で保持する。1px = 16 unitとする。
- 実装値はsource側の定数を正とする。
