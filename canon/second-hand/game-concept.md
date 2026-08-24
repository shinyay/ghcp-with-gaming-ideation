# STAR RELAY: SECOND HAND

> English summary: SECOND HAND is an approved prototype hypothesis that makes
> receiving a Core an active local co-op role. It is not a final ADR.

## Concept

2人が同じ画面でCore保持者と受領者を交代する。保持者はrouteを選び、受領者は位置と
timingで「受け取られた」感覚を作る。受領成立時だけroleを交換し、PAIRLESSはCoreを
一方向へ送るだけでなく、相手から返してもらうことで解決する。

## Phase 7 promise

- 4つのRelay Pointでsender/receiverの差を反復する
- `DIRECT`と`SHELTER`に速度と受領難度のtrade-offを持たせる
- Local two-playerとAI companionを同じsimulationで完走可能にする
- latency下でもowner一意性とhandoff sequence単調増加を維持する
- damage outputではなくreciprocal handoffをPAIRLESSの成功条件にする

Campaign、online multiplayer、matchmaking、final canon decisionは対象外である。
