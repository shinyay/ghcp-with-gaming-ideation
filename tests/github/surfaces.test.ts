import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import Ajv, { type AnySchema } from "ajv";
import addFormats from "ajv-formats";
import { parse as parseYaml } from "yaml";

interface AssetRecord {
  readonly id: string;
  readonly classification: string;
  readonly ai_eligible: boolean;
  readonly locators: readonly string[];
}

interface SurfacesManifest {
  readonly labels: readonly { readonly name: string }[];
  readonly milestones: readonly { readonly stable_id: string; readonly title: string }[];
  readonly issues: readonly {
    readonly stable_id: string;
    readonly title: string;
    readonly parent?: string;
    readonly labels: readonly string[];
    readonly milestone: string;
    readonly evidence: readonly {
      readonly asset_id: string;
      readonly locator: string;
    }[];
  }[];
  readonly discussions: readonly {
    readonly stable_id: string;
    readonly title: string;
  }[];
  readonly project: {
    readonly stable_id: string;
    readonly fields: readonly { readonly name: string }[];
    readonly views: readonly { readonly name: string }[];
  };
  readonly wiki: {
    readonly pages: readonly {
      readonly stable_id: string;
      readonly file: string;
      readonly title: string;
    }[];
  };
}

interface SnapshotAllowlist {
  readonly allowed_top_level: readonly string[];
  readonly allowed_object_fields: readonly string[];
  readonly forbidden_fields: readonly string[];
  readonly milestones: readonly string[];
  readonly issues: readonly string[];
  readonly discussions: readonly string[];
  readonly projects: readonly string[];
  readonly wiki_pages: readonly string[];
}

const readJson = async <T>(path: string): Promise<T> =>
  JSON.parse(await readFile(path, "utf8")) as T;

const collectRelativeFiles = async (
  directory: string,
  prefix = ""
): Promise<string[]> => {
  const files: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(
        ...(await collectRelativeFiles(`${directory}/${entry.name}`, relativePath))
      );
    } else if (entry.isFile()) {
      files.push(relativePath);
    }
  }
  return files;
};

const surfaces = await readJson<SurfacesManifest>("ops/github/surfaces.json");
const allowlist = await readJson<SnapshotAllowlist>(
  "ops/github/snapshot-allowlist.json"
);
const snapshot = await readJson<Record<string, unknown>>(
  "demo/offline-snapshots/github-objects.json"
);
const catalog = parseYaml(
  await readFile("archive/catalog/assets.yaml", "utf8")
) as { readonly assets: readonly AssetRecord[] };

test("seed issue evidence uses only eligible catalog locators", () => {
  const assets = new Map(catalog.assets.map((asset) => [asset.id, asset]));
  const issueIds = new Set<string>();

  for (const issue of surfaces.issues) {
    assert.equal(issueIds.has(issue.stable_id), false, issue.stable_id);
    issueIds.add(issue.stable_id);
    assert.ok(issue.evidence.length >= 2, issue.stable_id);

    for (const reference of issue.evidence) {
      const asset = assets.get(reference.asset_id);
      assert.ok(asset, `${issue.stable_id}: ${reference.asset_id}`);
      assert.equal(asset.classification, "demo-safe");
      assert.equal(asset.ai_eligible, true);
      assert.ok(
        asset.locators.includes(reference.locator),
        `${issue.stable_id}: ${reference.asset_id} / ${reference.locator}`
      );
    }
  }

  for (const issue of surfaces.issues) {
    if (issue.parent) {
      assert.ok(issueIds.has(issue.parent), issue.parent);
    }
  }
});

test("seed objects and snapshot allowlists match exactly", () => {
  assert.deepEqual(
    [...surfaces.milestones.map(({ stable_id }) => stable_id)].sort(),
    [...allowlist.milestones].sort()
  );
  assert.deepEqual(
    [...surfaces.issues.map(({ stable_id }) => stable_id)].sort(),
    [...allowlist.issues].sort()
  );
  assert.deepEqual(
    [...surfaces.discussions.map(({ stable_id }) => stable_id)].sort(),
    [...allowlist.discussions].sort()
  );
  assert.deepEqual([surfaces.project.stable_id], [...allowlist.projects]);
  assert.deepEqual(
    [...surfaces.wiki.pages.map(({ stable_id }) => stable_id)].sort(),
    [...allowlist.wiki_pages].sort()
  );
});

test("GitHub object snapshot conforms to the strict schema", async () => {
  const ajv = new Ajv({ allErrors: true, strict: true });
  addFormats(ajv);
  const schema = await readJson<AnySchema>(
    "schemas/github-object-snapshot.schema.json"
  );
  const validate = ajv.compile(schema);
  assert.equal(
    validate(snapshot),
    true,
    JSON.stringify(validate.errors, null, 2)
  );
});

