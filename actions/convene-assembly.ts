import { AssemblyOutputSchema } from "../shared/post-labor/contracts";
import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import {
  convenePerspectivesOp,
  operationContext,
} from "../server/lib/post-labor/operations";
import { mutateWorld } from "../server/lib/post-labor/store";

export default defineAction({
  outputSchema: AssemblyOutputSchema,
  description:
    "Convene the three fictional delegates (Maya Chen, Adrian Voss, Leila Okafor) on an open proposal. Returns their positions, risks, disagreement and concrete amendments. Never enacts a policy.",
  schema: z.object({
    proposalId: z.string().min(1).describe("Open proposal id to convene on"),
  }),
  run: async ({ proposalId }, ctx) =>
    mutateWorld((world) => {
      const { world: next, assembly, reused } = convenePerspectivesOp(
        world,
        proposalId,
        operationContext(ctx?.caller),
      );
      return { world: next, result: { assembly, reused } };
    }),
});

