import { fail } from "@agent-native/core/action";

import {
  advanceYears,
  applyPolicyChange,
  levelLabel,
  MAX_LEVEL,
  POLICIES,
  type Indicators,
  type PolicyId,
} from "../../../shared/post-labor/engine";
import { evaluatePolicyChange, type PolicyEvaluation } from "../../../shared/post-labor/evaluate";
import { convenePerspectives } from "../../../shared/post-labor/assembly";
import { worldAtRevision } from "../../../shared/post-labor/history";
import {
  householdFinances,
  householdNarrative,
  noPolicyFinances,
  type HouseholdFinances,
  type HouseholdId,
  HOUSEHOLDS,
  type HouseholdDefinition,
} from "../../../shared/post-labor/households";
import { HouseholdInputSchema, type HouseholdInput, type HouseholdProfile } from "../../../shared/post-labor/profiles";
import {
  createBaselineWorld,
  type Assembly,
  type Decision,
  type Proposal,
  type TimelineEntry,
  type WorldState,
} from "../../../shared/post-labor/state";

const ACTION_LOG_LIMIT = 200;

export interface OperationContext {
  caller: string;
  newId: () => string;
}

export function operationContext(caller: string | undefined): OperationContext {
  return { caller: caller ?? "unknown", newId: () => crypto.randomUUID() };
}

export function proposalOrigin(caller: string | undefined): Proposal["origin"] {
  return caller === "frontend" ? "human" : "agent";
}

function withLog(world: WorldState, ctx: OperationContext, action: string, summary: string) {
  const entry = { id: ctx.newId(), revision: world.revision, action, caller: ctx.caller, summary };
  return [...world.actionLog, entry].slice(-ACTION_LOG_LIMIT);
}

function findProposal(world: WorldState, proposalId: string): Proposal {
  const proposal = world.proposals.find((item) => item.id === proposalId);
  if (!proposal) {
    fail(`No proposal ${proposalId} exists in this simulation. Propose the policy again.`, {
      errorCode: "not_found",
      statusCode: 404,
    });
  }
  if (proposal.simulationId !== world.simulationId) {
    fail(
      `Proposal ${proposalId} belongs to a reset simulation and was invalidated. Propose the policy again.`,
      { errorCode: "invalidated_by_reset", statusCode: 409 },
    );
  }
  return proposal;
}

export function assertPolicyLevel(policyId: PolicyId, level: number, world: WorldState): void {
  if (!Number.isInteger(level) || level < 0 || level > MAX_LEVEL) {
    fail(`Level for ${POLICIES[policyId].name} must be an integer from 0 to ${MAX_LEVEL}.`, {
      errorCode: "invalid_level",
      statusCode: 400,
    });
  }
  if (level === world.levels[policyId]) {
    fail(
      `${POLICIES[policyId].name} is already at ${levelLabel(policyId, level)}. Choose a different level.`,
      { errorCode: "same_active_level", statusCode: 409 },
    );
  }
}

export function assertCurrent(proposal: Proposal, world: WorldState): void {
  if (proposal.worldRevision !== world.revision) {
    fail(
      `Proposal ${proposal.id} is stale: it was made at world revision ${proposal.worldRevision} and the world is now at revision ${world.revision}. Propose the policy again.`,
      { errorCode: "stale_revision", statusCode: 409 },
    );
  }
}

export function proposePolicyOp(
  world: WorldState,
  input: { policyId: PolicyId; level: number },
  origin: Proposal["origin"],
  ctx: OperationContext,
): { world: WorldState; proposal: Proposal; evaluation: PolicyEvaluation } {
  assertPolicyLevel(input.policyId, input.level, world);
  const proposal: Proposal = {
    id: ctx.newId(),
    simulationId: world.simulationId,
    worldRevision: world.revision,
    policyId: input.policyId,
    level: input.level,
    status: "open",
    origin,
    createdYear: world.year,
    assemblyId: null,
  };
  const proposals: Proposal[] = world.proposals.map((item) =>
    item.status === "open" ? { ...item, status: "superseded" } : item,
  );
  const evaluation = evaluatePolicyChange(world, input.policyId, input.level, householdDefinitions(world));
  const summary = `Proposed ${POLICIES[input.policyId].name} at ${levelLabel(input.policyId, input.level)}`;
  return {
    world: {
      ...world,
      proposals: [...proposals, proposal],
      actionLog: withLog(world, ctx, "propose-policy", summary),
    },
    proposal,
    evaluation,
  };
}

export function evaluatePolicyOp(world: WorldState, proposalId: string) {
  const proposal = findProposal(world, proposalId);
  const originalWorld = worldAtRevision(world, proposal.worldRevision);
  const evaluation = evaluatePolicyChange(originalWorld, proposal.policyId, proposal.level, householdDefinitions(world));
  return {
    proposal,
    evaluation,
    stale: proposal.status === "open" && proposal.worldRevision !== world.revision,
  };
}

