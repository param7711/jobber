import { defineConfig } from "drizzle-kit";

// Next loads .env.local automatically; drizzle-kit does not.
try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local yet — the URL check below produces the useful error.
}

// `generate` needs no connection, so a missing URL is only fatal on
// migrate/push — drizzle-kit raises that itself with a clear message.

/**
 * Migrations run against the direct (non-pooled) Supabase connection —
 * the transaction pooler on port 6543 does not support DDL reliably.
 */
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});
