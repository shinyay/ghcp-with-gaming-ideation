import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import Ajv, {
  type AnySchema,
  type ErrorObject,
  type ValidateFunction
} from "ajv";
import addFormats from "ajv-formats";
import { parse as parseYaml } from "yaml";
import {
  DERIVED_HASH_PROJECTION,
  hashFixtureText
} from "./lib/text-projection";
import {
  type LocatorGrammarVersion,
  parseCsvFixture,
  resolveLocator
} from "./lib/locator";

const MINIMUM_CORPUS_SIZE = 30;
const EVIDENCE_PACKET_COUNT = 7;

interface AssetRecord {
  readonly id: string;
  readonly title: string;
  readonly path: string;
  readonly origin_kind: string;
  readonly derivation_kind: string;
  readonly classification: string;
  readonly source_ref: string;
  readonly source_created_at: string;
  readonly src_sha256: string | null;
  readonly transform_id: string | null;
  readonly transform_version: string | null;
  readonly transform_config_sha256: string | null;
  readonly derived_hash_projection: string;
  readonly derived_sha256: string;
  readonly locator_grammar_version: LocatorGrammarVersion;
  readonly locators: readonly string[];
  readonly ai_eligible: boolean;
  readonly package_allowed: boolean;
}

interface AssetCatalog {
  readonly schema_version: number;
  readonly assets: readonly AssetRecord[];
}

interface PlannedOriginals {
  readonly sources: readonly {
    readonly id: string;
    readonly fictional_source_created_at: string;
  }[];
}

interface EvidenceReference {
  readonly asset_id: string;
  readonly locator: string;
}

interface EvidencePacket {
  readonly id: string;
  readonly reading_set: readonly (EvidenceReference & {
    readonly read_for_ja: string;
  })[];
}

interface ClaimRecord {
  readonly id: string;
  readonly asset_id: string;
  readonly locator: string;
}

interface ConflictRecord {
  readonly id: string;
  readonly sides: readonly EvidenceReference[];
}

interface FindingRecord {
  readonly id: string;
  readonly evidence: readonly EvidenceReference[];
}

interface HypothesisRecord {
  readonly id: string;
  readonly candidate_evidence: readonly EvidenceReference[];
}

interface DisclosureGuard {
  readonly scanned_roots: readonly string[];
  readonly derived_forbidden_substrings: readonly string[];
  readonly repository_forbidden_substrings: readonly string[];
}

function formatErrors(errors: ErrorObject[] | null | undefined): string {
  return (errors ?? [])
    .map((error) => `${error.instancePath || "/"} ${error.message ?? "invalid"}`)
    .join("; ");
}

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8")) as unknown;
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

function toPosix(path: string): string {
  return path.split("\\").join("/");
}

function categoryOf(assetPath: string): string {
  const segments = assetPath.split("/");
  return segments[2] ?? "";
}

const ajv = new Ajv({ allErrors: true, strict: true });
addFormats(ajv);

const compileSchema = async <T>(
  path: string
): Promise<ValidateFunction<T>> =>
  ajv.compile<T>((await readJson(path)) as AnySchema);

const [
  validateAsset,
  validateClaim,
  validateConflict,
  validateFinding,
  validateHypothesis,
  validateEvidencePacket,
  validateTimeline,
  validateLineage,
  validatePlaytestEvent
] = await Promise.all([
  compileSchema<AssetRecord>("schemas/asset-record.schema.json"),
  compileSchema<unknown>("schemas/claim.schema.json"),
  compileSchema<unknown>("schemas/conflict.schema.json"),
  compileSchema<unknown>("schemas/finding.schema.json"),
  compileSchema<unknown>("schemas/hypothesis.schema.json"),
  compileSchema<EvidencePacket>("schemas/evidence-packet.schema.json"),
  compileSchema<unknown>("schemas/archive-timeline.schema.json"),
  compileSchema<unknown>("schemas/lineage.schema.json"),
  compileSchema<unknown>("schemas/playtest-event.schema.json")
]);

