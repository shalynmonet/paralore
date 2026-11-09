import { fail } from "@agent-native/core/action";
import { eq } from "drizzle-orm";
import { getRequestUserEmail } from "@agent-native/core/server/request-context";

import { getDb, schema } from "../../db";
import {
  createBaselineWorld,
  validateWorld,
  type WorldState,
} from "../../../shared/post-labor/state";

// Signed-in people have separate worlds. Local development without an identity
// has one shared world in its own PGlite database.
function worldId() {
  const owner = getRequestUserEmail();
  return owner ? `aurora:${owner.toLowerCase()}` : "aurora-local";
}

type Db = ReturnType<typeof getDb>;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

function reportRecovery(problems: string[]): never {
  fail(
    `Stored simulation state failed validation (${problems.join("; ")}). Recovery: run resetSimulation to restore the 2040 baseline.`,
    { errorCode: "world_state_invalid", statusCode: 500, details: { problems } },
  );
}

function parseStoredWorld(raw: string): WorldState {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return reportRecovery(["state: stored document is not valid JSON"]);
  }
  const result = validateWorld(value);
  if (!result.ok) return reportRecovery(result.problems);
  return result.world;
}

function storedRevision(raw: string): number {
  try {
    const revision = (JSON.parse(raw) as { revision?: unknown }).revision;
    return typeof revision === "number" && Number.isInteger(revision) && revision >= 0
      ? revision
      : 0;
  } catch {
    return 0;
  }
}

async function insertBaselineIfMissing(tx: Tx | Db): Promise<void> {
  await tx
    .insert(schema.worldStates)
    .values({
      id: worldId(),
      state: JSON.stringify(createBaselineWorld(crypto.randomUUID())),
      updatedAt: new Date().toISOString(),
    })
    .onConflictDoNothing();
}

async function lockWorldRow(tx: Tx): Promise<string> {
  const rows = await tx
    .select()
    .from(schema.worldStates)
    .where(eq(schema.worldStates.id, worldId()))
    .for("update");
  const row = rows[0];
  if (!row) {
    fail("World state row is missing after initialization.", {
      errorCode: "world_state_missing",
      statusCode: 500,
    });
  }
  return row.state;
}

async function saveWorld(tx: Tx, world: WorldState): Promise<void> {
  await tx
    .update(schema.worldStates)
    .set({ state: JSON.stringify(world), updatedAt: new Date().toISOString() })
    .where(eq(schema.worldStates.id, worldId()));
}

export async function readWorld(): Promise<WorldState> {
  const db = getDb();
  await insertBaselineIfMissing(db);
  const rows = await db
    .select()
    .from(schema.worldStates)
    .where(eq(schema.worldStates.id, worldId()));
  const row = rows[0];
  if (!row) {
    fail("World state row is missing after initialization.", {
      errorCode: "world_state_missing",
      statusCode: 500,
    });
  }
  return parseStoredWorld(row.state);
}

export async function mutateWorld<T>(
  mutate: (world: WorldState) => { world: WorldState; result: T },
): Promise<T> {
  return getDb().transaction(async (tx) => {
    await insertBaselineIfMissing(tx);
    const raw = await lockWorldRow(tx);
    const { world, result } = mutate(parseStoredWorld(raw));
    await saveWorld(tx, world);
    return result;
  });
}

export async function replaceWorld(
  build: (previousRevision: number, previousWorld?: WorldState) => WorldState,
): Promise<WorldState> {
  return getDb().transaction(async (tx) => {
    await insertBaselineIfMissing(tx);
    const raw = await lockWorldRow(tx);
    let previous: WorldState | undefined;
    try { const result = validateWorld(JSON.parse(raw)); if (result.ok) previous = result.world; } catch { /* Reset also recovers corrupt state. */ }
    const next = build(storedRevision(raw), previous);
    await saveWorld(tx, next);
    return next;
  });
}
