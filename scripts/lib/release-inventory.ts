export interface ReleaseInventoryEntry {
  readonly name: string;
  readonly entrypoint: string;
  readonly start_anchor: string;
}

export const expectedReleaseInventory: readonly ReleaseInventoryEntry[] = [
  {
    name: "demo-site.zip",
    entrypoint: "index.html",
    start_anchor: "#museum"
  },
  {
    name: "star-relay-1998-playable.zip",
    entrypoint: "index.html",
    start_anchor: "#legacy"
  },
  {
    name: "second-hand-vertical-slice.zip",
    entrypoint: "index.html",
    start_anchor: "#second-hand"
  },
  {
    name: "offline-demo-pack.zip",
    entrypoint: "index.html",
    start_anchor: "#museum"
  }
] as const;

export function validateReleaseInventory(
  entries: readonly ReleaseInventoryEntry[]
): readonly string[] {
  const errors: string[] = [];
  if (entries.length !== expectedReleaseInventory.length) {
    errors.push(
      `Expected ${expectedReleaseInventory.length} release artifacts, found ${entries.length}.`
    );
  }
  if (new Set(entries.map((entry) => entry.name)).size !== entries.length) {
    errors.push("Release artifact names must be unique.");
  }

  for (let index = 0; index < expectedReleaseInventory.length; index += 1) {
    const expected = expectedReleaseInventory[index];
    const actual = entries[index];
    if (expected === undefined || actual === undefined) {
      continue;
    }
    if (
      actual.name !== expected.name ||
      actual.entrypoint !== expected.entrypoint ||
      actual.start_anchor !== expected.start_anchor
    ) {
      errors.push(
        `Release artifact ${index} must be ${expected.name} at ${expected.entrypoint}${expected.start_anchor}.`
      );
    }
  }
  return errors;
}

export function assertReleaseInventory(
  entries: readonly ReleaseInventoryEntry[]
): void {
  const errors = validateReleaseInventory(entries);
  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }
}
