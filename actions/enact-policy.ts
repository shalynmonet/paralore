import { EnactOutputSchema } from "../shared/post-labor/contracts";
import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import {
  enactPolicyOp,
  operationContext,
} from "../server/lib/post-labor/operations";
import { mutateWorld } from "../server/lib/post-labor/store";

export default defineAction({
  outputSchema: EnactOutputSchema,
  description:
    "Enact an open proposal into the world. Requires human approval bound to this exact proposalId and expectedRevision; the agent can request it but cannot approve it. Duplicate, superseded and stale enactments are refused.",
  schema: z.object({
    proposalId: z.string().min(1).describe("Open proposal id to enact"),
    expectedRevision: z
      .number()
      .int()
      .min(0)
      .describe("World revision the human reviewed; enactment is refused if the world has changed"),
  }),
  needsApproval: true,
  run: async ({ proposalId, expectedRevision }, ctx) =>
    mutateWorld((world) => {
      const { world: next, decision, before, after } = enactPolicyOp(
        world,
        { proposalId, expectedRevision },
        operationContext(ctx?.caller),
      );
      return { world: next, result: { decision, before, after, revision: next.revision } };
    }),
});

