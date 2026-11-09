import { NO_POLICY_LEVELS, type EngineWorld } from "./engine";
import type { WorldState } from "./state";

/** Recover the state a proposal actually evaluated, including legacy proposals. */
export function worldAtRevision(world: WorldState, revision: number): EngineWorld {
  const snapshot = [...world.timeline].reverse().find(item => item.revision <= revision);
  if (!snapshot) throw new Error("The proposal's historical snapshot is unavailable.");
  const levels = { ...NO_POLICY_LEVELS };
  for (const decision of world.decisions) {
    if (decision.revision <= revision) levels[decision.policyId] = decision.toLevel;
  }
  return { year: snapshot.year, indicators: { ...snapshot.indicators }, levels };
}
