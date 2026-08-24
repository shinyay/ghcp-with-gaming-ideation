import { access } from "node:fs/promises";
import assert from "node:assert/strict";
import test from "node:test";
import {
  thinLineage,
  validateLineageReferences
} from "@star-relay/lineage-model";

test("thin lineage is complete and every repository path resolves", async () => {
  assert.deepEqual(validateLineageReferences(thinLineage), []);
  assert.equal(thinLineage.nodes.length, 11);
  assert.equal(thinLineage.edges.length, 10);

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
    "PLAYABLE-001"
  ]);
});
