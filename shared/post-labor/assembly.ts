import { FISCAL_STRAIN_THRESHOLD, levelLabel, POLICIES, type PolicyId, type PolicyLevels } from "./engine";
import type { PolicyEvaluation } from "./evaluate";
import type { Delegate } from "./state";

interface ProposalRef {
  policyId: PolicyId;
  level: number;
}

interface AmendmentCandidate {
  policyId: PolicyId;
  level: number;
  rationale: string;
}

function firstValidAmendment(
  candidates: AmendmentCandidate[],
  levels: PolicyLevels,
  proposal: ProposalRef,
): AmendmentCandidate | null {
  return (
    candidates.find(
      (candidate) =>
        candidate.level >= 1 &&
        candidate.level <= 4 &&
        candidate.level !== levels[candidate.policyId] &&
        !(candidate.policyId === proposal.policyId && candidate.level === proposal.level),
    ) ?? null
  );
}

function signed(value: number): string {
  const rounded = Math.abs(value).toFixed(1);
  return value < 0 ? `-${rounded}` : `+${rounded}`;
}

function dollars(value: number): string {
  const sign = value < 0 ? "-" : "+";
  return `${sign}$${Math.abs(value).toFixed(0)}`;
}

function describe(candidate: AmendmentCandidate | null): Delegate["amendment"] {
  if (!candidate) return null;
  return {
    policyId: candidate.policyId,
    level: candidate.level,
    rationale: candidate.rationale,
  };
}

export interface AssemblyAnalysis {
  delegates: Delegate[];
  disagreement: string;
}

export function convenePerspectives(
  levels: PolicyLevels,
  proposal: ProposalRef,
  evaluation: PolicyEvaluation,
): AssemblyAnalysis {
  const chen = evaluation.households.chen;
  const chenDelta = chen.after.disposableBalance - chen.before.disposableBalance;
  const securityDelta = evaluation.deltas.security;
  const fiscalAfter = evaluation.fiscal.after;
  const strained = evaluation.fiscal.strainedAfterChange;
  const inequalityDelta = evaluation.deltas.inequality;

  const mayaAmendment = firstValidAmendment(
    [
      {
        policyId: "services",
        level: 1,
        rationale:
          "Essential services lower family costs now, instead of waiting for a slower cash rollout.",
      },
      {
        policyId: "services",
        level: 2,
        rationale: "Expanded services cut family costs further while keeping the rollout fast.",
      },
      {
        policyId: "ubi",
        level: 1,
        rationale: "A basic monthly floor gives Chen's household income security sooner.",
      },
    ],
    levels,
    proposal,
  );
  const mayaStance =
    chenDelta > 0 && securityDelta >= 0 ? "support" : chenDelta > 0 ? "conditional" : "oppose";

  const adrianAmendment = firstValidAmendment(
    [
      {
        policyId: "ownership",
        level: 1,
        rationale: "A smaller public share protects fiscal headroom and keeps the ownership path open.",
      },
      {
        policyId: "ownership",
        level: 2,
        rationale: "A moderate public share gives investors a clearer negotiated ownership path.",
      },
      {
        policyId: "workweek",
        level: 1,
        rationale: "A mild hours cap eases transition pressure without a large fiscal cost.",
      },
    ],
    levels,
    proposal,
  );
  const adrianStance = strained ? "oppose" : evaluation.deltas.ownership > 0 ? "conditional" : "support";

  const leilaAmendment = firstValidAmendment(
    [
      {
        policyId: "services",
        level: 3,
        rationale: "Comprehensive services give universal access through local institutions.",
      },
      {
        policyId: "services",
        level: 2,
        rationale: "Expanded services reach more neighborhoods while local capacity builds.",
      },
      {
        policyId: "services",
        level: 1,
        rationale: "Essential services are a legitimate first step that local partners can deliver.",
      },
    ],
    levels,
    proposal,
  );
  const leilaStance = inequalityDelta <= 0 ? "support" : "conditional";

  const delegates: Delegate[] = [
    {
      id: "maya-chen",
      name: "Maya Chen",
      role: "Displaced logistics worker",
      stance: mayaStance,
      position: `The Chen household's disposable balance moves ${dollars(chenDelta)} a month under this change. Maya backs changes that reach families quickly and is skeptical of delays.`,
      risk: `Economic security moves ${signed(securityDelta)} points. A slow rollout would leave her family exposed for longer.`,
      amendment: describe(mayaAmendment),
    },
    {
      id: "adrian-voss",
      name: "Adrian Voss",
      role: "AI infrastructure owner",
      stance: adrianStance,
      position: strained
        ? `Fiscal sustainability ends at ${fiscalAfter.toFixed(1)}, below the ${FISCAL_STRAIN_THRESHOLD} strain line. Investment depends on budget headroom, so Adrian opposes this level.`
        : `Fiscal sustainability ends at ${fiscalAfter.toFixed(1)}, above the ${FISCAL_STRAIN_THRESHOLD} strain line. Adrian will negotiate the ownership share if transition costs stay manageable.`,
      risk: `Public Automation Ownership moves to ${evaluation.after.ownership.toFixed(1)}%, which could slow private investment.`,
      amendment: describe(adrianAmendment),
    },
    {
      id: "leila-okafor",
      name: "Leila Okafor",
      role: "Community organizer",
      stance: leilaStance,
      position: `Inequality ${inequalityDelta <= 0 ? "falls" : "rises"} by ${Math.abs(inequalityDelta).toFixed(1)} points. Access must reach every neighborhood, not only households with the most bargaining power.`,
      risk: "Local institutions need capacity. A top-down rollout could lose legitimacy.",
      amendment: describe(leilaAmendment),
    },
  ];

  const disagreement = `Maya weighs the Chen balance change of ${dollars(chenDelta)} a month against Adrian's fiscal reading of ${fiscalAfter.toFixed(1)}. Leila asks for broader access than either. Proposal: ${POLICIES[proposal.policyId].name} at ${levelLabel(proposal.policyId, proposal.level)}.`;

  return { delegates, disagreement };
}
