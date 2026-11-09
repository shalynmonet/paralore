import { InspectOutputSchema } from "../shared/post-labor/contracts";
import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { inspectHouseholdOp } from "../server/lib/post-labor/operations";
import { readWorld } from "../server/lib/post-labor/store";

export default defineAction({
  outputSchema: InspectOutputSchema,
  description:
    "Inspect a fictional household (chen, rivera or a saved custom profile) with line-item finances derived from the current world, optionally compared with an open proposal. Read-only and illustrative; not a representative sample.",
  schema: z.object({
    householdId: z.string().min(1).max(100).describe("Household: chen, rivera, or a saved custom household id from get-world-state"),
    proposalId: z.string().optional().describe("Optional proposal id to compare against"),
  }),
  http: { method: "GET" },
  readOnly: true,
  run: async ({ householdId, proposalId }) => {
    const world = await readWorld();
    return inspectHouseholdOp(world, householdId, proposalId);
  },
});

