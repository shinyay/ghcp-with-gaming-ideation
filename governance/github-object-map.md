# GitHub object map

| Object | Responsibility | Repository source |
|---|---|---|
| Issue | Work and acceptance criteria | `design/vertical-slices/VS-001-thin-proof.md` |
| Discussion | Open design conversation | `design/bets/BET-002-second-hand.md` |
| Project | Coordinate status, not duplicate prose | `ops/github/desired-state.yaml` |
| Wiki | Museum navigation only | `ops/github/wiki/` |
| Release | Repository-access-controlled demo package | Build manifest |
| PR/commit | Implementation change | Git |

Live URLがない場合、`ops/github/offline-objects/`がstable IDを保持する。Static lineage
はresolverを使い、GitHub objectのauthor、reaction、token、free textをsnapshotへ
取り込まない。
