import { readFile, stat } from "node:fs/promises";
import Ajv, { type AnySchema, type ErrorObject } from "ajv";
import addFormats from "ajv-formats";
import { parse as parseYaml } from "yaml";
import {
  ALLOWED_AGENT_TOOLS,
  CORE_AGENT_SLUGS,
  CORE_PROMPT_STEMS,
  EXPECTED_AGENT_COUNT,
  EXPECTED_PROMPT_COUNT,
  PROMPT_AGENT_SLUGS,
  READ_ONLY_AGENTS,
  REPOSITORY_INSTRUCTIONS,
  ROLE_LENS_AGENT_SLUGS,
  ROLE_LENS_CONTRACT,
  ROLE_LENS_INFERENCE_SECTIONS,
  ROLE_LENS_PROMPT_STEMS,
  ROLE_LENS_RUBRIC,
  ROLE_LENS_RUN_SHEET,
  ROLE_LENS_ROLES,
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
} from "./lib/copilot-assets";

interface Scenario {
  readonly scenario_id: string;
  readonly prompt_file: string;
  readonly recommended_agent: string;
  readonly entry_ids: readonly string[];
  readonly required_sections: readonly string[];
  readonly structural_checks: readonly string[];
  readonly auto_fail_if: readonly string[];
}

interface ScenarioManifest {
  readonly pass_threshold: {
    readonly scenarios_total: number;
    readonly scenarios_must_pass: number;
    readonly conflict_separation_min: number;
    readonly distinct_bets_min: number;
    readonly bet_asset_trace_min: number;
  };
  readonly scenarios: readonly Scenario[];
}

interface RoleLensScenario extends Scenario {
  readonly role: string;
}

interface RoleLensScenarioManifest {
  readonly pass_threshold: {
    readonly scenarios_total: number;
    readonly scenarios_must_pass: number;
    readonly fictional_colleague_max: number;
    readonly role_approval_max: number;
    readonly proxy_decision_max: number;
  };
  readonly scenarios: readonly RoleLensScenario[];
}

interface SpaceManifest {
  readonly automation_status: string;
  readonly source_granularity: string;
  readonly repository_source_allowed: boolean;
  readonly context_repository: string;
  readonly forbidden_repositories: readonly string[];
  readonly allowed_sources: readonly {
    readonly kind: string;
    readonly path: string;
  }[];
  readonly excluded_paths: readonly string[];
  readonly verification: {
    readonly space_created: boolean;
    readonly created_at: string | null;
    readonly created_by: string | null;
    readonly verified_by: string | null;
  };
}

interface DisclosureGuard {
  readonly taxonomy_forbidden_substrings: readonly string[];
  readonly repository_forbidden_substrings: readonly string[];
}

/**
 * Repository instructions are load bearing: if a heading disappears, Copilot
 * silently loses a rule that the whole evaluation depends on. Each entry is a
 * required section title.
 */
const REQUIRED_INSTRUCTION_SECTIONS = [
  "使ってよい証拠",
  "出力の三層分離",
  "引用の形式",
  "Conflictの扱い",
  "昇格の禁止",
  "停止条件"
];

const REQUIRED_PROMPT_STEMS = [
  ...CORE_PROMPT_STEMS,
  ...ROLE_LENS_PROMPT_STEMS
];

const REQUIRED_AGENT_STEMS = [
  ...CORE_AGENT_SLUGS,
  ...ROLE_LENS_AGENT_SLUGS
];

const ROLE_LENS_REQUIRED_SECTIONS = [
  "Lens and target",
  "Evidence",
  "Current record",
  "Risks and trade-offs",
  "Questions for other roles",
  "Proposal (unselected)",
  "Human decisions required",
  "Could not assess"
];

/**
 * `06-plan-slice` requires a strictly `accepted` decision. ADR-001 records a
 * scoped acceptance, so a run that used it as a fallback would always stop.
 * The planning exercise therefore needs its own clearly labelled fixture, and
 * the fixture must stay distinguishable from a real decision.
 */