const catalog = parseYaml(
  await readFile("archive/catalog/assets.yaml", "utf8")
) as AssetCatalog;

if (catalog.schema_version !== 1) {
  throw new Error("Unsupported asset catalog schema version.");
}
if (catalog.assets.length < MINIMUM_CORPUS_SIZE) {
  throw new Error(
    `The full corpus needs at least ${MINIMUM_CORPUS_SIZE} DRV records; found ${catalog.assets.length}.`
  );
}

const plannedOriginals = parseYaml(
  await readFile("archive/catalog/planned-originals.yaml", "utf8")
) as PlannedOriginals;
const plannedById = new Map(
  plannedOriginals.sources.map((source) => [source.id, source])
);

const derivedFiles = (await collectFiles("archive/derived")).map((path) =>
  toPosix(relative(process.cwd(), path))
);
const catalogPaths = new Set(catalog.assets.map((asset) => asset.path));

for (const file of derivedFiles) {
  if (!catalogPaths.has(file)) {
    throw new Error(`Derived file is missing from the catalog: ${file}`);
  }
}
if (derivedFiles.length !== catalog.assets.length) {
  throw new Error(
    `Catalog and archive/derived must match exactly; ${catalog.assets.length} records versus ${derivedFiles.length} files.`
  );
}

const assetsById = new Map<string, AssetRecord>();
const fixtureText = new Map<string, string>();