test("snapshot has only allowlisted top-level and non-sensitive field names", () => {
  assert.deepEqual(
    Object.keys(snapshot).sort(),
    [...allowlist.allowed_top_level].sort()
  );
  const forbidden = new Set(
    allowlist.forbidden_fields.map((field) => field.toLowerCase())
  );
  const allowed = new Set(allowlist.allowed_object_fields);

  const visit = (value: unknown): void => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!value || typeof value !== "object") {
      return;
    }
    for (const [key, child] of Object.entries(value)) {
      assert.equal(forbidden.has(key.toLowerCase()), false, key);
      assert.ok(allowed.has(key), `Non-allowlisted snapshot field: ${key}`);
      visit(child);
    }
  };
  Object.values(snapshot).forEach(visit);

  const serialized = JSON.stringify(snapshot);
  assert.doesNotMatch(serialized, /\b(author|comments?|reactions?|token|free_text)\b/i);
  assert.doesNotMatch(serialized, /(github_pat_|ghp_|gho_)/);
});

test("snapshot titles come only from approved desired state", () => {
  const live = snapshot as {
    readonly milestones: readonly { readonly stable_id: string; readonly title: string }[];
    readonly issues: readonly { readonly stable_id: string; readonly title: string }[];
    readonly discussions: readonly { readonly stable_id: string; readonly title: string }[];
    readonly project: {
      readonly fields: readonly { readonly title: string }[];
      readonly views: readonly { readonly title: string }[];
      readonly items: readonly { readonly stable_id: string; readonly title: string }[];
    };
    readonly wiki: {
      readonly pages: readonly { readonly stable_id: string; readonly title: string }[];
    };
  };

  assert.deepEqual(
    live.milestones.map(({ stable_id, title }) => ({ stable_id, title })),
    surfaces.milestones.map(({ stable_id, title }) => ({ stable_id, title }))
  );
  assert.deepEqual(
    live.issues.map(({ stable_id, title }) => ({ stable_id, title })),
    surfaces.issues.map(({ stable_id, title }) => ({ stable_id, title }))
  );
  assert.deepEqual(
    live.discussions.map(({ stable_id, title }) => ({ stable_id, title })),
    surfaces.discussions.map(({ stable_id, title }) => ({ stable_id, title }))
  );
  assert.deepEqual(
    live.project.fields.map(({ title }) => title),
    surfaces.project.fields.map(({ name }) => name)
  );
  assert.deepEqual(
    live.project.views.map(({ title }) => title),
    surfaces.project.views.map(({ name }) => name)
  );
  assert.deepEqual(
    live.project.items.map(({ stable_id, title }) => ({
      stable_id,
      title
    })),
    surfaces.issues.map(({ stable_id, title }) => ({
      stable_id: `PROJECT-ITEM-${stable_id}`,
      title
    }))
  );
  assert.deepEqual(
    live.wiki.pages.map(({ stable_id, title }) => ({ stable_id, title })),
    surfaces.wiki.pages.map(({ stable_id, title }) => ({ stable_id, title }))
  );
});

test("Wiki source is complete and remains navigation-only", async () => {
  const expected = [...surfaces.wiki.pages.map(({ file }) => file), "_Sidebar.md"].sort();
  const actual = (await collectRelativeFiles("ops/github/wiki")).sort();
  assert.deepEqual(actual, expected);

  const contents = await Promise.all(
    actual.map((file) => readFile(`ops/github/wiki/${file}`, "utf8"))
  );
  const joined = contents.join("\n");
  assert.doesNotMatch(joined, /ghcp-with-gaming-ideation-reference/);
  assert.doesNotMatch(joined, /\/research\/findings\//);
  assert.doesNotMatch(joined, /\/design\/bets\//);
  assert.doesNotMatch(joined, /\/design\/decisions\//);
});

test("Issue Forms parse and keep blank issues disabled", async () => {
  const files = [
    ".github/ISSUE_TEMPLATE/archive-question.yml",
    ".github/ISSUE_TEMPLATE/experiment.yml",
    ".github/ISSUE_TEMPLATE/implementation.yml",
    ".github/ISSUE_TEMPLATE/config.yml"
  ];
  const parsed = await Promise.all(
    files.map(async (path) => parseYaml(await readFile(path, "utf8")))
  );
  assert.equal(
    (parsed.at(-1) as { readonly blank_issues_enabled: boolean })
      .blank_issues_enabled,
    false
  );
});