const PLANNING_FIXTURE = "demo/fixtures/ADR-DEMO-001-playtest-log-export.md";
const SCOPED_STATUS_DECISION = "design/decisions/ADR-001-thin-proof.md";

const problems: string[] = [];

function require(condition: boolean, message: string): void {
  if (!condition) {
    problems.push(message);
  }
}

function formatErrors(errors: ErrorObject[] | null | undefined): string {
  return (errors ?? [])
    .map((error) => `${error.instancePath || "/"} ${error.message ?? "invalid"}`)
    .join("; ");
}

const ajv = new Ajv({ allErrors: true, strict: true });
addFormats(ajv);

const validateScenarioManifest = ajv.compile<ScenarioManifest>(
  JSON.parse(
    await readFile("schemas/copilot-scenario.schema.json", "utf8")
  ) as AnySchema
);
const validateRoleLensScenarioManifest =
  ajv.compile<RoleLensScenarioManifest>(
    JSON.parse(
      await readFile("schemas/role-lens-scenario.schema.json", "utf8")
    ) as AnySchema
  );

const manifest = JSON.parse(
  await readFile(SCENARIO_MANIFEST, "utf8")
) as ScenarioManifest;
const roleLensManifest = JSON.parse(
  await readFile(ROLE_LENS_SCENARIO_MANIFEST, "utf8")
) as RoleLensScenarioManifest;

if (!validateScenarioManifest(manifest)) {
  throw new Error(
    `${SCENARIO_MANIFEST}: ${formatErrors(validateScenarioManifest.errors)}`
  );
}
if (!validateRoleLensScenarioManifest(roleLensManifest)) {
  throw new Error(
    `${ROLE_LENS_SCENARIO_MANIFEST}: ${formatErrors(validateRoleLensScenarioManifest.errors)}`
  );
}

const prompts = await loadPromptFiles();
const agents = await loadAgentFiles();
const instructions = await loadInstructionFiles();
const rubric = await readFile(STRUCTURAL_RUBRIC, "utf8");
const roleLensRubric = await readFile(ROLE_LENS_RUBRIC, "utf8");
const terms = rubricTerms(rubric);
const roleLensTerms = rubricTerms(roleLensRubric);
const stableIds = await collectStableIds();

// --- Repository instructions -------------------------------------------------

const repositoryInstructions = await readFile(REPOSITORY_INSTRUCTIONS, "utf8");
for (const section of REQUIRED_INSTRUCTION_SECTIONS) {
  require(
    repositoryInstructions.includes(section),
    `${REPOSITORY_INSTRUCTIONS} is missing the required section "${section}".`
  );
}

// --- Path instructions -------------------------------------------------------

const instructionTargets = new Set<string>();
for (const instruction of instructions) {
  const applyTo = instruction.frontmatter.applyTo;
  require(
    typeof applyTo === "string" && applyTo.length > 0,
    `${instruction.path} must declare a non-empty applyTo glob.`
  );
  require(
    typeof instruction.frontmatter.description === "string",
    `${instruction.path} must declare a description.`
  );
  if (typeof applyTo === "string") {
    for (const glob of applyTo.split(",")) {
      instructionTargets.add(glob.trim());
    }
  }
}

for (const target of [
  "archive/**",
  "research/**",
  "design/**",
  "packages/**",
  "tests/**"
]) {
  require(
    instructionTargets.has(target),
    `No path instruction file applies to ${target}.`
  );
}

// --- Prompt files ------------------------------------------------------------

require(
  prompts.length === EXPECTED_PROMPT_COUNT,
  `Expected ${EXPECTED_PROMPT_COUNT} prompt files; found ${prompts.length}.`
);

const promptBySlug = new Map(prompts.map((prompt) => [prompt.slug, prompt]));
for (const stem of REQUIRED_PROMPT_STEMS) {
  require(promptBySlug.has(stem), `Missing prompt file ${stem}.prompt.md.`);
}

