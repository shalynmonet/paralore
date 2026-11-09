import { describe, expect, it } from "vitest";
import { BASELINE_INDICATORS, NO_POLICY_LEVELS, applyPolicyChange, annualStep, advanceYears } from "./engine";
import { householdFinances } from "./households";
import { evaluatePolicyChange } from "./evaluate";
import { createBaselineWorld, validateWorld } from "./state";
import { proposePolicyOp, enactPolicyOp, advanceYearsOp, resetOp, convenePerspectivesOp } from "../../server/lib/post-labor/operations";

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
