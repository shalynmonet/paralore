import { ResetOutputSchema } from "../shared/post-labor/contracts";
import { defineAction, fail } from "@agent-native/core/action";
import { z } from "zod";

import { operationContext, resetOp } from "../server/lib/post-labor/operations";
import { replaceWorld } from "../server/lib/post-labor/store";

export default defineAction({
  outputSchema: ResetOutputSchema,
  description:
    "Restart the simulation at a chosen startYear from 2027 through 9999 (default 2040), using the same illustrative baseline scores. Saved household profiles remain; population and job replacement return to defaults. Invalidates every pending proposal and approval and keeps only baseline history. Requires human approval.",
  schema: z.object({ startYear: z.number().int().min(2027).max(9999).default(2040), expectedRevision: z.number().int().min(0).optional() }),
  needsApproval: true,
  run: async (args, ctx) => {
    const world = await replaceWorld((previousRevision, previousWorld) =>
      {
        if (args.expectedRevision !== undefined && args.expectedRevision !== previousRevision) fail("The world changed. Review the current world and restart again.", { statusCode: 409 });
        return resetOp(previousRevision, operationContext(ctx?.caller), previousWorld?.households ?? [], args.startYear);
      },
    );
    return { simulationId: world.simulationId, revision: world.revision, year: world.year };
  },
});

