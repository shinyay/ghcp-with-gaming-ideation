# SECOND HAND architecture note

> English summary: A 60 Hz integer-only authoritative simulation owns gameplay,
> while Canvas rendering, remappable input, captions, and local event export stay
> outside simulation state. Seeded latency fixtures exercise the same input path
> without an online backend.

## 位置づけ

このノートは`VS-001`の承認済み実装仮説を説明する。最終ADR、Design Betの回答、
Evidenceの再解釈ではない。

## Evidence

このノートは新しいEvidenceを主張しない。したがってEvidence citationは追加しない。

## Inference

自動testとplaytest eventをFindingへ昇格しない。解釈が必要な結果はhuman reviewへ
渡す。

## Proposal / implemented architecture

```text
remappable keyboard / deterministic AI
  -> numeric input mask
  -> seeded delay + jitter + loss queue
  -> authoritative 60 Hz integer step
  -> canonical state hash
  -> Canvas 2D + captions
  -> local numeric playtest event log
```

Simulation stateはsafe integerだけで構成する。packetは`deliverTick`、`sequence`、
`player`、`mask`を持ち、明示順で処理する。Coreはtransit中もsenderが所有し、
receiverの位置、catch input、ready/expiry tickが同時に成立したtickだけownerを
変更する。delayは安全側へ切り上げ、jitterは最寄りの60 Hz tickへ量子化する。
同じtickへ届くsnapshotはplayerごとの最新sequenceだけを採用し、遅れて届いた古い
snapshotは破棄する。

AI companionは特別な成功APIを使わない。P2のroute選択、上下移動、送信/受領を
numeric input maskとして生成し、人間と同じlatency queueへ投入する。

## Latency fixtures

| Delay | Jitter | Loss | Seed | Max receive |
|---:|---:|---:|---:|---:|
| 50 ms | 0 ms | 0‰ | 50050 | 64 tick |
| 100 ms | 17 ms | 10‰ | 100100 | 68 tick |
| 150 ms | 33 ms | 25‰ | 150150 | 72 tick |
| 200 ms | 50 ms | 50‰ | 200200 | 76 tick |

各fixtureは4 Relay PointとPAIRLESS往復の合計6 handoffを実行し、owner一意性、
sequence単調増加、fixture固有の最大受領tick、seed再現性を検査する。

## Playtest event contract

Top-level fieldは`schemaVersion`、128-bit random hex `sessionId`、`events`だけ。
各eventは次の整数fieldだけを持つ。

| Field | Meaning |
|---|---|
| `sequence` | session内の単調増加event番号 |
| `tick` | authoritative simulation tick |
| `code` | event kindのnumeric enum |
| `actor` | `0` system、`1` P1、`2` P2 |
| `value` | route、count、duration、設定値 |

Eventはbrowser memoryに保持し、明示操作時だけJSONをlocal downloadする。自由記述、
PII、device ID、IP address、GitHub API call、telemetry uploadは実装しない。
