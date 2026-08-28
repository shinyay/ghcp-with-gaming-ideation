import { createHash } from "node:crypto";
import { lstat, readFile, readdir } from "node:fs/promises";
import { sep } from "node:path";

interface PagesFile {
  readonly path: string;
  readonly public_route: string | null;
  readonly content_id: string;
  readonly classification: "demo-safe";
  readonly bytes: number;
  readonly sha256: string;
}

interface PagesAllowlist {
  readonly schema_version: 1;
  readonly publication_id: "PAGES-001";
  readonly base_path: string;
  readonly repository_visibility_required: "private";
  readonly pages_visibility: "public";
  readonly build_type: "workflow";
  readonly hash_projection: "utf8-lf-sha256-v1";
  readonly rights_policy: string;
  readonly languages: readonly ["ja", "en"];
  readonly default_language: "ja";
  readonly language_toggle: "segmented";
  readonly preference_storage: "localStorage";
  readonly preference_storage_key: "star-relay-pages-language-v1";
  readonly files: readonly PagesFile[];
  readonly forbidden_html_patterns: readonly string[];
}

interface TranslationEntry {
  readonly ja: string;
  readonly en: string;
}

interface TranslationCatalog {
  readonly schemaVersion: 1;
  readonly defaultLanguage: "ja";
  readonly storageKey: "star-relay-pages-language-v1";
  readonly translations: Readonly<Record<string, TranslationEntry>>;
}

interface DisclosureGuard {
  readonly repository_forbidden_substrings: readonly string[];
}

const PAGES_ROOT = "pages";
const ALLOWLIST_PATH = "ops/github/pages-allowlist.json";
const CSP =
  "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; font-src 'none'; connect-src 'none'; media-src 'none'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'";
const WORKFLOW_CANONICAL =
  "https://shinyay.github.io/ghcp-with-gaming-ideation/";
const GUIDE_CANONICAL =
  "https://shinyay.github.io/ghcp-with-gaming-ideation/game-guide/";

const toPosix = (path: string): string => path.split(sep).join("/");

async function listFiles(root: string): Promise<string[]> {
  const output: string[] = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = `${root}/${entry.name}`;
    const metadata = await lstat(path);
    if (metadata.isSymbolicLink()) {
      throw new Error(`Symlinks are forbidden in Pages artifacts: ${path}`);
    }
    if (metadata.isDirectory()) {
      output.push(...(await listFiles(path)));
    } else if (metadata.isFile()) {
      output.push(toPosix(path));
    } else {
      throw new Error(`Unsupported Pages artifact entry: ${path}`);
    }
  }
  return output.sort();
}

function requireUnique(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length) {
    throw new Error(`${label} values must be unique.`);
  }
}

function htmlIds(content: string): readonly string[] {
  return [...content.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]!);
}

function fragmentTargets(content: string): readonly string[] {
  return [...content.matchAll(/href="#([^"]+)"/g)].map((match) => match[1]!);
}

