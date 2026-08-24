import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import Ajv from "ajv";
import { assertReleaseInventory } from "./lib/release-inventory";

interface Artifact {
  readonly name: string;
  readonly sha256: string;
  readonly bytes: number;
  readonly entrypoint: string;
  readonly start_anchor: string;
}

interface ReleaseManifest {
  readonly artifacts: readonly Artifact[];
}

const releaseRoot = "dist/release";
const manifestText = await readFile(
  join(releaseRoot, "build-manifest.json"),
  "utf8"
);
const manifest = JSON.parse(manifestText) as ReleaseManifest;
const schema = JSON.parse(
  await readFile("schemas/release-build-manifest.schema.json", "utf8")
) as object;
const validate = new Ajv({ allErrors: true, strict: true }).compile(schema);
if (!validate(manifest)) {
  throw new Error(
    `Release build manifest failed validation: ${JSON.stringify(validate.errors)}`
  );
}
assertReleaseInventory(manifest.artifacts);

for (const artifact of manifest.artifacts) {
  const path = join(releaseRoot, artifact.name);
  const [content, file] = await Promise.all([readFile(path), stat(path)]);
  const hash = createHash("sha256").update(content).digest("hex");
  if (hash !== artifact.sha256 || file.size !== artifact.bytes) {
    throw new Error(`Release artifact does not match manifest: ${artifact.name}`);
  }
  if (
    content.readUInt32LE(0) !== 0x04034b50 ||
    content.readUInt32LE(content.length - 22) !== 0x06054b50
  ) {
    throw new Error(`Release artifact is not a complete ZIP: ${artifact.name}`);
  }
}

const expectedChecksums = [
  ...manifest.artifacts.map((artifact) => ({
    name: artifact.name,
    sha256: artifact.sha256
  })),
  {
    name: "build-manifest.json",
    sha256: createHash("sha256").update(manifestText).digest("hex")
  }
]
  .sort((left, right) => left.name.localeCompare(right.name))
  .map((entry) => `${entry.sha256}  ${entry.name}`)
  .join("\n");
const actualChecksums = (
  await readFile(join(releaseRoot, "SHA256SUMS"), "utf8")
).trim();
if (actualChecksums !== expectedChecksums) {
  throw new Error("SHA256SUMS does not match release artifacts.");
}

console.log(`Verified ${manifest.artifacts.length} release artifacts and checksums.`);
