import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import test from "node:test";
import { parse as parseYaml } from "yaml";
import { parseCsvFixture } from "../../scripts/lib/locator";

/**
 * These tests prove that each evidence packet's reading set actually exposes the
 * quantities a reader needs, and that no single asset exposes all of them. They
 * deliberately assert availability and separation, never the conclusion itself.
 */

interface Signal {
  readonly asset_id: string;
  readonly label: string;
  readonly present: (content: string) => boolean;
}

const contentCache = new Map<string, string>();

async function assetContent(assetId: string): Promise<string> {
  if (!contentCache.has(assetId)) {
    const catalog = parseYaml(
      await readFile("archive/catalog/assets.yaml", "utf8")
    ) as { readonly assets: readonly { id: string; path: string }[] };
    for (const asset of catalog.assets) {
      contentCache.set(asset.id, await readFile(asset.path, "utf8"));
    }
  }
  const content = contentCache.get(assetId);
  assert.ok(content, `${assetId} is not catalogued`);
  return content;
}

function jsonField(path: string): (content: string) => boolean {
  return (content) => {
    const document = JSON.parse(content) as unknown;
    let current: unknown = document;
    for (const token of path.split(".")) {
      if (current === null || typeof current !== "object") {
        return false;
      }
      current = (current as Record<string, unknown>)[token];
    }
    return current !== undefined;
  };
}

function csvRows(minimum: number, predicate: (row: readonly string[]) => boolean) {
  return (content: string) =>
    parseCsvFixture(content).rows.filter(predicate).length >= minimum;
}