for (const prompt of prompts) {
  const { frontmatter, path, slug, body } = prompt;
  require(
    typeof frontmatter.description === "string" &&
      frontmatter.description.length > 0,
    `${path} must declare a description.`
  );
  require(
    typeof frontmatter.name === "string",
    `${path} must declare an explicit name so the slash command is stable.`
  );
  require(
    !("mode" in frontmatter),
    `${path} uses the retired "mode" key; use "agent" instead.`
  );

  const boundAgent = frontmatter.agent;
  require(
    typeof boundAgent === "string" &&
      (PROMPT_AGENT_SLUGS as readonly string[]).includes(boundAgent),
    `${path} must bind agent to one of the repository custom agents; a generic ask/agent value would override the selected profile.`
  );

  /**
   * Tool scope lives on the bound agent. A prompt that also declared tools
   * would create a second, competing scope that is easy to widen by accident.
   */
  require(
    !("tools" in frontmatter),
    `${path} must not declare tools; the bound custom agent owns the tool scope.`
  );

  if ((ROLE_LENS_PROMPT_STEMS as readonly string[]).includes(slug)) {
    require(
      body.includes("read/search-only tool scope") &&
        body.includes("unsupported surface") &&
        body.includes("fallbackにしません"),
      `${path} must stop when the read-only Role Lens agent cannot be selected.`
    );
    require(
      !body.includes("本文を先に貼り付けてください"),
      `${path} must not present unrestricted paste as a Role Lens fallback.`
    );
  }
}

// --- Custom agents -----------------------------------------------------------

require(
  agents.length === EXPECTED_AGENT_COUNT,
  `Expected ${EXPECTED_AGENT_COUNT} custom agents; found ${agents.length}.`
);

const agentBySlug = new Map(agents.map((agent) => [agent.slug, agent]));
for (const stem of REQUIRED_AGENT_STEMS) {
  require(agentBySlug.has(stem), `Missing custom agent ${stem}.agent.md.`);
}

for (const agent of agents) {
  const { frontmatter, path, slug } = agent;
  require(
    typeof frontmatter.description === "string" &&
      frontmatter.description.length > 0,
    `${path} must declare a description; it is the only required property.`
  );
  require(
    typeof frontmatter.name === "string" && frontmatter.name === slug,
    `${path} must set name to its file slug "${slug}" so a prompt can bind to it unambiguously.`
  );
  require(
    !("infer" in frontmatter),
    `${path} uses the retired "infer" key; use disable-model-invocation.`
  );

  const tools = normalizeTools(path, frontmatter.tools);
  require(tools.length > 0, `${path} must scope tools explicitly.`);
  require(
    !tools.includes("*"),
    `${path} must not enable every tool with a wildcard.`
  );
  for (const tool of tools) {
    require(
      ALLOWED_AGENT_TOOLS.includes(tool),
      `${path} requests an unknown tool alias "${tool}".`
    );
  }
  require(
    !tools.includes("execute"),
    `${path} must not grant shell execution.`
  );

  if (READ_ONLY_AGENTS.includes(slug)) {
    require(
      tools.every((tool) => tool === "read" || tool === "search"),
      `${path} must stay read-only; it may only use read and search.`
    );
  }

  if (ROLE_LENS_AGENT_SLUGS.includes(slug as never)) {
    require(
      frontmatter["disable-model-invocation"] === true,
      `${path} must disable model invocation; Role Lens selection is explicit.`
    );
    for (const required of [
      "Role Lens",
      "role-lens-contract.md",
      "Questions for other roles",
      "Proposal (unselected)",
      "Human decisions required",
      "Could not assess"
    ]) {
      require(
        agent.body.includes(required),
        `${path} is missing the Role Lens contract marker "${required}".`
      );
    }
    require(
      agent.body.includes("架空"),
      `${path} must say that it is not a fictional colleague.`
    );
  }

  require(
    agent.body.includes("しないこと") || agent.body.includes("前提"),
    `${path} must state what the agent refuses to do.`
  );
}

