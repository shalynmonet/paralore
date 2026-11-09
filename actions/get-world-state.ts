import { WorldOutputSchema } from "../shared/post-labor/contracts";
import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { scenarioStatus, SCENARIO_LABELS } from "../shared/post-labor/engine";
import { readWorld } from "../server/lib/post-labor/store";

export default defineAction({
  outputSchema: WorldOutputSchema,
  description:
    "Read the authoritative PARALORE world: year, indicators, active policy levels, proposals, assemblies, timeline history, decisions and the action log.",
  schema: z.object({}),
  http: { method: "GET" },
  readOnly: true,
  run: async () => {
    const world = await readWorld();
    const scenario = scenarioStatus(world.indicators);
    return { ...world, scenario, scenarioLabel: SCENARIO_LABELS[scenario] };
  },
});

