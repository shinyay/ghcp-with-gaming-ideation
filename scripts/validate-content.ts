import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import Ajv, {
  type AnySchema,
  type ErrorObject,
  type ValidateFunction
} from "ajv";
import addFormats from "ajv-formats";
import { parse as parseYaml } from "yaml";

interface AssetRecord {
  readonly id: string;
  readonly path: string;
  readonly origin_kind: string;
  readonly derivation_kind: string;
  readonly classification: string;
  readonly src_sha256: string | null;
  readonly transform_id: string | null;
  readonly transform_version: string | null;
  readonly transform_config_sha256: string | null;
  readonly derived_sha256: string;
  readonly ai_eligible: boolean;
  readonly package_allowed: boolean;
}

interface AssetCatalog {
  readonly schema_version: number;
  readonly assets: readonly AssetRecord[];
}

function formatErrors(errors: ErrorObject[] | null | undefined): string {
  return (errors ?? [])
    .map((error) => `${error.instancePath || "/"} ${error.message ?? "invalid"}`)
    .join("; ");
}

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8")) as unknown;
}

async function sha256(path: string): Promise<string> {
  const content = await readFile(path);
  return createHash("sha256").update(content).digest("hex");
}

async function collectFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(path)));
    } else if (entry.isFile()) {
      files.push(path);
    }
  }

  return files;
}

const ajv = new Ajv({ allErrors: true, strict: true });
addFormats(ajv);

const compileSchema = async <T>(
  path: string
): Promise<ValidateFunction<T>> =>
  ajv.compile<T>((await readJson(path)) as AnySchema);

const [
  validateAsset,
  validateConflict,
  validateFinding,
  validateLineage,
  validatePlaytestEvent
] = await Promise.all([
  compileSchema<AssetRecord>("schemas/asset-record.schema.json"),
  compileSchema<unknown>("schemas/conflict.schema.json"),
  compileSchema<unknown>("schemas/finding.schema.json"),
  compileSchema<unknown>("schemas/lineage.schema.json"),
  compileSchema<unknown>("schemas/playtest-event.schema.json")
]);

const catalog = parseYaml(
  await readFile("archive/catalog/assets.yaml", "utf8")
) as AssetCatalog;

if (catalog.schema_version !== 1 || catalog.assets.length !== 6) {
  throw new Error("The thin catalog must contain exactly six DRV records.");
}

const derivedFiles = await collectFiles("archive/derived");
if (derivedFiles.length !== 6) {
  throw new Error(
    `archive/derived must contain exactly six files; found ${derivedFiles.length}.`
  );
}

const ids = new Set<string>();
for (const asset of catalog.assets) {
  if (!validateAsset(asset)) {
    throw new Error(
      `Asset failed schema: ${formatErrors(validateAsset.errors)}`
    );
  }
  if (ids.has(asset.id)) {
    throw new Error(`Duplicate asset ID: ${asset.id}`);
  }
  ids.add(asset.id);

  if (
    asset.origin_kind !== "synthetic_fixture" ||
    asset.derivation_kind !== "directly_authored_fixture" ||
    asset.classification !== "demo-safe"
  ) {
    throw new Error(`${asset.id} violates the demo repository boundary.`);
  }
  if (!asset.ai_eligible || !asset.package_allowed) {
    throw new Error(`${asset.id} is outside the thin allowlist.`);
  }

  const fileStat = await stat(asset.path);
  if (!fileStat.isFile()) {
    throw new Error(`${asset.id} path is not a file: ${asset.path}`);
  }
  if ((await sha256(asset.path)) !== asset.derived_sha256) {
    throw new Error(`${asset.id} derived_sha256 does not match its file.`);
  }
  if (
    asset.src_sha256 !== null ||
    asset.transform_id !== null ||
    asset.transform_version !== null ||
    asset.transform_config_sha256 !== null
  ) {
    throw new Error(
      `${asset.id} invents source or transform execution metadata.`
    );
  }

  const fixtureText = await readFile(asset.path, "utf8");
  if (!fixtureText.includes("synthetic_fixture")) {
    throw new Error(`${asset.id} does not declare synthetic_fixture in content.`);
  }
}

for (const path of [
  "research/conflicts/CFL-001.json",
  "research/conflicts/CFL-002.json"
]) {
  const conflict = await readJson(path);
  if (!validateConflict(conflict)) {
    throw new Error(`${path}: ${formatErrors(validateConflict.errors)}`);
  }
}

const finding = await readJson("research/findings/FND-001.json");
if (!validateFinding(finding)) {
  throw new Error(`FND-001: ${formatErrors(validateFinding.errors)}`);
}

const lineage = (await readJson("design/lineage/LINEAGE-001.json")) as {
  readonly nodes: readonly { readonly repository_path: string }[];
};
if (!validateLineage(lineage)) {
  throw new Error(`LINEAGE-001: ${formatErrors(validateLineage.errors)}`);
}

for (const node of lineage.nodes) {
  const nodeStat = await stat(node.repository_path);
  if (!nodeStat.isFile()) {
    throw new Error(`Lineage path is not a file: ${node.repository_path}`);
  }
}

const events = (await readJson(
  "research/playtests/PT-001-automated-events.json"
)) as readonly unknown[];
for (const event of events) {
  if (!validatePlaytestEvent(event)) {
    throw new Error(`PT-001 event: ${formatErrors(validatePlaytestEvent.errors)}`);
  }
}

console.log(
  `Validated ${catalog.assets.length} synthetic DRVs, 2 conflicts, 1 finding, ${lineage.nodes.length} lineage nodes, and ${events.length} enum-only events.`
);
