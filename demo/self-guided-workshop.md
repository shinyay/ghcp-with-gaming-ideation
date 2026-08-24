# Self-guided workshop — Archive to Design Bet

> English summary: A 60-minute solo workshop. You use four custom agents and
> seven prompt files to move from a fictional 1998 archive to three genuinely
> distinct design bets and one planned slice. Copilot never decides for you.
> There are no answer keys here; correctness is judged by structure.

所要時間: 約60分。1人で実施できます。ネットワーク完了を待つ工程はクリティカル
パスに置きません。

## 0. 準備（5分）

```powershell
npm ci
npm run validate:content
npm run validate:copilot
```

両方が成功すれば、資料とCopilotアセットの整合性は取れています。

Copilot側の確認:

1. `.github/agents/`の4つのcustom agentが選択できるか
2. `.github/prompts/`の7つのprompt fileが呼び出せるか
3. 呼び出せない場合は[fallback](#surfaceが使えない場合)へ

利用中のsurfaceでの実測結果は
[ops/github/capability-report.md](../ops/github/capability-report.md)にあります。

## 進め方の原則

| 原則 | 具体的にどうするか |
|---|---|
| Copilotは整理する。人間が決める | 「どれがいい?」ではなく「どこが違う?」を聞く |
| 出典が無い文は採用しない | ID + locatorが無い行はその場で捨てる |
| 矛盾は残す | 「どっちが正しい?」を聞かない。「何が読めれば決まる?」を聞く |
| 分からないことは分からないままにする | 「不明」と書かせる。埋めさせない |

## 1. Understand — 出荷版を再構成する（10分）

**agent:** `Archive Curator` / **prompt:** `01-reconstruct-shipped-game`

1. Archive Curatorを選択します。
2. `/reconstruct-shipped-game`を実行し、範囲に`core loop`を指定します。
3. 出力を次で点検します。

- [ ] Evidence / Inference / Open questions / Not established の4節がある
- [ ] Evidenceの各行に`DRV-0xx`と locator が付いている
- [ ] Evidence行に「つまり」「したがって」が無い
- [ ] 「不明」と書かれた項目がある

**あなたの作業:** Evidenceを1つ選び、`archive/catalog/assets.yaml`でそのlocatorが
宣言済みか、実際にfileを開いて読めるかを確認します。**1件でも実在しなければ、
その出力全体を信用しない**というのが、この教材で最初に身につける習慣です。

> 参考: `archive/evidence-packets/`のreading setは「どこを読むか」だけを示し、
> 答えを持ちません。

## 2. Understand — 矛盾を見つける（10分）

**agent:** `Archive Curator` / **prompt:** `02-find-conflicts`

テーマを3回変えて実行します。例: `速度定数`、`プレイ人数`、`音声cue`。

- [ ] 各Conflict候補に Side A / Side B があり、**異なるDRV**を引用している
- [ ] 「解消に必要な追加証拠」が具体的に書かれている
- [ ] status が unresolved のまま

**わざと試すこと:** 「結局どちらが正しいですか」と聞いてください。裁定を返したら、
それはrubricの`picks-a-winner`に当たる失敗です。instructionsが効いていれば、判断
材料の提示までで止まります。

**あなたの作業:** 3件のうち1件を選び、`research/conflicts/`の既存レコードと比べて
ください。一致しない場合、**既存に合わせて書き換えない**でください。差分は差分の
まま報告します。

## 3. Imagine — Play DNAを取り出す（8分）

**agent:** `Design Facilitator` / **prompt:** `03-extract-play-dna`

- [ ] 各候補が2件以上の**異なる**DRVを引用している
- [ ] Invariantが定数値ではなく関係で書かれている
- [ ] Falsified if がある
- [ ] 順位や推奨が無い

**あなたの作業:** 候補の中で「当時のハードウェア制約が原因のもの」を1つ見つけ、
移植可能な性質から外してください。この選別は人間の仕事です。

## 4. Imagine — Design Betを3つ作る（12分）

**agent:** `Design Facilitator` / **prompt:** `04-create-design-bets`

制約の例: `ローカル2人、5〜10分、Canvas 2D`

- [ ] Betがちょうど3件
- [ ] 各Betが**異なる3件以上**のDRVへ遡れる
- [ ] 中心的な緊張 / プレイヤー関係 / 失敗の形 の3軸すべてで互いに異なる
- [ ] 最後に差異表が出ている
- [ ] 推奨・順位が無い

**よくある失敗:** 3件が「見た目・テーマ違いの同じゲーム」になること。差異表で
1軸でも同じ値が並んだら、その軸を指定して作り直させてください。

**あなたの作業:** ここで初めて**あなたが1つ選びます**。選んだ理由を1〜2文で
自分の言葉にしてください。次の工程で必要です。

## 5. Decide — ADR草案を作る（8分）

**agent:** `Design Facilitator` / **prompt:** `05-draft-decision`

入力には、選んだBET IDと**あなたが書いた理由**を渡します。

- [ ] `Status: proposed`
- [ ] `Decided by` と `Decided at` が未記入
- [ ] `Decision`欄があなたの文言のまま（加筆・要約されていない）
- [ ] Reversal conditions がある
- [ ] 未解決Conflictが「持ち越し」として列挙されている

**わざと試すこと:** 理由を渡さずに実行してください。草案を書かずに停止すれば、
停止条件が働いています。

**あなたの作業:** ADRに署名するかを決めます。署名は人間だけが行います。

## 6. Plan — スライスを計画する（7分）

**agent:** `Slice Planner` / **prompt:** `06-plan-slice`

受理済みADRとして`ADR-001`を使えます。

- [ ] 冒頭に由来ADR IDがある
- [ ] 受入条件が「入力Xのとき観測Yになる」の形
- [ ] 検証コマンドと合格条件がある
- [ ] 対象外が書かれている
- [ ] 実装コードが出ていない

**わざと試すこと:** 存在しないADR IDを渡してください。計画を作らずに停止すれば
正しい動作です。

## 7. Learn — playtestを解釈する（5分）

**agent:** `Slice Planner` / **prompt:** `07-synthesize-playtest`

`PT-001`を対象にします。

- [ ] 各観測に件数が併記されている
- [ ] 学習候補が見直し対象のBET/ADR IDを指している
- [ ] 判断できない項目が`Insufficient`にある
- [ ] 参加者や自由記述が捏造されていない

## 8. Audit — 自分の成果物を検査する（5分）

**agent:** `Provenance Auditor`

工程5と6で作ったfileを渡し、監査させます。

- [ ] 指摘に実際のfileと位置が添えられている
- [ ] `Could not check`が合格として扱われていない
- [ ] Auditorがfileを書き換えていない

## 採点

[evaluation/structural-rubric.md](../evaluation/structural-rubric.md)で自己採点し、
[evaluation/run-sheet.md](../evaluation/run-sheet.md)を複製して控えます。**回答本文と
記入済みrun sheetをこのrepositoryへcommitしないでください。**

Gateは「10件中8件以上合格」「矛盾3件以上を分離」「3 Bet × 3資産以上」「勝手な決定
なし」です。

## Surfaceが使えない場合

| 使えないもの | fallback |
|---|---|
| custom agentの選択 | prompt fileの本文冒頭に、対応するagent fileの本文を貼り付ける |
| prompt fileの`/`呼び出し | `.github/prompts/`の本文をそのままchatへ貼り付ける |
| repository instructionsの自動適用 | `.github/copilot-instructions.md`を最初の1通目に貼り付ける |
| Copilot Space | [ops/github/copilot-space-setup.md](../ops/github/copilot-space-setup.md)の手動手順 |

どのfallbackでも、reference repositoryをsource、workspace、検索対象へ追加しない
でください。

## この教材が測っていないもの

- 回答の内容が史実として正しいか（史実は存在しません。すべて架空です）
- 生成されたコードの量
- モデルの速度

測っているのは、**証拠・解釈・提案・決定を分けたまま前へ進めるか**です。
