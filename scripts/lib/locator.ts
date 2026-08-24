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

const HEADING_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const C_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
const CSV_KEY = /^[^\s,]+$/;

/**
 * Locator targets reach a regular expression for the C schemes, so they are
 * validated as identifiers first and escaped second. A schema-valid but
 * regex-active target such as `.*` must never widen or crash a match.
 */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function assertLocatorTarget(scheme: string, target: string): string {
  switch (scheme) {
    case "md:heading":
      if (!HEADING_SLUG.test(target)) {
        throw new Error(
          `md:heading target must be an ASCII kebab-case slug: ${target}`
        );
      }
      return target;
    case "json:pointer":
      if (target !== "" && !target.startsWith("/")) {
        throw new Error(
          `json:pointer target must be empty or start with a slash: ${target}`
        );
      }
      return target;
    case "csv:row":
    case "csv:column":
      if (!CSV_KEY.test(target)) {
        throw new Error(
          `${scheme} target must be a non-empty key without whitespace or commas: ${target}`
        );
      }
      return target;
    case "c:symbol":
    case "c:define":
      if (!C_IDENTIFIER.test(target)) {
        throw new Error(
          `${scheme} target must be a C identifier: ${target}`
        );
      }
      return target;
    default:
      throw new Error(`Unhandled locator scheme: ${scheme}`);
  }
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
  return new RegExp(`\\b${escapeRegExp(identifier)}\\b`).test(content);
}

function hasCDefine(content: string, macro: string): boolean {
  return new RegExp(
    `^\\s*#\\s*define\\s+${escapeRegExp(macro)}\\b`,
    "m"
  ).test(content);
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
  assertLocatorTarget(scheme, target);

  switch (scheme) {
    case "md:heading":
      return markdownHeadingSlugs(fileContent).has(target);
    case "json:pointer":
      return (
        resolveJsonPointer(JSON.parse(fileContent) as unknown, target) !==
        undefined
      );
    case "csv:column": {
      const table = parseCsvFixture(fileContent);
      return table.header.includes(target) && table.rows.length > 0;
    }
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

/**
 * Names that a statement may only assert about when the matching locator is
 * cited. This keeps a citation from covering less than the sentence claims.
 */
export function citableNames(
  content: string,
  mediaType: string
): { readonly rows: readonly string[]; readonly columns: readonly string[]; readonly macros: readonly string[] } {
  if (mediaType === "text/csv") {
    const table = parseCsvFixture(content);
    return {
      rows: table.rows.map((row) => row[0] ?? "").filter((key) => key !== ""),
      columns: table.header.filter((name) => name.length >= 3),
      macros: []
    };
  }
  if (mediaType === "text/x-c") {
    return {
      rows: [],
      columns: [],
      macros: [...content.matchAll(/^\s*#\s*define\s+([A-Za-z_][A-Za-z0-9_]*)/gm)].map(
        (match) => match[1] ?? ""
      )
    };
  }
  return { rows: [], columns: [], macros: [] };
}

export function mentionsName(statement: string, name: string): boolean {
  return new RegExp(`(?<![A-Za-z0-9_-])${escapeRegExp(name)}(?![A-Za-z0-9_-])`).test(
    statement
  );
}

