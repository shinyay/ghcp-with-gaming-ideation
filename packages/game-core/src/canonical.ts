export type CanonicalIntegerValue = number | readonly number[];
export type CanonicalIntegerField = readonly [
  name: string,
  value: CanonicalIntegerValue
];

const FIELD_NAME = /^[a-z][a-z0-9_]*$/;

function assertSafeInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value)) {
    throw new TypeError(`${label} must be a safe integer`);
  }
}

function encodeValue(name: string, value: CanonicalIntegerValue): string {
  if (typeof value === "number") {
    assertSafeInteger(value, name);
    return String(value);
  }

  for (let index = 0; index < value.length; index += 1) {
    const item = value[index];
    if (item === undefined) {
      throw new TypeError(`${name}[${index}] is missing`);
    }
    assertSafeInteger(item, `${name}[${index}]`);
  }

  return `[${value.join(",")}]`;
}

export function serializeIntegerState(
  schemaVersion: number,
  fields: readonly CanonicalIntegerField[]
): string {
  assertSafeInteger(schemaVersion, "schemaVersion");
  const seen = new Set<string>();
  const segments = [`schema=${schemaVersion}`];

  for (const [name, value] of fields) {
    if (!FIELD_NAME.test(name)) {
      throw new TypeError(`Invalid canonical field name: ${name}`);
    }
    if (seen.has(name)) {
      throw new TypeError(`Duplicate canonical field name: ${name}`);
    }
    seen.add(name);
    segments.push(`${name}=${encodeValue(name, value)}`);
  }

  return segments.join("|");
}

export function hashCanonical(serialized: string): string {
  let hash = 0x811c9dc5;
  const bytes = new TextEncoder().encode(serialized);

  for (const byte of bytes) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }

  return hash.toString(16).padStart(8, "0");
}
