import assert from "node:assert/strict";
import test from "node:test";
import { readFile, stat } from "node:fs/promises";
import { parse as parseYaml } from "yaml";
import {
  CORE_AGENT_SLUGS,
  EXPECTED_AGENT_COUNT,
  EXPECTED_PROMPT_COUNT,
  PROMPT_AGENT_SLUGS,
  READ_ONLY_AGENTS,
  ROLE_LENS_AGENT_SLUGS,
  ROLE_LENS_CONTRACT,
  ROLE_LENS_INFERENCE_SECTIONS,
  ROLE_LENS_PROMPT_STEMS,
  ROLE_LENS_ROLES,
  ROLE_LENS_RUN_SHEET,
  ROLE_LENS_SCENARIO_MANIFEST,
  SCENARIO_MANIFEST,
  SPACE_MANIFEST,
  STRUCTURAL_RUBRIC,
  collectFiles,
  collectStableIds,
  loadAgentFiles,
  loadInstructionFiles,
  loadPromptFiles,
  normalizeTools,
  relativeLinkTargets,
  rubricTerms
} from "../../scripts/lib/copilot-assets";

interface Scenario {
  readonly scenario_id: string;
  readonly prompt_file: string;
  readonly recommended_agent: string;
  readonly entry_ids: readonly string[];
  readonly required_sections: readonly string[];
  readonly structural_checks: readonly string[];
  readonly auto_fail_if: readonly string[];
}

interface RoleLensScenario extends Scenario {
  readonly role: string;
}

async function readScenarios(): Promise<readonly Scenario[]> {
  const manifest = JSON.parse(await readFile(SCENARIO_MANIFEST, "utf8")) as {
    readonly scenarios: readonly Scenario[];
  };
  return manifest.scenarios;
}

async function readRoleLensScenarios(): Promise<readonly RoleLensScenario[]> {
  const manifest = JSON.parse(
    await readFile(ROLE_LENS_SCENARIO_MANIFEST, "utf8")
  ) as {
    readonly scenarios: readonly RoleLensScenario[];
  };
  return manifest.scenarios;
}

test("eighteen prompts and fifteen custom agents are installed", async () => {
  const [prompts, agents] = await Promise.all([
    loadPromptFiles(),
    loadAgentFiles()
  ]);

  assert.equal(prompts.length, EXPECTED_PROMPT_COUNT);
  assert.equal(agents.length, EXPECTED_AGENT_COUNT);
  assert.deepEqual(
    agents.map((agent) => agent.slug).sort(),
    [...CORE_AGENT_SLUGS, ...ROLE_LENS_AGENT_SLUGS].sort()
  );
});

