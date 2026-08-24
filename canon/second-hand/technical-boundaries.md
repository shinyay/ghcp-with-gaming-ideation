# Technical boundaries

> English summary: Phase 7 keeps an authoritative deterministic local
> simulation and inserts a seeded latency queue; it does not implement online
> multiplayer.

## Simulation

- 60 Hz固定tick、safe integer state、canonical serialization
- runtime乱数、時計、三角関数、暗黙のpacket順序へ依存しない
- Core ownerはtransit中もsenderのまま
- receiver acceptance時だけownerとsequenceをatomicに変更する
- latency queueは`deliverTick`とpacket sequenceで明示順序を持つ
- `p1Delay`、`p2Delay`、jitter、loss、seedをstateへ含める
- AI companionも同じnumeric input maskとlatency queueを通す

## Network boundary

Backend、matchmaking、account、cross-play、telemetry uploadは実装しない。50/100/150/
200 ms fixtureはnetwork設計そのものではなく、authoritative stateの不変条件と収束性を
検証する決定論的simulationである。

## Privacy boundary

Playtest logは128-bit random session IDとnumeric enum/integer eventだけをlocalで保持
する。自由記述、氏名、メール、device ID、IP addressを収集せず、GitHub APIを含む
外部endpointへ送信しない。

詳細は`packages/second-hand/ARCHITECTURE.md`を参照する。
