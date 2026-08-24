# Phase 5 gate evidence

Captured: `2026-08-25`
Branch: `shinyay-star-relay-copilot-experience`
Base: `main` at `918758c471e35bba6d2d51e5be9bf712713d53c0`

このgate記録は構造と検査結果だけを残す。10シナリオの期待回答、期待される分類、
分類数は記載しない。答えはこのrepositoryに存在しない。

## 成果物

| 区分 | 件数 | 正本 |
|---|---|---|
| Repository instructions | 1 | `.github/copilot-instructions.md` |
| Path instructions | 4 | `.github/instructions/` |
| Prompt file | 7 | `.github/prompts/` |
| Custom agent | 4 | `.github/agents/` |
| 固定シナリオ | 10 | `evaluation/scenario-manifest.json` |
| 構造rubric | 1 | `evaluation/structural-rubric.md` |
| Run sheetテンプレート | 1 | `evaluation/run-sheet.md`（空欄） |
| Self-guided workshop | 1 | `demo/self-guided-workshop.md` |
| Space manifest / 手順 | 2 | `ops/github/copilot-space-*.{yaml,md}` |

### Path instructionsの適用範囲

| File | applyTo |
|---|---|
| `evidence.instructions.md` | `archive/**`, `research/**` |
| `design.instructions.md` | `design/**`, `canon/**` |
| `playable.instructions.md` | `packages/**`, `apps/**`, `tests/**` |
| `copilot-assets.instructions.md` | `.github/prompts/**`, `.github/agents/**`, `evaluation/**`, `ops/github/**` |

### Custom agentのtool scope

| Agent | tools | 書き込み先 |
|---|---|---|
| `archive-curator` | `read`, `search` | なし（読み取り専用） |
| `provenance-auditor` | `read`, `search` | なし（読み取り専用） |
| `design-facilitator` | `read`, `search`, `edit` | `design/bets/`, `design/decisions/`の新規fileのみ |
| `slice-planner` | `read`, `search`, `edit` | `design/vertical-slices/`の新規fileのみ |

`execute`はどのagentにも与えていない。全agentが`disable-model-invocation: true`で、
明示選択でのみ起動する。`name`はfile slugと一致させ、prompt側の`agent`がslugで
解決できるようにしている。

### Prompt fileのagent binding

7 promptすべてが`agent:`に**custom agent slug**をbindし、`tools`を宣言しない。
汎用値（`ask` / `agent` / `plan`）は、利用者が選んだcustom agentを上書きして
agent側のtool scopeと禁止事項を捨てるため使わない。scopeの正本はagent側の1箇所に
なる。

| Prompt | bind先 |
|---|---|
| 01, 02 | `archive-curator` |
| 03, 04, 05 | `design-facilitator` |
| 06, 07 | `slice-planner` |

validatorは、bind先が4 agentのいずれかであること、`tools`が宣言されていないこと、
シナリオの`recommended_agent`と一致することを検査する。

### 人間しかできない工程

workshopは、Copilotへ渡さない操作を独立した工程として持つ。

| 工程 | 操作 | なぜagentにやらせないか |
|---|---|---|
| 4.5 | BET IDの採番と`design/bets/`への保存 | 選択肢を記録へ格上げする宣言だから |
| 5.5 | ADRの受理（`accepted`）と署名 | 「これで行く」と言えるのは人間だけだから |

prompt 04はIDを採番せずfileも書かない。prompt 05は`design/bets/`に実在するBETを
要求し、無ければ停止する。prompt 06は`Status: accepted`のADRを要求し、無ければ
停止する。工程4.5と5.5がこの3つを繋ぐ。工程5.5まで進めなかった場合は既存
`ADR-001`をfallbackとして使う。

## Gate

| Gate | Evidence | Result |
|---|---|---|
| 固定10シナリオが存在し、実在するAsset IDとlocatorを対象にする | `SCN-001`〜`SCN-010`。全`entry_ids`が実在IDへ解決することをvalidatorが検査（68 ID解決） | Pass |
| 3件以上の意図的矛盾をEvidence/Inferenceへ分離させる | `SCN-003`〜`SCN-005`が`both-sides-cited`、`sides-are-different-assets`、`status-unresolved`を必須にする | Pass |
| 3つの異なるDesign Betがそれぞれ3資産以上へ遡る | `SCN-007`が`exactly-three-bets`、`each-bet-traces-3-distinct-assets`、3軸distinctnessを必須にする | Pass |
| 採用案を勝手に決定した出力を不合格にする | 全シナリオが`auto_fail_if`を持ち、`recommends-a-bet`、`fills-decision-autonomously`、`marks-accepted`、`picks-a-winner`を定義済み | Pass |
| 期待回答・期待分類を含まない | 開示ガードを`.github`と`evaluation`へ拡張。`taxonomy_forbidden_substrings`と`repository_forbidden_substrings`をprompt、agent、instructions、rubric、manifestに対して検査 | Pass |
| Instructionsが規律を強制する | `使ってよい証拠`、`出力の三層分離`、`引用の形式`、`Conflictの扱い`、`昇格の禁止`、`停止条件`の6節をvalidatorが必須にする | Pass |
| Agentが最小権限である | 読み取り専用2件、`execute`ゼロ、wildcard toolsゼロをvalidatorとtestが検査 | Pass |
| Promptが選択されたagentを上書きしない | 7 promptすべてがcustom agent slugへbindし、`tools`を宣言しない。シナリオの`recommended_agent`との一致もvalidatorが検査 | Pass |
| Bet→ADR→Planの鎖が繋がる | workshopに工程4.5（BET採番と保存）と5.5（ADR受理と署名）を追加。prompt 05はBET不在で停止、prompt 06は`accepted`不在で停止 | Pass |
| Space sourceが除外treeを取り込まない | `repository_source_allowed: false`、`source_granularity: file_or_folder_only`、10件のfile/folder sourceが実在しかつ除外treeの外にあることをvalidatorが検査 | Pass |
| 文中linkが切れていない | Copilot surfaceのmarkdown link 32件が実在fileへ解決することをvalidatorとtestが検査 | Pass |
| 自動検査を振る舞いgateと偽らない | `validate:copilot-metadata`へ改名。README、rubric、boundaries、gateに「検査しない項目」を明記 | Pass |
| Space作成を偽装しない | `verification.space_created: false`。`created_at`/`created_by`/`verified_by`が`null`でないと不整合としてvalidatorが失敗する | Pass |
| Reference混入がない | canary非混入チェックを再実行。worktree、pushed branch、code search、issue search、discussionすべて0件 | Pass |

