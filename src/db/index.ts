import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const DB_PATH =
  process.env.DATABASE_URL ?? join(process.cwd(), "data", "app.db");

// Ensure directory exists
const dir = join(process.cwd(), "data");
if (!existsSync(dir)) {
  mkdirSync(dir, { recursive: true });
}

// Singleton to survive hot-reloads in dev (turbopack re-evaluates modules)
const g = globalThis as unknown as {
  __sqlite?: Database.Database;
  __db?: ReturnType<typeof drizzle>;
};

if (!g.__sqlite) {
  g.__sqlite = new Database(DB_PATH);
  g.__sqlite.pragma("journal_mode = WAL");
  g.__sqlite.pragma("foreign_keys = ON");
}

if (!g.__db) {
  g.__db = drizzle(g.__sqlite, { schema });
}

export const db = g.__db;
