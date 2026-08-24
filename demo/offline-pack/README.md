# STAR RELAY offline demo pack

> English summary: A self-contained, repository-allowlisted private demo. It
> includes the Museum, Archive Explorer, Creative Lineage Explorer, Legacy, and
> SECOND HAND views plus operating documents and committed snapshots.

Node.js 22以上で展開先から実行します。

```powershell
node .\serve.mjs
```

`http://127.0.0.1:4173`を開き、Museumから順に進みます。外部network、GitHub
account、tokenは不要です。`build-manifest.json`と`SHA256SUMS`はpack内部fileを検証
します。

録画は同梱されていません。`recording-manifest.json`の`not-recorded`を、録画済みと
読み替えないでください。
