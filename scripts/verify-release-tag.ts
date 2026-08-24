import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

interface ReleaseAllowlist {
  readonly tag_pattern: string;
}

const tag = process.env["RELEASE_TAG"];
if (tag === undefined || tag.length === 0) {
  throw new Error("RELEASE_TAG is required.");
}

const allowlist = JSON.parse(
  await readFile("ops/packaging/release-allowlist.json", "utf8")
) as ReleaseAllowlist;
if (!new RegExp(allowlist.tag_pattern).test(tag)) {
  throw new Error(`Release tag is not allowlisted: ${tag}`);
}

const type = execFileSync("git", ["cat-file", "-t", `refs/tags/${tag}`], {
  encoding: "utf8"
}).trim();
if (type !== "tag") {
  throw new Error(`Release tag must be annotated: ${tag}`);
}

const [target, head] = [
  execFileSync("git", ["rev-list", "-n", "1", tag], { encoding: "utf8" }).trim(),
  execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim()
];
if (target !== head) {
  throw new Error(`Release tag ${tag} does not resolve to checked-out HEAD.`);
}

console.log(`Verified annotated release tag ${tag} at ${head}.`);
