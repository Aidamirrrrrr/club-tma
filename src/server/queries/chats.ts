import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import type { Chat } from "@/db/schema";
import { chats } from "@/db/schema";

export interface UpdateChatInput {
  title?: string;
  url?: string;
  description?: string;
  sort?: number;
}

export async function listChats(): Promise<Chat[]> {
  return db.select().from(chats).orderBy(asc(chats.sort), asc(chats.id));
}

export async function createChat(
  values: typeof chats.$inferInsert,
): Promise<Chat> {
  const [row] = await db.insert(chats).values(values).returning();
  return row;
}

export async function updateChatById(
  chatId: number,
  updates: UpdateChatInput,
): Promise<Chat | undefined> {
  const [updated] = await db
    .update(chats)
    .set(updates)
    .where(eq(chats.id, chatId))
    .returning();

  return updated;
}

export async function deleteChatById(
  chatId: number,
): Promise<Chat | undefined> {
  const [deleted] = await db
    .delete(chats)
    .where(eq(chats.id, chatId))
    .returning();

  return deleted;
}
