import { thinLineage } from "@star-relay/lineage-model";

const REPOSITORY_BASE =
  "https://github.com/shinyay/ghcp-with-gaming-ideation/blob/shinyay-star-relay-thin-slice/";

export function renderLineage(list: HTMLOListElement): void {
  const fragment = document.createDocumentFragment();

  for (const node of thinLineage.nodes) {
    const item = document.createElement("li");
    item.className = `lineage-node lineage-${node.kind}`;
    item.dataset["stableId"] = node.id;

    const badge = document.createElement("span");
    badge.className = "lineage-badge";
    badge.textContent = node.id;

    const content = document.createElement("div");
    const heading = document.createElement("h3");
    heading.textContent = node.label_ja;
    const summary = document.createElement("p");
    summary.lang = "en";
    summary.textContent = node.summary_en;

    const link = document.createElement("a");
    link.href = node.external_url ?? `${REPOSITORY_BASE}${node.repository_path}`;
    link.rel = "noreferrer";
    link.target = "_blank";
    link.textContent = node.external_url === null ? "repository source" : "GitHub object";

    const path = document.createElement("code");
    path.textContent = node.repository_path;

    content.append(heading, summary, link, path);
    item.append(badge, content);
    fragment.append(item);
  }

  list.replaceChildren(fragment);
}
