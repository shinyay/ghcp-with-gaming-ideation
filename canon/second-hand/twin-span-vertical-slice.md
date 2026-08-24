# Twin Span vertical slice

> English summary: `VS-001` is a 5–10 minute deterministic Canvas 2D
> implementation hypothesis. Four relay handoffs teach sender/receiver role
> exchange before PAIRLESS requires an outbound pass and a reciprocal return.

## 位置づけ

これはPhase 7で承認された実装仮説であり、最終ADRやDesign Betの回答ではない。
実network backendを作らず、local two-playerと1人＋AI相棒で受領の能動性を検証する。

## Evidence

この文書は新しいEvidenceを追加しない。原資料の事実、推論、ConflictをPlayable仕様へ
書き戻さない。

## Inference

新しいFindingや正典上の結論へ昇格する推論はない。Playtest eventから得るLearningは
別途human reviewを経る。

## Proposal / approved implementation hypothesis

1. P1がCoreを保持して開始する。
2. senderが`DIRECT`または`SHELTER`を選び、Coreを送信する。
3. receiverが対応spanへ移動し、catch windowで受領する。
4. 受領成立時だけCore ownerとsender/receiver roleをatomicに交換する。
5. 4つのRelay Pointを接続するとPAIRLESSが現れる。
6. PAIRLESSは往路handoffだけでは解決せず、制限内のreciprocal returnで完了する。

`DIRECT`は40 tickで到達する代わりに受領域が狭い。`SHELTER`は56 tickかかるが
受領域とcatch windowが広い。damage outputは勝利条件に含めない。

## Modes and controls

- Local two-player: P1とP2を同じkeyboardで操作する
- AI companion: humanはP1、決定論的AIはP2を担当する
- 上下移動、2 route、送信/受領をすべてUIからremapできる
- Catch assist、captions、reduced flashを初期状態で有効にする

## Acceptance

- 全tickでCore ownerは`1`または`2`の一人だけ
- accepted handoffごとにsequenceが1増え、減少しない
- 4 Relay Point後も、PAIRLESSの往復が完了するまでmission completeにならない
- AI相棒でも同じ6 handoff sequenceで完走できる
- 50/100/150/200 ms fixtureがそれぞれの最大受領tick以内に収束する