// --- Scenarios ---------------------------------------------------------------

const seenScenarioIds = new Set<string>();
const referencedPrompts = new Set<string>();
const referencedAgents = new Set<string>();

for (const [index, scenario] of manifest.scenarios.entries()) {
  const expectedId = `SCN-${String(index + 1).padStart(3, "0")}`;
  require(
    scenario.scenario_id === expectedId,
    `Scenario ${index + 1} should be ${expectedId}; found ${scenario.scenario_id}.`
  );
  require(
    !seenScenarioIds.has(scenario.scenario_id),
    `Duplicate scenario ID ${scenario.scenario_id}.`
  );
  seenScenarioIds.add(scenario.scenario_id);

  referencedPrompts.add(scenario.prompt_file);
  referencedAgents.add(scenario.recommended_agent);

  const promptSlug = scenario.prompt_file.slice(
    ".github/prompts/".length,
    -".prompt.md".length
  );
  require(
    promptBySlug.has(promptSlug),
    `${scenario.scenario_id} points at a missing prompt file ${scenario.prompt_file}.`
  );
  require(
    agentBySlug.has(scenario.recommended_agent),
    `${scenario.scenario_id} points at a missing agent ${scenario.recommended_agent}.`
  );

  /**
   * The scenario's agent and the prompt's bound agent must agree, otherwise the
   * run sheet records one profile while the prompt silently switches to another.
   */
  const boundAgent = promptBySlug.get(promptSlug)?.frontmatter.agent;
  require(
    boundAgent === scenario.recommended_agent,
    `${scenario.scenario_id} recommends ${scenario.recommended_agent} but ${scenario.prompt_file} binds ${String(boundAgent)}.`
  );

  for (const id of scenario.entry_ids) {
    require(
      stableIds.has(id),
      `${scenario.scenario_id} cites ${id}, which does not exist in this repository.`
    );
  }

  const seenRoleScenarioIds = new Set<string>();
  const seenRoles = new Set<string>();
  const referencedRoleLensTerms = new Set<string>();
  for (const [index, scenario] of roleLensManifest.scenarios.entries()) {
    const expectedId = `RLS-${String(index + 1).padStart(3, "0")}`;
    require(
      scenario.scenario_id === expectedId,
      `Role Lens scenario ${index + 1} should be ${expectedId}; found ${scenario.scenario_id}.`
    );
    require(
      !seenRoleScenarioIds.has(scenario.scenario_id),
      `Duplicate Role Lens scenario ID ${scenario.scenario_id}.`
    );
    seenRoleScenarioIds.add(scenario.scenario_id);
    seenRoles.add(scenario.role);
    referencedPrompts.add(scenario.prompt_file);
    referencedAgents.add(scenario.recommended_agent);

    require(
      ROLE_LENS_ROLES.includes(scenario.role as never),
      `${scenario.scenario_id} declares unknown role ${scenario.role}.`
    );
    require(
      scenario.recommended_agent === `${scenario.role}-lens`,
      `${scenario.scenario_id} role ${scenario.role} does not match agent ${scenario.recommended_agent}.`
    );

    const promptSlug = scenario.prompt_file.slice(
      ".github/prompts/".length,
      -".prompt.md".length
    );
    require(
      promptBySlug.has(promptSlug),
      `${scenario.scenario_id} points at missing prompt ${scenario.prompt_file}.`
    );
    require(
      agentBySlug.has(scenario.recommended_agent),
      `${scenario.scenario_id} points at missing agent ${scenario.recommended_agent}.`
    );
    require(
      promptBySlug.get(promptSlug)?.frontmatter.agent ===
        scenario.recommended_agent,
      `${scenario.scenario_id} and ${scenario.prompt_file} disagree on the Role Lens agent.`
    );

    for (const section of ROLE_LENS_REQUIRED_SECTIONS) {
      require(
        scenario.required_sections.includes(section),
        `${scenario.scenario_id} is missing required section ${section}.`
      );
    }
    const inferenceSection = ROLE_LENS_INFERENCE_SECTIONS[scenario.role];
    require(
      typeof inferenceSection === "string" &&
        scenario.required_sections.includes(inferenceSection),
      `${scenario.scenario_id} has the wrong role-specific Inference section.`
    );
    const boundPrompt = promptBySlug.get(promptSlug);
    const boundRoleAgent = agentBySlug.get(scenario.recommended_agent);
    require(
      typeof inferenceSection === "string" &&
        boundPrompt?.body.includes(inferenceSection) === true,
      `${scenario.prompt_file} does not require "${String(inferenceSection)}".`
    );
    require(
      typeof inferenceSection === "string" &&
        boundRoleAgent?.body.includes(inferenceSection) === true,
      `${scenario.recommended_agent} does not define "${String(inferenceSection)}".`
    );

    for (const id of scenario.entry_ids) {
      require(
        stableIds.has(id),
        `${scenario.scenario_id} cites ${id}, which does not exist in this repository.`
      );
    }
    for (const check of scenario.structural_checks) {
      referencedRoleLensTerms.add(check);
      require(
        roleLensTerms.has(check),
        `${scenario.scenario_id} uses check "${check}" that the Role Lens rubric does not define.`
      );
    }
    for (const term of scenario.auto_fail_if) {
      referencedRoleLensTerms.add(term);
      require(
        roleLensTerms.has(term),
        `${scenario.scenario_id} uses auto-fail "${term}" that the Role Lens rubric does not define.`
      );
    }
  }

  for (const term of roleLensTerms) {
    require(
      referencedRoleLensTerms.has(term),
      `Role Lens rubric term "${term}" is never exercised by a scenario.`
    );
  }

  require(
    JSON.stringify([...seenRoles].sort()) ===
      JSON.stringify([...ROLE_LENS_ROLES].sort()),
    "Role Lens scenarios must cover each of the eleven roles exactly once."
  );

  for (const check of scenario.structural_checks) {
    require(
      terms.has(check),
      `${scenario.scenario_id} uses check "${check}" that the rubric does not define.`
    );
  }
  for (const term of scenario.auto_fail_if) {
    require(
      terms.has(term),
      `${scenario.scenario_id} uses auto-fail "${term}" that the rubric does not define.`
    );
  }
}

