export const INDICATOR_KEYS = [
  "security",
  "inequality",
  "trust",
  "stability",
  "ownership",
  "fiscal",
] as const;

export type IndicatorKey = (typeof INDICATOR_KEYS)[number];
export type Indicators = Record<IndicatorKey, number>;

export const POLICY_IDS = ["ubi", "ownership", "workweek", "services"] as const;
export type PolicyId = (typeof POLICY_IDS)[number];
export type PolicyLevels = Record<PolicyId, number>;

export const MAX_LEVEL = 4;
export const BASE_YEAR = 2040;
export const POPULATION = 10_000_000;
export const DISPLACEMENT_PERCENT = 75;
export const FISCAL_STRAIN_THRESHOLD = 25;
export const FRAGILE_THRESHOLD = 40;

export const BASELINE_INDICATORS: Indicators = {
  security: 32,
  inequality: 78,
  trust: 38,
  stability: 43,
  ownership: 8,
  fiscal: 65,
};

export const NO_POLICY_LEVELS: PolicyLevels = {
  ubi: 0,
  ownership: 0,
  workweek: 0,
  services: 0,
};

export const INDICATOR_META: Record<
  IndicatorKey,
  { label: string; unit: string; higherIsBetter: boolean; description: string }
> = {
  security: {
    label: "Economic Security",
    unit: "index / 100",
    higherIsBetter: true,
    description: "Household capacity to absorb income shocks during transition.",
  },
  inequality: {
    label: "Inequality",
    unit: "index / 100",
    higherIsBetter: false,
    description: "Distance between households at the top and bottom of income.",
  },
  trust: {
    label: "Public Trust",
    unit: "index / 100",
    higherIsBetter: true,
    description: "Public confidence that institutions manage the transition fairly.",
  },
  stability: {
    label: "Social Stability",
    unit: "index / 100",
    higherIsBetter: true,
    description: "Continuity of communities, work and civic life.",
  },
  ownership: {
    label: "Public Automation Ownership",
    unit: "% of automation capital",
    higherIsBetter: true,
    description: "Share of automated productive capital held in public hands.",
  },
  fiscal: {
    label: "Fiscal Sustainability",
    unit: "index / 100",
    higherIsBetter: true,
    description: "Headroom in public budgets to fund commitments without strain.",
  },
};

export interface PolicyDefinition {
  id: PolicyId;
  name: string;
  summary: string;
  benefits: string[];
  tradeoffs: string[];
  levelLabels: [string, string, string, string];
  perLevelDelta: Indicators;
}

export const POLICIES: Record<PolicyId, PolicyDefinition> = {
  ubi: {
    id: "ubi",
    name: "Universal Basic Income",
    summary: "A monthly cash floor paid to every resident.",
    benefits: [
      "Raises the income floor for every household at once.",
      "Lowers inequality and steadies social life.",
    ],
    tradeoffs: [
      "Each level draws heavily on public budgets.",
      "Cash alone does not change costs of housing or care.",
    ],
    levelLabels: [
      "$500 / resident / month",
      "$1,000 / resident / month",
      "$1,500 / resident / month",
      "$2,000 / resident / month",
    ],
    perLevelDelta: { security: 6, inequality: -4, trust: 2, stability: 3, ownership: 0, fiscal: -7 },
  },
  ownership: {
    id: "ownership",
    name: "Public AI Ownership",
    summary: "Public share of automated productive capital, added on top of the baseline.",
    benefits: [
      "Builds a public stake in automation returns.",
      "Funds a per-resident dividend and fiscal headroom over time.",
    ],
    tradeoffs: [
      "Private AI owners resist and invest less while the share rises.",
      "Transition costs and capital flight can weigh on trust in the short run.",
    ],
    levelLabels: [
      "+10 pts (18% public share)",
      "+20 pts (28% public share)",
      "+30 pts (38% public share)",
      "+40 pts (48% public share)",
    ],
    perLevelDelta: { security: 3, inequality: -5, trust: 2, stability: 2, ownership: 10, fiscal: 3 },
  },
  workweek: {
    id: "workweek",
    name: "Shorter Workweek",
    summary: "A cap on weekly paid hours, sharing remaining work across more people.",
    benefits: [
      "Frees time for family, care and civic life.",
      "Spreads paid work across more people.",
    ],
    tradeoffs: [
      "Lower hours reduce output and public revenue.",
      "Without wage compensation, earned income falls with hours.",
    ],
    levelLabels: [
      "Cap 30 hours / week",
      "Cap 25 hours / week",
      "Cap 20 hours / week",
      "Cap 15 hours / week",
    ],
    perLevelDelta: { security: 2, inequality: -2, trust: 2, stability: 3, ownership: 0, fiscal: -3 },
  },
  services: {
    id: "services",
    name: "Universal Basic Services",
    summary: "Guaranteed core services that lower the cost of living.",
    benefits: [
      "Cuts household costs for care, transit and essentials.",
      "Gives every resident access regardless of income.",
    ],
    tradeoffs: [
      "Service delivery is expensive and slow to scale.",
      "Higher levels cost more and need institutional capacity.",
    ],
    levelLabels: [
      "Essential",
      "Expanded",
      "Comprehensive",
      "Universal",
    ],
    perLevelDelta: { security: 5, inequality: -3, trust: 3, stability: 2, ownership: 0, fiscal: -5 },
  },
};

