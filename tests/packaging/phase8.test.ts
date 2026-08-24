import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";
import Ajv from "ajv";
import { parse as parseYaml } from "yaml";
import {
  expectedReleaseInventory,
  validateReleaseInventory
} from "../../scripts/lib/release-inventory";

const readJson = async <T>(path: string): Promise<T> =>
  JSON.parse(await readFile(path, "utf8")) as T;

test("committed Archive snapshot is the exact eligible 30-DRV projection", async () => {
  const catalog = parseYaml(
    await readFile("archive/catalog/assets.yaml", "utf8")
  ) as {
    readonly assets: readonly {
      readonly id: string;
      readonly classification: string;
      readonly ai_eligible: boolean;
      readonly package_allowed: boolean;
    }[];
  };
  const snapshot = await readJson<{
    readonly asset_count: number;
    readonly assets: readonly { readonly id: string }[];
  }>("demo/offline-snapshots/archive-assets.json");
  const eligible = catalog.assets
    .filter(
      (asset) =>
        asset.classification === "demo-safe" &&
        asset.ai_eligible &&
        asset.package_allowed
    )
    .map((asset) => asset.id);

  assert.equal(snapshot.asset_count, 30);
  assert.deepEqual(
    snapshot.assets.map((asset) => asset.id),
    eligible
  );
  assert.equal(new Set(eligible).size, eligible.length);
});

test("Lineage snapshot contains only explicitly allowlisted nodes and objects", async () => {
  const [allowlist, snapshot] = await Promise.all([
    readJson<{
      readonly lineage_node_ids: readonly string[];
      readonly additional_nodes: readonly { readonly id: string }[];
      readonly github_object_refs: readonly { readonly stable_id: string }[];
      readonly external_github_objects: readonly { readonly stable_id: string }[];
      readonly forbidden_github_fields: readonly string[];
    }>("ops/packaging/demo-snapshot-allowlist.json"),
    readJson<{
      readonly browser_network: string;
      readonly nodes: readonly { readonly id: string }[];
      readonly github_objects: readonly { readonly stable_id: string }[];
    }>("demo/offline-snapshots/lineage-snapshot.json")
  ]);

  assert.equal(snapshot.browser_network, "forbidden");
  assert.deepEqual(
    snapshot.nodes.map((node) => node.id).sort(),
    [
      ...allowlist.lineage_node_ids,
      ...allowlist.additional_nodes.map((node) => node.id)
    ].sort()
  );
  assert.deepEqual(
    snapshot.github_objects.map((object) => object.stable_id),
    [
      ...allowlist.github_object_refs.map((object) => object.stable_id),
      ...allowlist.external_github_objects.map((object) => object.stable_id)
    ]
  );
  const serialized = JSON.stringify(snapshot.github_objects);
  for (const field of allowlist.forbidden_github_fields) {
    assert.doesNotMatch(serialized, new RegExp(`"${field}"`, "i"));
  }
});

test("checkpoint manifest points to real commits and the committed snapshot", async () => {
  const manifest = await readJson<{
    readonly lineage_snapshot_sha256: string;
    readonly checkpoints: readonly {
      readonly tag: string;
      readonly kind: string;
      readonly tag_object: string;
      readonly commit: string;
    }[];
  }>("demo/checkpoints/manifest.json");
  const snapshot = await readFile(
    "demo/offline-snapshots/lineage-snapshot.json"
  );
  assert.equal(
    manifest.lineage_snapshot_sha256,
    createHash("sha256").update(snapshot).digest("hex")
  );
  assert.deepEqual(
    manifest.checkpoints.map((checkpoint) => checkpoint.tag),
    [
      "checkpoint/archive",
      "checkpoint/understand",
      "checkpoint/decide",
      "checkpoint/build"
    ]
  );
  for (const checkpoint of manifest.checkpoints) {
    assert.equal(checkpoint.kind, "annotated");
    assert.equal(
      execFileSync("git", ["cat-file", "-t", `refs/tags/${checkpoint.tag}`], {
        encoding: "utf8"
      }).trim(),
      "tag"
    );
    assert.equal(
      execFileSync("git", ["rev-parse", `refs/tags/${checkpoint.tag}`], {
        encoding: "utf8"
      }).trim(),
      checkpoint.tag_object
    );
    assert.equal(
      execFileSync("git", ["rev-list", "-n", "1", checkpoint.tag], {
        encoding: "utf8"
      }).trim(),
      checkpoint.commit
    );
    assert.equal(
      execFileSync("git", ["cat-file", "-t", checkpoint.commit], {
        encoding: "utf8"
      }).trim(),
      "commit"
    );
  }
});

