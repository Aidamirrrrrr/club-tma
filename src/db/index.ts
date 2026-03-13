import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const g = globalThis as unknown as {
  __pgClient?: postgres.Sql;
  __db?: ReturnType<typeof drizzle<typeof schema>>;
};

function getDb() {
  if (!g.__db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    g.__pgClient = postgres(url, { max: 10 });
    g.__db = drizzle(g.__pgClient, { schema });
  }
  return g.__db;
}

/** Drizzle-клиент БД (синглтон, переживает HMR). */
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