export const ASSUMPTIONS: string[] = [
  "Fictional MVP model of the Commonwealth of Aurora. Outputs are illustrative and are not an economic forecast.",
  "Indicators are index values bounded from 0 to 100 and are clamped after every action and every annual step.",
  "Each policy has discrete levels 0 to 4. Level 0 is inactive, and one level is active per policy at a time.",
  "Changing an active level applies the per-level delta times the level difference, so a replacement never stacks the full vector.",
  "Public AI Ownership levels add 10 percentage points each to the baseline 8% public share.",
  "Annual drift uses the active levels: security, inequality, trust, stability and fiscal sustainability move each year.",
  "Public Automation Ownership stays at its enacted value during annual drift.",
  "If fiscal sustainability falls below 25 after a step, security and trust drop by 2 and stability by 1 more.",
  "Forecasts run on a copy through the same engine and never append to the real timeline.",
  "Dashboard index scores do not convert directly into dollars.",
];

export interface EngineWorld {
  year: number;
  indicators: Indicators;
  levels: PolicyLevels;
}

export function clamp(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export function levelLabel(policyId: PolicyId, level: number): string {
  if (level === 0) return "Inactive";
  return POLICIES[policyId].levelLabels[level - 1] ?? "Unknown level";
}

export function applyPolicyChange(
  indicators: Indicators,
  policyId: PolicyId,
  fromLevel: number,
  toLevel: number,
): Indicators {
  const steps = toLevel - fromLevel;
  const delta = POLICIES[policyId].perLevelDelta;
  const next = { ...indicators };
  for (const key of INDICATOR_KEYS) {
    next[key] = clamp(indicators[key] + steps * delta[key]);
  }
  return next;
}

export function annualStep(indicators: Indicators, levels: PolicyLevels): Indicators {
  const u = levels.ubi;
  const o = levels.ownership;
  const w = levels.workweek;
  const s = levels.services;

  let security = clamp(indicators.security + (-1 + 0.7 * u + 0.4 * o + 0.2 * w + 0.6 * s));
  const inequality = clamp(indicators.inequality + (0.7 - 0.3 * u - 0.4 * o - 0.1 * w - 0.2 * s));
  let trust = clamp(indicators.trust + (-0.5 + 0.2 * u + 0.2 * o + 0.2 * w + 0.3 * s));
  let stability = clamp(indicators.stability + (-0.8 + 0.3 * u + 0.2 * o + 0.3 * w + 0.3 * s));
  const fiscal = clamp(indicators.fiscal + (0.3 + 0.8 * o - 1.0 * u - 0.3 * w - 0.7 * s));

  if (fiscal < FISCAL_STRAIN_THRESHOLD) {
    security = clamp(security - 2);
    trust = clamp(trust - 2);
    stability = clamp(stability - 1);
  }

  return {
    security,
    inequality,
    trust,
    stability,
    ownership: indicators.ownership,
    fiscal,
  };
}

export function advanceOneYear(world: EngineWorld): EngineWorld {
  return {
    year: world.year + 1,
    indicators: annualStep(world.indicators, world.levels),
    levels: world.levels,
  };
}

export function advanceYears(
  world: EngineWorld,
  years: number,
): { path: EngineWorld[]; final: EngineWorld } {
  const path: EngineWorld[] = [];
  let current = world;
  for (let i = 0; i < years; i += 1) {
    current = advanceOneYear(current);
    path.push(current);
  }
  return { path, final: current };
}

export type ScenarioStatus = "fiscal-strain" | "fragile-transition" | "building-resilience";

export function scenarioStatus(indicators: Indicators): ScenarioStatus {
  if (indicators.fiscal < FISCAL_STRAIN_THRESHOLD) return "fiscal-strain";
  if (indicators.security < FRAGILE_THRESHOLD || indicators.stability < FRAGILE_THRESHOLD) {
    return "fragile-transition";
  }
  return "building-resilience";
}

export const SCENARIO_LABELS: Record<ScenarioStatus, string> = {
  "fiscal-strain": "Fiscal strain",
  "fragile-transition": "Fragile transition",
  "building-resilience": "Building resilience",
};

export function indicatorDeltas(before: Indicators, after: Indicators): Indicators {
  const deltas = {} as Indicators;
  INDICATOR_KEYS.forEach((key) => {
    deltas[key] = after[key] - before[key];
  });
  return deltas;
}

export function forecastYears(world: EngineWorld, years: number): Indicators {
  return advanceYears(world, years).final.indicators;
}
