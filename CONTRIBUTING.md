# Contributing

このrepositoryはPhase Gate方式で進めます。変更前に次を確認してください。

1. Demo repositoryへ`demo-safe`以外を追加しない。
2. Evidence、Inference、Proposalを分離し、主張へstable IDとlocatorを付ける。
3. `origin_kind`を省略せず、初期fixtureでは`synthetic_fixture`だけを使う。
4. 矛盾を自動解消せず、意思決定をADRとして記録する。
5. Playtest eventへ氏名、メール、自由記述、IP、端末識別子を保存しない。
6. packageへ追加するfileは明示allowlistへ登録する。

`main`へ直接作業せず、feature branchとpull requestを使います。solo ownerをlock out
しないため、remote ruleset適用は[owner-safe guidance](ops/github/ruleset-guidance.md)
に従い、owner bypassを確認してから行います。
