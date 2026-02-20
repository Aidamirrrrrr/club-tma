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

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