function assertBilingualHtml(
  path: string,
  content: string,
  allowlist: PagesAllowlist
): void {
  const catalogMatch = content.match(
    /<script\b(?=[^>]*\bid="i18n-catalog")(?=[^>]*\btype="application\/json")[^>]*>([\s\S]*?)<\/script>/
  );
  if (catalogMatch?.[1] === undefined) {
    throw new Error(`${path} is missing its inline i18n catalog.`);
  }

  let catalog: TranslationCatalog;
  try {
    catalog = JSON.parse(catalogMatch[1]) as TranslationCatalog;
  } catch (error) {
    throw new Error(`${path} has invalid i18n catalog JSON.`, { cause: error });
  }

  if (
    catalog.schemaVersion !== 1 ||
    catalog.defaultLanguage !== allowlist.default_language ||
    catalog.storageKey !== allowlist.preference_storage_key
  ) {
    throw new Error(`${path} i18n catalog does not match the Pages allowlist.`);
  }

  const translationEntries = Object.entries(catalog.translations);
  if (translationEntries.length === 0) {
    throw new Error(`${path} i18n catalog has no translations.`);
  }
  for (const [key, entry] of translationEntries) {
    if (!/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/i.test(key)) {
      throw new Error(`${path} has an invalid i18n key: ${key}`);
    }
    if (
      typeof entry !== "object" ||
      entry === null ||
      typeof entry.ja !== "string" ||
      entry.ja.trim().length === 0 ||
      typeof entry.en !== "string" ||
      entry.en.trim().length === 0
    ) {
      throw new Error(`${path} has an incomplete i18n entry: ${key}`);
    }
  }

  const markupWithoutCatalog = content.replace(catalogMatch[0], "");
  const referencedKeys = [
    ...markupWithoutCatalog.matchAll(
      /\sdata-i18n(?:-[a-z][a-z0-9-]*)?="([^"]+)"/gi
    )
  ].map((match) => match[1]!);
  if (referencedKeys.length === 0) {
    throw new Error(`${path} has no i18n bindings.`);
  }
  for (const key of referencedKeys) {
    if (catalog.translations[key] === undefined) {
      throw new Error(`${path} references a missing i18n key: ${key}`);
    }
  }

  const languageChoices = [
    ...content.matchAll(/\sdata-language-choice="([^"]+)"/g)
  ].map((match) => match[1]!);
  if (
    JSON.stringify(languageChoices.sort()) !== JSON.stringify([...allowlist.languages].sort())
  ) {
    throw new Error(`${path} must expose exactly the ja/en language choices.`);
  }
  if (
    !content.includes("data-language-switcher") ||
    !content.includes("data-language-status") ||
    !content.includes("data-translation-notice")
  ) {
    throw new Error(`${path} is missing required bilingual accessibility markers.`);
  }
  if (!/<html\b[^>]*\blang="ja"/i.test(content)) {
    throw new Error(`${path} must keep Japanese as the default document language.`);
  }
  if (!/<title\b[^>]*\bdata-i18n="[^"]+"/i.test(content)) {
    throw new Error(`${path} must localize the document title.`);
  }
  if (
    !/<meta\b(?=[^>]*\bname="description")(?=[^>]*\bdata-i18n-content="[^"]+")[^>]*>/i.test(
      content
    )
  ) {
    throw new Error(`${path} must localize the meta description.`);
  }
  if (!content.includes("localStorage")) {
    throw new Error(`${path} must persist its language choice locally.`);
  }
  if (/\binnerHTML\b/.test(content)) {
    throw new Error(`${path} must not use innerHTML for translation.`);
  }
}

