import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * App queries go through Supabase's transaction pooler (port 6543), so
 * `prepare` must be off — the pooler does not support prepared statements.
 * Migrations use DIRECT_URL instead; see drizzle.config.ts.
 */
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.local.example to .env.local and fill it in.",
  );
}

// Reuse the client across hot reloads in dev, or every save leaks a pool.
const globalForDb = globalThis as unknown as {
  sql: ReturnType<typeof postgres> | undefined;
};

const sql =
  globalForDb.sql ?? postgres(connectionString, { prepare: false, max: 5 });

if (process.env.NODE_ENV !== "production") globalForDb.sql = sql;

export const db = drizzle(sql, { schema });
export { schema };
