---
id: DRV-025
origin_kind: synthetic_fixture
classification: demo-safe
fictional_source_created_at: 1998-04-22
---

# Sound direction excerpt

この文書は架空の音響指示書fixtureである。実在の楽曲、声、音源、演者を参照しない。
音声は合成前提の指示であり、実在人物の収録を意味しない。

## BGM layers

BGMは3層で構成し、Chain値によって上位層を開く。

| Layer | 内容 | 開放条件 |
|---|---|---|
| L1 | 低域pad | 常時 |
| L2 | 中域arpeggio | Chain 8以上 |
| L3 | 高域lead | Chain 16以上 |

## SE list

| SE ID | 用途 |
|---|---|
| SE-THROW | 投擲 |
| SE-MIRROR | 反射 |
| SE-PIERCE | 貫通 |
| SE-CONNECT | Relay Point接続 |
| SE-CATCH | 通常受領 |
| SE-PERFECT | PERFECT CATCH |

## Return voice cue

受領の瞬間に重ねる音声cue `RETURN` を計画する。

- 二声部構成とする。第一声部 `VOX_RETURN_A` を主、第二声部 `VOX_RETURN_B` を応答とする。
- 第一声部は受領frameに同期させ、第二声部は6 frame遅らせる。
- 第二声部だけが鳴った場合、応答だけが残るため意味が通らない。避けること。
- 声部の長さと容量見積りは音響側の作業表に持つ。本書には記載しない。

## Not covered here

- 最終buildでのcue採否
- ROM allocationの結果
- 未使用素材の扱い
