import { EvaluateOutputSchema } from "../shared/post-labor/contracts";
import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { evaluatePolicyOp } from "../server/lib/post-labor/operations";
import { readWorld } from "../server/lib/post-labor/store";

export default defineAction({
  outputSchema: EvaluateOutputSchema,
  description:
    "Evaluate an existing proposal against the current world: before and after indicators, deltas, fiscal consequences, household impacts, assumptions and trade-offs. Read-only; never changes the world.",
  schema: z.object({
    proposalId: z.string().min(1).describe("Proposal id returned by proposePolicy"),
  }),
  http: { method: "GET" },
  readOnly: true,
  run: async ({ proposalId }) => {
    const world = await readWorld();
    return evaluatePolicyOp(world, proposalId);
  },
});