const PACKET_SIGNALS: Record<string, readonly Signal[]> = {
  "EVP-001": [
    { asset_id: "DRV-012", label: "older field geometry", present: jsonField("field_geometry.field_width_units") },
    { asset_id: "DRV-012", label: "older speed set", present: jsonField("core_speed.outbound_units_per_tick") },
    { asset_id: "DRV-004", label: "registered speed set", present: jsonField("tables.core_speed.outbound_units_per_tick") },
    { asset_id: "DRV-027", label: "implementation field width", present: (c) => /#define\s+SCREEN_W\s+\d+/.test(c) },
    { asset_id: "DRV-027", label: "implementation unit convention", present: (c) => /#define\s+UNITS_PER_PX\s+\d+/.test(c) },
    { asset_id: "DRV-027", label: "implementation speed constant", present: (c) => /#define\s+CORE_OUTBOUND_STEP\s+\d+/.test(c) },
    { asset_id: "DRV-011", label: "recorded width change", present: (c) => c.includes("384") && c.includes("320") }
  ],
  "EVP-002": [
    { asset_id: "DRV-008", label: "deferred attachments", present: (c) => c.includes("ATT-1") && c.includes("ATT-3") },
    { asset_id: "DRV-016", label: "mode rating aggregate", present: (c) => c.includes("2P") && c.includes("1P") },
    { asset_id: "DRV-020", label: "shipped panel count", present: (c) => c.includes("操作パネル") },
    { asset_id: "DRV-011", label: "layout consequence", present: (c) => c.includes("分割") },
    { asset_id: "DRV-024", label: "layout revision history", present: (c) => c.includes("split_vertical") && c.includes("single_full") }
  ],
  "EVP-003": [
    { asset_id: "DRV-007", label: "1996 symbol numbering", present: (c) => /SYM-1996-\d{3}/.test(c) },
    { asset_id: "DRV-029", label: "indexed symbol identity", present: jsonField("symbols.partner_aim.symbol_id") },
    { asset_id: "DRV-029", label: "indexed module history", present: jsonField("symbols.partner_aim.module_history") },
    { asset_id: "DRV-028", label: "call site", present: (c) => /partner_aim\s*\(/.test(c) },
    { asset_id: "DRV-008", label: "module handling policy", present: (c) => c.includes("p2系module") }
  ],
  "EVP-004": [
    { asset_id: "DRV-009", label: "protocol text", present: (c) => c.includes("Two-body protocol") },
    { asset_id: "DRV-009", label: "narrative disposition", present: (c) => c.includes("不採用") },
    { asset_id: "DRV-013", label: "paired link groups", present: csvRows(2, (row) => row[5] === "LG-1") },
    { asset_id: "DRV-029", label: "link evaluation rule", present: jsonField("symbols.enemy_paired_bind_update.summary_ja") },
    { asset_id: "DRV-010", label: "ending branch condition", present: (c) => c.includes("TRUE END") }
  ],
  "EVP-005": [
    { asset_id: "DRV-021", label: "published figures", present: (c) => (JSON.parse(c) as { ocr_lines: { text: string }[] }).ocr_lines.filter((line) => /\d/.test(line.text)).length >= 3 },
    { asset_id: "DRV-005", label: "published chain figure", present: (c) => c.includes("CHAIN 30") },
    { asset_id: "DRV-003", label: "internal chain figure", present: (c) => c.includes("32") },
    { asset_id: "DRV-010", label: "documented stage count", present: (c) => c.includes("ST-06") },
    { asset_id: "DRV-014", label: "table row count", present: csvRows(8, () => true) },
    { asset_id: "DRV-012", label: "superseded numbers", present: jsonField("core_speed") }
  ],
  "EVP-006": [
    { asset_id: "DRV-021", label: "published final-stage figure", present: (c) => c.includes("150") },
    { asset_id: "DRV-010", label: "specified limit handling", present: (c) => c.includes("制限時間") },
    { asset_id: "DRV-019", label: "measured run table", present: (c) => [...c.matchAll(/\|\s*R-\d+\s*\|/g)].length === 10 },
    { asset_id: "DRV-019", label: "measured statistics", present: (c) => c.includes("平均") },
    { asset_id: "DRV-030", label: "replay tick conversion", present: jsonField("capture.ticks_per_second") },
    { asset_id: "DRV-030", label: "replay outcome", present: jsonField("expected_outcome.timer_expired") },
    { asset_id: "DRV-017", label: "qa disposition", present: csvRows(1, (row) => row[0] === "BUG-047") }
  ],
  "EVP-007": [
    { asset_id: "DRV-025", label: "planned voice parts", present: (c) => c.includes("VOX_RETURN_A") && c.includes("VOX_RETURN_B") },
    { asset_id: "DRV-026", label: "rom capacity", present: jsonField("capacity_bytes") },
    { asset_id: "DRV-026", label: "allocation table", present: jsonField("entries") },
    { asset_id: "DRV-026", label: "remaining space", present: jsonField("totals.free_bytes") },
    { asset_id: "DRV-011", label: "sound rom budget", present: (c) => c.includes("Sound ROM") },
    { asset_id: "DRV-017", label: "qa disposition", present: csvRows(1, (row) => row[0] === "BUG-063") }
  ]
};

test("every planned discovery has a signal set", () => {
  assert.deepEqual(Object.keys(PACKET_SIGNALS).sort(), [
    "EVP-001",
    "EVP-002",
    "EVP-003",
    "EVP-004",
    "EVP-005",
    "EVP-006",
    "EVP-007"
  ]);
});

for (const [packetId, signals] of Object.entries(PACKET_SIGNALS)) {
  test(`${packetId} reading set exposes every quantity a reader needs`, async () => {
    for (const signal of signals) {
      const content = await assetContent(signal.asset_id);
      assert.ok(
        signal.present(content),
        `${packetId} cannot read ${signal.label} from ${signal.asset_id}`
      );
    }
  });

  test(`${packetId} signals are spread across assets`, async () => {
    const owners = new Set(signals.map((signal) => signal.asset_id));
    assert.ok(owners.size >= 3, `${packetId} concentrates signals in ${owners.size} assets`);

    for (const owner of owners) {
      const owned = signals.filter((signal) => signal.asset_id === owner).length;
      assert.ok(
        owned < signals.length,
        `${packetId} is fully readable from ${owner} alone`
      );
    }
  });

  test(`${packetId} signals match the published reading set`, async () => {
    const packet = JSON.parse(
      await readFile(packetPath(packetId), "utf8")
    ) as { readonly reading_set: readonly { readonly asset_id: string }[] };

    const declared = new Set(packet.reading_set.map((entry) => entry.asset_id));
    for (const signal of signals) {
      assert.ok(
        declared.has(signal.asset_id),
        `${packetId} signal asset ${signal.asset_id} is not in the reading set`
      );
    }
  });
}

function packetPath(packetId: string): string {
  const names: Record<string, string> = {
    "EVP-001": "EVP-001-speed-and-screen-width.json",
    "EVP-002": "EVP-002-player-count-change.json",
    "EVP-003": "EVP-003-return-pass-symbol-origin.json",
    "EVP-004": "EVP-004-two-body-protocol-traces.json",
    "EVP-005": "EVP-005-public-versus-internal-numbers.json",
    "EVP-006": "EVP-006-zero-lap-150-seconds.json",
    "EVP-007": "EVP-007-return-voice-absence.json"
  };
  return `archive/evidence-packets/${names[packetId]}`;
}
