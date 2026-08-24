# Phase 8 demo runbook — Museum to Playable

> **日本語が正本です。** English summary: This runbook delivers a 60-minute,
> network-optional private demo from Museum through Archive and Creative Lineage
> to both deterministic playables. It never relies on a reference repository,
> an answer key, or a live GitHub write succeeding.

## 実装境界

- 参照ADR: `ADR-001`。Phase 2限定の決定を変更せず、2つの既存simulationと
  `LINEAGE-001`を表示・配布する。
- 受入条件: `Museum -> Archive -> Creative Lineage -> Legacy -> SECOND HAND`
  をリンクだけで順に移動でき、network遮断時も同じstable IDを確認できる。
- 検証: `npm run gate:phase8`が終了コード`0`となり、offline Playwrightが外部request
  `0`件を確認する。
- 影響範囲: demo表示、allowlisted snapshot、運用資料、offline/release packaging。
  対象外はgame rule、balance、勝敗条件、入力の意味、Reference repository、Pages公開。

## 開始前チェック

```powershell
npm ci
npm run gate:phase8
npm run serve:offline
```

`http://127.0.0.1:4173`を開きます。GitHubへのsign-in、token、外部APIは不要です。
画面右上の`OFFLINE READY`、`30 DRV`、`2 PLAYABLES`を確認してください。
展開済みoffline packを使う場合は、pack内で`node .\serve.mjs`だけを実行します。

## 60分進行

| 時刻 | 画面 / 操作 | 話すこと | 合格する観測 |
|---:|---|---|---|
| 00:00–05:00 | Museum | 架空archive、3層分離、情報境界 | 5つのstopが表示される |
| 05:00–15:00 | Archive Explorer | ID、fixture日付、media type、宣言済みlocator | 30件を検索・絞り込みできる |
| 15:00–25:00 | Creative Lineage | Evidence / Inference / Proposalを混ぜずに辿る | `DRV-001`から`PLAYABLE-001`まで辿れる |
| 25:00–35:00 | Legacy | HOLD / BANK / RELAY / RETURN | 4つのstepが順に更新される |
| 35:00–47:00 | SECOND HAND | 保持者と受領者の役割差、local/AI、latency fixture | ownerとsequenceが更新される |
| 47:00–54:00 | GitHub object resolver | live URLとoffline stable IDは同じ対象を表す | network無しでもIDとpathが残る |
| 54:00–58:00 | Boundary | Pages未公開、Releaseはrepository accessを継承 | public URLを提示しない |
| 58:00–60:00 | Reset | 次の参加者向けに初期状態へ戻す | reset verificationがpassする |

## Evidence

- Evidence: Coreを投げる側だけでなく、受ける側も移動とtimingを選ぶ。 (`DRV-001` / `md:heading/active-receiving`)
- Evidence: CoreはMirrorで反射し、敵を貫通してRelay Pointへ接続した後、Playerへ戻る。 (`DRV-003` / `md:heading/core-loop`)

## Inference

- Inference: 上の2行から、送信・経路・戻り・受領を2つのplayableで比較する説明は
  可能である。確信度は中。出荷版が2人用だったことを示す証拠は不足しており、出荷時の
  player構成を示す別資料があれば反証または限定される。
- Inference: Creative LineageのInference欄は既存の人間レビュー済みrecordへの導線で
  あり、新しいFindingではない。上のEvidence 2行だけでは各recordの結論を判定できない。

## Proposal

- Proposal: 以下は未決である。Design Betや将来の選択肢は未決として扱い、比較軸は提示してよいが、
  推奨、順位付け、採用はしない。
- Proposal: 新しいgameplay案やplayable意味の変更はこのデモ中に実装しない。

## Fallback

| 段階 | 使用条件 | 操作 | 禁止 |
|---|---|---|---|
| Live | GitHubとCopilot surfaceが利用可能 | allowlisted外部URLを別tabで開く | 新規object作成を必須にしない |
| Recorded placeholder | 事前承認済み録画が存在する | manifestに実在fileとhashを登録して再生 | 録画が無いのに存在を示唆しない |
| Static | network、GitHub、Copilotが利用不能 | commit済みsnapshotとlocal demoだけを使う | 架空の録画、reviewer、reactionを作らない |

録画は現時点では用意されていません。placeholderは状態を`not-recorded`と表示し、
file名、duration、checksumを空欄で埋めません。実在録画を追加する場合だけ、
rights review後にmanifestへ登録します。

## Reset

1. browser tabを閉じる。
2. `npm run demo:reset`を実行する。
3. `npm run serve:offline`を再実行する。
4. Museumの`OFFLINE READY`とbuild IDを確認する。

resetはGit branch、Issue、Discussion、Project、Release、tagを変更しません。localの
generated packageとPlaywright出力だけを対象にします。

## 停止条件

- 参照先のrights、license、出所が不明なら`risk:rights`として停止する。
- Reference repository、answer key、expected responseが必要になったら停止する。
- stable IDまたはlocatorをcatalogで確認できなければ`Unknown`とし、推測しない。
- WikiはGitHub Web UIでfirst pageが作られるまでrepository内fallbackを使用する。
