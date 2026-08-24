# STAR RELAY 1998 — Game Bible

> English summary: A fictional 1998 one-player arcade action game about throwing
> a light Core through enemies and receiving its return without breaking a chain.

## Canon status

この文書群はPhase 1で定義した架空canonです。Archive fixtureはcanonの証拠ではなく、
canonと異なるproposalやversionを含み得ます。差はConflictとして保持します。

## Player promise

「光を投げ、軌道で敵を切り、戻る光を受け取って次の経路へつなぐ。」

## Shipped core loop

1. Core保持中は移動が遅く、A長押しで点線routeを予告する。
2. Aを離すとCoreを投げる。MirrorでBank Passできる。
3. Coreの軌道が敵を貫通し、Relay Pointへ接続する。
4. CoreがReturn Passとして戻る。
5. catch window内に受けるとPERFECT CATCH、ChainとChargeが増える。
6. Chargeが100になると短時間のOVERRAYが発生する。

## Thin proof boundary

Phase 2はMirror Corridorの30秒だけを実装する。全stage、全enemy、boss、ending、
cabinet fidelityは対象外。

関連文書:

- [World and scenario](world-and-scenario.md)
- [Gameplay system](gameplay-system.md)
- [Scoring and balance](scoring-and-balance.md)
- [Stages and enemies](stages-and-enemies.md)
- [Technical constraints](technical-constraints.md)
