import { createHash } from "node:crypto";

export const DERIVED_HASH_PROJECTION = "utf8-nfc-lf-v1";

export function normalizeFixtureText(content: string): string {
  return content.normalize("NFC").replace(/\r\n?/g, "\n");
}

export function hashFixtureText(content: string): string {
  return createHash("sha256")
    .update(normalizeFixtureText(content), "utf8")
    .digest("hex");
}
