export const LOCATOR_GRAMMAR_VERSIONS = ["sr-loc/v1", "sr-loc/v2"] as const;

export type LocatorGrammarVersion = (typeof LOCATOR_GRAMMAR_VERSIONS)[number];

const V1_SCHEMES = new Set(["md:heading", "json:pointer"]);

const V2_SCHEMES = new Set([
  "md:heading",
  "json:pointer",
  "csv:row",
  "csv:column",
  "c:symbol",
  "c:define"
]);

export function schemesFor(version: LocatorGrammarVersion): ReadonlySet<string> {
  return version === "sr-loc/v1" ? V1_SCHEMES : V2_SCHEMES;
}

export function splitLocator(locator: string): {
  readonly scheme: string;
  readonly target: string;
} {
  const separator = locator.indexOf("/");
  if (separator < 0) {
    throw new Error(`Locator has no scheme separator: ${locator}`);
  }
  return {
    scheme: locator.slice(0, separator),
    target: locator.slice(separator + 1)
  };
}

export function slugifyHeading(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^\u0020-\u007e]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function markdownHeadingSlugs(content: string): ReadonlySet<string> {
  const slugs = new Set<string>();
  for (const line of content.split("\n")) {
    const match = /^#{1,6}\s+(.*\S)\s*$/.exec(line);
    if (match) {
      slugs.add(slugifyHeading(match[1] ?? ""));
    }
  }
  return slugs;
}

export function resolveJsonPointer(document: unknown, pointer: string): unknown {
  if (pointer === "") {
    return document;
  }
  if (!pointer.startsWith("/")) {
    throw new Error(`JSON pointer must start with a slash: ${pointer}`);
  }

  let current: unknown = document;
  for (const rawToken of pointer.slice(1).split("/")) {
    const token = rawToken.replace(/~1/g, "/").replace(/~0/g, "~");
    if (Array.isArray(current)) {
      const index = Number(token);
      if (!Number.isInteger(index) || index < 0 || index >= current.length) {
        return undefined;
      }
      current = current[index];
      continue;
    }
    if (current !== null && typeof current === "object") {
      const record = current as Record<string, unknown>;
      if (!Object.prototype.hasOwnProperty.call(record, token)) {
        return undefined;
      }
      current = record[token];
      continue;
    }
    return undefined;
  }
  return current;
}

export interface CsvTable {
  readonly header: readonly string[];
  readonly rows: readonly (readonly string[])[];
}

export function parseCsvFixture(content: string): CsvTable {
  const lines = content
    .split("\n")
    .filter((line) => line.trim().length > 0 && !line.startsWith("#"));

  if (lines.length === 0) {
    throw new Error("CSV fixture has no header row.");
  }

  const cells = lines.map((line) => line.split(",").map((cell) => cell.trim()));
  return { header: cells[0] ?? [], rows: cells.slice(1) };
}

function hasCIdentifier(content: string, identifier: string): boolean {
  return new RegExp(`\\b${identifier}\\b`).test(content);
}

function hasCDefine(content: string, macro: string): boolean {
  return new RegExp(`^\\s*#\\s*define\\s+${macro}\\b`, "m").test(content);
}

export function resolveLocator(
  locator: string,
  fileContent: string,
  version: LocatorGrammarVersion
): boolean {
  const { scheme, target } = splitLocator(locator);

  if (!schemesFor(version).has(scheme)) {
    throw new Error(`Locator scheme ${scheme} is not part of ${version}.`);
  }

  switch (scheme) {
    case "md:heading":
      return markdownHeadingSlugs(fileContent).has(target);
    case "json:pointer":
      return (
        resolveJsonPointer(JSON.parse(fileContent) as unknown, target) !==
        undefined
      );
    case "csv:column":
      return parseCsvFixture(fileContent).header.includes(target);
    case "csv:row":
      return parseCsvFixture(fileContent).rows.some(
        (row) => row[0] === target
      );
    case "c:symbol":
      return hasCIdentifier(fileContent, target);
    case "c:define":
      return hasCDefine(fileContent, target);
    default:
      throw new Error(`Unhandled locator scheme: ${scheme}`);
  }
}
