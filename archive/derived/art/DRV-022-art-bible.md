---
id: DRV-022
origin_kind: synthetic_fixture
classification: demo-safe
fictional_source_created_at: 1998-05-08
---

# Art bible excerpt

この文書は架空のアート指針fixtureである。実在作品のパレット、書体、素材を参照しない。

## Palette

| Slot | Role | Value |
|---|---|---|
| PAL-00 | 背景最暗部 | #05070d |
| PAL-01 | 背景中間 | #101a2c |
| PAL-02 | Mirror | #3f6ea8 |
| PAL-03 | 敵基調 | #a2405f |
| PAL-04 | Core本体 | #ffe9a8 |
| PAL-05 | Core軌跡 | #ffb347 |
| PAL-06 | Relay Point | #63e0c8 |
| PAL-07 | HUD文字 | #e8f0ff |

## Shape language

- Coreは常に円。角を持たせない。保持中のみ外周に静止した輪を1本足す。
- Mirrorは直線と45度のみ。曲面は使わない。
- 敵は多角形。link関係にある個体は同一の輪郭幅を共有する。
- Playerは三角形の先端で向きを示す。

## HUD layout

- 有効表示幅320px前提で構成する。左上にSCORE、右上にCHAIN、下辺中央にCHARGE。
- CHAIN欄は2桁分の幅で確保する。桁あふれ時の表示は本書の対象外。
- 画面を左右に分ける仕切り表現は使わない。

## Not covered here

- sprite bankの実配置とROM上の残存状況
- 表示幅が320pxに決まった経緯