for (const asset of catalog.assets) {
  const assetId = asset.id;
  if (!validateAsset(asset)) {
    throw new Error(
      `${assetId} failed schema: ${formatErrors(validateAsset.errors)}`
    );
  }
  if (assetsById.has(asset.id)) {
    throw new Error(`Duplicate asset ID: ${asset.id}`);
  }
  assetsById.set(asset.id, asset);

  if (
    asset.origin_kind !== "synthetic_fixture" ||
    asset.derivation_kind !== "directly_authored_fixture" ||
    asset.classification !== "demo-safe"
  ) {
    throw new Error(`${asset.id} violates the demo repository boundary.`);
  }
  if (!asset.ai_eligible || !asset.package_allowed) {
    throw new Error(`${asset.id} is outside the demo-safe allowlist.`);
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

  const planned = plannedById.get(asset.source_ref);
  if (!planned) {
    throw new Error(`${asset.id} references unknown source ${asset.source_ref}.`);
  }
  if (planned.fictional_source_created_at !== asset.source_created_at) {
    throw new Error(
      `${asset.id} source date does not match ${asset.source_ref}.`
    );
  }

  const fileStat = await stat(asset.path);
  if (!fileStat.isFile()) {
    throw new Error(`${asset.id} path is not a file: ${asset.path}`);
  }
  if (asset.derived_hash_projection !== DERIVED_HASH_PROJECTION) {
    throw new Error(`${asset.id} uses an unsupported derived hash projection.`);
  }

  const content = await readFile(asset.path, "utf8");
  fixtureText.set(asset.id, content);

  if (hashFixtureText(content) !== asset.derived_sha256) {
    throw new Error(`${asset.id} derived_sha256 does not match its file.`);
  }
  if (!content.includes("synthetic_fixture")) {
    throw new Error(`${asset.id} does not declare synthetic_fixture in content.`);
  }
  for (const locator of asset.locators) {
    if (!resolveLocator(locator, content, asset.locator_grammar_version)) {
      throw new Error(`${asset.id} locator does not resolve: ${locator}`);
    }
  }
}

function requireDeclaredLocator(
  owner: string,
  reference: EvidenceReference
): void {
  const asset = assetsById.get(reference.asset_id);
  if (!asset) {
    throw new Error(`${owner} references unknown asset ${reference.asset_id}.`);
  }
  if (!asset.locators.includes(reference.locator)) {
    throw new Error(
      `${owner} uses an undeclared locator ${reference.locator} on ${reference.asset_id}.`
    );
  }
  const content = fixtureText.get(reference.asset_id) ?? "";
  if (!resolveLocator(reference.locator, content, asset.locator_grammar_version)) {
    throw new Error(
      `${owner} locator does not resolve: ${reference.asset_id} ${reference.locator}`
    );
  }
}

async function loadRecords<T>(
  directory: string
): Promise<readonly { readonly path: string; readonly body: T }[]> {
  const files = (await collectFiles(directory))
    .map((path) => toPosix(relative(process.cwd(), path)))
    .filter((path) => path.endsWith(".json"))
    .sort();

  return Promise.all(
    files.map(async (path) => ({
      path,
      body: (await readJson(path)) as T
    }))
  );
}

const claims = await loadRecords<ClaimRecord>("research/claims");
for (const { path, body } of claims) {
  if (!validateClaim(body)) {
    throw new Error(`${path}: ${formatErrors(validateClaim.errors)}`);
  }
  requireDeclaredLocator(body.id, {
    asset_id: body.asset_id,
    locator: body.locator
  });
}

const conflicts = await loadRecords<ConflictRecord>("research/conflicts");
for (const { path, body } of conflicts) {
  if (!validateConflict(body)) {
    throw new Error(`${path}: ${formatErrors(validateConflict.errors)}`);
  }
  const [first, second] = body.sides;
  if (!first || !second) {
    throw new Error(`${body.id} does not record two sides.`);
  }
  if (first.asset_id === second.asset_id) {
    throw new Error(`${body.id} compares a single asset with itself.`);
  }
  for (const side of body.sides) {
    requireDeclaredLocator(body.id, side);
  }
}

const findings = await loadRecords<FindingRecord>("research/findings");
for (const { path, body } of findings) {
  if (!validateFinding(body)) {
    throw new Error(`${path}: ${formatErrors(validateFinding.errors)}`);
  }
  const distinct = new Set(body.evidence.map((item) => item.asset_id));
  if (distinct.size < 2) {
    throw new Error(`${body.id} rests on a single asset.`);
  }
  for (const item of body.evidence) {
    requireDeclaredLocator(body.id, item);
  }
}

const hypotheses = await loadRecords<HypothesisRecord>("research/hypotheses");
for (const { path, body } of hypotheses) {
  if (!validateHypothesis(body)) {
    throw new Error(`${path}: ${formatErrors(validateHypothesis.errors)}`);
  }
  for (const item of body.candidate_evidence) {
    requireDeclaredLocator(body.id, item);
  }
}

const packets = await loadRecords<EvidencePacket>("archive/evidence-packets");
if (packets.length !== EVIDENCE_PACKET_COUNT) {
  throw new Error(
    `Expected ${EVIDENCE_PACKET_COUNT} evidence packets; found ${packets.length}.`
  );
}

for (const { path, body } of packets) {
  if (!validateEvidencePacket(body)) {
    throw new Error(`${path}: ${formatErrors(validateEvidencePacket.errors)}`);
  }

  const assetIds = new Set<string>();
  const categories = new Set<string>();
  const sourceRefs = new Set<string>();

  for (const entry of body.reading_set) {
    requireDeclaredLocator(body.id, entry);
    const asset = assetsById.get(entry.asset_id);
    if (!asset) {
      throw new Error(`${body.id} references unknown asset ${entry.asset_id}.`);
    }
    assetIds.add(asset.id);
    categories.add(categoryOf(asset.path));
    sourceRefs.add(asset.source_ref);
  }

  if (assetIds.size < 3) {
    throw new Error(
      `${body.id} must read at least three distinct assets; found ${assetIds.size}.`
    );
  }
  if (categories.size < 2) {
    throw new Error(
      `${body.id} must span at least two archive categories; found ${categories.size}.`
    );
  }
  if (sourceRefs.size < 2) {
    throw new Error(
      `${body.id} must span at least two planned originals; found ${sourceRefs.size}.`
    );
  }
}

const timeline = (await readJson("archive/catalog/timeline.json")) as {
  readonly entries: readonly {
    readonly asset_id: string;
    readonly fictional_date: string;
  }[];
};
if (!validateTimeline(timeline)) {
  throw new Error(`timeline: ${formatErrors(validateTimeline.errors)}`);
}
const timelineIds = new Set(timeline.entries.map((entry) => entry.asset_id));
for (const asset of catalog.assets) {
  if (!timelineIds.has(asset.id)) {
    throw new Error(`${asset.id} is missing from the archive timeline.`);
  }
}
for (const entry of timeline.entries) {
  const asset = assetsById.get(entry.asset_id);
  if (!asset) {
    throw new Error(`Timeline references unknown asset ${entry.asset_id}.`);
  }
  if (asset.source_created_at !== entry.fictional_date) {
    throw new Error(`Timeline date disagrees with the catalog for ${asset.id}.`);
  }
}

const qaIndex = parseYaml(
  await readFile("archive/catalog/qa-index.yaml", "utf8")
) as {
  readonly tracker_asset: string;
  readonly records: readonly {
    readonly bug_id: string;
    readonly detail_asset: string | null;
    readonly detail_locator: string | null;
    readonly tracker_locator: string;
  }[];
  readonly symbol_index_assets: Record<string, string>;
};

const tracker = assetsById.get(qaIndex.tracker_asset);
if (!tracker) {
  throw new Error("QA index references an unknown tracker asset.");
}
const trackerRows = parseCsvFixture(fixtureText.get(tracker.id) ?? "");
const trackerBugIds = new Set(trackerRows.rows.map((row) => row[0]));

for (const record of qaIndex.records) {
  if (!trackerBugIds.has(record.bug_id)) {
    throw new Error(`QA index bug ${record.bug_id} is absent from the tracker.`);
  }
  requireDeclaredLocator(`qa-index:${record.bug_id}`, {
    asset_id: tracker.id,
    locator: record.tracker_locator
  });
  if (record.detail_asset !== null && record.detail_locator !== null) {
    requireDeclaredLocator(`qa-index:${record.bug_id}`, {
      asset_id: record.detail_asset,
      locator: record.detail_locator
    });
  }
}
for (const symbolAsset of Object.values(qaIndex.symbol_index_assets)) {
  if (!assetsById.has(symbolAsset)) {
    throw new Error(`QA index references unknown symbol asset ${symbolAsset}.`);
  }
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

const guard = (await readJson(
  "governance/disclosure-guard.json"
)) as DisclosureGuard;

for (const [id, content] of fixtureText) {
  for (const forbidden of guard.derived_forbidden_substrings) {
    if (content.includes(forbidden)) {
      throw new Error(
        `${id} discloses a cross-asset conclusion directly: ${forbidden}`
      );
    }
  }
}

for (const root of guard.scanned_roots) {
  for (const path of await collectFiles(root)) {
    const content = await readFile(path, "utf8");
    for (const forbidden of guard.repository_forbidden_substrings) {
      if (content.includes(forbidden)) {
        throw new Error(
          `${toPosix(relative(process.cwd(), path))} contains reference-only content: ${forbidden}`
        );
      }
    }
  }
}

console.log(
  [
    `Validated ${catalog.assets.length} synthetic DRVs across ${
      new Set(catalog.assets.map((asset) => categoryOf(asset.path))).size
    } categories`,
    `${claims.length} claims`,
    `${conflicts.length} conflicts`,
    `${findings.length} findings`,
    `${hypotheses.length} hypotheses`,
    `${packets.length} cross-asset evidence packets`,
    `${timeline.entries.length} timeline entries`,
    `${lineage.nodes.length} lineage nodes`,
    `${events.length} enum-only events`
  ].join(", ") + "."
);
