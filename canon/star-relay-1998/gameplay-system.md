# Gameplay system

## Coordinates and timing

- Fixed tick: 60 Hz
- Logical playfield: `12800 x 7200` integer units
- Core holder speed: 80 units/tick
- Non-holder speed: 120 units/tick
- PERFECT CATCH: return contact中にcatch inputがあること

## Core states

`held -> outbound -> banked -> returning -> held`

Core ownerは常に1人である。1998 thin proofではPlayer 1だけがownerになり、SECOND HAND
proofではhandoff accepted時だけownerを切り替える。

## Route, Chain, Charge

Aim holdが12 tick以上ならroute previewが有効になる。Bank、enemy pierce、Relay接続、
PERFECT CATCHがChain/Chargeへ寄与する。Charge 100でOVERRAY flagを立てる。

Rendererは補間にfloatを使えるが、Simulation stateへ戻さない。
