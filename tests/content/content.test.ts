import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import test from "node:test";
import {
  hashCanonical,
  serializeIntegerState
} from "@star-relay/game-core";
import { parse as parseYaml } from "yaml";

test("canonical integer serializer fixes field order and rejects floats", () => {
  const serialized = serializeIntegerState(1, [
    ["tick", 60],
    ["owner", 1],
    ["events", [2, 4, 8]]
  ]);

  assert.equal(serialized, "schema=1|tick=60|owner=1|events=[2,4,8]");
  assert.equal(hashCanonical(serialized), hashCanonical(serialized));
  assert.throws(
    () => serializeIntegerState(1, [["tick", 1.5]]),
    /safe integer/
  );
});

test("browser source has no GitHub API or token dependency", async () => {
  const sources = await Promise.all(
    [
      "apps/demo-site/src/main.ts",
      "apps/demo-site/src/legacy-view.ts",
      "apps/demo-site/src/second-hand-view.ts",
      "apps/demo-site/src/lineage-view.ts"
    ].map((path) => readFile(path, "utf8"))
  );
  const joined = sources.join("\n");

  assert.doesNotMatch(joined, /api\.github\.com/);
  assert.doesNotMatch(joined, /\bfetch\s*\(/);
  assert.doesNotMatch(joined, /github_pat_|ghp_/);
});

test("directly authored fixtures never claim source or transform execution", async () => {
  const catalog = parseYaml(
    await readFile("archive/catalog/assets.yaml", "utf8")
  ) as {
    readonly assets: readonly {
      readonly derivation_kind: string;
      readonly src_sha256: string | null;
      readonly transform_id: string | null;
      readonly transform_version: string | null;
      readonly transform_config_sha256: string | null;
    }[];
  };

  assert.equal(catalog.assets.length, 6);
  for (const asset of catalog.assets) {
    assert.equal(asset.derivation_kind, "directly_authored_fixture");
    assert.equal(asset.src_sha256, null);
    assert.equal(asset.transform_id, null);
    assert.equal(asset.transform_version, null);
    assert.equal(asset.transform_config_sha256, null);
  }
});
