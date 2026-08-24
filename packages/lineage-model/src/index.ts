import rawLineage from "../../../design/lineage/LINEAGE-001.json";

export type LineageNodeKind =
  | "evidence"
  | "conflict"
  | "finding"
  | "play-dna"
  | "bet"
  | "decision"
  | "slice"
  | "issue"
  | "playable";

export interface LineageNode {
  readonly id: string;
  readonly kind: LineageNodeKind;
  readonly label_ja: string;
  readonly summary_en: string;
  readonly repository_path: string;
  readonly external_url: string | null;
}

export interface LineageEdge {
  readonly from: string;
  readonly to: string;
  readonly relation: string;
}

export interface Lineage {
  readonly schema_version: 1;
  readonly id: "LINEAGE-001";
  readonly classification: "demo-safe";
  readonly nodes: readonly LineageNode[];
  readonly edges: readonly LineageEdge[];
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
    if (!ids.has(edge.to)) {
      errors.push(`Missing lineage target: ${edge.to}`);
    }
  }

  return errors;
}
