import { readFile, readdir, lstat, mkdir, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";

interface ZipEntry {
  readonly name: string;
  readonly content: Buffer;
  readonly crc: number;
  readonly offset: number;
}

const crcTable = new Uint32Array(256);
for (let index = 0; index < crcTable.length; index += 1) {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = (value & 1) === 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  crcTable[index] = value >>> 0;
}

export function crc32(content: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of content) {
    const tableValue = crcTable[(crc ^ byte) & 0xff];
    if (tableValue === undefined) {
      throw new Error("CRC table lookup failed.");
    }
    crc = tableValue ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

async function collectFiles(root: string, directory = root): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const path = join(directory, entry.name);
    if (entry.isSymbolicLink()) {
      throw new Error(`Symlinks are forbidden in release packages: ${path}`);
    }
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(root, path)));
    } else if (entry.isFile()) {
      files.push(path);
    }
  }
  return files;
}

function localHeader(entry: Omit<ZipEntry, "offset">): Buffer {
  const name = Buffer.from(entry.name, "utf8");
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0x0800, 6);
  header.writeUInt16LE(0, 8);
  header.writeUInt16LE(0, 10);
  header.writeUInt16LE(0x21, 12);
  header.writeUInt32LE(entry.crc, 14);
  header.writeUInt32LE(entry.content.length, 18);
  header.writeUInt32LE(entry.content.length, 22);
  header.writeUInt16LE(name.length, 26);
  header.writeUInt16LE(0, 28);
  return Buffer.concat([header, name, entry.content]);
}

function centralHeader(entry: ZipEntry): Buffer {
  const name = Buffer.from(entry.name, "utf8");
  const header = Buffer.alloc(46);
  header.writeUInt32LE(0x02014b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(20, 6);
  header.writeUInt16LE(0x0800, 8);
  header.writeUInt16LE(0, 10);
  header.writeUInt16LE(0, 12);
  header.writeUInt16LE(0x21, 14);
  header.writeUInt32LE(entry.crc, 16);
  header.writeUInt32LE(entry.content.length, 20);
  header.writeUInt32LE(entry.content.length, 24);
  header.writeUInt16LE(name.length, 28);
  header.writeUInt16LE(0, 30);
  header.writeUInt16LE(0, 32);
  header.writeUInt16LE(0, 34);
  header.writeUInt16LE(0, 36);
  header.writeUInt32LE(0, 38);
  header.writeUInt32LE(entry.offset, 42);
  return Buffer.concat([header, name]);
}

export async function createDeterministicZip(
  sourceDirectory: string,
  outputPath: string
): Promise<void> {
  const files = await collectFiles(sourceDirectory);
  if (files.length === 0 || files.length > 0xffff) {
    throw new Error(`Unsupported ZIP entry count: ${files.length}`);
  }

  const localParts: Buffer[] = [];
  const entries: ZipEntry[] = [];
  let offset = 0;
  for (const path of files) {
    const content = await readFile(path);
    const partial = {
      name: relative(sourceDirectory, path).replaceAll("\\", "/"),
      content,
      crc: crc32(content)
    };
    const part = localHeader(partial);
    entries.push({ ...partial, offset });
    localParts.push(part);
    offset += part.length;
  }

  const centralParts = entries.map(centralHeader);
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, Buffer.concat([...localParts, ...centralParts, end]));
}
