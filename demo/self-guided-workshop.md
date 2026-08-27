# Self-guided workshop — Archive to Design Bet

> English summary: A 70-minute solo workshop. You use four phase agents and
> seven core prompt files to move from a fictional 1998 archive to three genuinely
> distinct design bets and one planned slice. Two checkpoints are yours alone:
> naming and saving the bet you chose, and accepting the decision record.
> Copilot never decides for you. There are no answer keys here; correctness is
> judged by structure.

所要時間: 約70分（うち6分は人間だけが行うcheckpoint）。1人で実施できます。
ネットワーク完了を待つ工程はクリティカルパスに置きません。

## 0. 準備（5分）

```powershell
npm ci
npm run validate:content
npm run validate:copilot-metadata
```

両方が成功すれば、資料とCopilotアセットの整合性は取れています。

Copilot側の確認:

1. `.github/agents/`の4つの工程別custom agentが選択できるか
2. `.github/prompts/01-*`〜`07-*`の7つのcore prompt fileが呼び出せるか
3. 呼び出せない場合は[fallback](#surfaceが使えない場合)へ

異なる職種の観点を比較する場合は、このworkshopを完了または中断した後に
[Cross-functional Role Lens workshop](role-lens-workshop.md)を使用してください。
Role Lensは工程別Agentを置き換えません。

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

**agent:** `archive-curator` / **prompt:** `01-reconstruct-shipped-game`

1. `archive-curator`を選択します。
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

**agent:** `archive-curator` / **prompt:** `02-find-conflicts`

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

**agent:** `design-facilitator` / **prompt:** `03-extract-play-dna`

- [ ] 各候補が2件以上の**異なる**DRVを引用している
- [ ] Invariantが定数値ではなく関係で書かれている
- [ ] Falsified if がある
- [ ] 順位や推奨が無い

**あなたの作業:** 候補の中で「当時のハードウェア制約が原因のもの」を1つ見つけ、
移植可能な性質から外してください。この選別は人間の仕事です。

## 4. Imagine — Design Betを3つ作る（12分）

**agent:** `design-facilitator` / **prompt:** `04-create-design-bets`

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

## 4.5 人間のcheckpoint — 選んだBetを保存する（3分）

**agentを使いません。あなたが手で行います。**

prompt 04はIDを採番せず、fileも書きません。工程5の`05-draft-decision`は
`design/bets/`に**実在する**BETを要求します。ここを飛ばすと鎖が切れます。

1. 次に空いているBET番号を確認します。

   ```powershell
   Get-ChildItem design\bets -Name
   ```

2. `design/bets/BET-00x-<短いslug>.md`を作り、選んだBetを転記します。既存
   `BET-002-second-hand.md`が書式の見本です。
3. 由来Evidence（異なる3件以上のDRV IDとlocator）をそのまま残します。
4. 選んだ理由を、あなたの言葉で1〜2文書き添えます。
5. 検証します。

   ```powershell
   npm run validate:content
   ```

file化の代わりにdraft Issueで運用しても構いません。その場合はIssue番号を
BET IDの代わりに使い、工程5でそのIssueへのlinkを渡します。ただし採番と保存を
**人間が行う**点は変わりません。

> なぜCopilotにやらせないのか: IDの採番と保存は「これは選択肢ではなく記録である」
> という宣言です。宣言を人間が行うから、後続のADRとPlanが誰の判断かを追跡できます。

## 5. Decide — ADR草案を作る（8分）

**agent:** `design-facilitator` / **prompt:** `05-draft-decision`

入力には、工程4.5で保存した**BET ID**と**あなたが書いた理由**を渡します。

- [ ] `Status: proposed`
- [ ] `Decided by` と `Decided at` が未記入
- [ ] `Decision`欄があなたの文言のまま（加筆・要約されていない）
- [ ] Reversal conditions がある
- [ ] 未解決Conflictが「持ち越し」として列挙されている

**わざと試すこと:** 理由を渡さずに実行してください。草案を書かずに停止すれば、
停止条件が働いています。工程4.5を飛ばした状態（BETが`design/bets/`に無い状態）で
実行した場合も、同じく停止するはずです。

## 5.5 人間のcheckpoint — ADRを受理して保存する（3分）

**agentを使いません。あなたが手で行います。**

工程5の出力は`Status: proposed`の**草案**です。工程6の`06-plan-slice`は
`Status: accepted`のADRを要求します。受理はCopilotができない操作です。

1. 草案を読み、`Decision`欄があなたの文言のままかを確認します。
2. `design/decisions/ADR-00x-<短いslug>.md`として保存します。番号は
   `Get-ChildItem design\decisions -Name`で確認します。
3. 受理する場合だけ、次を自分で書き換えます。

   | Field | 値 |
   |---|---|
   | `Status` | `accepted` |
   | `Decided by` | あなたの名前またはhandle |
   | `Decided at` | 実際の日付 |

4. 受理しない場合は`proposed`のまま残します。それも正しい結果です。工程6は
   訓練用fixture`ADR-DEMO-001`で進めてください。`ADR-001`は使えません（`Status`が
   `Accepted for Phase 2 only`で、`accepted`と厳密一致しないため）。
5. 検証します。

   ```powershell
   npm run validate:content
   ```

> ここが教材の要点です。Copilotは選択肢を作り、草案を整え、計画へ展開できますが、
> **「これで行く」と言えるのは人間だけ**です。署名欄はそのための空欄です。

## 6. Plan — スライスを計画する（7分）

**agent:** `slice-planner` / **prompt:** `06-plan-slice`

渡すADRは次の優先順です。

| 状況 | 渡すADR |
|---|---|
| 工程5.5でADRを受理した | あなたのADR ID |
| 受理しなかった、または時間が足りない | `ADR-DEMO-001`（訓練用fixture） |

`ADR-DEMO-001`は[demo/fixtures/](fixtures/README.md)にある訓練用fixtureです。
tooling決定であり、ゲーム設計の決定でも、Archiveの問いへの答えでもありません。
これを使った場合、出力の冒頭に「訓練用fixtureに基づく計画」と明記されるはずです。

**わざと試すこと（2回）:**

1. 存在しないADR IDを渡す。計画を作らずに停止すれば正しい動作です。
2. `ADR-001`を渡す。**これも停止するのが正解です。** `ADR-001`の`Status`は
   `Accepted for Phase 2 only`で、`accepted`と厳密一致しません。scope付きのstatusを
   「実質accepted」と読み替えて計画を作った場合、それは
   `plans-meaning-change-without-adr`に当たる失敗です。停止時に、確認したstatus
   文字列が報告に含まれているかも確認してください。

- [ ] 冒頭に由来ADR IDがある
- [ ] 受入条件が「入力Xのとき観測Yになる」の形
- [ ] 検証コマンドと合格条件がある
- [ ] 対象外が書かれている
- [ ] 実装コードが出ていない
- [ ] fixtureを使った場合、その旨が冒頭に明記されている

## 7. Learn — playtestを解釈する（5分）

**agent:** `slice-planner` / **prompt:** `07-synthesize-playtest`

`PT-001`を対象にします。

- [ ] 各観測に件数が併記されている
- [ ] 学習候補が見直し対象のBET/ADR IDを指している
- [ ] 判断できない項目が`Insufficient`にある
- [ ] 参加者や自由記述が捏造されていない

## 8. Audit — 自分の成果物を検査する（5分）

**agent:** `provenance-auditor`

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

採点は**人間が行います**。`npm run validate:copilot-metadata`はprompt、agent、
シナリオ、rubricの**設定の整合性**だけを検査し、モデルの出力を一切読みません。
CIは引用の実在や勝手な決定を検出しません。

## 人間しかできない工程

この教材で**Copilotに渡してはいけない**操作は次の3つです。工程4.5と5.5がここに
当たります。

| 操作 | 理由 |
|---|---|
| BET IDの採番とfileへの保存 | 「選択肢」から「記録」へ格上げする宣言だから |
| ADRの受理と署名 | 「これで行く」と言えるのは人間だけだから |
| Conflictの裁定 | どちらを採るかは証拠ではなく判断だから |

## Surfaceが使えない場合

| 使えないもの | fallback |
|---|---|
| custom agentの選択 | prompt本文の冒頭で案内している`.github/agents/`のfile本文を、先にchatへ貼り付ける |
| prompt fileの`/`呼び出し | `.github/prompts/`の本文をそのままchatへ貼り付ける |
| repository instructionsの自動適用 | `.github/copilot-instructions.md`を最初の1通目に貼り付ける |
| Copilot Space | [ops/github/copilot-space-setup.md](../ops/github/copilot-space-setup.md)の手動手順 |

prompt fileはtool scopeを宣言しません。scopeはbindしたcustom agent側が持ちます。
agentを選べないsurfaceでは、agent本文を貼り付けることで同じ制約を文面として与えて
ください。

どのfallbackでも、reference repositoryをsource、workspace、検索対象へ追加しない
でください。Spaceにrepository sourceを追加しないでください。

## この教材が測っていないもの

- 回答の内容が史実として正しいか（史実は存在しません。すべて架空です）
- 生成されたコードの量
- モデルの速度

測っているのは、**証拠・解釈・提案・決定を分けたまま前へ進めるか**です。
