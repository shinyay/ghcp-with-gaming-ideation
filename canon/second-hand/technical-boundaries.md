# Technical boundaries

Phase 2はlocal deterministic simulationであり、network modelではない。

- Backend、matchmaking、account、telemetry uploadなし
- Core ownerはtransit中もsenderのまま
- receiver acceptance時だけatomicにownerを変更
- sequenceをcanonical stateへ含める
- Playtest eventはschemaで列挙値と整数だけに制限

50/100/150/200 ms latency、jitter、loss、AI companionはPhase 7対象であり実装しない。
