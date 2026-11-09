import {
  ASSUMPTIONS,
  FISCAL_STRAIN_THRESHOLD,
  POLICIES,
  applyPolicyChange,
  forecastYears,
  indicatorDeltas,
  levelLabel,
  type EngineWorld,
  type Indicators,
  type PolicyId,
  type PolicyLevels,
} from "./engine";
import {
  HOUSEHOLD_IDS,
  householdFinances,
  type HouseholdFinances,
  type HouseholdId,
} from "./households";

export const FORECAST_YEARS = 5;

export interface PolicyEvaluation {
  policyId: PolicyId;
  policyName: string;
  fromLevel: number;
  toLevel: number;
  fromLabel: string;
  toLabel: string;
  before: Indicators;
  after: Indicators;
  deltas: Indicators;
  fiscal: {
    before: number;
    after: number;
    strainThreshold: number;
    strainedAfterChange: boolean;
  };
  forecast: {
    years: number;
    indicators: Indicators;
    fiscalStrainedAtEnd: boolean;
  };
  households: Record<
    HouseholdId,
    { before: HouseholdFinances; after: HouseholdFinances }
  >;
  assumptions: string[];
  tradeoffs: string[];
}

export function levelsWith(
  levels: PolicyLevels,
  policyId: PolicyId,
  level: number,
): PolicyLevels {
  return { ...levels, [policyId]: level };
}

export function evaluatePolicyChange(
  world: EngineWorld,
  policyId: PolicyId,
  toLevel: number,
): PolicyEvaluation {
  const fromLevel = world.levels[policyId];
  const before = world.indicators;
  const after = applyPolicyChange(before, policyId, fromLevel, toLevel);
  const nextLevels = levelsWith(world.levels, policyId, toLevel);
  const forecastIndicators = forecastYears(
    { year: world.year, indicators: after, levels: nextLevels },
    FORECAST_YEARS,
  );
  const deltas = indicatorDeltas(before, after);
  const policy = POLICIES[policyId];

  const households = {} as PolicyEvaluation["households"];
  for (const householdId of HOUSEHOLD_IDS) {
    households[householdId] = {
      before: householdFinances(householdId, world.levels),
      after: householdFinances(householdId, nextLevels),
    };
  }

  const tradeoffs = [...policy.tradeoffs];
  if (after.fiscal < FISCAL_STRAIN_THRESHOLD) {
    tradeoffs.push(
      `Fiscal sustainability would fall to ${after.fiscal.toFixed(1)}, below the ${FISCAL_STRAIN_THRESHOLD} strain line.`,
    );
  }
  if (deltas.inequality < 0) {
    tradeoffs.push(`Inequality falls by ${(-deltas.inequality).toFixed(1)} points.`);
  } else if (deltas.inequality > 0) {
    tradeoffs.push(`Inequality rises by ${deltas.inequality.toFixed(1)} points.`);
  }

  return {
    policyId,
    policyName: policy.name,
    fromLevel,
    toLevel,
    fromLabel: levelLabel(policyId, fromLevel),
    toLabel: levelLabel(policyId, toLevel),
    before,
    after,
    deltas,
    fiscal: {
      before: before.fiscal,
      after: after.fiscal,
      strainThreshold: FISCAL_STRAIN_THRESHOLD,
      strainedAfterChange: after.fiscal < FISCAL_STRAIN_THRESHOLD,
    },
    forecast: {
      years: FORECAST_YEARS,
      indicators: forecastIndicators,
      fiscalStrainedAtEnd: forecastIndicators.fiscal < FISCAL_STRAIN_THRESHOLD,
    },
    households,
    assumptions: ASSUMPTIONS,
    tradeoffs,
  };
}
