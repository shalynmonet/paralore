import { defineAction } from "@agent-native/core/action";
import { ScenarioInputsSchema } from "../shared/post-labor/state";
import { mutateWorld } from "../server/lib/post-labor/store";
export default defineAction({
  description: "Set the current world's population and AI job replacement percentage. Defaults are 10,000,000 and 75%. These are scenario context only: the existing normalized indicator and household formulas do not depend on them. Does not enact policy or invalidate previews. Reset restores defaults.",
  schema: ScenarioInputsSchema,
  outputSchema: ScenarioInputsSchema,
  run: async (inputs) => mutateWorld(world => ({ world: { ...world, ...inputs }, result: inputs })),
});
