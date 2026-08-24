# Twin Span vertical slice

Phase 2ではTwin Span全体ではなく`VS-001`のsingle-screen test chamberだけを作る。

## Controls

- Player 1: `F`で送信、`Q`で受領
- Player 2: `Enter`で送信/受領

受領可能tickにreceiver inputがある場合だけownerが変わる。移動、AI、latency menu、
combat、bossはdeferred。

## Acceptance

- ownerは全tickで`1`または`2`のどちらか1つ
- accepted handoffごとにsequenceが1増え、減少しない
- static lineageから`VS-001`と実装へ辿れる