export function convenePerspectivesOp(
  world: WorldState,
  proposalId: string,
  ctx: OperationContext,
): { world: WorldState; assembly: Assembly; reused: boolean } {
  const proposal = findProposal(world, proposalId);
  if (proposal.status !== "open") {
    fail(`Proposal ${proposalId} is ${proposal.status}. Convene on the latest open proposal.`, {
      errorCode: "proposal_not_open",
      statusCode: 409,
    });
  }
  assertCurrent(proposal, world);

  if (proposal.assemblyId) {
    const existing = world.assemblies.find((item) => item.id === proposal.assemblyId);
    if (existing) return { world, assembly: existing, reused: true };
  }

  const evaluation = evaluatePolicyChange(world, proposal.policyId, proposal.level);
  const analysis = convenePerspectives(
    world.levels,
    { policyId: proposal.policyId, level: proposal.level },
    evaluation,
  );
  const assembly: Assembly = {
    id: ctx.newId(),
    proposalId,
    worldRevision: world.revision,
    mode: "illustrative-deterministic",
    delegates: analysis.delegates,
    disagreement: analysis.disagreement,
  };
  return {
    world: {
      ...world,
      assemblies: [...world.assemblies, assembly],
      proposals: world.proposals.map((item) =>
        item.id === proposalId ? { ...item, assemblyId: assembly.id } : item,
      ),
      actionLog: withLog(
        world,
        ctx,
        "convene-assembly",
        `Convened illustrative assembly on ${POLICIES[proposal.policyId].name} at ${levelLabel(proposal.policyId, proposal.level)}`,
      ),
    },
    assembly,
    reused: false,
  };
}

export function enactPolicyOp(
  world: WorldState,
  input: { proposalId: string; expectedRevision: number },
  ctx: OperationContext,
): { world: WorldState; decision: Decision; before: Indicators; after: Indicators } {
  const proposal = findProposal(world, input.proposalId);
  if (proposal.status === "enacted") {
    fail(`Proposal ${proposal.id} was already enacted. Duplicate enactment is refused.`, {
      errorCode: "duplicate_enactment",
      statusCode: 409,
    });
  }
  if (proposal.status === "superseded") {
    fail(
      `Proposal ${proposal.id} was superseded by a newer proposal, so its approval no longer applies. Review the latest proposal instead.`,
      { errorCode: "superseded_proposal", statusCode: 409 },
    );
  }
  if (input.expectedRevision !== world.revision) {
    fail(
      `Approval was given for world revision ${input.expectedRevision}, but the world is now at revision ${world.revision}. Review the proposal again.`,
      { errorCode: "stale_revision", statusCode: 409 },
    );
  }
  assertCurrent(proposal, world);
  assertPolicyLevel(proposal.policyId, proposal.level, world);

  const fromLevel = world.levels[proposal.policyId];
  const before = world.indicators;
  const after = applyPolicyChange(before, proposal.policyId, fromLevel, proposal.level);
  const revision = world.revision + 1;
  const summary = `Enacted ${POLICIES[proposal.policyId].name}: ${levelLabel(proposal.policyId, fromLevel)} to ${levelLabel(proposal.policyId, proposal.level)}`;
  const decision: Decision = {
    id: ctx.newId(),
    year: world.year,
    revision,
    proposalId: proposal.id,
    policyId: proposal.policyId,
    fromLevel,
    toLevel: proposal.level,
    summary,
  };
  const timelineEntry: TimelineEntry = {
    id: ctx.newId(),
    kind: "enactment",
    year: world.year,
    revision,
    indicators: after,
    label: summary,
    policyId: proposal.policyId,
    level: proposal.level,
  };
  return {
    world: {
      ...world,
      revision,
      indicators: after,
      levels: { ...world.levels, [proposal.policyId]: proposal.level },
      proposals: world.proposals.map((item) => {
        if (item.id === proposal.id) return { ...item, status: "enacted" };
        if (item.status === "open") return { ...item, status: "superseded" };
        return item;
      }),
      timeline: [...world.timeline, timelineEntry],
      decisions: [...world.decisions, decision],
      actionLog: withLog(world, ctx, "enact-policy", summary),
    },
    decision,
    before,
    after,
  };
}

