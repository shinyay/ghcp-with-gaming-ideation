import { lstat, readFile, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { isPathWithin } from "./lib/safe-path";

interface ResetManifest {
  readonly schema_version: 1;
  readonly id: "RESET-001";
  readonly destructive: false;
  readonly generated_targets: readonly string[];
}

const repositoryRoot = resolve(".");
const manifest = JSON.parse(
  await readFile("demo/offline-reset-manifest.json", "utf8")
) as ResetManifest;

if (
  manifest.schema_version !== 1 ||
  manifest.id !== "RESET-001" ||
  manifest.destructive !== false
) {
  throw new Error("Unsupported or destructive reset manifest.");
}

for (const configuredPath of manifest.generated_targets) {
  const target = resolve(configuredPath);
  if (!isPathWithin(repositoryRoot, target) || target === repositoryRoot) {
    throw new Error(`Reset target escapes the repository: ${configuredPath}`);
  }
  try {
    const info = await lstat(target);
    if (info.isSymbolicLink()) {
      throw new Error(`Reset target must not be a symlink: ${configuredPath}`);
    }
    await rm(target, { recursive: true, force: true });
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      continue;
    }
    throw error;
  }
}

console.log(
  `Reset ${manifest.generated_targets.length} generated demo targets from ${manifest.id}.`
);