## 実測したCopilot surface

このsessionはCopilot CLI（`github-app` 1.0.80、Windows）で実行した。session開始時点の
branch状態に対する観測である。

| 対象 | 観測結果 |
|---|---|
| Repository instructions | 検出。`.github/copilot-instructions.md`の本文がsessionへそのまま注入された |
| Path instructions | 検出。`applyTo` globとfile pathの対応表が提示された |
| Custom agent | 検出。`archive-curator`がagent一覧へ登録され、frontmatterの`description`が表示された |
| Prompt file | **未検出**。`.github/prompts/`のfileはsurfaceへ現れず、slash commandとしても提示されなかった |

session開始後に追加した3 agentと6 promptは、同一session内では再読み込みされないため
未観測である。次のsessionまたは他surfaceでの確認が必要。

Prompt fileの非対応はfallback（本文をchatへ貼り付け）で回避できる。手順は
`demo/self-guided-workshop.md`の「Surfaceが使えない場合」にある。

## Copilot Space

作成用の対応手段が存在しないことを再確認した。疎通確認ではなく、対象APIそのものを
叩いている。

| 確認 | 結果 |
|---|---|
| REST `/user/copilot/spaces` | HTTP 404 Not Found |
| REST `/copilot/spaces` | HTTP 404 Not Found |
| GraphQL `__type(name: "CopilotSpace")` | `null` |
| GraphQL mutation名にCopilot Space該当 | 0件 |
| `gh extension list` | 空 |

`automation_status: manual_only`とし、Spaceは**作成していない**。手順は
`ops/github/copilot-space-setup.md`。

### Source granularity

Copilot Spaceは**path allowlistを強制しない**。repository sourceを1件でも追加すると
repository全体が回答材料になり、`research/findings/`、`design/`、`canon/`、
`evaluation/`が新しい問いの答えとして引用されてしまう。

manifestは`repository_source_allowed: false`、`source_granularity:
file_or_folder_only`とし、`allowed_sources`に10件のfile / folderを列挙する。
`excluded_paths`は「除外設定として登録するもの」ではなく「追加しないもの」の一覧で
ある。validatorは、各sourceが実在すること、`excluded_paths`の内側に無いこと、
repository sourceが禁止されたままであることを検査する。

## 自動検査

| Check | Result |
|---|---|
| TypeScript strict typecheck | Pass |
| Simulation forbidden-API scan | Pass |
| Content / schema / provenance / locator validation | Pass |
| Copilot metadata validation | Pass |
| Node tests | 91 pass（Phase 3の80 + Copilot 11） |
| Chromium dev-server smoke | Actions |
| Vite production build | Actions |
| Allowlisted package + build-manifest schema | Actions |
| Packaged offline Chromium smoke | Actions |

`npm run validate:copilot-metadata`は**設定のmetadata検査**である。モデル出力を
一切読まない。検査する項目:

- シナリオ10件、ID連番、重複なし
- 各`prompt_file`と`recommended_agent`の実在
- prompt frontmatterのbind先が4 agentのいずれかであること、`tools`未宣言、
  退役key（`mode`）の不使用
- prompt fileのbind先とシナリオの`recommended_agent`の一致
- agent frontmatterの必須`description`、`name`とfile slugの一致、退役key（`infer`）の
  不使用、wildcard tools禁止
- 読み取り専用agentが`read`/`search`のみを持つこと
- 全`entry_ids`が実在stable IDへ解決すること
- `structural_checks`と`auto_fail_if`がrubricで定義済みであること
- 全prompt fileが少なくとも1シナリオで使われること
- path instructionsが`archive`/`research`/`design`/`packages`/`tests`を覆うこと
- 文中のrepository内link 32件が実在fileへ解決すること
- Space manifestのrepository source禁止、source実在、除外treeとの非重複、
  verification整合性
- 開示ガード語彙の不在

**検査しない項目**（人間がrubricで採点する）:

- モデルが何と答えたか
- 引用されたIDが実在したか
- 層が分離されていたか
- Conflictを裁定しなかったか
- 勝手に採用しなかったか
- Betが3資産へ遡れたか

CIは振る舞いのgateではない。Gate G1〜G4の判定者は人間である。

## Reference側

10シナリオのanswer keyと採点templateは別のPrivate reference repositoryへ置いた。
このrepositoryには、シナリオ一覧、rubricの文言、空のrun sheetだけを置く。
required ID集合、disqualifier一覧、結論はここに存在しない。

## 意図的に据え置いた範囲

Copilot Spaceの実作成、prompt file対応surfaceでの実測、10シナリオの実行と採点、
model/client比較、答え、期待回答はこのPhaseの対象外である。
