# Transform boundary

Phase 0〜2の6件は`directly_authored_fixture`であり、原本から変換していません。
Reproducible inputとtransform toolが存在するまで、`src_sha256`、`transform_id`、
`transform_version`、`transform_config_sha256`は`null`のままにします。

このdirectoryは将来のtransform contract用placeholderで、実行済み処理を表しません。
