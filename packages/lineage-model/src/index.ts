import rawLineage from "../../../demo/offline-snapshots/lineage-snapshot.json";

export type LineageNodeKind =
  | "evidence"
  | "conflict"
  | "finding"
  | "play-dna"
  | "bet"
  | "decision"
  | "slice"
  | "issue"
  | "pull-request"
  | "build"
  | "playable";

export interface LineageNode {
  readonly id: string;
  readonly kind: LineageNodeKind;
  readonly label_ja: string;
  readonly summary_en: string;
  readonly repository_path: string;
  readonly external_url: string | null;
  readonly github_object_id: string | null;
}

export interface LineageEdge {
  readonly from: string;
  readonly to: string;
  readonly relation: string;
}

export interface Lineage {
  readonly schema_version: 1;
  readonly id: "LINEAGE-SNAPSHOT-001";
  readonly classification: "demo-safe";
  readonly browser_network: "forbidden";
  readonly sources: readonly {
    readonly path: string;
    readonly sha256: string;
  }[];
  readonly nodes: readonly LineageNode[];
  readonly edges: readonly LineageEdge[];
  readonly github_objects: readonly LineageGitHubObject[];
}

export interface LineageGitHubObject {
  readonly stable_id: string;
  readonly collection:
    | "issues"
    | "discussions"
    | "project"
    | "wiki"
    | "pull-request"
    | "actions-run";
  readonly url: string;
  readonly status: string;
}

export const thinLineage = rawLineage as Lineage;

export function validateLineageReferences(lineage: Lineage): readonly string[] {
  const errors: string[] = [];
  const ids = new Set<string>();

  for (const node of lineage.nodes) {
    if (ids.has(node.id)) {
      errors.push(`Duplicate lineage node: ${node.id}`);
    }
    ids.add(node.id);
  }

  for (const edge of lineage.edges) {
    if (!ids.has(edge.from)) {
      errors.push(`Missing lineage source: ${edge.from}`);
    }

    const githubObjects = new Map(
      lineage.github_objects.map((object) => [object.stable_id, object])
    );
    for (const node of lineage.nodes) {
      if (node.github_object_id === null) {
        if (node.external_url !== null) {
          errors.push(`Unresolved external URL on lineage node: ${node.id}`);
        }
        continue;
      }
      const object = githubObjects.get(node.github_object_id);
      if (object === undefined) {
        errors.push(
          `Missing GitHub object ${node.github_object_id} for lineage node: ${node.id}`
        );
      } else if (node.external_url !== object.url) {
        errors.push(`GitHub object URL mismatch on lineage node: ${node.id}`);
      }
    }
    if (!ids.has(edge.to)) {
      errors.push(`Missing lineage target: ${edge.to}`);
    }
  }

  if (lineage.browser_network !== "forbidden") {
    errors.push("Lineage snapshot must forbid browser network access.");
  }

  return errors;
}
