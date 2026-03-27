import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const g = globalThis as unknown as {
  __prisma?: PrismaClient;
};

function getPrisma() {
  if (!g.__prisma) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    const adapter = new PrismaPg({ connectionString: url });
    g.__prisma = new PrismaClient({ adapter });
  }
  return g.__prisma;
}

/** Prisma-клиент БД (синглтон, переживает HMR). */
export const db = new Proxy({} as PrismaClient, {
  get(_, prop) {
    return (getPrisma() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
