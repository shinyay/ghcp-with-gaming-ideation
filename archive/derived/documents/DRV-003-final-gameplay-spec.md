---
id: DRV-003
origin_kind: synthetic_fixture
classification: demo-safe
fictional_source_created_at: 1998-06-12
---

# Final gameplay specification excerpt

この文書は架空の出荷仕様projectionで、Phase 2に必要な項目だけを含む。

## Core loop

PlayerはCore保持中にAを長押ししてrouteを予告し、releaseで投げる。CoreはMirrorで
反射し、敵を貫通してRelay Pointへ接続した後、Playerへ戻る。

## Catch and chain

戻るCoreと接触中にcatch inputがあればPERFECT CATCHとする。Enemy pierce、Relay
connect、PERFECT CATCHでChainが増える。内部counterの上限は32と記載されている。

## Simulation frame

Gameplay updateは60回/秒。fixture projectionでは座標、速度、tick、score、Chain、
Chargeを整数として扱う。
