import { describe, expect, it } from "vitest";
import { BASELINE_INDICATORS, NO_POLICY_LEVELS, applyPolicyChange, annualStep, advanceYears } from "./engine";
import { householdFinances } from "./households";
import { evaluatePolicyChange } from "./evaluate";
import { createBaselineWorld, validateWorld } from "./state";
import { proposePolicyOp, enactPolicyOp, advanceYearsOp, resetOp, convenePerspectivesOp, evaluatePolicyOp, advanceToYearOp, manageHouseholdOp, inspectHouseholdOp } from "../../server/lib/post-labor/operations";

let sequence = 0;
const context = { caller: "frontend", newId: () => `test-${++sequence}` };
const baseline = () => createBaselineWorld(`simulation-${++sequence}`);
const ownership = () => proposePolicyOp(baseline(), { policyId: "ownership", level: 2 }, "human", context);

describe("PARALORE deterministic contract", () => {
  it("starts in 2040 with the exact baseline", () => {
    const world = baseline();
    expect(world.year).toBe(2040);
    expect(world.indicators).toEqual({ security: 32, inequality: 78, trust: 38, stability: 43, ownership: 8, fiscal: 65 });
    expect(world.timeline).toHaveLength(1);
    expect(world.levels).toEqual(NO_POLICY_LEVELS);
  });
  it("previews ownership without mutating the input or indicators", () => {
    const world = baseline(); const snapshot = structuredClone(world);
    const result = proposePolicyOp(world, { policyId: "ownership", level: 2 }, "agent", context);
    expect(world).toEqual(snapshot);
    expect(result.world.indicators).toEqual(BASELINE_INDICATORS);
    expect(result.world.timeline).toHaveLength(1);
    expect(result.evaluation.after).toEqual({ security: 38, inequality: 68, trust: 42, stability: 47, ownership: 28, fiscal: 71 });
    expect(evaluatePolicyChange(world, "ownership", 2)).toEqual(result.evaluation);
  });
  it("matches the five-year reference trajectory and annual replay", () => {
    const first = ownership();
    const world = enactPolicyOp(first.world, { proposalId: first.proposal.id, expectedRevision: 0 }, context).world;
    const advanced = advanceYearsOp(world, 5, context).world;
    let replay = world; for (let i = 0; i < 5; i++) replay = advanceYearsOp(replay, 1, context).world;
    expect(advanced.year).toBe(2045);
    const expected = { security: 37, inequality: 67.5, trust: 41.5, stability: 45, ownership: 28, fiscal: 80.5 };
    for (const key of Object.keys(expected) as (keyof typeof expected)[]) expect(advanced.indicators[key]).toBeCloseTo(expected[key], 8);
    expect(advanced.indicators).toEqual(replay.indicators);
    expect(advanced.timeline).toHaveLength(7);
  });
  it("replaces levels rather than stacking full effects", () => {
    const first = applyPolicyChange(BASELINE_INDICATORS, "ownership", 0, 2);
    expect(applyPolicyChange(first, "ownership", 2, 3)).toEqual({ security: 41, inequality: 63, trust: 44, stability: 49, ownership: 38, fiscal: 74 });
  });
  it("derives household budgets and uncompensated shorter hours", () => {
    const levels = { ...NO_POLICY_LEVELS, ownership: 2 };
    expect(householdFinances("chen", levels).disposableBalance).toBe(-960);
    expect(householdFinances("rivera", levels).disposableBalance).toBe(1280);
    const shorter = householdFinances("rivera", { ...NO_POLICY_LEVELS, workweek: 4 });
    expect(shorter.paidHours).toBe(15);
    expect(shorter.earnedIncome).toBe(1425);
    expect(shorter.weeklyHoursFreed).toBe(25);
    expect(householdFinances("chen", { ...NO_POLICY_LEVELS, services: 4 }).adjustedCosts).toBe(1632);
  });
  it("clamps scores and applies fiscal-strain penalties after yearly drift", () => {
    expect(applyPolicyChange({ ...BASELINE_INDICATORS, security: 99 }, "ubi", 0, 4).security).toBe(100);
    const strained = annualStep({ ...BASELINE_INDICATORS, fiscal: 1, security: 1 }, NO_POLICY_LEVELS);
    expect(strained.security).toBe(0);
    expect(strained.trust).toBe(35.5);
  });
  it("rejects same levels, invalid levels, stale and duplicate enactments", () => {
    expect(() => proposePolicyOp(baseline(), { policyId: "ubi", level: 0 }, "human", context)).toThrow();
    for (const level of [-1, 5, NaN, 1.5, Infinity]) expect(() => proposePolicyOp(baseline(), { policyId: "ubi", level }, "agent", context)).toThrow();
    const first = ownership();
    const changed = advanceYearsOp(first.world, 1, context).world;
    expect(() => enactPolicyOp(changed, { proposalId: first.proposal.id, expectedRevision: changed.revision }, context)).toThrow(/stale/);
    const enacted = enactPolicyOp(first.world, { proposalId: first.proposal.id, expectedRevision: 0 }, context).world;
    expect(() => enactPolicyOp(enacted, { proposalId: first.proposal.id, expectedRevision: enacted.revision }, context)).toThrow(/already enacted/);
  });
  it("invalidates superseded proposals and all proposals on reset", () => {
    const first = ownership(); const amended = proposePolicyOp(first.world, { policyId: "ownership", level: 1 }, "human", context);
    expect(() => enactPolicyOp(amended.world, { proposalId: first.proposal.id, expectedRevision: 0 }, context)).toThrow(/superseded/);
    const fresh = resetOp(amended.world.revision, context);
    expect(fresh.simulationId).not.toBe(amended.world.simulationId);
    expect(fresh.indicators).toEqual(BASELINE_INDICATORS);
    expect(fresh.proposals).toHaveLength(0);
    expect(fresh.timeline).toHaveLength(1);
    expect(() => enactPolicyOp(fresh, { proposalId: first.proposal.id, expectedRevision: fresh.revision }, context)).toThrow();
  });
  it("convenes traceable perspectives without enacting, and supports persistence validation", () => {
    const first = ownership(); const result = convenePerspectivesOp(first.world, first.proposal.id, context);
    expect(result.assembly.delegates).toHaveLength(3);
    expect(result.assembly.mode).toBe("illustrative-deterministic");
    expect(result.world.indicators).toEqual(BASELINE_INDICATORS);
    expect(result.world.decisions).toHaveLength(0);
    expect(validateWorld(JSON.parse(JSON.stringify(result.world))).ok).toBe(true);
    expect(validateWorld({ ...result.world, indicators: { security: NaN } }).ok).toBe(false);
  });
});