for (const prompt of prompts) {
  require(
    referencedPrompts.has(prompt.path),
    `${prompt.path} is never exercised by a scenario.`
  );
}
for (const stem of REQUIRED_AGENT_STEMS) {
  if (stem === "provenance-auditor") {
    continue;
  }
  require(
    referencedAgents.has(stem),
    `Custom agent ${stem} is never exercised by a scenario.`
  );
}

require(
  manifest.pass_threshold.scenarios_total === manifest.scenarios.length,
  "pass_threshold.scenarios_total disagrees with the scenario count."
);
require(
  roleLensManifest.pass_threshold.scenarios_total ===
    roleLensManifest.scenarios.length,
  "Role Lens pass_threshold.scenarios_total disagrees with the scenario count."
);
require(
  roleLensManifest.pass_threshold.fictional_colleague_max === 0 &&
    roleLensManifest.pass_threshold.role_approval_max === 0 &&
    roleLensManifest.pass_threshold.proxy_decision_max === 0,
  "Role Lens zero-tolerance thresholds must remain zero."
);

const roleLensContract = await readFile(ROLE_LENS_CONTRACT, "utf8");
for (const section of [
  "位置づけ",
  "Source hierarchy",
  "Shared output contract",
  "Shared prohibitions",
  "Cross-role handoff",
  "Stop conditions"
]) {
  require(
    roleLensContract.includes(section),
    `${ROLE_LENS_CONTRACT} is missing section ${section}.`
  );
}

const roleLensRunSheet = await readFile(ROLE_LENS_RUN_SHEET, "utf8");
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
  require(
    roleLensRunSheet.includes(marker),
    `${ROLE_LENS_RUN_SHEET} is missing execution evidence field "${marker}".`
  );
}

