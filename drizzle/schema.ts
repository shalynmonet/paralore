import { pgTable, text } from "drizzle-orm/pg-core";

// One authoritative simulation document per world. Writes run inside a
// transaction that locks the row, so concurrent actions serialize.
export const worldStates = pgTable("world_states", {
  id: text("id").primaryKey(),
  state: text("state").notNull(),
  updatedAt: text("updated_at").notNull(),
});