test("release workflow stays manual until tag protection is verified", async () => {
  const workflowText = await readFile(
    ".github/workflows/package-private-release.yml",
    "utf8"
  );
  const workflow = parseYaml(workflowText) as {
    readonly on: Readonly<Record<string, unknown>>;
    readonly jobs: Readonly<Record<string, unknown>>;
  };
  assert.deepEqual(Object.keys(workflow.on), ["workflow_dispatch"]);
  assert.doesNotMatch(workflowText, /\bpull_request\s*:/);
  assert.doesNotMatch(workflowText, /deploy-pages|pages:write|github-pages/i);
  assert.match(workflowText, /verify-release-tag/);
  assert.match(workflowText, /gh release (create|upload)/);

  const allowlist = await readJson<{
    readonly repository_access_required: string;
    readonly pages_publication: string;
    readonly packages: readonly { readonly name: string }[];
  }>("ops/packaging/release-allowlist.json");
  assert.equal(allowlist.repository_access_required, "private");
  assert.equal(allowlist.pages_publication, "forbidden");
  assert.deepEqual(
    allowlist.packages.map((entry) => entry.name),
    [
      "demo-site.zip",
      "star-relay-1998-playable.zip",
      "second-hand-vertical-slice.zip",
      "offline-demo-pack.zip"
    ]
  );
});

test("recorded fallback remains an explicit empty placeholder", async () => {
  const manifest = await readJson<{
    readonly status: string;
    readonly recording_file: string | null;
    readonly sha256: string | null;
    readonly duration_seconds: number | null;
  }>("demo/recording-manifest.json");
  assert.deepEqual(manifest, {
    ...manifest,
    status: "not-recorded",
    recording_file: null,
    sha256: null,
    duration_seconds: null
  });
});

test("release inventory rejects missing, duplicate, and mismatched artifacts", () => {
    assert.deepEqual(validateReleaseInventory(expectedReleaseInventory), []);
    assert.match(
      validateReleaseInventory(expectedReleaseInventory.slice(0, 3)).join("\n"),
      /Expected 4 release artifacts/
    );
    assert.match(
      validateReleaseInventory([
        expectedReleaseInventory[0]!,
        expectedReleaseInventory[0]!,
        expectedReleaseInventory[2]!,
        expectedReleaseInventory[3]!
      ]).join("\n"),
      /names must be unique/
    );
    assert.match(
      validateReleaseInventory([
        expectedReleaseInventory[0]!,
        {
          ...expectedReleaseInventory[1]!,
          start_anchor: "#museum"
        },
        expectedReleaseInventory[2]!,
        expectedReleaseInventory[3]!
      ]).join("\n"),
      /star-relay-1998-playable\.zip/
    );
});

test("release manifest schema rejects duplicate, missing, and misrouted artifacts", async () => {
    const schema = await readJson<object>(
      "schemas/release-build-manifest.schema.json"
    );
    const validate = new Ajv({ allErrors: true, strict: true }).compile(schema);
    const artifacts = expectedReleaseInventory.map((entry) => ({
      ...entry,
      sha256: "a".repeat(64),
      bytes: 1
    }));
    const manifest = {
      schema_version: 1,
      release_id: "REL-001",
      classification: "demo-safe",
      repository_access_required: "private",
      pages_published: false,
      source_commit: "b".repeat(40),
      lineage_snapshot_sha256: "c".repeat(64),
      artifacts
    };
    assert.equal(validate(manifest), true, JSON.stringify(validate.errors));
    assert.equal(validate({ ...manifest, artifacts: artifacts.slice(0, 3) }), false);
    assert.equal(
      validate({
        ...manifest,
        artifacts: [artifacts[0], artifacts[0], artifacts[2], artifacts[3]]
      }),
      false
    );
    assert.equal(
      validate({
        ...manifest,
        artifacts: [
          artifacts[0],
          { ...artifacts[1], start_anchor: "#museum" },
          artifacts[2],
          artifacts[3]
        ]
      }),
      false
    );
});

test("demo reset rebuilds the Release ZIP required by offline smoke", async () => {
    const packageJson = await readJson<{
      readonly scripts: Readonly<Record<string, string>>;
    }>("package.json");
    assert.match(packageJson.scripts["demo:reset"] ?? "", /package:release/);
    assert.match(packageJson.scripts["demo:reset"] ?? "", /verify:release/);
    assert.match(packageJson.scripts["package:release"] ?? "", /npm run build/);
    assert.match(packageJson.scripts["package:release"] ?? "", /package:offline/);
    assert.match(
      await readFile("scripts/serve-offline.mjs", "utf8"),
      /dist\/offline-demo-pack\/serve\.mjs/
    );
});
