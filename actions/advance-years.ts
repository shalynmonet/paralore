import { AdvanceOutputSchema } from "../shared/post-labor/contracts";
import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { advanceYearsOp, operationContext } from "../server/lib/post-labor/operations";
import { mutateWorld } from "../server/lib/post-labor/store";

export default defineAction({
  outputSchema: AdvanceOutputSchema,
  description:
    "Advance the world by 1 to 5 whole years. Each year is one engine step and is recorded in the timeline. Invalidates open proposals made before the advance.",
  schema: z.object({
    years: z.number().int().min(1).max(5).describe("Whole years to advance, 1 to 5"),
  }),
  run: async ({ years }, ctx) =>
    mutateWorld((world) => {
      const { world: next, path } = advanceYearsOp(world, years, operationContext(ctx?.caller));
      return { world: next, result: { years, path, year: next.year, revision: next.revision } };
    }),
});

