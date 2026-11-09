import { useActionQuery, actionErrorMessage } from "@agent-native/core/client/hooks";

export {
  ASSUMPTIONS,
  INDICATOR_KEYS,
  INDICATOR_META,
  POLICIES,
  POLICY_IDS,
  SCENARIO_LABELS,
  levelLabel,
  type IndicatorKey,
  type Indicators,
  type PolicyId,
  type ScenarioStatus,
} from "../../../shared/post-labor/engine";
export { HOUSEHOLD_IDS, HOUSEHOLDS, type HouseholdId } from "../../../shared/post-labor/households";

export function useWorld() {
  return useActionQuery("get-world-state");
}

export type World = NonNullable<ReturnType<typeof useWorld>["data"]>;

export function errorText(error: unknown): string {
  const message = actionErrorMessage(error);
  if (message) return message;
  return "The request failed. Try again.";
}

export function formatIndex(value: number): string {
  return value.toFixed(1);
}

export function formatSigned(value: number, suffix = ""): string {
  if (Math.abs(value) < 0.05) return `0.0${suffix}`;
  const sign = value > 0 ? "+" : "\u2212";
  return `${sign}${Math.abs(value).toFixed(1)}${suffix}`;
}

export function formatMoney(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? "\u2212" : "";
  return `${sign}$${Math.abs(rounded).toLocaleString("en-US")}`;
}

export function formatSignedMoney(value: number): string {
  if (Math.round(value) === 0) return "$0";
  const sign = value > 0 ? "+" : "\u2212";
  return `${sign}$${Math.abs(Math.round(value)).toLocaleString("en-US")}`;
}

export function formatPopulation(value: number): string {
  return `${(value / 1_000_000).toFixed(0)} million`;
}

export const CALLER_LABELS: Record<string, string> = {
  frontend: "Human UI",
  tool: "Native agent",
  http: "HTTP",
  mcp: "MCP client",
  cli: "Command line",
  unknown: "Unknown",
};

export function callerLabel(caller: string): string {
  return CALLER_LABELS[caller] ?? caller;
}
