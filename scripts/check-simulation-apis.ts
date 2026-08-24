import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const ROOTS = [
  "packages/game-core/src",
  "packages/legacy-1998/src",
  "packages/second-hand/src"
];

const FORBIDDEN = [
  /\bMath\.(?:random|sin|cos|tan|atan2|pow|exp|log|sqrt)\b/,
  /\bperformance\.now\b/,
  /\bnew\s+Date\b/,
  /\bDate\.(?:now|parse|UTC)\b/
];

async function collectTypeScriptFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectTypeScriptFiles(path)));
    } else if (entry.isFile() && entry.name.endsWith(".ts")) {
      files.push(path);
    }
  }

  return files;
}

const violations: string[] = [];

for (const root of ROOTS) {
  for (const file of await collectTypeScriptFiles(root)) {
    const source = await readFile(file, "utf8");
    for (const pattern of FORBIDDEN) {
      if (pattern.test(source)) {
        violations.push(`${relative(".", file)} matches ${pattern.source}`);
      }
    }
  }
}

if (violations.length > 0) {
  throw new Error(`Forbidden simulation API usage:\n${violations.join("\n")}`);
}

console.log("Simulation API guard passed.");
