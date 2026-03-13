import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const g = globalThis as unknown as {
  __pgClient?: postgres.Sql;
  __db?: ReturnType<typeof drizzle<typeof schema>>;
};

if (!g.__pgClient) {
  g.__pgClient = postgres(connectionString, { max: 10 });
}

if (!g.__db) {
  g.__db = drizzle(g.__pgClient, { schema });
}

/** Drizzle-клиент БД (синглтон, переживает HMR). */
export const db = g.__db;
