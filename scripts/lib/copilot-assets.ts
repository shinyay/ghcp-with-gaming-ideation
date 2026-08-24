import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { parse as parseYaml } from "yaml";

export const PROMPT_DIRECTORY = ".github/prompts";
export const AGENT_DIRECTORY = ".github/agents";
export const INSTRUCTION_DIRECTORY = ".github/instructions";
export const REPOSITORY_INSTRUCTIONS = ".github/copilot-instructions.md";
export const SCENARIO_MANIFEST = "evaluation/scenario-manifest.json";
export const STRUCTURAL_RUBRIC = "evaluation/structural-rubric.md";
export const SPACE_MANIFEST = "ops/github/copilot-space-manifest.yaml";

export const EXPECTED_PROMPT_COUNT = 7;
export const EXPECTED_AGENT_COUNT = 4;

/**
 * Agents that must not be able to change the repository or run commands. A
 * curator that can edit, or an auditor that can execute, would let an inference
 * become a stored fact without human review.
 */
export const READ_ONLY_AGENTS = ["archive-curator", "provenance-auditor"];

export const ALLOWED_AGENT_TOOLS = [
  "read",
  "search",
  "edit",
  "execute",
  "agent",
  "web",
  "todo"
];

export const ALLOWED_PROMPT_AGENT_MODES = ["ask", "agent", "plan"];

export interface Frontmatter {
  readonly name?: unknown;
  readonly description?: unknown;
  readonly applyTo?: unknown;
  readonly agent?: unknown;
  readonly mode?: unknown;
  readonly model?: unknown;
  readonly tools?: unknown;
  readonly infer?: unknown;
  readonly "argument-hint"?: unknown;
  readonly "disable-model-invocation"?: unknown;
  readonly "user-invocable"?: unknown;
}

export interface MarkdownAsset {
  readonly path: string;
  readonly slug: string;
  readonly frontmatter: Frontmatter;
  readonly body: string;
}

export function toPosix(path: string): string {
  return path.split("\\").join("/");
}

export async function collectFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(path)));
    } else if (entry.isFile()) {
      files.push(toPosix(relative(process.cwd(), path)));
    }
  }

  return files.sort();
}

/**
 * Splits a Markdown asset into YAML frontmatter and body. A missing or
 * unterminated frontmatter block is an error rather than an empty object,
 * because Copilot silently ignores a malformed header and the asset would look
 * installed while behaving like plain Markdown.
 */
export function splitFrontmatter(
  path: string,
  content: string
): { frontmatter: Frontmatter; body: string } {
  const normalized = content.replace(/\r\n?/g, "\n");
  if (!normalized.startsWith("---\n")) {
    throw new Error(`${path} does not start with a YAML frontmatter block.`);
  }

  const end = normalized.indexOf("\n---\n", 3);
  if (end === -1) {
    throw new Error(`${path} has an unterminated YAML frontmatter block.`);
  }

  const raw = normalized.slice(4, end + 1);
  const parsed = parseYaml(raw) as unknown;
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${path} frontmatter is not a YAML mapping.`);
  }

  return {
    frontmatter: parsed as Frontmatter,
    body: normalized.slice(end + 5)
  };
}

async function loadMarkdownAssets(
  directory: string,
  suffix: string
): Promise<readonly MarkdownAsset[]> {
  const files = (await collectFiles(directory)).filter((path) =>
    path.endsWith(suffix)
  );

  return Promise.all(
    files.map(async (path) => {
      const content = await readFile(path, "utf8");
      const { frontmatter, body } = splitFrontmatter(path, content);
      const name = path.slice(directory.length + 1, -suffix.length);
      return { path, slug: name, frontmatter, body };
    })
  );
}

export function loadPromptFiles(): Promise<readonly MarkdownAsset[]> {
  return loadMarkdownAssets(PROMPT_DIRECTORY, ".prompt.md");
}

export function loadAgentFiles(): Promise<readonly MarkdownAsset[]> {
  return loadMarkdownAssets(AGENT_DIRECTORY, ".agent.md");
}

export function loadInstructionFiles(): Promise<readonly MarkdownAsset[]> {
  return loadMarkdownAssets(INSTRUCTION_DIRECTORY, ".instructions.md");
}

/**
 * `tools` accepts a comma separated string or a YAML sequence. Both forms are
 * normalized so a scope check cannot be bypassed by changing notation.
 */
export function normalizeTools(
  path: string,
  value: unknown
): readonly string[] {
  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter((entry) => entry.length > 0);
  }
  if (Array.isArray(value)) {
    return value.map((entry) => {
      if (typeof entry !== "string") {
        throw new Error(`${path} lists a non-string tool entry.`);
      }
      return entry.trim().toLowerCase();
    });
  }
  throw new Error(`${path} must declare tools as a string or a string array.`);
}

const ID_PREFIXES = [
  "SRC",
  "AST",
  "DRV",
  "EVP",
  "CLM",
  "CFL",
  "FND",
  "HYP",
  "PDN",
  "BET",
  "ADR",
  "EXP",
  "VS",
  "BLD",
  "PT",
  "LRN"
] as const;

/**
 * Record files are named `<ID>-<lowercase description>.<ext>` or `<ID>.<ext>`.
 * The ID must therefore stop at the first separator that is not followed by
 * another uppercase segment, otherwise `EVP-001-speed-...` would register the
 * non-existent ID `EVP-001-`.
 */
const FILE_ID_PATTERN = new RegExp(
  `^(?:${ID_PREFIXES.join("|")})-[A-Z0-9]+(?:-[A-Z0-9]+)*(?=[-.]|$)`
);

interface CatalogShape {
  readonly assets: readonly { readonly id: string }[];
}

/**
 * Collects the stable IDs that actually exist, so a scenario cannot point at an
 * invented record. IDs are taken from the catalog, from record file names, and
 * from the Play DNA headings, never from prose that merely mentions an ID.
 */
export async function collectStableIds(): Promise<ReadonlySet<string>> {
  const ids = new Set<string>();

  const catalog = parseYaml(
    await readFile("archive/catalog/assets.yaml", "utf8")
  ) as CatalogShape;
  for (const asset of catalog.assets) {
    ids.add(asset.id);
  }

  const recordRoots = [
    "archive/evidence-packets",
    "research/claims",
    "research/conflicts",
    "research/findings",
    "research/hypotheses",
    "research/playtests",
    "design/bets",
    "design/decisions",
    "design/vertical-slices"
  ];

  for (const root of recordRoots) {
    for (const path of await collectFiles(root)) {
      const fileName = path.slice(path.lastIndexOf("/") + 1);
      const match = FILE_ID_PATTERN.exec(fileName);
      if (match) {
        ids.add(match[0]);
      }
    }
  }

  const playDna = await readFile("design/play-dna.md", "utf8");
  for (const line of playDna.split("\n")) {
    const heading = /^##\s+(PDN-[A-Z0-9][A-Z0-9-]*)\b/.exec(line);
    if (heading?.[1]) {
      ids.add(heading[1]);
    }
  }

  return ids;
}

/**
 * Terms are declared in the rubric as table row keys wrapped in backticks. The
 * rubric stays the single definition point, so a scenario cannot introduce a
 * check that nobody can score.
 */
export function rubricTerms(rubric: string): ReadonlySet<string> {
  const terms = new Set<string>();
  for (const line of rubric.split("\n")) {
    const cell = /^\|\s*`([a-z0-9]+(?:-[a-z0-9]+)*)`\s*\|/.exec(line);
    if (cell?.[1]) {
      terms.add(cell[1]);
    }
  }
  return terms;
}
