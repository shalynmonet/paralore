import { z } from "zod";
import { HouseholdProfileSchema } from "./profiles";

import {
  BASE_YEAR,
  BASELINE_INDICATORS,
  MAX_LEVEL,
  NO_POLICY_LEVELS,
  POLICY_IDS,
  type Indicators,
  type PolicyLevels,
} from "./engine";

export const SCHEMA_VERSION = 1;

const indicatorValue = z.number().min(0).max(100);
const levelValue = z.number().int().min(0).max(MAX_LEVEL);
const policyId = z.enum(POLICY_IDS);

export const IndicatorsSchema = z.object({
  security: indicatorValue,
  inequality: indicatorValue,
  trust: indicatorValue,
  stability: indicatorValue,
  ownership: indicatorValue,
  fiscal: indicatorValue,
});

export const LevelsSchema = z.object({
  ubi: levelValue,
  ownership: levelValue,
  workweek: levelValue,
  services: levelValue,
});

export const ProposalSchema = z.object({
  id: z.string().min(1),
  simulationId: z.string().min(1),
  worldRevision: z.number().int().min(0),
  policyId,
  level: levelValue,
  status: z.enum(["open", "superseded", "enacted"]),
  origin: z.enum(["human", "agent"]),
  createdYear: z.number().int(),
  assemblyId: z.string().nullable(),
});

export const AmendmentSchema = z.object({
  policyId,
  level: levelValue,
  rationale: z.string(),
});

export const DelegateSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  role: z.string(),
  stance: z.enum(["support", "conditional", "oppose"]),
  position: z.string(),
  risk: z.string(),
  amendment: AmendmentSchema.nullable(),
});

export const AssemblySchema = z.object({
  id: z.string().min(1),
  proposalId: z.string().min(1),
  worldRevision: z.number().int().min(0),
  mode: z.literal("illustrative-deterministic"),
  delegates: z.array(DelegateSchema).length(3),
  disagreement: z.string(),
});

export const TimelineEntrySchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["baseline", "annual", "enactment"]),
  year: z.number().int(),
  revision: z.number().int().min(0),
  indicators: IndicatorsSchema,
  label: z.string(),
  policyId: policyId.nullable(),
  level: levelValue.nullable(),
});

export const DecisionSchema = z.object({
  id: z.string().min(1),
  year: z.number().int(),
  revision: z.number().int().min(0),
  proposalId: z.string().min(1),
  policyId,
  fromLevel: levelValue,
  toLevel: levelValue,
  summary: z.string(),
});

export const ActionLogSchema = z.object({
  id: z.string().min(1),
  revision: z.number().int().min(0),
  action: z.string().min(1),
  caller: z.string(),
  summary: z.string(),
});

export const WorldStateSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  simulationId: z.string().min(1),
  revision: z.number().int().min(0),
  year: z.number().int(),
  indicators: IndicatorsSchema,
  levels: LevelsSchema,
  proposals: z.array(ProposalSchema),
  assemblies: z.array(AssemblySchema),
  timeline: z.array(TimelineEntrySchema),
  decisions: z.array(DecisionSchema),
  actionLog: z.array(ActionLogSchema),
  households: z.array(HouseholdProfileSchema).max(20).default([]),
});

export type Proposal = z.infer<typeof ProposalSchema>;
export type Assembly = z.infer<typeof AssemblySchema>;
export type Delegate = z.infer<typeof DelegateSchema>;
export type TimelineEntry = z.infer<typeof TimelineEntrySchema>;
export type Decision = z.infer<typeof DecisionSchema>;
export type ActionLogEntry = z.infer<typeof ActionLogSchema>;
export type WorldState = z.infer<typeof WorldStateSchema>;

export function createBaselineWorld(simulationId: string, revision = 0): WorldState {
  const indicators: Indicators = { ...BASELINE_INDICATORS };
  const levels: PolicyLevels = { ...NO_POLICY_LEVELS };
  return {
    schemaVersion: SCHEMA_VERSION,
    simulationId,
    revision,
    year: BASE_YEAR,
    indicators,
    levels,
    proposals: [],
    assemblies: [],
    timeline: [
      {
        id: `${simulationId}-baseline`,
        kind: "baseline",
        year: BASE_YEAR,
        revision,
        indicators: { ...indicators },
        label: "Baseline 2040",
        policyId: null,
        level: null,
      },
    ],
    decisions: [],
    actionLog: [],
    households: [],
  };
}

export type WorldValidation =
  | { ok: true; world: WorldState }
  | { ok: false; problems: string[] };

export function validateWorld(value: unknown): WorldValidation {
  const parsed = WorldStateSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      problems: parsed.error.issues.map(
        (issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`,
      ),
    };
  }
  const world = parsed.data;
  const problems: string[] = [];
  const proposalIds = new Set(world.proposals.map((proposal) => proposal.id));
  if (proposalIds.size !== world.proposals.length) {
    problems.push("proposals: duplicate proposal ids");
  }
  for (const proposal of world.proposals) {
    if (proposal.simulationId !== world.simulationId && proposal.status === "open") {
      problems.push(`proposals.${proposal.id}: open proposal belongs to another simulation`);
    }
  }
  if (problems.length > 0) return { ok: false, problems };
  return { ok: true, world };
}
