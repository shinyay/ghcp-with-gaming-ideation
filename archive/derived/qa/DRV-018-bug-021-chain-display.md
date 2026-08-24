---
id: DRV-018
origin_kind: synthetic_fixture
classification: demo-safe
fictional_source_created_at: 1998-08-24
---

# BUG-021 CHAIN display cap

この文書は架空のQA個票fixtureである。報告者、担当者、承認者の氏名は記録しない。

## Report

- Area: ui
- Severity: minor
- Status: closed
- Resolution: wont_fix

## Observed

`CHAIN`表示が30で更新を止める。scoreとChargeの加算は30を超えても継続する。

## Investigation

- 表示routineは2桁table参照で実装されており、31以上のglyph indexを持たない。
- 内部counterの上限値は本個票に記載しない。仕様書側の記述を参照すること。
- 表示と内部値が一致しない区間があることだけを確認した。

## Resolution note

glyph table拡張はcharacter ROM配置の再調整を伴うため、この時期の修正対象外とした。
公開資料の記載をどう扱うかは本個票の範囲外。

## Not established here

- 表示上限と内部上限の差が丸めか、非公開か、version差か、仕様漏れかの分類
- 公開manualの記載根拠
