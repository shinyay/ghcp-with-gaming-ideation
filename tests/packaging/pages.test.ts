import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parse as parseYaml } from "yaml";

const readJson = async <T>(path: string): Promise<T> =>
  JSON.parse(await readFile(path, "utf8")) as T;

test("Pages validator accepts only the owner-approved publication tree", () => {
  const output = execFileSync(
    process.execPath,
    ["--import", "tsx", "scripts/validate-pages-site.ts"],
    { encoding: "utf8" }
  );
  assert.match(output, /Validated 3 allowlisted Pages files for PAGES-001/);
});

test("Pages allowlist exposes exactly two demo-safe HTML artifacts", async () => {
  const allowlist = await readJson<{
    readonly repository_visibility_required: string;
    readonly pages_visibility: string;
    readonly build_type: string;
    readonly hash_projection: string;
    readonly languages: readonly string[];
    readonly default_language: string;
    readonly language_toggle: string;
    readonly preference_storage: string;
    readonly preference_storage_key: string;
    readonly files: readonly {
      readonly path: string;
      readonly public_route: string | null;
      readonly classification: string;
    }[];
  }>("ops/github/pages-allowlist.json");

  assert.equal(allowlist.repository_visibility_required, "private");
  assert.equal(allowlist.pages_visibility, "public");
  assert.equal(allowlist.build_type, "workflow");
  assert.equal(allowlist.hash_projection, "utf8-lf-sha256-v1");
  assert.deepEqual(allowlist.languages, ["ja", "en"]);
  assert.equal(allowlist.default_language, "ja");
  assert.equal(allowlist.language_toggle, "segmented");
  assert.equal(allowlist.preference_storage, "localStorage");
  assert.equal(
    allowlist.preference_storage_key,
    "star-relay-pages-language-v1"
  );
  assert.deepEqual(
    allowlist.files.map((entry) => entry.path).sort(),
    ["pages/.nojekyll", "pages/game-guide/index.html", "pages/index.html"]
  );
  assert.deepEqual(
    allowlist.files
      .filter((entry) => entry.public_route !== null)
      .map((entry) => entry.public_route)
      .sort(),
    [
      "/ghcp-with-gaming-ideation/",
      "/ghcp-with-gaming-ideation/game-guide/"
    ]
  );
  for (const entry of allowlist.files) {
    assert.equal(entry.classification, "demo-safe");
  }
});

test("Pages workflow deploys from main with minimal permissions", async () => {
  const workflowText = await readFile(
    ".github/workflows/deploy-pages.yml",
    "utf8"
  );
  const workflow = parseYaml(workflowText) as {
    readonly on: Readonly<Record<string, unknown>>;
    readonly permissions: Readonly<Record<string, string>>;
    readonly jobs: Readonly<
      Record<
        string,
        {
          readonly permissions?: Readonly<Record<string, string>>;
          readonly environment?: { readonly name?: string };
        }
      >
    >;
  };

  assert.deepEqual(Object.keys(workflow.on).sort(), [
    "push",
    "workflow_dispatch"
  ]);
  assert.equal(workflow.permissions["contents"], "read");
  assert.equal(workflow.jobs["upload"]?.permissions?.["contents"], "read");
  assert.equal(workflow.jobs["upload"]?.permissions?.["pages"], "write");
  assert.equal(workflow.jobs["deploy"]?.permissions?.["pages"], "write");
  assert.equal(workflow.jobs["deploy"]?.permissions?.["id-token"], "write");
  assert.equal(workflow.jobs["deploy"]?.environment?.name, "github-pages");
  assert.match(workflowText, /actions\/configure-pages@v5/);
  assert.match(workflowText, /actions\/upload-pages-artifact@v4/);
  assert.match(workflowText, /actions\/deploy-pages@v4/);
  assert.match(workflowText, /path:\s+pages/);
  assert.match(workflowText, /playwright install --with-deps chromium/);
  assert.match(workflowText, /npm run test:pages/);
  assert.match(workflowText, /playwright\.pages\.config\.ts/);
  assert.match(workflowText, /tests\/pages\/\*\*/);
  assert.doesNotMatch(workflowText, /\bpull_request\s*:/);
  assert.doesNotMatch(workflowText, /\bcontents:\s+write\b/);
  assert.doesNotMatch(workflowText, /enablement:\s+true/);
});

test("public-display exception remains limited to two HTML paths", async () => {
  const [notice, policy] = await Promise.all([
    readFile("NOTICE.md", "utf8"),
    readFile("governance/pages-publication-policy.md", "utf8")
  ]);
  for (const path of ["pages/index.html", "pages/game-guide/index.html"]) {
    assert.match(notice, new RegExp(path.replaceAll(".", "\\.")));
    assert.match(policy, new RegExp(path.replaceAll(".", "\\.")));
  }
  assert.match(notice, /他siteでの再配布/);
  assert.match(notice, /日本語 \| English/);
  assert.match(notice, /2026-08-28/);
  assert.match(policy, /Repository visibilityは`private`/);
  assert.match(policy, /Reference repository/);
  assert.match(policy, /Bilingual presentation amendment/);
  assert.match(policy, /star-relay-pages-language-v1/);
});

test("bilingual Pages behavior is part of the normal test suite", async () => {
  const packageJson = await readJson<{
    readonly scripts: Readonly<Record<string, string>>;
  }>("package.json");

  assert.equal(
    packageJson.scripts["test:pages"],
    "playwright test --config playwright.pages.config.ts"
  );
  assert.match(packageJson.scripts["test"] ?? "", /npm run test:pages/);
});

test("Pages desired state keeps two routes and a local language preference", async () => {
  const desiredState = parseYaml(
    await readFile("ops/github/desired-state.yaml", "utf8")
  ) as {
    readonly pages: {
      readonly repository_visibility_required: string;
      readonly languages: readonly string[];
      readonly default_language: string;
      readonly language_toggle: string;
      readonly preference: {
        readonly storage: string;
        readonly key: string;
        readonly allowed_values: readonly string[];
        readonly telemetry: string;
      };
      readonly routes: readonly string[];
    };
  };

  assert.equal(desiredState.pages.repository_visibility_required, "private");
  assert.deepEqual(desiredState.pages.languages, ["ja", "en"]);
  assert.equal(desiredState.pages.default_language, "ja");
  assert.equal(desiredState.pages.language_toggle, "segmented");
  assert.deepEqual(desiredState.pages.preference, {
    storage: "browser_local_storage",
    key: "star-relay-pages-language-v1",
    allowed_values: ["ja", "en"],
    telemetry: "forbidden"
  });
  assert.deepEqual(desiredState.pages.routes, [
    "/ghcp-with-gaming-ideation/",
    "/ghcp-with-gaming-ideation/game-guide/"
  ]);
});
