import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { parse } from "yaml";

interface CatalogAsset {
  readonly id: string;
  readonly title: string;
  readonly classification: string;
  readonly origin_kind: string;
  readonly source_created_at: string;
  readonly media_type: string;
  readonly path: string;
  readonly derived_sha256: string;
  readonly locators: readonly string[];
  readonly review_status: string;
  readonly ai_eligible: boolean;
  readonly package_allowed: boolean;
}

interface Catalog {
  readonly assets: readonly CatalogAsset[];
}

interface LineageNode {
  readonly id: string;
  readonly kind: string;
  readonly label_ja: string;
  readonly summary_en: string;
  readonly repository_path: string;
  readonly external_url: string | null;
}

interface SnapshotLineageNode extends LineageNode {
  readonly github_object_id: string | null;
}

interface LineageEdge {
  readonly from: string;
  readonly to: string;
  readonly relation: string;
}

interface RawLineage {
  readonly id: string;
  readonly nodes: readonly LineageNode[];
  readonly edges: readonly LineageEdge[];
}

interface GitHubObject {
  readonly stable_id: string;
  readonly url: string;
  readonly status: string;
}

interface GitHubSnapshot {
  readonly issues: readonly GitHubObject[];
  readonly discussions: readonly GitHubObject[];
  readonly project: GitHubObject;
  readonly wiki: GitHubObject;
}

interface GitHubObjectRef {
  readonly stable_id: string;
  readonly collection: "issues" | "discussions" | "project" | "wiki";
}

interface ExternalGitHubObject {
  readonly stable_id: string;
  readonly collection: "pull-request" | "actions-run";
  readonly url: string;
  readonly status: "merged" | "success";
}

interface SnapshotAllowlist {
  readonly schema_version: 1;
  readonly snapshot_id: "DEMO-SNAPSHOT-001";
  readonly archive_catalog: string;
  readonly archive_asset_ids: readonly string[];
  readonly lineage_source: string;
  readonly lineage_node_ids: readonly string[];
  readonly github_snapshot: string;
  readonly github_object_refs: readonly GitHubObjectRef[];
  readonly external_github_objects: readonly ExternalGitHubObject[];
  readonly node_github_object_refs: Readonly<Record<string, string>>;
  readonly additional_nodes: readonly LineageNode[];
  readonly additional_edges: readonly LineageEdge[];
  readonly forbidden_github_fields: readonly string[];
}

function sha256(content: string): string {
  return createHash("sha256")
    .update(content.replace(/\r\n?/g, "\n"))
    .digest("hex");
}

function json(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function requireUnique(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length) {
    throw new Error(`${label} contains duplicate stable IDs.`);
  }
}

function resolveGitHubObject(
  snapshot: GitHubSnapshot,
  reference: GitHubObjectRef
): GitHubObject {
  const object =
    reference.collection === "project" || reference.collection === "wiki"
      ? snapshot[reference.collection]
      : snapshot[reference.collection].find(
          (candidate) => candidate.stable_id === reference.stable_id
        );
  if (object === undefined || object.stable_id !== reference.stable_id) {
    throw new Error(`Missing allowlisted GitHub object: ${reference.stable_id}`);
  }
  return object;
}

function rejectForbiddenFields(
  value: unknown,
  forbidden: ReadonlySet<string>,
  path = "$"
): void {
  if (Array.isArray(value)) {
    value.forEach((entry, index) =>
      rejectForbiddenFields(entry, forbidden, `${path}[${index}]`)
    );
    return;
  }

  if (value === null || typeof value !== "object") {
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (forbidden.has(key.toLowerCase())) {
      throw new Error(`Forbidden GitHub snapshot field at ${path}.${key}`);
    }
    rejectForbiddenFields(child, forbidden, `${path}.${key}`);
  }
}

function topologicalNodes(
  nodes: readonly SnapshotLineageNode[],
  edges: readonly LineageEdge[]
): readonly SnapshotLineageNode[] {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const indegree = new Map(nodes.map((node) => [node.id, 0]));
  const outgoing = new Map(nodes.map((node) => [node.id, [] as string[]]));
  for (const edge of edges) {
    indegree.set(edge.to, (indegree.get(edge.to) ?? 0) + 1);
    outgoing.get(edge.from)?.push(edge.to);
  }

  const queue = nodes.filter((node) => indegree.get(node.id) === 0);
  const ordered: SnapshotLineageNode[] = [];
  while (queue.length > 0) {
    const node = queue.shift();
    if (node === undefined) {
      break;
    }
    ordered.push(node);
    for (const target of outgoing.get(node.id) ?? []) {
      const next = (indegree.get(target) ?? 0) - 1;
      indegree.set(target, next);
      if (next === 0) {
        const targetNode = byId.get(target);
        if (targetNode !== undefined) {
          queue.push(targetNode);
        }
      }
    }
  }
  if (ordered.length !== nodes.length) {
    throw new Error("Lineage graph contains a cycle.");
  }
  return ordered;
}

const allowlistPath = "ops/packaging/demo-snapshot-allowlist.json";
const allowlistText = await readFile(allowlistPath, "utf8");
const allowlist = JSON.parse(allowlistText) as SnapshotAllowlist;
if (
  allowlist.schema_version !== 1 ||
  allowlist.snapshot_id !== "DEMO-SNAPSHOT-001"
) {
  throw new Error("Unsupported demo snapshot allowlist.");
}

