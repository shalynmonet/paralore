import { defineAction, defineActionErrors } from "@agent-native/core/action";
import { z } from "zod";
import { AdvanceOutputSchema } from "../shared/post-labor/contracts";
import { advanceToYearOp, operationContext } from "../server/lib/post-labor/operations";
import { mutateWorld } from "../server/lib/post-labor/store";
export default defineAction({
  description: "Simulate forward to a chosen year, at most 50 years per call. Runs every intervening annual step and preserves history. Requires the current expectedRevision. Earlier years are read-only history; use reset-simulation to restart.",
  errors: defineActionErrors("stale_revision", "invalid_year"),
  schema: z.object({ targetYear: z.number().int().min(2041).max(9999), expectedRevision: z.number().int().min(0) }),
  outputSchema: AdvanceOutputSchema,
  run: async ({ targetYear, expectedRevision }, ctx) => mutateWorld(world => {
    const { world: next, path, years } = advanceToYearOp(world, targetYear, expectedRevision, operationContext(ctx?.caller));
    return { world: next, result: { years, path, year: next.year, revision: next.revision } };
  }),
});
