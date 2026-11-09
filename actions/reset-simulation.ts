import { ResetOutputSchema } from "../shared/post-labor/contracts";
import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { operationContext, resetOp } from "../server/lib/post-labor/operations";
import { replaceWorld } from "../server/lib/post-labor/store";

export default defineAction({
  outputSchema: ResetOutputSchema,
  description:
    "Fully reset the simulation to the 2040 baseline. Invalidates every pending proposal and approval and keeps only baseline history. Requires human approval.",
  schema: z.object({}),
  needsApproval: true,
  run: async (_args, ctx) => {
    const world = await replaceWorld((previousRevision, previousWorld) =>
      resetOp(previousRevision, operationContext(ctx?.caller), previousWorld?.households ?? []),
    );
    return { simulationId: world.simulationId, revision: world.revision, year: world.year };
  },
});