// --- Planning fallback fixture -----------------------------------------------

function statusLine(content: string): string {
  const match = /^-\s*Status:\s*(.+)$/m.exec(content);
  return match?.[1]?.trim() ?? "";
}

const fixture = await readFile(PLANNING_FIXTURE, "utf8");
const fixtureStatus = statusLine(fixture);

require(
  fixtureStatus === "accepted",
  `${PLANNING_FIXTURE} must record a strictly accepted status; found "${fixtureStatus}".`
);
require(
  /^-\s*Fixture:\s*true$/m.test(fixture),
  `${PLANNING_FIXTURE} must declare Fixture: true so it is never read as a real decision.`
);
require(
  fixture.includes("訓練用fixture"),
  `${PLANNING_FIXTURE} must say in its body that it is a training fixture.`
);
require(
  !/^-\s*Decided by:\s*(?!fixture data)\S/m.test(fixture),
  `${PLANNING_FIXTURE} must not name a real approver.`
);
require(
  !fixture.includes("DRV-"),
  `${PLANNING_FIXTURE} must not cite archive evidence; it is not an ideation answer.`
);

/**
 * If ADR-001 ever became plainly `accepted`, the fixture would no longer be
 * needed and the workshop's deliberate stop probe would silently pass instead
 * of stopping. Fail loudly so the material gets revisited rather than drifting.
 */
const scopedStatus = statusLine(await readFile(SCOPED_STATUS_DECISION, "utf8"));
require(
  scopedStatus !== "accepted",
  `${SCOPED_STATUS_DECISION} is now plainly accepted; revisit the planning fallback and the stop probe that rely on its scoped status.`
);
require(
  scopedStatus.length > 0,
  `${SCOPED_STATUS_DECISION} no longer records a status line.`
);

const workshop = await readFile("demo/self-guided-workshop.md", "utf8");
require(
  workshop.includes("ADR-DEMO-001"),
  "The workshop must name the planning fallback fixture."
);
require(
  !/既存の`ADR-001`で進めて/.test(workshop),
  "The workshop must not send a reader to ADR-001, whose scoped status always stops the planner."
);

// --- Space manifest ----------------------------------------------------------

const space = parseYaml(await readFile(SPACE_MANIFEST, "utf8")) as SpaceManifest;

require(
  ["manual_only", "manual_fallback", "automated"].includes(
    space.automation_status
  ),
  `${SPACE_MANIFEST} declares an unknown automation_status.`
);

/**
 * Spaces do not enforce a path allowlist. Attaching the repository as a source
 * would make every excluded tree answerable, so the manifest must forbid a
 * repository-level source and enumerate file or folder sources instead.
 */
require(
  space.source_granularity === "file_or_folder_only",
  `${SPACE_MANIFEST} must restrict sources to files and folders.`
);
require(
  space.repository_source_allowed === false,
  `${SPACE_MANIFEST} must forbid repository-level sources; a Space does not enforce a path allowlist.`
);
require(
  space.context_repository === "shinyay/ghcp-with-gaming-ideation",
  `${SPACE_MANIFEST} names the wrong context repository.`
);
require(
  space.forbidden_repositories.some((entry) => entry.endsWith("-reference")),
  `${SPACE_MANIFEST} must keep the reference repository on the forbidden list.`
);
require(
  space.allowed_sources.length > 0,
  `${SPACE_MANIFEST} must enumerate the individual sources to attach.`
);

for (const source of space.allowed_sources) {
  require(
    source.kind === "file" || source.kind === "folder",
    `${SPACE_MANIFEST} source ${source.path} must be a file or a folder.`
  );
  try {
    const info = await stat(source.path);
    require(
      source.kind === "file" ? info.isFile() : info.isDirectory(),
      `${SPACE_MANIFEST} source ${source.path} is not a ${source.kind}.`
    );
  } catch {
    problems.push(`${SPACE_MANIFEST} source does not exist: ${source.path}`);
  }
  for (const excluded of space.excluded_paths) {
    require(
      source.path !== excluded && !source.path.startsWith(`${excluded}/`),
      `${SPACE_MANIFEST} attaches ${source.path}, which sits inside excluded ${excluded}.`
    );
  }
}

