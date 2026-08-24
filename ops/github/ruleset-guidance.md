# Owner-safe main ruleset guidance

## 方針

このrepositoryはsolo owner運用です。owner bypassを確認できないrulesetをAPIから
自動適用すると、緊急修正やruleset解除ができなくなる可能性があります。そのため
Phase 0ではrulesetを自動作成せず、次のdesired stateを決定的fallbackとします。

1. Targetはdefault branch `main`。
2. Pull requestを要求し、force pushとbranch deletionを禁止する。
3. Required checkは`validate-thin-slice`。
4. Repository administratorの`Always allow` bypassを**保存前に**確認する。
5. CODEOWNERS reviewはsolo ownerを自己lockoutさせるためrequiredにしない。
6. 適用後、ownerがfeature branchをpushでき、rulesetを編集できることを確認する。

現在のthin-slice作業はisolated feature branchで行い、`main`へ直接pushしません。
Remote rulesetが未適用でも、この運用とCODEOWNERSを静的fallbackとして維持します。

English summary: apply branch protection only after confirming an unconditional
repository-administrator bypass. Never trade the solo owner's recovery path for
a misleading green capability check.
