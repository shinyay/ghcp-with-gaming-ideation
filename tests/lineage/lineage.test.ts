import { access } from "node:fs/promises";
import assert from "node:assert/strict";
import test from "node:test";
import {
  thinLineage,
  validateLineageReferences
} from "@star-relay/lineage-model";

test("allowlisted lineage is complete and every repository path resolves", async () => {
  assert.deepEqual(validateLineageReferences(thinLineage), []);
  assert.equal(thinLineage.nodes.length, 14);
  assert.equal(thinLineage.edges.length, 15);
  assert.equal(thinLineage.browser_network, "forbidden");

  for (const node of thinLineage.nodes) {
    await access(node.repository_path);
  }

  const ids = thinLineage.nodes.map((node) => node.id);
  assert.deepEqual(ids, [
    "DRV-001",
    "DRV-002",
    "DRV-003",
    "CFL-001",
    "FND-001",
    "PDN-001",
    "BET-002",
    "ADR-001",
    "VS-001",
    "ISSUE-001",
    "PR-004",
    "PR-005",
    "BLD-001",
    "PLAYABLE-001"
  ]);
  assert.deepEqual(
    thinLineage.nodes
      .filter((node) => node.github_object_id !== null)
      .map((node) => node.github_object_id),
    ["DISC-004", "PROJECT-001", "ISSUE-001", "PR-004", "PR-005", "BLD-001"]
  );
});
