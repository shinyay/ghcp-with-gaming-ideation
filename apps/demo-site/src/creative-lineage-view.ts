import {
  thinLineage,
  type LineageEdge,
  type LineageNode,
  type LineageNodeKind
} from "@star-relay/lineage-model";

const REPOSITORY_SOURCE =
  "https://github.com/shinyay/ghcp-with-gaming-ideation/blob/main/";

type LineageStage = "all" | "evidence" | "inference" | "proposal";

interface CreativeLineageElements {
  readonly list: HTMLOListElement;
  readonly count: HTMLElement;
  readonly filters: readonly HTMLButtonElement[];
}

const layerByKind: Readonly<Record<LineageNodeKind, Exclude<LineageStage, "all">>> = {
  evidence: "evidence",
  conflict: "inference",
  finding: "inference",
  "play-dna": "inference",
  bet: "proposal",
  decision: "proposal",
  slice: "proposal",
  issue: "proposal",
  "pull-request": "proposal",
  build: "proposal",
  playable: "proposal"
};

function createActionLink(href: string, label: string, external: boolean): HTMLAnchorElement {
  const link = document.createElement("a");
  link.className = "lineage-action";
  link.href = href;
  link.textContent = label;
  if (external) {
    link.rel = "noreferrer";
    link.target = "_blank";
  }
  return link;
}

const githubObjectById = new Map(
  thinLineage.github_objects.map((object) => [object.stable_id, object])
);

function createNode(
  node: LineageNode,
  incoming: readonly LineageEdge[]
): HTMLLIElement {
  const layer = layerByKind[node.kind];
  const item = document.createElement("li");
  item.className = `lineage-node lineage-${node.kind}`;
  item.dataset["stableId"] = node.id;
  item.dataset["lineageLayer"] = layer;

  const badge = document.createElement("span");
  badge.className = "lineage-badge";
  badge.textContent = node.id;

  const content = document.createElement("div");
  const meta = document.createElement("p");
  meta.className = "lineage-meta";
  meta.textContent = `${layer.toUpperCase()} / ${node.kind}`;

  const heading = document.createElement("h3");
  heading.textContent = node.label_ja;

  const summary = document.createElement("p");
  summary.lang = "en";
  summary.textContent = node.summary_en;

  const actions = document.createElement("div");
  actions.className = "lineage-actions";
  actions.append(
    createActionLink(
      `${REPOSITORY_SOURCE}${node.repository_path}`,
      "Repository source",
      true
    )
  );
  const githubObject =
    node.github_object_id === null
      ? undefined
      : githubObjectById.get(node.github_object_id);
  if (githubObject !== undefined) {
    actions.append(
      createActionLink(githubObject.url, "Live GitHub object", true)
    );
  }
  if (node.id === "PLAYABLE-001") {
    actions.append(
      createActionLink("#legacy", "Open Legacy", false),
      createActionLink("#second-hand", "Open SECOND HAND", false)
    );
  }

  const fallback = document.createElement("code");
  fallback.className = "lineage-resolver";
  fallback.textContent = `offline:${node.github_object_id ?? node.id} -> ${node.repository_path}`;

  const relations = document.createElement("ul");
  relations.className = "lineage-relations";
  if (incoming.length === 0) {
    const origin = document.createElement("li");
    origin.textContent = "origin node";
    relations.append(origin);
  } else {
    for (const edge of incoming) {
      const relation = document.createElement("li");
      relation.textContent = `${edge.from} —${edge.relation}→ ${edge.to}`;
      relations.append(relation);
    }
  }

  content.append(meta, heading, summary, relations, actions, fallback);
  item.append(badge, content);
  return item;
}

function setSelectedFilter(
  filters: readonly HTMLButtonElement[],
  selected: LineageStage
): void {
  for (const filter of filters) {
    filter.setAttribute(
      "aria-pressed",
      String(filter.dataset["lineageStage"] === selected)
    );
  }
}

export function mountCreativeLineage(elements: CreativeLineageElements): void {
  let selected: LineageStage = "all";

  const render = (): void => {
    const nodes =
      selected === "all"
        ? thinLineage.nodes
        : thinLineage.nodes.filter((node) => layerByKind[node.kind] === selected);
    const fragment = document.createDocumentFragment();
    for (const node of nodes) {
      fragment.append(
        createNode(
          node,
          thinLineage.edges.filter((edge) => edge.to === node.id)
        )
      );
    }
    elements.list.replaceChildren(fragment);
    elements.count.textContent = `${nodes.length} / ${thinLineage.nodes.length} nodes`;
    setSelectedFilter(elements.filters, selected);
  };

  for (const filter of elements.filters) {
    filter.addEventListener("click", () => {
      const requested = filter.dataset["lineageStage"];
      if (
        requested === "all" ||
        requested === "evidence" ||
        requested === "inference" ||
        requested === "proposal"
      ) {
        selected = requested;
        render();
      }
    });
  }

  render();
}