function assertSelfContainedHtml(
  path: string,
  content: string,
  canonical: string,
  routeLink: string,
  forbidden: readonly string[]
): void {
  if (!content.includes(`content="${CSP}"`)) {
    throw new Error(`${path} is missing the required self-contained CSP.`);
  }
  if (!content.includes(`href="${canonical}"`)) {
    throw new Error(`${path} has the wrong canonical URL.`);
  }
  if (!content.includes(`href="${routeLink}"`)) {
    throw new Error(`${path} is missing its same-origin artifact navigation.`);
  }
  if (!content.includes("Public display scope: this HTML only")) {
    throw new Error(`${path} is missing the limited public-display notice.`);
  }

  const forbiddenMarkup = [
    /<script\b[^>]*\bsrc\s*=/i,
    /<link\b[^>]*\brel\s*=\s*["']stylesheet["']/i,
    /<img\b[^>]*\bsrc\s*=\s*["']https?:/i,
    /url\(\s*["']?https?:/i,
    /\bfetch\s*\(/,
    /\bXMLHttpRequest\b/,
    /\bWebSocket\s*\(/,
    /\bEventSource\s*\(/,
    /\bsendBeacon\s*\(/
  ];
  for (const pattern of forbiddenMarkup) {
    if (pattern.test(content)) {
      throw new Error(`${path} contains forbidden external or network markup: ${pattern}`);
    }
  }

  for (const value of forbidden) {
    if (content.toLowerCase().includes(value.toLowerCase())) {
      throw new Error(`${path} contains forbidden content: ${value}`);
    }
  }

  const ids = htmlIds(content);
  requireUnique(ids, `${path} id`);
  const idSet = new Set(ids);
  for (const fragment of fragmentTargets(content)) {
    if (!idSet.has(fragment)) {
      throw new Error(`${path} has an unresolved fragment: #${fragment}`);
    }
  }
}

const allowlist = JSON.parse(
  await readFile(ALLOWLIST_PATH, "utf8")
) as PagesAllowlist;
if (
  allowlist.schema_version !== 1 ||
  allowlist.publication_id !== "PAGES-001" ||
  allowlist.base_path !== "/ghcp-with-gaming-ideation/" ||
  allowlist.repository_visibility_required !== "private" ||
  allowlist.pages_visibility !== "public" ||
  allowlist.build_type !== "workflow" ||
  allowlist.hash_projection !== "utf8-lf-sha256-v1" ||
  allowlist.rights_policy !== "governance/pages-publication-policy.md" ||
  JSON.stringify(allowlist.languages) !== JSON.stringify(["ja", "en"]) ||
  allowlist.default_language !== "ja" ||
  allowlist.language_toggle !== "segmented" ||
  allowlist.preference_storage !== "localStorage" ||
  allowlist.preference_storage_key !== "star-relay-pages-language-v1"
) {
  throw new Error("Unsupported Pages allowlist configuration.");
}

const allowlistedPaths = allowlist.files.map((entry) => entry.path).sort();
requireUnique(allowlistedPaths, "Pages allowlist path");
requireUnique(
  allowlist.files.map((entry) => entry.content_id),
  "Pages content ID"
);
if (
  JSON.stringify(allowlistedPaths) !==
  JSON.stringify([
    "pages/.nojekyll",
    "pages/game-guide/index.html",
    "pages/index.html"
  ])
) {
  throw new Error("Pages allowlist must contain exactly two HTML files and .nojekyll.");
}

const actualPaths = await listFiles(PAGES_ROOT);
if (JSON.stringify(actualPaths) !== JSON.stringify(allowlistedPaths)) {
  throw new Error(
    `Pages tree differs from allowlist: ${JSON.stringify({
      expected: allowlistedPaths,
      actual: actualPaths
    })}`
  );
}

const guard = JSON.parse(
  await readFile("governance/disclosure-guard.json", "utf8")
) as DisclosureGuard;
const forbidden = [
  ...allowlist.forbidden_html_patterns,
  ...guard.repository_forbidden_substrings
];

for (const entry of allowlist.files) {
  const content = await readFile(entry.path);
  const projected = entry.path.endsWith(".html")
    ? Buffer.from(content.toString("utf8").replace(/\r\n/g, "\n"), "utf8")
    : content;
  const hash = createHash("sha256").update(projected).digest("hex");
  if (projected.length !== entry.bytes || hash !== entry.sha256) {
    throw new Error(`Pages artifact does not match allowlist: ${entry.path}`);
  }
  if (entry.classification !== "demo-safe") {
    throw new Error(`Pages artifact is not demo-safe: ${entry.path}`);
  }

  if (entry.path.endsWith(".html")) {
    const text = content.toString("utf8");
    assertBilingualHtml(entry.path, text, allowlist);
    assertSelfContainedHtml(
      entry.path,
      text,
      entry.path === "pages/index.html" ? WORKFLOW_CANONICAL : GUIDE_CANONICAL,
      entry.path === "pages/index.html" ? "./game-guide/" : "../",
      forbidden
    );
  } else if (content.length !== 0) {
    throw new Error(`${entry.path} must remain empty.`);
  }
}

await lstat(allowlist.rights_policy);
console.log(
  `Validated ${allowlist.files.length} allowlisted Pages files for ${allowlist.publication_id}.`
);
