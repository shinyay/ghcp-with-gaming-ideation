import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { crc32 } from "./lib/zip";
import { isPathWithin } from "./lib/safe-path";

const archivePath = "dist/release/offline-demo-pack.zip";
const targetRoot = resolve("dist/release-smoke/offline-demo-pack");
const archive = await readFile(archivePath);

await rm(targetRoot, { recursive: true, force: true });
await mkdir(targetRoot, { recursive: true });

let offset = 0;
let extracted = 0;
while (offset + 4 <= archive.length) {
  const signature = archive.readUInt32LE(offset);
  if (signature === 0x02014b50 || signature === 0x06054b50) {
    break;
  }
  if (signature !== 0x04034b50 || offset + 30 > archive.length) {
    throw new Error(`Invalid ZIP local header at offset ${offset}.`);
  }

  const flags = archive.readUInt16LE(offset + 6);
  const method = archive.readUInt16LE(offset + 8);
  const expectedCrc = archive.readUInt32LE(offset + 14);
  const compressedSize = archive.readUInt32LE(offset + 18);
  const uncompressedSize = archive.readUInt32LE(offset + 22);
  const nameLength = archive.readUInt16LE(offset + 26);
  const extraLength = archive.readUInt16LE(offset + 28);
  if (
    flags !== 0x0800 ||
    method !== 0 ||
    compressedSize !== uncompressedSize
  ) {
    throw new Error("Offline release ZIP must use deterministic stored entries.");
  }

  const nameStart = offset + 30;
  const dataStart = nameStart + nameLength + extraLength;
  const dataEnd = dataStart + compressedSize;
  if (dataEnd > archive.length) {
    throw new Error("Offline release ZIP entry exceeds archive bounds.");
  }
  const name = archive.subarray(nameStart, nameStart + nameLength).toString("utf8");
  const content = archive.subarray(dataStart, dataEnd);
  if (name.length === 0 || name.endsWith("/") || crc32(content) !== expectedCrc) {
    throw new Error(`Invalid offline release ZIP entry: ${name}`);
  }

  const target = resolve(targetRoot, name);
  if (!isPathWithin(targetRoot, target) || target === targetRoot) {
    throw new Error(`Offline release ZIP path escapes target: ${name}`);
  }
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, content);
  extracted += 1;
  offset = dataEnd;
}

if (extracted === 0) {
  throw new Error("Offline release ZIP contains no files.");
}

const entry = JSON.parse(
  await readFile(resolve(targetRoot, "package-entry.json"), "utf8")
) as {
  readonly entrypoint: string;
  readonly start_anchor: string;
};
if (entry.entrypoint !== "index.html" || entry.start_anchor !== "#museum") {
  throw new Error("Offline release ZIP has an invalid entrypoint.");
}
await Promise.all([
  readFile(resolve(targetRoot, "index.html")),
  readFile(resolve(targetRoot, "serve.mjs")),
  readFile(resolve(targetRoot, "build-manifest.json")),
  readFile(resolve(targetRoot, "SHA256SUMS"))
]);

console.log(`Extracted ${extracted} verified offline release files.`);
