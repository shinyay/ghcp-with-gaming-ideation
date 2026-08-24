# Self-guided demo — five stops

> English summary: A 20-minute, network-optional route through Museum, Archive,
> Creative Lineage, Legacy, and SECOND HAND. No GitHub account is required.

## Start

Repository checkoutでは`npm ci`、`npm run demo:reset`、`npm run serve:offline`を
実行します。展開済み`offline-demo-pack.zip`では、そのdirectoryで次だけを実行します。

```powershell
node .\serve.mjs
```

Open `http://127.0.0.1:4173`.

## 1. Museum (2 minutes)

Read the three layer cards. Confirm that Evidence, Inference, and Proposal are
separate and that the screen reports `0 browser API calls`.

## 2. Archive Explorer (4 minutes)

Search `DRV-003`, inspect its declared locators, then clear the filter and select
`Source projections`. Dates are fixture metadata, not commit dates.

## 3. Creative Lineage Explorer (4 minutes)

Select each layer filter. Follow stable IDs from `DRV-001` to `PLAYABLE-001`.
External links are optional. The `offline:<ID>` resolver remains visible without
network access.

## 4. Legacy Mirror Corridor (4 minutes)

Select **自分でプレイ**, hold <kbd>A</kbd> to preview a route, release to send the
Core, then receive the return. Observe HOLD / BANK / RELAY / RETURN rather than
trying to infer an unstated historical conclusion.

## 5. SECOND HAND (5 minutes)

Complete a handoff in Local 2P or switch to the local AI companion. Observe which
player owns the Core and whether sequence increments. No network multiplayer or
account service is present.

## Finish (1 minute)

Return to Museum. If a surface failed, use
[fallback-matrix.md](fallback-matrix.md). To prepare for the next person, stop
the server. Repository checkoutは`npm run demo:reset`、展開済みpackは未変更のZIPを
新しいdirectoryへ再展開します。