requireUnique(allowlist.archive_asset_ids, "Archive allowlist");
requireUnique(allowlist.lineage_node_ids, "Lineage allowlist");

const [catalogText, lineageText, githubText] = await Promise.all([
  readFile(allowlist.archive_catalog, "utf8"),
  readFile(allowlist.lineage_source, "utf8"),
  readFile(allowlist.github_snapshot, "utf8")
]);
const catalog = parse(catalogText) as Catalog;
const rawLineage = JSON.parse(lineageText) as RawLineage;
const githubSnapshot = JSON.parse(githubText) as GitHubSnapshot;

const catalogById = new Map(catalog.assets.map((asset) => [asset.id, asset]));
const archiveAssets = allowlist.archive_asset_ids.map((id) => {
  const asset = catalogById.get(id);
  if (asset === undefined) {
    throw new Error(`Missing allowlisted archive asset: ${id}`);
  }
  if (
    asset.classification !== "demo-safe" ||
    asset.ai_eligible !== true ||
    asset.package_allowed !== true
  ) {
    throw new Error(`Archive asset is not demo eligible: ${id}`);
  }
  return {
    id: asset.id,
    title: asset.title,
    source_created_at: String(asset.source_created_at),
    media_type: asset.media_type,
    path: asset.path,
    derived_sha256: asset.derived_sha256,
    locators: asset.locators,
    review_status: asset.review_status,
    origin_kind: asset.origin_kind
  };
});

const archiveSnapshot = {
  schema_version: 1,
  id: "ARCHIVE-SNAPSHOT-001",
  classification: "demo-safe",
  source: {
    path: allowlist.archive_catalog,
    sha256: sha256(catalogText)
  },
  asset_count: archiveAssets.length,
  assets: archiveAssets
};

const rawNodeById = new Map(rawLineage.nodes.map((node) => [node.id, node]));
const lineageNodes = allowlist.lineage_node_ids.map((id) => {
  const node = rawNodeById.get(id);
  if (node === undefined) {
    throw new Error(`Missing allowlisted lineage node: ${id}`);
  }
  return node;
});
const configuredNodes = [...lineageNodes, ...allowlist.additional_nodes];
requireUnique(
  configuredNodes.map((node) => node.id),
  "Generated lineage"
);

const nodeIds = new Set(configuredNodes.map((node) => node.id));
const lineageEdges = [...rawLineage.edges, ...allowlist.additional_edges];
for (const edge of lineageEdges) {
  if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
    throw new Error(`Lineage edge does not resolve: ${edge.from} -> ${edge.to}`);
  }
}

const githubObjects = [
  ...allowlist.github_object_refs.map((reference) => {
    const object = resolveGitHubObject(githubSnapshot, reference);
    return {
      stable_id: object.stable_id,
      collection: reference.collection,
      url: object.url,
      status: object.status
    };
  }),
  ...allowlist.external_github_objects
];
requireUnique(
  githubObjects.map((object) => object.stable_id),
  "GitHub object allowlist"
);
rejectForbiddenFields(
  githubObjects,
  new Set(allowlist.forbidden_github_fields.map((field) => field.toLowerCase()))
);
const githubObjectById = new Map(
  githubObjects.map((object) => [object.stable_id, object])
);
const allNodes = configuredNodes.map((node): SnapshotLineageNode => {
  const githubObjectId = allowlist.node_github_object_refs[node.id] ?? null;
  const githubObject =
    githubObjectId === null ? undefined : githubObjectById.get(githubObjectId);
  if (githubObjectId !== null && githubObject === undefined) {
    throw new Error(
      `Lineage node ${node.id} references non-allowlisted object ${githubObjectId}.`
    );
  }
  if (node.external_url !== null && githubObject === undefined) {
    throw new Error(`Lineage node has an unregistered external URL: ${node.id}`);
  }
  return {
    ...node,
    external_url: githubObject?.url ?? null,
    github_object_id: githubObjectId
  };
});
const orderedNodes = topologicalNodes(allNodes, lineageEdges);

const lineageSnapshot = {
  schema_version: 1,
  id: "LINEAGE-SNAPSHOT-001",
  classification: "demo-safe",
  browser_network: "forbidden",
  sources: [
    {
      path: allowlist.lineage_source,
      sha256: sha256(lineageText)
    },
    {
      path: allowlist.github_snapshot,
      sha256: sha256(githubText)
    },
    {
      path: allowlistPath,
      sha256: sha256(allowlistText)
    }
  ],
  nodes: orderedNodes,
  edges: lineageEdges,
  github_objects: githubObjects
};

const outputs = new Map([
  [
    "demo/offline-snapshots/archive-assets.json",
    json(archiveSnapshot)
  ],
  [
    "demo/offline-snapshots/lineage-snapshot.json",
    json(lineageSnapshot)
  ]
]);

const checkOnly = process.argv.includes("--check");
for (const [path, content] of outputs) {
  if (checkOnly) {
    const committed = await readFile(path, "utf8");
    if (committed !== content) {
      throw new Error(`Committed demo snapshot is stale: ${path}`);
    }
    continue;
  }
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, "utf8");
}

console.log(
  `${checkOnly ? "Validated" : "Generated"} ${outputs.size} allowlisted demo snapshots.`
);