test("curator, auditor, and every Role Lens cannot edit or execute", async () => {
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

test("Role Lens agents carry the shared identity and decision boundary", async () => {
  const agents = await loadAgentFiles();

  for (const slug of ROLE_LENS_AGENT_SLUGS) {
    const agent = agents.find((candidate) => candidate.slug === slug);
    assert.ok(agent, `${slug} is missing`);
    assert.equal(agent.frontmatter["disable-model-invocation"], true);
    for (const marker of [
      "Role Lens",
      "role-lens-contract.md",
      "Questions for other roles",
      "Proposal (unselected)",
      "Human decisions required",
      "Could not assess",
      "架空"
    ]) {
      assert.ok(agent.body.includes(marker), `${slug} is missing ${marker}`);
    }
  }

  const contract = await readFile(ROLE_LENS_CONTRACT, "utf8");
  for (const section of [
    "位置づけ",
    "Source hierarchy",
    "Shared output contract",
    "Shared prohibitions",
    "Cross-role handoff",
    "Stop conditions"
  ]) {
    assert.ok(contract.includes(section), `Role Lens contract misses ${section}`);
  }
});

test("Role Lens run sheet records agent selection and read-only tool scope", async () => {
  const runSheet = await readFile(ROLE_LENS_RUN_SHEET, "utf8");
  for (const marker of [
    "Allowed source paths",
    "Agent slug",
    "Invocation",
    "Tool scope",
    "read, search",
    "paste-based run",
    "RL-G1",
    "RL-G4"
  ]) {
    assert.ok(runSheet.includes(marker), `Role Lens run sheet misses ${marker}`);
  }
});

test("no prompt declares its own tool scope or a generic agent", async () => {
  const prompts = await loadPromptFiles();

  for (const prompt of prompts) {
    assert.ok(
      !("tools" in prompt.frontmatter),
      `${prompt.path} declares tools; the bound agent owns the scope`
    );
    assert.ok(
      !("mode" in prompt.frontmatter),
      `${prompt.path} uses the retired mode key`
    );
    assert.ok(
      (PROMPT_AGENT_SLUGS as readonly string[]).includes(
        prompt.frontmatter.agent as string
      ),
      `${prompt.path} does not bind a repository custom agent`
    );
  }
});

test("each prompt binds the agent its scenario recommends", async () => {
  const [prompts, coreScenarios, roleScenarios] = await Promise.all([
    loadPromptFiles(),
    readScenarios(),
    readRoleLensScenarios()
  ]);
  const byPath = new Map(prompts.map((prompt) => [prompt.path, prompt]));

  for (const scenario of [...coreScenarios, ...roleScenarios]) {
    const prompt = byPath.get(scenario.prompt_file);
    assert.ok(prompt, `${scenario.prompt_file} is missing`);
    assert.equal(
      prompt.frontmatter.agent,
      scenario.recommended_agent,
      `${scenario.scenario_id} and ${scenario.prompt_file} disagree on the agent`
    );
  }
});

test("eleven Role Lens prompts bind one-to-one to eleven read-only agents", async () => {
  const [prompts, scenarios] = await Promise.all([
    loadPromptFiles(),
    readRoleLensScenarios()
  ]);
  const rolePrompts = prompts.filter((prompt) =>
    ROLE_LENS_PROMPT_STEMS.includes(prompt.slug as never)
  );

  assert.equal(rolePrompts.length, 11);
  assert.equal(scenarios.length, 11);
  assert.deepEqual(
    scenarios.map((scenario) => scenario.role).sort(),
    [...ROLE_LENS_ROLES].sort()
  );
  assert.deepEqual(
    scenarios.map((scenario) => scenario.recommended_agent).sort(),
    [...ROLE_LENS_AGENT_SLUGS].sort()
  );
  assert.deepEqual(
    scenarios.map((scenario) => scenario.prompt_file).sort(),
    rolePrompts.map((prompt) => prompt.path).sort()
  );

  for (const scenario of scenarios) {
    assert.equal(scenario.recommended_agent, `${scenario.role}-lens`);
    const inferenceSection = ROLE_LENS_INFERENCE_SECTIONS[scenario.role];
    assert.ok(inferenceSection, `${scenario.role} has no inference heading`);
    assert.ok(scenario.required_sections.includes(inferenceSection));
    const prompt = rolePrompts.find(
      (candidate) => candidate.path === scenario.prompt_file
    );
    assert.match(prompt?.body ?? "", new RegExp(inferenceSection));
  }

  for (const prompt of rolePrompts) {
    assert.match(prompt.body, /read\/search-only tool scope/);
    assert.match(prompt.body, /unsupported surface/);
    assert.match(prompt.body, /fallbackにしません/);
    assert.doesNotMatch(prompt.body, /本文を先に貼り付けてください/);
  }
});

test("agent display names match their file slugs", async () => {
  const agents = await loadAgentFiles();

  for (const agent of agents) {
    assert.equal(
      agent.frontmatter.name,
      agent.slug,
      `${agent.path} name must equal its slug for prompt binding`
    );
  }
});

test("in-repository links in the Copilot surface resolve", async () => {
  const files = [
    ...(await collectFiles(".github/prompts")),
    ...(await collectFiles(".github/agents")),
    ...(await collectFiles(".github/instructions")),
    ...(await collectFiles("evaluation")),
    ...(await collectFiles("demo/fixtures")),
    ".github/copilot-instructions.md",
    "demo/self-guided-workshop.md",
    "governance/copilot-boundaries.md",
    "ops/github/copilot-space-setup.md"
  ].filter((path) => path.endsWith(".md"));

  for (const path of files) {
    const content = await readFile(path, "utf8");
    for (const link of relativeLinkTargets(path, content)) {
      await stat(link.resolved).catch(() => {
        assert.fail(`${path} links to ${link.target}, which does not resolve`);
      });
    }
  }
});

test("the planning fallback fixture is usable and clearly labelled", async () => {
  const fixture = await readFile(
    "demo/fixtures/ADR-DEMO-001-playtest-log-export.md",
    "utf8"
  );

  assert.match(fixture, /^-\s*Status:\s*accepted$/m);
  assert.match(fixture, /^-\s*Fixture:\s*true$/m);
  assert.ok(fixture.includes("訓練用fixture"));
  assert.ok(
    !fixture.includes("DRV-"),
    "the fallback fixture must not cite archive evidence"
  );
  assert.ok(
    !/^-\s*Decided by:\s*(?!fixture data)\S/m.test(fixture),
    "the fallback fixture must not name a real approver"
  );
});

test("ADR-001 stays scoped, so the planner keeps stopping on it", async () => {
  const adr = await readFile("design/decisions/ADR-001-thin-proof.md", "utf8");
  const status = /^-\s*Status:\s*(.+)$/m.exec(adr)?.[1]?.trim();

  assert.ok(status, "ADR-001 must record a status");
  assert.notEqual(
    status,
    "accepted",
    "ADR-001 became plainly accepted; revisit the fallback and the stop probe"
  );
});

test("the workshop sends readers to the fixture, not to ADR-001", async () => {
  const workshop = await readFile("demo/self-guided-workshop.md", "utf8");

  assert.ok(workshop.includes("ADR-DEMO-001"));
  assert.ok(
    !/既存の`ADR-001`で進めて/.test(workshop),
    "the workshop must not fall back to a scoped-status decision"
  );
});

test("the Space manifest forbids repository-level sources", async () => {
  const space = parseYaml(await readFile(SPACE_MANIFEST, "utf8")) as {
    readonly source_granularity: string;
    readonly repository_source_allowed: boolean;
    readonly allowed_sources: readonly { readonly path: string }[];
    readonly excluded_paths: readonly string[];
  };

  assert.equal(space.source_granularity, "file_or_folder_only");
  assert.equal(space.repository_source_allowed, false);
  assert.ok(space.allowed_sources.length > 0);

  for (const source of space.allowed_sources) {
    for (const excluded of space.excluded_paths) {
      assert.ok(
        source.path !== excluded && !source.path.startsWith(`${excluded}/`),
        `${source.path} sits inside excluded ${excluded}`
      );
    }
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
  const [coreScenarios, roleScenarios, ids] = await Promise.all([
    readScenarios(),
    readRoleLensScenarios(),
    collectStableIds()
  ]);

  assert.equal(coreScenarios.length, 10);
  assert.equal(roleScenarios.length, 11);

  for (const scenario of [...coreScenarios, ...roleScenarios]) {
    for (const id of scenario.entry_ids) {
      assert.ok(ids.has(id), `${scenario.scenario_id} cites missing ${id}`);
    }
  }
});

test("rubric defines every check and auto-fail the scenarios use", async () => {
  const [coreScenarios, roleScenarios, rubric, roleRubric] = await Promise.all([
    readScenarios(),
    readRoleLensScenarios(),
    readFile(STRUCTURAL_RUBRIC, "utf8"),
    readFile("evaluation/role-lens-rubric.md", "utf8")
  ]);
  const coreTerms = rubricTerms(rubric);
  const roleTerms = rubricTerms(roleRubric);

  for (const scenario of coreScenarios) {
    for (const term of [
      ...scenario.structural_checks,
      ...scenario.auto_fail_if
    ]) {
      assert.ok(coreTerms.has(term), `core rubric does not define ${term}`);
    }
  }
  for (const scenario of roleScenarios) {
    for (const term of [
      ...scenario.structural_checks,
      ...scenario.auto_fail_if
    ]) {
      assert.ok(roleTerms.has(term), `Role Lens rubric does not define ${term}`);
    }
  }
  const referencedRoleTerms = new Set(
    roleScenarios.flatMap((scenario) => [
      ...scenario.structural_checks,
      ...scenario.auto_fail_if
    ])
  );
  assert.deepEqual(
    [...roleTerms].filter((term) => !referencedRoleTerms.has(term)),
    [],
    "every Role Lens rubric term must be exercised by a scenario"
  );
});

test("scenario manifest stores no expected answer text", async () => {
  const raw = [
    await readFile(SCENARIO_MANIFEST, "utf8"),
    await readFile(ROLE_LENS_SCENARIO_MANIFEST, "utf8")
  ].join("\n");
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