describe("proposal history and user controls", () => {
  it("preserves original consequences after enactment and later years", () => {
    const first = ownership();
    const enacted = enactPolicyOp(first.world, { proposalId: first.proposal.id, expectedRevision: 0 }, context).world;
    for (const world of [enacted, advanceYearsOp(enacted, 5, context).world]) {
      const result = evaluatePolicyOp(world, first.proposal.id);
      expect(result.stale).toBe(false);
      expect(result.evaluation).toEqual(first.evaluation);
      expect(result.evaluation.fromLevel).toBe(0);
      expect(result.evaluation.deltas.ownership).toBe(20);
    }
    const changed = advanceYearsOp(first.world, 1, context).world;
    expect(evaluatePolicyOp(changed, first.proposal.id).stale).toBe(true);
    expect(evaluatePolicyOp(changed, first.proposal.id).evaluation).toEqual(first.evaluation);
  });
  it("simulates a selected year through every intermediate annual step", () => {
    const world = baseline();
    const selected = advanceToYearOp(world, 2050, world.revision, context);
    expect(selected.world.year).toBe(2050);
    expect(selected.world.timeline).toHaveLength(11);
    expect(selected.world.indicators).toEqual(advanceYearsOp(world, 10, context).world.indicators);
    for (const year of [2039, 2040, 2041.5, 2091]) expect(() => advanceToYearOp(world, year, 0, context)).toThrow();
    expect(() => advanceToYearOp(world, 2045, 99, context)).toThrow();
  });
  it("saves, edits, inspects and removes a household without changing policy state", () => {
    const original = baseline();
    const profile = { name: "Test household", residents: 2, baselineEarnedIncome: 2400, baselineCosts: 3000, baselineHours: 40, context: "Fictional" };
    const created = manageHouseholdOp(original, { operation: "save", profile }, context);
    expect(created.world.indicators).toEqual(original.indicators);
    expect(created.world.revision).toBe(original.revision);
    const world = { ...created.world, levels: { ...original.levels, ubi: 1, ownership: 2, services: 1 } };
    expect(inspectHouseholdOp(world, created.id, undefined).current.disposableBalance).toBe(800);
    const edited = manageHouseholdOp(world, { operation: "save", id: created.id, profile: { ...profile, name: "Updated" } }, context);
    expect(edited.world.households).toHaveLength(1);
    expect(edited.world.households[0]!.name).toBe("Updated");
    expect(resetOp(world.revision, context, world.households).households).toEqual(world.households);
    expect(manageHouseholdOp(world, { operation: "delete", id: created.id }, context).world.households).toEqual([]);
    expect(() => manageHouseholdOp(world, { operation: "delete", id: "chen" }, context)).toThrow();
    expect(() => manageHouseholdOp(original, { operation: "save", profile: { ...profile, baselineHours: 0 } }, context)).toThrow();
    const zero = manageHouseholdOp(original, { operation: "save", profile: { ...profile, baselineHours: 0, baselineEarnedIncome: 0 } }, context);
    expect(inspectHouseholdOp(zero.world, zero.id, undefined).current.earnedIncome).toBe(0);
    const legacy = { ...original } as Record<string, unknown>; delete legacy.households;
    const validated = validateWorld(legacy);
    expect(validated.ok).toBe(true);
    if (validated.ok) expect(validated.world.households).toEqual([]);
  });
});
