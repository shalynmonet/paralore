import { NO_POLICY_LEVELS, type PolicyLevels } from "./engine";

export const HOUSEHOLD_IDS = ["chen", "rivera"] as const;
export type HouseholdId = (typeof HOUSEHOLD_IDS)[number];

export interface HouseholdDefinition {
  id: string;
  name: string;
  composition: string;
  residents: number;
  baselineEarnedIncome: number;
  baselineCosts: number;
  baselineHours: number;
  context: string;
}

export const HOUSEHOLDS: Record<HouseholdId, HouseholdDefinition> = {
  chen: {
    id: "chen",
    name: "Chen household",
    composition: "2 adults + 1 child",
    residents: 3,
    baselineEarnedIncome: 1200,
    baselineCosts: 2400,
    baselineHours: 20,
    context: "Displaced logistics work; part-time paid hours while family costs stay high.",
  },
  rivera: {
    id: "rivera",
    name: "Rivera household",
    composition: "1 adult",
    residents: 1,
    baselineEarnedIncome: 3800,
    baselineCosts: 2600,
    baselineHours: 40,
    context: "Full-time paid hours under automation pressure in a single-earner household.",
  },
};

export const UBI_PER_RESIDENT_PER_LEVEL = 500;
export const DIVIDEND_PER_RESIDENT_PER_LEVEL = 40;
export const SERVICE_SAVINGS_PER_LEVEL_PERCENT = 8;
export const SERVICE_SAVINGS_CAP_PERCENT = 32;
export function workweekCapFor(level: number): number {
  if (level === 0) return 40;
  if (level === 1) return 30;
  if (level === 2) return 25;
  if (level === 3) return 20;
  return 15;
}

export interface HouseholdFinances {
  householdId: string;
  householdName: string;
  residents: number;
  baselineEarnedIncome: number;
  earnedIncome: number;
  ubiMonthly: number;
  ownershipDividendMonthly: number;
  baselineCosts: number;
  servicesReductionPercent: number;
  servicesSavingsMonthly: number;
  adjustedCosts: number;
  disposableBalance: number;
  baselineHours: number;
  workweekCap: number;
  paidHours: number;
  weeklyHoursFreed: number;
}

export function householdFinances(
  householdId: string,
  levels: PolicyLevels,
  profile?: HouseholdDefinition,
): HouseholdFinances {
  const household = profile ?? (Object.prototype.hasOwnProperty.call(HOUSEHOLDS, householdId) ? HOUSEHOLDS[householdId as HouseholdId] : undefined);
  if (!household) throw new Error("Unknown household profile.");
  const ubiMonthly = household.residents * UBI_PER_RESIDENT_PER_LEVEL * levels.ubi;
  const ownershipDividendMonthly =
    household.residents * DIVIDEND_PER_RESIDENT_PER_LEVEL * levels.ownership;
  const servicesReductionPercent = Math.min(
    SERVICE_SAVINGS_PER_LEVEL_PERCENT * levels.services,
    SERVICE_SAVINGS_CAP_PERCENT,
  );
  const servicesSavingsMonthly =
    household.baselineCosts * (servicesReductionPercent / 100);
  const adjustedCosts = household.baselineCosts - servicesSavingsMonthly;
  const workweekCap = workweekCapFor(levels.workweek);
  const paidHours = Math.min(household.baselineHours, workweekCap);
  const earnedIncome =
    household.baselineHours > 0 ? (household.baselineEarnedIncome * paidHours) / household.baselineHours : 0;
  const disposableBalance =
    earnedIncome + ubiMonthly + ownershipDividendMonthly - adjustedCosts;

  return {
    householdId,
    householdName: household.name,
    residents: household.residents,
    baselineEarnedIncome: household.baselineEarnedIncome,
    earnedIncome,
    ubiMonthly,
    ownershipDividendMonthly,
    baselineCosts: household.baselineCosts,
    servicesReductionPercent,
    servicesSavingsMonthly,
    adjustedCosts,
    disposableBalance,
    baselineHours: household.baselineHours,
    workweekCap,
    paidHours,
    weeklyHoursFreed: household.baselineHours - paidHours,
  };
}

export function noPolicyFinances(householdId: string, profile?: HouseholdDefinition): HouseholdFinances {
  return householdFinances(householdId, NO_POLICY_LEVELS, profile);
}

export function householdNarrative(
  householdId: string,
  levels: PolicyLevels,
  profile?: HouseholdDefinition,
): string[] {
  const finances = householdFinances(householdId, levels, profile);
  const household = profile ?? (Object.prototype.hasOwnProperty.call(HOUSEHOLDS, householdId) ? HOUSEHOLDS[householdId as HouseholdId] : undefined);
  if (!household) throw new Error("Unknown household profile.");
  const lines: string[] = [];

  if (levels.ubi > 0) {
    lines.push(
      `Universal Basic Income at level ${levels.ubi} pays $${finances.ubiMonthly.toLocaleString("en-US")} a month across ${household.residents} resident${household.residents === 1 ? "" : "s"}.`,
    );
  }
  if (levels.ownership > 0) {
    lines.push(
      `Public AI Ownership at level ${levels.ownership} adds a $${finances.ownershipDividendMonthly.toLocaleString("en-US")} monthly dividend.`,
    );
  }
  if (levels.workweek > 0) {
    lines.push(
      `The workweek cap of ${finances.workweekCap} hours reduces paid hours from ${finances.baselineHours} to ${finances.paidHours}, freeing ${finances.weeklyHoursFreed} hours each week. The model assumes no wage compensation, so earned income falls by $${(finances.baselineEarnedIncome - finances.earnedIncome).toFixed(0)} a month.`,
    );
  }
  if (levels.services > 0) {
    lines.push(
      `Universal Basic Services reduce baseline costs by ${finances.servicesReductionPercent}%, saving $${finances.servicesSavingsMonthly.toFixed(0)} a month.`,
    );
  }
  if (lines.length === 0) {
    lines.push("No policy is active, so this household shows the baseline position.");
  }
  return lines;
}
