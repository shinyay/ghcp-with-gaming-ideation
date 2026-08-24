import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  EXPECTED_AGENT_COUNT,
  EXPECTED_PROMPT_COUNT,
  READ_ONLY_AGENTS,
  SCENARIO_MANIFEST,
  STRUCTURAL_RUBRIC,
  collectStableIds,
  loadAgentFiles,
  loadInstructionFiles,
  loadPromptFiles,
  normalizeTools,
  rubricTerms
} from "../../scripts/lib/copilot-assets";

interface Scenario {
  readonly scenario_id: string;
  readonly prompt_file: string;
  readonly recommended_agent: string;
  readonly entry_ids: readonly string[];
  readonly structural_checks: readonly string[];
  readonly auto_fail_if: readonly string[];
}

async function readScenarios(): Promise<readonly Scenario[]> {
  const manifest = JSON.parse(await readFile(SCENARIO_MANIFEST, "utf8")) as {
    readonly scenarios: readonly Scenario[];
  };
  return manifest.scenarios;
}

test("seven prompt files and four custom agents are installed", async () => {
  const [prompts, agents] = await Promise.all([
    loadPromptFiles(),
    loadAgentFiles()
  ]);

  assert.equal(prompts.length, EXPECTED_PROMPT_COUNT);
  assert.equal(agents.length, EXPECTED_AGENT_COUNT);
  assert.deepEqual(agents.map((agent) => agent.slug).sort(), [
    "archive-curator",
    "design-facilitator",
    "provenance-auditor",
    "slice-planner"
  ]);
});

test("curator and auditor cannot edit or execute", async () => {
  const agents = await loadAgentFiles();

  for (const slug of READ_ONLY_AGENTS) {
    const agent = agents.find((candidate) => candidate.slug === slug);
    assert.ok(agent, `${slug} is missing`);
    const tools = normalizeTools(agent.path, agent.frontmatter.tools);
    assert.ok(tools.length > 0);
    for (const tool of tools) {
      assert.ok(
        tool === "read" || tool === "search",
        `${slug} may not use ${tool}`
      );
    }
  }
});

test("no prompt file grants shell execution", async () => {
  const prompts = await loadPromptFiles();

  for (const prompt of prompts) {
    const tools = normalizeTools(prompt.path, prompt.frontmatter.tools);
    assert.ok(!tools.includes("execute"), `${prompt.path} grants execute`);
    assert.ok(
      !("mode" in prompt.frontmatter),
      `${prompt.path} uses the retired mode key`
    );
  }
});

test("path instructions cover evidence, design, and playable trees", async () => {
  const instructions = await loadInstructionFiles();
  const globs = new Set<string>();

  for (const instruction of instructions) {
    const applyTo = instruction.frontmatter.applyTo;
    assert.equal(typeof applyTo, "string", `${instruction.path} has no applyTo`);
    for (const glob of (applyTo as string).split(",")) {
      globs.add(glob.trim());
    }
  }

  for (const required of [
    "archive/**",
    "research/**",
    "design/**",
    "packages/**",
    "tests/**"
  ]) {
    assert.ok(globs.has(required), `no instruction applies to ${required}`);
  }
});

test("every scenario cites stable IDs that exist", async () => {
  const [scenarios, ids] = await Promise.all([
    readScenarios(),
    collectStableIds()
  ]);

  assert.equal(scenarios.length, 10);

  for (const scenario of scenarios) {
    for (const id of scenario.entry_ids) {
      assert.ok(ids.has(id), `${scenario.scenario_id} cites missing ${id}`);
    }
  }
});

test("rubric defines every check and auto-fail the scenarios use", async () => {
  const [scenarios, rubric] = await Promise.all([
    readScenarios(),
    readFile(STRUCTURAL_RUBRIC, "utf8")
  ]);
  const terms = rubricTerms(rubric);

  for (const scenario of scenarios) {
    for (const term of [
      ...scenario.structural_checks,
      ...scenario.auto_fail_if
    ]) {
      assert.ok(terms.has(term), `rubric does not define ${term}`);
    }
  }
});

test("scenario manifest stores no expected answer text", async () => {
  const raw = await readFile(SCENARIO_MANIFEST, "utf8");
  const guard = JSON.parse(
    await readFile("governance/disclosure-guard.json", "utf8")
  ) as {
    readonly taxonomy_forbidden_substrings: readonly string[];
    readonly repository_forbidden_substrings: readonly string[];
  };

  for (const forbidden of [
    ...guard.taxonomy_forbidden_substrings,
    ...guard.repository_forbidden_substrings
  ]) {
    assert.ok(!raw.includes(forbidden), `scenario manifest leaks ${forbidden}`);
  }

  for (const field of ["expected_output", "answer", "expected_answer"]) {
    assert.ok(!raw.includes(`"${field}"`), `scenario manifest carries ${field}`);
  }
});
