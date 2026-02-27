import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users } from "../src/db/schema";

const sql = postgres(process.env.DATABASE_URL || "");
const db = drizzle(sql);

async function main() {
  const result = await db
    .update(users)
    .set({ role: "admin" })
    .returning({ id: users.id, firstName: users.firstName, role: users.role });

  console.log("Updated:", result);
  await sql.end();
}

main();
