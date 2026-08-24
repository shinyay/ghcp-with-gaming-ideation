# Technical constraints

- 60 Hz fixed tick
- Simulation stateはsafe integerのみ
- runtimeの乱数、時計、三角関数、平方根へ依存しない
- fixed seed PRNGのseedとsequenceをstateへ含める
- entity/event処理順はstable ID順
- canonical serializationのfield/array順を固定
- Canvas renderer、audio、frame accumulatorをhash対象から除外

Phase 2の数値は架空のlogical unitsで、実在boardやCPUの再現ではない。
