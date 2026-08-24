import rawArchive from "../../../demo/offline-snapshots/archive-assets.json";

const REPOSITORY_SOURCE =
  "https://github.com/shinyay/ghcp-with-gaming-ideation/blob/main/";

interface ArchiveAsset {
  readonly id: string;
  readonly title: string;
  readonly source_created_at: string;
  readonly media_type: string;
  readonly path: string;
  readonly derived_sha256: string;
  readonly locators: readonly string[];
  readonly review_status: string;
  readonly origin_kind: "synthetic_fixture";
}

interface ArchiveSnapshot {
  readonly schema_version: 1;
  readonly id: "ARCHIVE-SNAPSHOT-001";
  readonly classification: "demo-safe";
  readonly source: {
    readonly path: string;
    readonly sha256: string;
  };
  readonly asset_count: number;
  readonly assets: readonly ArchiveAsset[];
}

interface ArchiveElements {
  readonly search: HTMLInputElement;
  readonly media: HTMLSelectElement;
  readonly clear: HTMLButtonElement;
  readonly list: HTMLElement;
  readonly count: HTMLElement;
  readonly empty: HTMLElement;
}

const archiveSnapshot = rawArchive as ArchiveSnapshot;

function mediaFamily(asset: ArchiveAsset): string {
  const segments = asset.path.split("/");
  return segments.length >= 3 ? segments[2] ?? "other" : "other";
}

function createAssetCard(asset: ArchiveAsset): HTMLElement {
  const article = document.createElement("article");
  article.className = "archive-card";
  article.dataset["archiveId"] = asset.id;
  article.dataset["mediaFamily"] = mediaFamily(asset);

  const meta = document.createElement("div");
  meta.className = "archive-card-meta";

  const id = document.createElement("span");
  id.className = "archive-id";
  id.textContent = asset.id;

  const date = document.createElement("span");
  date.textContent = `${asset.source_created_at} / fixture metadata`;
  meta.append(id, date);

  const heading = document.createElement("h3");
  heading.textContent = asset.title;

  const facts = document.createElement("dl");
  facts.className = "archive-facts";
  const factRows = [
    ["Media", asset.media_type],
    ["Origin", asset.origin_kind],
    ["Review", asset.review_status]
  ] as const;
  for (const [label, value] of factRows) {
    const term = document.createElement("dt");
    term.textContent = label;
    const description = document.createElement("dd");
    description.textContent = value;
    facts.append(term, description);
  }

  const locatorHeading = document.createElement("p");
  locatorHeading.className = "archive-locator-heading";
  locatorHeading.textContent = "Declared locators";

  const locators = document.createElement("ul");
  locators.className = "archive-locators";
  for (const locator of asset.locators) {
    const item = document.createElement("li");
    const code = document.createElement("code");
    code.textContent = locator;
    item.append(code);
    locators.append(item);
  }

  const source = document.createElement("a");
  source.className = "archive-source";
  source.href = `${REPOSITORY_SOURCE}${asset.path}`;
  source.rel = "noreferrer";
  source.target = "_blank";
  source.textContent = asset.path;

  const hash = document.createElement("code");
  hash.className = "archive-hash";
  hash.textContent = `sha256:${asset.derived_sha256}`;

  article.append(meta, heading, facts, locatorHeading, locators, source, hash);
  return article;
}

export function mountArchiveExplorer(elements: ArchiveElements): void {
  if (
    archiveSnapshot.asset_count !== 30 ||
    archiveSnapshot.assets.length !== archiveSnapshot.asset_count
  ) {
    throw new Error("Archive snapshot must contain exactly 30 allowlisted DRVs.");
  }

  const render = (): void => {
    const query = elements.search.value.trim().toLocaleLowerCase("en");
    const selectedMedia = elements.media.value;
    const assets = archiveSnapshot.assets.filter((asset) => {
      const matchesQuery =
        query.length === 0 ||
        [asset.id, asset.title, asset.path, ...asset.locators]
          .join("\n")
          .toLocaleLowerCase("en")
          .includes(query);
      const matchesMedia =
        selectedMedia === "all" || mediaFamily(asset) === selectedMedia;
      return matchesQuery && matchesMedia;
    });

    const fragment = document.createDocumentFragment();
    for (const asset of assets) {
      fragment.append(createAssetCard(asset));
    }
    elements.list.replaceChildren(fragment);
    elements.count.textContent = `${assets.length} / ${archiveSnapshot.asset_count} DRV`;
    elements.empty.hidden = assets.length !== 0;
  };

  elements.search.addEventListener("input", render);
  elements.media.addEventListener("change", render);
  elements.clear.addEventListener("click", () => {
    elements.search.value = "";
    elements.media.value = "all";
    elements.search.focus();
    render();
  });

  render();
}
