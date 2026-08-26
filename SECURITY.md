# Security and privacy

## Reporting

Repository ownerへPrivate channelで報告してください。IssueやDiscussionへtoken、
個人情報、未公開のreference contentを貼らないでください。

## Demo guarantees

- RepositoryはPrivateのまま維持する。
- GitHub Pagesへ公開するのはallowlist済みの2 HTMLだけで、Archive、source、snapshot、
  packageを含めない。
- Browser codeへGitHub tokenを埋め込まず、GitHub APIを直接呼ばない。
- Playtest eventはrandom session ID、列挙値、整数だけに限定する。
- Release/offline packageはallowlist方式で生成する。
- `ai_eligible`やCopilot instructionを機密境界として扱わない。

English summary: Keep secrets, personal data, reference-only material, and
non-allowlisted repository content out of every package and the two-file Pages
site.