export function advanceYearsOp(
  world: WorldState,
  years: number,
  ctx: OperationContext,
): { world: WorldState; path: { year: number; indicators: Indicators }[] } {
  const revision = world.revision + 1;
  const { path, final } = advanceYears(
    { year: world.year, indicators: world.indicators, levels: world.levels },
    years,
  );
  const timelineEntries: TimelineEntry[] = path.map((step) => ({
    id: ctx.newId(),
    kind: "annual",
    year: step.year,
    revision,
    indicators: step.indicators,
    label: `Annual snapshot ${step.year}`,
    policyId: null,
    level: null,
  }));
  return {
    world: {
      ...world,
      revision,
      year: final.year,
      indicators: final.indicators,
      timeline: [...world.timeline, ...timelineEntries],
      actionLog: withLog(
        world,
        ctx,
        "advance-years",
        `Advanced ${years} year${years === 1 ? "" : "s"} to ${final.year}`,
      ),
    },
    path: path.map((step) => ({ year: step.year, indicators: step.indicators })),
  };
}

export function resetOp(previousRevision: number, ctx: OperationContext, households: HouseholdProfile[] = [], startYear = 2040): WorldState {
  const fresh = createBaselineWorld(ctx.newId(), previousRevision + 1, startYear);
  return {
    ...fresh,
    households,
    actionLog: [
      {
        id: ctx.newId(),
        revision: fresh.revision,
        action: "reset-simulation",
        caller: ctx.caller,
        summary: `Reset to the ${startYear} baseline; pending proposals and approvals invalidated`,
      },
    ],
  };
}

export interface HouseholdInspection {
  householdId: string;
  profile: HouseholdDefinition;
  baseline: HouseholdFinances;
  current: HouseholdFinances;
  withProposal: HouseholdFinances | null;
  narrative: string[];
  proposalNarrative: string[];
}

export function inspectHouseholdOp(
  world: WorldState,
  householdId: string,
  proposalId: string | undefined,
): HouseholdInspection {
  const profile = householdDefinitions(world).find(item => item.id === householdId) ?? (Object.prototype.hasOwnProperty.call(HOUSEHOLDS, householdId) ? HOUSEHOLDS[householdId as HouseholdId] : undefined);
  if (!profile) fail("That household no longer exists. Select another profile.", { errorCode: "household_not_found", statusCode: 404 });
  let withProposal: HouseholdFinances | null = null;
  let proposalNarrative: string[] = [];
  if (proposalId) {
    const proposal = findProposal(world, proposalId);
    const levels = { ...world.levels, [proposal.policyId]: proposal.level };
    withProposal = householdFinances(householdId, levels, profile);
    proposalNarrative = householdNarrative(householdId, levels, profile);
  }
  return {
    householdId,
    profile,
    baseline: noPolicyFinances(householdId, profile),
    current: householdFinances(householdId, world.levels, profile),
    withProposal,
    narrative: householdNarrative(householdId, world.levels, profile),
    proposalNarrative,
  };
}

export function householdDefinitions(world: WorldState): HouseholdDefinition[] {
  return world.households.map(profile => ({ ...profile, composition: `${profile.residents} resident${profile.residents === 1 ? "" : "s"}` }));
}

export function manageHouseholdOp(world: WorldState, input: { operation: "save"; id?: string | undefined; profile: HouseholdInput } | { operation: "delete"; id: string }, ctx: OperationContext) {
  const existing = "id" in input && input.id ? world.households.find(item => item.id === input.id) : undefined;
  if (input.id && !existing) fail("That saved household was not found. Refresh your profiles.", { errorCode: "household_not_found", statusCode: 404 });
  if (input.operation === "delete") {
    const households = world.households.filter(item => item.id !== input.id);
    return { world: { ...world, households, actionLog: withLog(world, ctx, "manage-household", "Deleted a saved household profile") }, id: input.id };
  }
  if (!existing && world.households.length >= 20) fail("You can save up to 20 household profiles. Edit or remove one first.", { errorCode: "household_limit", statusCode: 409 });
  const profile = { ...HouseholdInputSchema.parse(input.profile), id: existing?.id ?? `custom-${ctx.newId()}` };
  const households = existing ? world.households.map(item => item.id === existing.id ? profile : item) : [...world.households, profile];
  return { world: { ...world, households, actionLog: withLog(world, ctx, "manage-household", existing ? "Updated a saved household profile" : "Created a saved household profile") }, id: profile.id };
}

export function advanceToYearOp(world: WorldState, targetYear: number, expectedRevision: number, ctx: OperationContext) {
  if (expectedRevision !== world.revision) fail("The world changed. Review the current year and try again.", { errorCode: "stale_revision", statusCode: 409 });
  const years = targetYear - world.year;
  if (!Number.isInteger(targetYear) || years < 1 || years > 50) fail(`Choose a year from ${world.year + 1} to ${world.year + 50}. Inspect earlier years in history, or reset to begin again.`, { errorCode: "invalid_year", statusCode: 400 });
  return { ...advanceYearsOp(world, years, ctx), years };
}
