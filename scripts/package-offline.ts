import { createHash } from "node:crypto";
import {
  copyFile,
  lstat,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile
} from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import Ajv from "ajv";

interface AllowlistEntry {
  readonly from: string;
  readonly to: string;
}

interface Allowlist {
  readonly schema_version: 1;
  readonly build_id: "BLD-001";
  readonly sources: readonly AllowlistEntry[];
  readonly forbidden_content_tokens: readonly string[];
}

interface ManifestFile {
  readonly path: string;
  readonly sha256: string;
  readonly bytes: number;
}

const TARGET = resolve("dist/offline-demo-pack");
const allowlist = JSON.parse(
  await readFile("ops/packaging/allowlist.json", "utf8")
) as Allowlist;

if (allowlist.schema_version !== 1 || allowlist.build_id !== "BLD-001") {
  throw new Error("Unsupported package allowlist.");
}

await rm(TARGET, { recursive: true, force: true });
await mkdir(TARGET, { recursive: true });

async function collectFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isSymbolicLink()) {
      throw new Error(`Symlinks are forbidden in packages: ${path}`);
    }
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(path)));
    } else if (entry.isFile()) {
      files.push(path);
    }
  }

  return files;
}

for (const entry of allowlist.sources) {
  const sourceRoot = resolve(entry.from);
  const sourceInfo = await lstat(sourceRoot);
  if (!sourceInfo.isDirectory()) {
    throw new Error(`Allowlisted source is not a directory: ${entry.from}`);
  }

  for (const sourcePath of await collectFiles(sourceRoot)) {
    const targetPath = resolve(TARGET, entry.to, relative(sourceRoot, sourcePath));
    if (!targetPath.startsWith(`${TARGET}\\`) && targetPath !== TARGET) {
      throw new Error(`Package path escapes target: ${targetPath}`);
    }
    await mkdir(dirname(targetPath), { recursive: true });
    await copyFile(sourcePath, targetPath);
  }
}

const packagedFiles = await collectFiles(TARGET);
const manifestFiles: ManifestFile[] = [];
const textExtensions = new Set([".css", ".html", ".js", ".json", ".map", ".txt"]);

for (const file of packagedFiles) {
  const content = await readFile(file);
  const extension = file.slice(file.lastIndexOf("."));

  if (textExtensions.has(extension)) {
    const text = content.toString("utf8");
    for (const token of allowlist.forbidden_content_tokens) {
      if (text.includes(token)) {
        throw new Error(`Forbidden token ${token} found in ${relative(TARGET, file)}.`);
      }
    }
  }

  manifestFiles.push({
    path: relative(TARGET, file).replaceAll("\\", "/"),
    sha256: createHash("sha256").update(content).digest("hex"),
    bytes: content.byteLength
  });
}

manifestFiles.sort((left, right) => left.path.localeCompare(right.path));

const manifest = {
  schema_version: 1,
  build_id: "BLD-001",
  classification: "demo-safe",
  entrypoint: "index.html",
  files: manifestFiles
};

const buildManifestSchema = JSON.parse(
  await readFile("schemas/build-manifest.schema.json", "utf8")
) as object;
const validateManifest = new Ajv({ allErrors: true, strict: true }).compile(
  buildManifestSchema
);
if (!validateManifest(manifest)) {
  throw new Error(
    `Build manifest failed schema validation: ${JSON.stringify(validateManifest.errors)}`
  );
}

await writeFile(
  join(TARGET, "build-manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8"
);
await writeFile(
  join(TARGET, "SHA256SUMS"),
  `${manifestFiles.map((file) => `${file.sha256}  ${file.path}`).join("\n")}\n`,
  "utf8"
);

console.log(`Packaged ${manifestFiles.length} allowlisted files into ${TARGET}.`);
