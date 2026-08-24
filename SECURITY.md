# Security and privacy

## Reporting

Repository ownerへPrivate channelで報告してください。IssueやDiscussionへtoken、
個人情報、未公開のreference contentを貼らないでください。

## Demo guarantees

- GitHub Pagesを公開しない。
- Browser codeへGitHub tokenを埋め込まず、GitHub APIを直接呼ばない。
- Playtest eventはrandom session ID、列挙値、整数だけに限定する。
- Release/offline packageはallowlist方式で生成する。
- `ai_eligible`やCopilot instructionを機密境界として扱わない。

English summary: Keep secrets, personal data, and reference-only material out of
this repository and every generated package.
