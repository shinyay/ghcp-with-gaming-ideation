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
    readonly files: readonly {
      readonly path: string;
      readonly public_route: string | null;
      readonly classification: string;
    }[];
  }>("ops/github/pages-allowlist.json");

  assert.equal(allowlist.repository_visibility_required, "private");
  assert.equal(allowlist.pages_visibility, "public");
  assert.equal(allowlist.build_type, "workflow");
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
  assert.equal(workflow.jobs["deploy"]?.permissions?.["pages"], "write");
  assert.equal(workflow.jobs["deploy"]?.permissions?.["id-token"], "write");
  assert.equal(workflow.jobs["deploy"]?.environment?.name, "github-pages");
  assert.match(workflowText, /actions\/configure-pages@v5/);
  assert.match(workflowText, /actions\/upload-pages-artifact@v4/);
  assert.match(workflowText, /actions\/deploy-pages@v4/);
  assert.match(workflowText, /path:\s+pages/);
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
  assert.match(policy, /Repository visibilityは`private`/);
  assert.match(policy, /Reference repository/);
});
