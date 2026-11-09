import { ProposalOutputSchema } from "../shared/post-labor/contracts";
import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { POLICY_IDS, MAX_LEVEL } from "../shared/post-labor/engine";
import {
  operationContext,
  proposalOrigin,
  proposePolicyOp,
} from "../server/lib/post-labor/operations";
import { mutateWorld } from "../server/lib/post-labor/store";

export default defineAction({
  outputSchema: ProposalOutputSchema,
  description:
    "Create an immutable proposal to set one policy to a new level, bound to the current world revision, and return its evaluation. Never changes indicators and never enacts the policy; enactment needs human approval through enactPolicy.",
  schema: z.object({
    policyId: z.enum(POLICY_IDS).describe("Policy to change: ubi, ownership, workweek or services"),
    parameters: z.object({
      level: z
        .number()
        .int()
        .min(0)
        .max(MAX_LEVEL)
        .describe("Target level from 0 (inactive) to 4"),
    }),
  }),
  run: async ({ policyId, parameters }, ctx) => {
    const origin = proposalOrigin(ctx?.caller);
    return mutateWorld((world) => {
      const { world: next, proposal, evaluation } = proposePolicyOp(
        world,
        { policyId, level: parameters.level },
        origin,
        operationContext(ctx?.caller),
      );
      return { world: next, result: { proposal, evaluation } };
    });
  },
});

