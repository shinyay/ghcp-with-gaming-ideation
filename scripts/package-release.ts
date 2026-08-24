import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  cp,
  lstat,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile
} from "node:fs/promises";
import { join, resolve } from "node:path";
import Ajv from "ajv";
import { createDeterministicZip } from "./lib/zip";

interface ReleasePackage {
  readonly name:
    | "demo-site.zip"
    | "star-relay-1998-playable.zip"
    | "second-hand-vertical-slice.zip"
    | "offline-demo-pack.zip";
  readonly source: string;
  readonly entrypoint: "index.html";
  readonly start_anchor: "#museum" | "#legacy" | "#second-hand";
}

interface ReleaseAllowlist {
  readonly schema_version: 1;
  readonly release_id: "REL-001";
  readonly repository_access_required: "private";
  readonly pages_publication: "forbidden";
  readonly required_clean_paths: readonly string[];
  readonly packages: readonly ReleasePackage[];
  readonly forbidden_content_tokens: readonly string[];
}

const releaseRoot = resolve("dist/release");
const stagingRoot = resolve("dist/release-staging");
const allowlist = JSON.parse(
  await readFile("ops/packaging/release-allowlist.json", "utf8")
) as ReleaseAllowlist;
if (
  allowlist.schema_version !== 1 ||
  allowlist.release_id !== "REL-001" ||
  allowlist.repository_access_required !== "private" ||
  allowlist.pages_publication !== "forbidden" ||
  allowlist.packages.length !== 4
) {
  throw new Error("Unsupported release allowlist.");
}

const dirtyPaths = execFileSync(
  "git",
  [
    "status",
    "--porcelain=v1",
    "--untracked-files=all",
    "--",
    ...allowlist.required_clean_paths
  ],
  { encoding: "utf8" }
).trim();
if (dirtyPaths.length > 0) {
  throw new Error(
    `Release packages require a clean committed tree:\n${dirtyPaths}`
  );
}

async function collectFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const path = join(directory, entry.name);
    if (entry.isSymbolicLink()) {
      throw new Error(`Symlinks are forbidden in release inputs: ${path}`);
    }
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(path)));
    } else if (entry.isFile()) {
      files.push(path);
    }
  }
  return files;
}

async function assertAllowedContent(directory: string): Promise<void> {
  const textExtensions = new Set([
    ".css",
    ".html",
    ".js",
    ".json",
    ".map",
    ".md",
    ".mjs",
    ".txt"
  ]);
  for (const path of await collectFiles(directory)) {
    const extension = path.slice(path.lastIndexOf("."));
    if (!textExtensions.has(extension)) {
      continue;
    }
    const content = await readFile(path, "utf8");
    for (const token of allowlist.forbidden_content_tokens) {
      if (content.includes(token)) {
        throw new Error(`Forbidden token ${token} found in release input ${path}.`);
      }
    }
  }
}

await rm(releaseRoot, { recursive: true, force: true });
await rm(stagingRoot, { recursive: true, force: true });
await mkdir(releaseRoot, { recursive: true });
await mkdir(stagingRoot, { recursive: true });

const artifacts: {
  name: ReleasePackage["name"];
  sha256: string;
  bytes: number;
  entrypoint: "index.html";
  start_anchor: ReleasePackage["start_anchor"];
}[] = [];

for (const packageDefinition of allowlist.packages) {
  const source = resolve(packageDefinition.source);
  const sourceInfo = await lstat(source);
  if (!sourceInfo.isDirectory()) {
    throw new Error(`Release source is not a directory: ${packageDefinition.source}`);
  }

  const stage = resolve(
    stagingRoot,
    packageDefinition.name.slice(0, -".zip".length)
  );
  await cp(source, stage, { recursive: true, force: false });
  await writeFile(
    join(stage, "package-entry.json"),
    `${JSON.stringify(
      {
        schema_version: 1,
        release_id: allowlist.release_id,
        entrypoint: packageDefinition.entrypoint,
        start_anchor: packageDefinition.start_anchor
      },
      null,
      2
    )}\n`,
    "utf8"
  );
  await assertAllowedContent(stage);

  const output = resolve(releaseRoot, packageDefinition.name);
  await createDeterministicZip(stage, output);
  const content = await readFile(output);
  artifacts.push({
    name: packageDefinition.name,
    sha256: createHash("sha256").update(content).digest("hex"),
    bytes: content.byteLength,
    entrypoint: packageDefinition.entrypoint,
    start_anchor: packageDefinition.start_anchor
  });
}

const lineageSnapshot = await readFile(
  "demo/offline-snapshots/lineage-snapshot.json"
);
const sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], {
  encoding: "utf8"
}).trim();
const manifest = {
  schema_version: 1,
  release_id: allowlist.release_id,
  classification: "demo-safe",
  repository_access_required: allowlist.repository_access_required,
  pages_published: false,
  source_commit: sourceCommit,
  lineage_snapshot_sha256: createHash("sha256")
    .update(lineageSnapshot)
    .digest("hex"),
  artifacts
};

const schema = JSON.parse(
  await readFile("schemas/release-build-manifest.schema.json", "utf8")
) as object;
const validate = new Ajv({ allErrors: true, strict: true }).compile(schema);
if (!validate(manifest)) {
  throw new Error(
    `Release build manifest failed validation: ${JSON.stringify(validate.errors)}`
  );
}

const manifestPath = join(releaseRoot, "build-manifest.json");
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
const manifestContent = await readFile(manifestPath);
const checksumEntries = [
  ...artifacts.map((artifact) => ({
    name: artifact.name,
    sha256: artifact.sha256
  })),
  {
    name: "build-manifest.json",
    sha256: createHash("sha256").update(manifestContent).digest("hex")
  }
].sort((left, right) => left.name.localeCompare(right.name));
await writeFile(
  join(releaseRoot, "SHA256SUMS"),
  `${checksumEntries
    .map((entry) => `${entry.sha256}  ${entry.name}`)
    .join("\n")}\n`,
  "utf8"
);

for (const artifact of artifacts) {
  const actual = await stat(join(releaseRoot, artifact.name));
  if (actual.size !== artifact.bytes) {
    throw new Error(`Release artifact size changed: ${artifact.name}`);
  }
}

await rm(stagingRoot, { recursive: true, force: true });
console.log(`Packaged ${artifacts.length} release artifacts into ${releaseRoot}.`);
