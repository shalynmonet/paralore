import { useActionMutation } from "@agent-native/core/client/hooks";
import type { ReactNode } from "react";

import {
  DeltaBar,
  DisplayHeading,
  ConfirmDialog,
  Eyebrow,
  LoadingBlock,
  Notice,
  Panel,
  PLButton,
  Pill,
} from "../primitives";
import {
  ASSUMPTIONS,
  HOUSEHOLDS,
  HOUSEHOLD_IDS,
  INDICATOR_KEYS,
  INDICATOR_META,
  errorText,
  formatIndex,
  formatMoney,
  formatSignedMoney,
  type World,
} from "../world";

export function WorldGate({
  query,
  children,
}: {
  query: { isLoading: boolean; error: unknown; data: World | undefined; refetch: () => unknown };
  children: (world: World) => ReactNode;
}) {
  if (query.isLoading) return <LoadingBlock label="Loading the world state..." />;
  if (query.error || !query.data) {
    return (
      <div className="space-y-4">
        <Notice tone="error">{errorText(query.error)}</Notice>
        <PLButton onClick={() => query.refetch()}>Try again</PLButton>
      </div>
    );
  }
  return <>{children(query.data)}</>;
}

export function ViewIntro({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="mb-10 max-w-3xl space-y-3">
      <Eyebrow>{eyebrow}</Eyebrow>
      <DisplayHeading className="text-4xl md:text-5xl">{title}</DisplayHeading>
      {children ? <div className="text-sm leading-relaxed text-muted-foreground md:text-base">{children}</div> : null}
    </header>
  );
}

export interface EvaluationData {
  proposal: { id: string; policyId: string; level: number; origin: string; status: string };
  evaluation: {
    policyId: string;
    policyName: string;
    fromLabel: string;
    toLabel: string;
    before: Record<string, number>;
    after: Record<string, number>;
    deltas: Record<string, number>;
    fiscal: { before: number; after: number; strainThreshold: number; strainedAfterChange: boolean };
    forecast: { years: number; indicators: Record<string, number>; fiscalStrainedAtEnd: boolean };
    households: Record<string, { before: HouseholdSnapshot; after: HouseholdSnapshot }>;
    assumptions: string[];
    tradeoffs: string[];
  };
  stale: boolean;
}

interface HouseholdSnapshot {
  householdName?: string;
  disposableBalance: number;
  earnedIncome: number;
  paidHours: number;
  weeklyHoursFreed: number;
  adjustedCosts: number;
  ubiMonthly: number;
  ownershipDividendMonthly: number;
}

