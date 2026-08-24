# Speaker notes — Phase 8 private demo

> English summary: Presenter notes for the 60-minute Museum-to-Playable path.
> The notes distinguish source evidence, existing human interpretation, and
> unselected proposals. They do not contain expected participant answers.

## Opening

「これは実在作品の復元ではなく、すべて架空・自作のfixtureを使うprivate demoです。
日付はfixture metadataであり、Git履歴を1998年に偽装していません。」

画面で`OFFLINE READY`と`0 browser API calls`を指します。Pagesではなくlocal
serverです。RepositoryがPrivateであることと、Release assetがrepository accessを
継承することを説明します。

## Evidence

- Evidence: Coreを投げる側だけでなく、受ける側も移動とtimingを選ぶ。 (`DRV-001` / `md:heading/active-receiving`)
- Evidence: 戻るCoreと接触中にcatch inputがあればPERFECT CATCHとする。 (`DRV-003` / `md:heading/catch-and-chain`)

Archive Explorerでは文を要約して答えにせず、ID、locator、fixture日付、media typeを
見せます。検索例は`catch`または`DRV-003`です。

## Inference

Inference: 上の2行は「受領が入力を伴う」という読みを支える可能性がある。確信度は
中。Player 2の出荷有無や削除理由はこの2行から判定できず、出荷時のplayer構成資料が
反証条件になる。

Creative Lineageでは`Conflict`、`Finding`、`Play DNA`を「既存の人間判断」と呼び、
Evidenceそのものとは呼びません。`Live GitHub object`と`offline:<ID>`が同じstable
IDを解決することを示します。

## Proposal

Proposal: Design Betは未決の選択肢として扱います。既存ADRが明示した2つの
deterministic proofだけを操作し、新しい方向の推奨やgame rule変更は行いません。

Legacyでは4つのtutorial step、SECOND HANDではownerとsequenceの変化を観測します。
参加者へ期待回答を教えず、見えた操作と役割差だけを聞きます。

## Closing

「画面、snapshot、package、tagは再現性のための道具です。判断は人間、Evidenceは
locator付き、Conflictは未解決のまま残します。」

WikiはGitHub Web UIでfirst pageを作るまでrepository fallbackです。録画は
`not-recorded`で、存在するように見せません。