for (const excluded of [
  "research/findings",
  "design",
  "canon",
  "evaluation",
  "demo",
  "packages",
  "apps",
  "tests"
]) {
  require(
    space.excluded_paths.includes(excluded),
    `${SPACE_MANIFEST} must list ${excluded} among the trees that are never attached.`
  );
}

/**
 * A Space that was never created must not be recorded as created. The
 * signature fields only carry meaning once a human has actually done it.
 */
if (space.verification.space_created === false) {
  require(
    space.verification.created_at === null &&
      space.verification.created_by === null &&
      space.verification.verified_by === null,
    `${SPACE_MANIFEST} claims verification details for a Space that is not created.`
  );
} else {
  require(
    typeof space.verification.created_at === "string" &&
      typeof space.verification.verified_by === "string",
    `${SPACE_MANIFEST} records a created Space without who created and verified it.`
  );
}

// --- Disclosure guard --------------------------------------------------------

const guard = JSON.parse(
  await readFile("governance/disclosure-guard.json", "utf8")
) as DisclosureGuard;

const guardedFiles = [
  ...(await collectFiles(".github/prompts")),
  ...(await collectFiles(".github/agents")),
  ...(await collectFiles(".github/instructions")),
  ...(await collectFiles("evaluation")),
  REPOSITORY_INSTRUCTIONS,
  ROLE_LENS_CONTRACT
];

for (const path of guardedFiles) {
  const content = await readFile(path, "utf8");
  for (const forbidden of guard.taxonomy_forbidden_substrings) {
    require(
      !content.includes(forbidden),
      `${path} states the shape of an expected answer: ${forbidden}`
    );
  }
  for (const forbidden of guard.repository_forbidden_substrings) {
    require(
      !content.includes(forbidden),
      `${path} contains reference-only content: ${forbidden}`
    );
  }
}

// --- Link integrity ----------------------------------------------------------

/**
 * A broken cross-reference silently drops a rule from the reader's path, so
 * every in-repository Markdown link in the Copilot surface is resolved.
 */
const linkedFiles = [
  ...guardedFiles,
  "demo/self-guided-workshop.md",
  "demo/fixtures/README.md",
  PLANNING_FIXTURE,
  "governance/copilot-boundaries.md",
  ROLE_LENS_CONTRACT,
  "ops/github/copilot-space-setup.md"
].filter((path) => path.endsWith(".md"));

let checkedLinks = 0;
for (const path of linkedFiles) {
  const content = await readFile(path, "utf8");
  for (const link of relativeLinkTargets(path, content)) {
    checkedLinks += 1;
    try {
      await stat(link.resolved);
    } catch {
      problems.push(
        `${path} links to ${link.target}, which does not resolve to ${link.resolved}.`
      );
    }
  }
}

// --- Report ------------------------------------------------------------------

if (problems.length > 0) {
  for (const problem of problems) {
    console.error(`- ${problem}`);
  }
  throw new Error(
    `${problems.length} Copilot metadata problem(s) found.`
  );
}

console.log(
  [
    `Validated Copilot asset metadata: ${prompts.length} prompt files`,
    `${agents.length} custom agents (${READ_ONLY_AGENTS.length} read-only)`,
    `${instructions.length} path instruction files`,
    `${manifest.scenarios.length} fixed scenarios`,
    `${roleLensManifest.scenarios.length} Role Lens scenarios`,
    `${terms.size + roleLensTerms.size} rubric terms across two suites`,
    `${stableIds.size} resolvable stable IDs`,
    `${checkedLinks} in-repository links`,
    `Space automation ${space.automation_status}, sources ${space.allowed_sources.length}, created=${space.verification.space_created}`
  ].join(", ") + "."
);
console.log(
  "This check reads configuration only. It never reads or scores a model response."
);
