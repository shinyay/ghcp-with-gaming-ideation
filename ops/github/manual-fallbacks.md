# GitHub surface fallbacks

| Surface | Live probe | Deterministic fallback |
|---|---|---|
| Custom agent | `.github/agents/archive-curator.agent.md`をclientで選択 | 同fileを通常promptのinstructionとして添付 |
| Prompt file | prompt pickerから実行 | file本文をchatへ貼り、allowed pathsを明示 |
| Issue Form | repository default branchでformを選択 | `.github/ISSUE_TEMPLATE/implementation.yml`の項目を通常Issueへ転記 |
| Discussion | Design Lab categoryまたはGeneralへ作成 | `ops/github/offline-objects/discussion.json`を静的表示 |
| Project | private user ProjectへIssueを追加 | `ops/github/offline-objects/project-item.json`を静的表示 |
| Wiki | `.wiki.git`へoutput-only sourceをpush | `ops/github/wiki/Home.md`を直接開く |
| Release | Private repositoryのdraft Release | `dist/offline-demo-pack/`をlocal HTTP serverで提供 |
| Copilot Space | cleared archiveだけをsourceにする | `copilot-space-manifest.yaml`で手動設定 |

Fallbackは成功を装うものではありません。Live surfaceが利用できない場合はCapability
reportへ理由と未作成状態を記録し、同じstable IDをoffline objectで解決します。
