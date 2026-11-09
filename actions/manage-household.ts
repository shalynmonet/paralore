import { defineAction, defineActionErrors } from "@agent-native/core/action";
import { z } from "zod";
import { HouseholdInputSchema } from "../shared/post-labor/profiles";
import { HouseholdProfileSchema } from "../shared/post-labor/profiles";
import { manageHouseholdOp, operationContext } from "../server/lib/post-labor/operations";
import { mutateWorld } from "../server/lib/post-labor/store";
const errors = defineActionErrors("household_not_found", "household_limit");
export default defineAction({
  description: "Create or update a private household profile with residents, monthly earned income, basic costs and paid hours; or delete a custom profile. Built-in examples cannot be edited. Deletion requires human approval. Does not change policy indicators or enact anything.",
  errors,
  schema: z.discriminatedUnion("operation", [
    z.object({ operation: z.literal("save"), id: z.string().min(1).max(100).optional(), profile: HouseholdInputSchema }),
    z.object({ operation: z.literal("delete"), id: z.string().min(1).max(100) }),
  ]),
  outputSchema: z.object({ id: z.string(), households: z.array(HouseholdProfileSchema), message: z.string() }),
  needsApproval: args => args.operation === "delete",
  run: async (args, ctx) => mutateWorld(world => {
    const result = manageHouseholdOp(world, args, operationContext(ctx?.caller));
    return { world: result.world, result: { id: result.id, households: result.world.households, message: args.operation === "delete" ? "Household removed." : "Household saved." } };
  }),
});