export function EvaluationPanel({ data }: { data: EvaluationData }) {
  const { evaluation, proposal, stale } = data;
  return (
    <div className="space-y-6">
      {stale ? (
        <Notice tone="error">
          The world changed since this preview. These are the original projected effects. Refresh the proposal against the current world before enacting it.
        </Notice>
      ) : null}
      {proposal.status === "enacted" ? <Notice tone="success">Policy enacted. These are its original before-and-after effects, preserved for your decision record.</Notice> : null}
      {proposal.status === "superseded" ? <Notice tone="info">A newer proposal replaced this one. Its original effects remain here for comparison.</Notice> : null}
      <Panel className="p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Eyebrow>Proposal {proposal.id.slice(0, 8)}</Eyebrow>
            <p className="mt-1 font-pl-display text-2xl">{evaluation.policyName}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Pill>{evaluation.fromLabel}</Pill>
            <span aria-hidden="true" className="text-muted-foreground">to</span>
            <Pill tone="amber">{evaluation.toLabel}</Pill>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Immediate change, six indicators</p>
          {INDICATOR_KEYS.map((key) => (
            <DeltaBar
              key={key}
              label={INDICATOR_META[key].label}
              delta={evaluation.deltas[key] ?? 0}
              higherIsBetter={INDICATOR_META[key].higherIsBetter}
              detail={`${formatIndex(evaluation.before[key] ?? 0)} to ${formatIndex(evaluation.after[key] ?? 0)}${key === "ownership" ? "%" : ""}`}
            />
          ))}
        </div>
      </Panel>

      <div className="grid gap-6 md:grid-cols-2">
        <Panel className="p-5 md:p-6">
          <Eyebrow>Fiscal consequence</Eyebrow>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Fiscal sustainability moves from <span className="text-foreground tabular-nums">{formatIndex(evaluation.fiscal.before)}</span> to{" "}
            <span className="text-foreground tabular-nums">{formatIndex(evaluation.fiscal.after)}</span>. The strain line is{" "}
            {evaluation.fiscal.strainThreshold}.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {evaluation.fiscal.strainedAfterChange
              ? "This level pushes fiscal sustainability into strain immediately."
              : "This level stays above the strain line immediately."}{" "}
            Over {evaluation.forecast.years} years on a copy, fiscal sustainability reaches{" "}
            <span className="text-foreground tabular-nums">{formatIndex(evaluation.forecast.indicators.fiscal ?? 0)}</span>
            {evaluation.forecast.fiscalStrainedAtEnd ? ", still in strain." : "."}
          </p>
        </Panel>

        <Panel className="p-5 md:p-6">
          <Eyebrow>Household impacts</Eyebrow>
          <div className="mt-3 space-y-4">
            {Object.entries(evaluation.households).map(([id, pair]) => {
              if (!pair) return null;
              const change = pair.after.disposableBalance - pair.before.disposableBalance;
              return (
                <div key={id} className="text-sm">
                  <p className="text-foreground">{pair.after.householdName ?? id}</p>
                  <p className="tabular-nums text-muted-foreground">
                    Disposable balance {formatMoney(pair.before.disposableBalance)} to{" "}
                    <span className="text-foreground">{formatMoney(pair.after.disposableBalance)}</span>{" "}
                    <span className={change >= 0 ? "text-pl-teal" : "text-pl-coral"}>({formatSignedMoney(change)})</span>
                  </p>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <Panel className="p-5 md:p-6">
        <Eyebrow>Trade-offs</Eyebrow>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
          {evaluation.tradeoffs.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </Panel>

      <details className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">
        <summary className="cursor-pointer text-foreground focus-visible:outline-2 focus-visible:outline-ring">
          Assumptions used in this evaluation
        </summary>
        <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed">
          {(evaluation.assumptions.length ? evaluation.assumptions : ASSUMPTIONS).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}

export function ReviewEnactmentDialog({
  open,
  onOpenChange,
  data,
  reviewedRevision,
  onEnacted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: EvaluationData;
  reviewedRevision: number;
  onEnacted: (message: string) => void;
}) {
  const enact = useActionMutation("enact-policy");
  const { evaluation, proposal } = data;

  const confirm = () => {
    if (enact.isPending) return;
    enact.mutate(
      { proposalId: proposal.id, expectedRevision: reviewedRevision },
      {
        onSuccess: (result) => {
          onEnacted(`${evaluation.policyName} enacted at ${evaluation.toLabel}. World revision is now ${result.revision}.`);
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Review before enactment"
      description="Confirming enacts exactly these parameters into the shared world. Cancel leaves the world unchanged."
      confirmLabel="Confirm and enact"
      onConfirm={confirm}
      pending={enact.isPending}
      error={enact.error ? errorText(enact.error) : null}
    >
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Policy</dt>
        <dd className="text-foreground">{evaluation.policyName}</dd>
        <dt className="text-muted-foreground">Change</dt>
        <dd className="text-foreground">{evaluation.fromLabel} to {evaluation.toLabel}</dd>
        <dt className="text-muted-foreground">Proposal</dt>
        <dd className="font-mono text-xs text-foreground">{proposal.id}</dd>
        <dt className="text-muted-foreground">World revision</dt>
        <dd className="tabular-nums text-foreground">{reviewedRevision}</dd>
      </dl>
      <ul className="mt-5 space-y-1.5 text-sm tabular-nums">
        {INDICATOR_KEYS.map((key) => {
          const delta = evaluation.deltas[key] ?? 0;
          const good = INDICATOR_META[key].higherIsBetter ? delta > 0 : delta < 0;
          return (
            <li key={key} className="flex justify-between gap-4">
              <span className="text-muted-foreground">{INDICATOR_META[key].label}</span>
              <span className={Math.abs(delta) < 0.05 ? "text-muted-foreground" : good ? "text-pl-teal" : "text-pl-coral"}>
                {Math.abs(delta) < 0.05 ? "0.0" : `${delta > 0 ? "+" : "\u2212"}${Math.abs(delta).toFixed(1)}`}
              </span>
            </li>
          );
        })}
      </ul>
    </ConfirmDialog>
  );
}
