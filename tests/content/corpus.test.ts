import { readdir, readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import test from "node:test";
import { join } from "node:path";
import {
  LEGACY_FREE_SPEED,
  LEGACY_HELD_SPEED,
  LEGACY_OUTBOUND_VX,
  LEGACY_RETURN_VX
} from "@star-relay/legacy-1998";
import { parse as parseYaml } from "yaml";
import {
  assertLocatorTarget,
  citableNames,
  escapeRegExp,
  markdownHeadingSlugs,
  mentionsName,
  parseCsvFixture,
  resolveJsonPointer,
  resolveLocator,
  schemesFor,
  slugifyHeading,
  splitLocator
} from "../../scripts/lib/locator";

interface AssetRecord {
  readonly id: string;
  readonly path: string;
  readonly source_ref: string;
  readonly classification: string;
  readonly origin_kind: string;
  readonly locator_grammar_version: "sr-loc/v1" | "sr-loc/v2";
  readonly locators: readonly string[];
  readonly ai_eligible: boolean;
}

interface EvidenceReference {
  readonly asset_id: string;
  readonly locator: string;
}

interface EvidencePacket {
  readonly id: string;
  readonly sufficiency: string;
  readonly single_asset_is_insufficient: boolean;
  readonly reading_set: readonly EvidenceReference[];
}

async function readCatalog(): Promise<readonly AssetRecord[]> {
  const catalog = parseYaml(
    await readFile("archive/catalog/assets.yaml", "utf8")
  ) as { readonly assets: readonly AssetRecord[] };
  return catalog.assets;
}

async function readPackets(): Promise<readonly EvidencePacket[]> {
  const directory = "archive/evidence-packets";
  const names = (await readdir(directory)).filter((name) =>
    name.endsWith(".json")
  );
  return Promise.all(
    names.map(
      async (name) =>
        JSON.parse(
          await readFile(join(directory, name), "utf8")
        ) as EvidencePacket
    )
  );
}

function categoryOf(path: string): string {
  return path.split("/")[2] ?? "";
}

test("heading slugs drop non-ASCII and collapse separators", () => {
  assert.equal(slugifyHeading("Two-body protocol"), "two-body-protocol");
  assert.equal(slugifyHeading("ROM budget"), "rom-budget");
  assert.equal(slugifyHeading("Zero lap  conditions"), "zero-lap-conditions");
  assert.equal(slugifyHeading("受領 Return voice cue"), "return-voice-cue");

  const slugs = markdownHeadingSlugs("# Title\n\n## Runs\ntext\n### Disposition\n");
  assert.deepEqual([...slugs].sort(), ["disposition", "runs", "title"]);
});

test("csv fixtures ignore comment lines and expose the first column as a key", () => {
  const table = parseCsvFixture(
    "# origin_kind: synthetic_fixture\nid,value\nA-1,10\nA-2,20\n"
  );
  assert.deepEqual(table.header, ["id", "value"]);
  assert.equal(table.rows.length, 2);
  assert.equal(table.rows[1]?.[0], "A-2");
});

test("json pointers resolve nested members and reject missing ones", () => {
  const document = { a: { b: [1, 2] } };
  assert.deepEqual(resolveJsonPointer(document, "/a/b"), [1, 2]);
  assert.equal(resolveJsonPointer(document, "/a/b/1"), 2);
  assert.equal(resolveJsonPointer(document, "/a/missing"), undefined);
  assert.equal(resolveJsonPointer(document, "/a/b/9"), undefined);
});

test("c locators match whole identifiers and real define directives", () => {
  const source = "#define SCREEN_W 320\nvoid core_throw_step(void) {}\n";
  assert.equal(resolveLocator("c:define/SCREEN_W", source, "sr-loc/v2"), true);
  assert.equal(resolveLocator("c:define/SCREEN", source, "sr-loc/v2"), false);
  assert.equal(
    resolveLocator("c:symbol/core_throw_step", source, "sr-loc/v2"),
    true
  );
  assert.equal(resolveLocator("c:symbol/core_throw", source, "sr-loc/v2"), false);
});

test("c locator targets cannot smuggle a regular expression", () => {
  const source = "#define SCREEN_W 320\nvoid core_throw_step(void) {}\n";

  for (const hostile of [
    "c:symbol/.*",
    "c:symbol/core_.*",
    "c:define/.*",
    "c:symbol/[A-Z]+",
    "c:define/SCREEN_W|ANYTHING"
  ]) {
    assert.throws(
      () => resolveLocator(hostile, source, "sr-loc/v2"),
      /must be a C identifier/,
      `${hostile} should be rejected before it reaches a regular expression`
    );
  }
});

test("malformed locator targets are rejected instead of crashing", () => {
  const source = "#define SCREEN_W 320\n";

  for (const malformed of ["c:symbol/a{2,", "c:define/(", "c:symbol/x)"]) {
    assert.throws(
      () => resolveLocator(malformed, source, "sr-loc/v2"),
      /must be a C identifier/
    );
  }
  assert.throws(
    () => resolveLocator("md:heading/Not A Slug", "# Not A Slug\n", "sr-loc/v2"),
    /kebab-case slug/
  );
  assert.throws(
    () => resolveLocator("json:pointer/no-leading-slash", "{}", "sr-loc/v2"),
    /start with a slash/
  );
  assert.equal(escapeRegExp("a.*b"), "a\\.\\*b");
  assert.equal(assertLocatorTarget("c:symbol", "partner_aim"), "partner_aim");
});

test("a csv column locator requires real data rows, not just a header", () => {
  const headerOnly = "# comment\nid,build_flag\n";
  const withRows = "# comment\nid,build_flag\nST-01,ship\n";

  assert.equal(
    resolveLocator("csv:column/build_flag", headerOnly, "sr-loc/v2"),
    false
  );
  assert.equal(
    resolveLocator("csv:column/build_flag", withRows, "sr-loc/v2"),
    true
  );
});

test("statement scope is checked against the names a citation reaches", () => {
  const csv = "# c\nid,build_flag,note\nEN-05,ship,a\nEN-06,unused,b\n";
  const csvNames = citableNames(csv, "text/csv");
  assert.deepEqual([...csvNames.rows], ["EN-05", "EN-06"]);
  assert.ok(csvNames.columns.includes("build_flag"));
  assert.ok(!csvNames.columns.includes("id"));

  const cNames = citableNames("#define SCREEN_W 320\n#define UNITS_PER_PX 16\n", "text/x-c");
  assert.deepEqual([...cNames.macros], ["SCREEN_W", "UNITS_PER_PX"]);

  assert.equal(mentionsName("EN-06 が同じ値を持つ", "EN-06"), true);
  assert.equal(mentionsName("EN-060 は別行である", "EN-06"), false);
  assert.equal(mentionsName("UNITS_PER_PX は 16", "UNITS_PER_PX"), true);
  assert.equal(mentionsName("SCREEN_WIDTH は別名", "SCREEN_W"), false);
});

test("sr-loc/v1 rejects schemes introduced by sr-loc/v2", () => {
  assert.equal(schemesFor("sr-loc/v1").has("csv:row"), false);
  assert.equal(schemesFor("sr-loc/v2").has("csv:row"), true);
  assert.throws(
    () => resolveLocator("csv:row/EN-05", "id\nEN-05\n", "sr-loc/v1"),
    /not part of sr-loc\/v1/
  );
  assert.deepEqual(splitLocator("json:pointer//events"), {
    scheme: "json:pointer",
    target: "/events"
  });
});

test("the catalog and the derived tree describe the same files", async () => {
  const assets = await readCatalog();
  const catalogPaths = new Set(assets.map((asset) => asset.path));

  async function walk(directory: string): Promise<string[]> {
    const entries = await readdir(directory, { withFileTypes: true });
    const files: string[] = [];
    for (const entry of entries) {
      const path = `${directory}/${entry.name}`;
      if (entry.isDirectory()) {
        files.push(...(await walk(path)));
      } else {
        files.push(path);
      }
    }
    return files;
  }

  const files = await walk("archive/derived");
  assert.equal(files.length, assets.length);
  for (const file of files) {
    assert.ok(catalogPaths.has(file), `${file} is not catalogued`);
  }
});

test("the corpus covers every planned archive category", async () => {
  const assets = await readCatalog();
  const categories = new Set(assets.map((asset) => categoryOf(asset.path)));

  for (const expected of [
    "documents",
    "spreadsheets",
    "manuals",
    "qa",
    "art",
    "audio",
    "source",
    "replay"
  ]) {
    assert.ok(categories.has(expected), `missing category ${expected}`);
  }
});

test("every asset stays demo-safe, synthetic and AI eligible", async () => {
  const assets = await readCatalog();
  for (const asset of assets) {
    assert.equal(asset.classification, "demo-safe");
    assert.equal(asset.origin_kind, "synthetic_fixture");
    assert.equal(asset.ai_eligible, true);
    assert.ok(asset.locators.length > 0);
  }
});

test("no evidence packet can be answered from a single asset", async () => {
  const assets = await readCatalog();
  const byId = new Map(assets.map((asset) => [asset.id, asset]));
  const packets = await readPackets();

  assert.equal(packets.length, 7);
  for (const packet of packets) {
    assert.equal(packet.sufficiency, "cross-asset");
    assert.equal(packet.single_asset_is_insufficient, true);

    const assetIds = new Set(packet.reading_set.map((entry) => entry.asset_id));
    const categories = new Set(
      [...assetIds].map((id) => categoryOf(byId.get(id)?.path ?? ""))
    );    const sources = new Set(
      [...assetIds].map((id) => byId.get(id)?.source_ref ?? "")
    );

    assert.ok(assetIds.size >= 3, `${packet.id} reads ${assetIds.size} assets`);
    assert.ok(categories.size >= 2, `${packet.id} stays in one category`);
    assert.ok(sources.size >= 2, `${packet.id} stays in one planned original`);

    for (const id of assetIds) {
      const owned = packet.reading_set.filter(
        (entry) => entry.asset_id === id
      ).length;
      assert.ok(
        owned < packet.reading_set.length,
        `${packet.id} is fully covered by ${id}`
      );
    }
  }
});

test("the seven planned discoveries each have a packet", async () => {
  const packets = await readPackets();
  assert.deepEqual(
    packets.map((packet) => packet.id).sort(),
    [
      "EVP-001",
      "EVP-002",
      "EVP-003",
      "EVP-004",
      "EVP-005",
      "EVP-006",
      "EVP-007"
    ]
  );
});

test("the 1998 playable uses the speed table registered in the archive", async () => {
  const registered = JSON.parse(
    await readFile("archive/derived/spreadsheets/DRV-004-relay-master.json", "utf8")
  ) as {
    readonly tables: {
      readonly core_speed: {
        readonly holder_units_per_tick: number;
        readonly non_holder_units_per_tick: number;
        readonly outbound_units_per_tick: number;
        readonly return_units_per_tick: number;
      };
    };
  };
  const speed = registered.tables.core_speed;

  assert.equal(LEGACY_HELD_SPEED, speed.holder_units_per_tick);
  assert.equal(LEGACY_FREE_SPEED, speed.non_holder_units_per_tick);
  assert.equal(LEGACY_OUTBOUND_VX, speed.outbound_units_per_tick);
  assert.equal(Math.abs(LEGACY_RETURN_VX), speed.return_units_per_tick);
});

test("no fixture states a cross-asset conclusion on its own", async () => {
  const guard = JSON.parse(
    await readFile("governance/disclosure-guard.json", "utf8")
  ) as { readonly derived_forbidden_substrings: readonly string[] };
  const assets = await readCatalog();

  for (const asset of assets) {
    const content = await readFile(asset.path, "utf8");
    for (const forbidden of guard.derived_forbidden_substrings) {
      assert.ok(
        !content.includes(forbidden),
        `${asset.id} discloses ${forbidden}`
      );
    }
  }
});

test("archive dates stay metadata and are never presented as git history", async () => {
  const timeline = JSON.parse(
    await readFile("archive/catalog/timeline.json", "utf8")
  ) as {
    readonly date_semantics: string;
    readonly entries: readonly { readonly asset_id: string }[];
  };
  const assets = await readCatalog();

  assert.equal(timeline.date_semantics, "fictional-metadata-only");
  assert.equal(timeline.entries.length, assets.length);
});

test("research records only cite locators declared by the catalog", async () => {
  const assets = await readCatalog();
  const byId = new Map(assets.map((asset) => [asset.id, asset]));

  async function walk(directory: string): Promise<string[]> {
    const entries = await readdir(directory, { withFileTypes: true });
    const files: string[] = [];
    for (const entry of entries) {
      const path = `${directory}/${entry.name}`;
      if (entry.isDirectory()) {
        files.push(...(await walk(path)));
      } else if (entry.name.endsWith(".json")) {
        files.push(path);
      }
    }
    return files;
  }

  const files = [
    ...(await walk("research/claims")),
    ...(await walk("research/conflicts")),
    ...(await walk("research/findings")),
    ...(await walk("research/hypotheses"))
  ];
  assert.ok(files.length >= 26);

  for (const file of files) {
    const body = JSON.parse(await readFile(file, "utf8")) as {
      readonly asset_id?: string;
      readonly locators?: readonly string[];
      readonly sides?: readonly {
        readonly asset_id: string;
        readonly locators: readonly string[];
      }[];
      readonly evidence?: readonly EvidenceReference[];
      readonly candidate_evidence?: readonly EvidenceReference[];
    };
    const references: EvidenceReference[] = [
      ...(body.evidence ?? []),
      ...(body.candidate_evidence ?? [])
    ];

    for (const side of body.sides ?? []) {
      for (const locator of side.locators) {
        references.push({ asset_id: side.asset_id, locator });
      }
    }
    if (body.asset_id !== undefined && body.locators !== undefined) {
      for (const locator of body.locators) {
        references.push({ asset_id: body.asset_id, locator });
      }
    }

    assert.ok(references.length > 0, `${file} cites no evidence`);
    for (const reference of references) {
      const asset = byId.get(reference.asset_id);
      assert.ok(asset, `${file} cites unknown ${reference.asset_id}`);
      assert.ok(
        asset.locators.includes(reference.locator),
        `${file} cites undeclared ${reference.locator}`
      );
    }
  }
});
