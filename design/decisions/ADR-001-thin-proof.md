# ADR-001 — Prove active receiving with two minimal simulations

- Status: Accepted for Phase 2 only
- Owner role: Repository owner
- Evidence: `FND-001`
- Design Bet: `BET-002`

## Decision

1998 core loopを30秒固定replayで、SECOND HANDを1画面local 2P handoffで実装する。
両方が同じcanonical integer serializerを使い、Lineage UIから`VS-001`へ接続する。

## Consequences

Thin gateを先に検証できる。一方、完全corpus、AI、latency、boss、full playablesは
明示的にdeferされる。
